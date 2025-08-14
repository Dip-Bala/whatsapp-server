"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_1 = require("http");
const ws_1 = require("ws");
const schema_1 = require("./model/schema");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Create HTTP server for both Express & WS
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
// Map of online users: userId → ws connection
const onlineUsers = new Map();
function generateToken(userId) {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
}
// Middleware to verify token for REST API
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "Invalid token format" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
// ===== REST API =====
app.post("/test", (req, res) => {
    const payload = req.body;
    res.send(`hi ${payload.name}`);
});
app.post("/login", async (req, res) => {
    console.log("login under process");
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }
        let user = await schema_1.UserModel.findOne({ email });
        if (!user) {
            console.log("User does not exist, creating new");
            user = await schema_1.UserModel.create({ name, email });
            const token = generateToken(user._id.toString());
            return res.status(201).json({ message: "User registered", token, user });
        }
        const token = generateToken(user._id.toString());
        return res.status(200).json({ message: "Login successful", token, user });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/contact", verifyToken, async (req, res) => {
    console.log("requested for contacts");
    try {
        const contacts = await schema_1.ContactModel.find({ owner: req.user.id }).sort({
            isOnWhatsApp: -1,
            name: 1,
        });
        res.json(contacts);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch contacts" });
    }
});
app.post("/contact", verifyToken, async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }
        const waUser = await schema_1.UserModel.findOne({ email });
        const contactData = {
            owner: req.user.id,
            name,
            email,
            isOnWhatsApp: !!waUser,
        };
        if (waUser) {
            contactData.profilePicUrl = waUser.profilePicUrl || "";
            contactData.status = waUser.status || "offline";
        }
        const contact = await schema_1.ContactModel.create(contactData);
        res.status(201).json(contact);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add contact" });
    }
});
// ===== WS Server =====
function sendJSON(ws, data) {
    ws.send(JSON.stringify(data));
}
wss.on("connection", (ws) => {
    console.log("New WS connection");
    ws.on("message", async (msg) => {
        try {
            const data = JSON.parse(msg.toString());
            // User joins socket
            if (data.type === "join") {
                // @ts-ignore
                ws.userId = data.userId;
                onlineUsers.set(data.userId, ws);
                await schema_1.UserModel.findByIdAndUpdate(data.userId, { status: "online" });
                console.log(`User ${data.userId} is now online`);
                // Send queued messages
                const undelivered = await schema_1.MessageModel.find({
                    receiver: data.userId,
                    status: "sent",
                });
                undelivered.forEach((message) => {
                    sendJSON(ws, { type: "receiveMessage", message });
                    message.status = "delivered";
                    message.save();
                });
            }
            // Sending a message
            if (data.type === "sendMessage") {
                const { senderId, receiverId, text } = data;
                const message = await schema_1.MessageModel.create({
                    sender: senderId,
                    receiver: receiverId,
                    text,
                    timestamp: new Date(),
                    status: onlineUsers.has(receiverId) ? "delivered" : "sent",
                });
                if (onlineUsers.has(receiverId)) {
                    sendJSON(onlineUsers.get(receiverId), {
                        type: "receiveMessage",
                        message,
                    });
                }
            }
            // Mark messages as read
            if (data.type === "markAsRead") {
                await schema_1.MessageModel.updateMany({
                    sender: data.senderId,
                    receiver: data.receiverId,
                    status: "delivered",
                }, { $set: { status: "read" } });
            }
        }
        catch (err) {
            console.error("Invalid WS message:", err);
        }
    });
    ws.on("close", async () => {
        if (ws.userId) {
            onlineUsers.delete(ws.userId);
            await schema_1.UserModel.findByIdAndUpdate(ws.userId, { status: "offline" });
            console.log(`User ${ws.userId} disconnected`);
        }
    });
});
// ===== Start Server =====
(async function main() {
    try {
        await mongoose_1.default.connect(process.env.DB_URL);
        console.log("Database Connected");
        server.listen(process.env.PORT || 8080, () => {
            console.log(`Server running on port ${process.env.PORT || 8080}`);
        });
    }
    catch (e) {
        console.log("Could Not connect to Database", e);
    }
})();
//# sourceMappingURL=index.js.map