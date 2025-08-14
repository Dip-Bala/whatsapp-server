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
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
const onlineUsers = new Map();
function generateToken(userId) {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
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
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
function sendJSON(ws, data) {
    if (ws.readyState === ws_1.WebSocket.OPEN)
        ws.send(JSON.stringify(data));
}
// ===== REST API =====
app.post("/login", async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email)
        return res.status(400).json({ error: "Name and email are required" });
    let user = await schema_1.UserModel.findOne({ email });
    if (!user)
        user = await schema_1.UserModel.create({ name, email });
    const token = generateToken(user._id.toString());
    return res.status(200).json({ message: "Login successful", token, user });
});
app.get("/contact", verifyToken, async (req, res) => {
    const contacts = await schema_1.ContactModel.find({ owner: req.user.id })
        .sort({ isOnWhatsApp: -1, name: 1 });
    res.json(contacts);
});
app.post("/contact", verifyToken, async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email)
        return res.status(400).json({ error: "Name and email are required" });
    const waUser = await schema_1.UserModel.findOne({ email });
    const contactData = {
        owner: req.user.id,
        name,
        email,
        isOnWhatsApp: !!waUser,
        profilePicUrl: waUser?.profilePicUrl || "",
        status: waUser?.status || "offline"
    };
    const contact = await schema_1.ContactModel.create(contactData);
    res.status(201).json(contact);
});
app.get("/chats", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const chats = await schema_1.MessageModel.aggregate([
        {
            $match: {
                $or: [
                    { sender: new mongoose_1.default.Types.ObjectId(userId) },
                    { receiver: new mongoose_1.default.Types.ObjectId(userId) }
                ]
            }
        },
        { $sort: { timestamp: -1 } },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ["$sender", new mongoose_1.default.Types.ObjectId(userId)] },
                        "$receiver",
                        "$sender",
                    ],
                },
                lastMessage: { $first: "$$ROOT" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$receiver", new mongoose_1.default.Types.ObjectId(userId)] },
                                    { $ne: ["$status", "read"] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "participant",
            },
        },
        { $unwind: "$participant" },
        {
            $project: {
                _id: 0,
                chatId: "$_id",
                participant: {
                    _id: "$participant._id",
                    name: "$participant.name",
                    email: "$participant.email",
                    profilePicUrl: "$participant.profilePicUrl",
                    status: "$participant.status",
                },
                lastMessage: {
                    text: "$lastMessage.text",
                    timestamp: "$lastMessage.timestamp",
                    status: "$lastMessage.status",
                },
                unreadCount: 1,
            },
        },
    ]);
    res.json(chats);
});
app.get("/messages/:contactEmail", verifyToken, async (req, res) => {
    const me = await schema_1.UserModel.findById(req.user.id);
    const them = await schema_1.UserModel.findOne({ email: req.params.contactEmail });
    if (!me || !them)
        return res.status(404).json({ error: "User not found" });
    const msgs = await schema_1.MessageModel.find({
        $or: [
            { sender: me._id, receiver: them._id },
            { sender: them._id, receiver: me._id },
        ],
    }).sort({ timestamp: 1 });
    const enriched = msgs.map(m => ({
        _id: m._id,
        text: m.text,
        timestamp: m.timestamp,
        status: m.status,
        senderEmail: String(m.sender) === String(me._id) ? me.email : them.email,
        receiverEmail: String(m.receiver) === String(me._id) ? me.email : them.email
    }));
    res.json(enriched);
});
// ===== WEBSOCKET =====
wss.on("connection", (ws) => {
    console.log("New WS connection");
    ws.on("message", async (raw) => {
        try {
            const data = JSON.parse(raw.toString());
            if (data.type === "join") {
                onlineUsers.set(data.email, ws);
                const user = await schema_1.UserModel.findOne({ email: data.email });
                if (user) {
                    user.status = "online";
                    await user.save();
                }
                const undelivered = await schema_1.MessageModel.find({
                    receiver: user?._id, status: "sent"
                }).populate("sender receiver", "email name profilePicUrl");
                for (const msg of undelivered) {
                    const enriched = {
                        _id: msg._id,
                        text: msg.text,
                        timestamp: msg.timestamp,
                        status: msg.status,
                        senderEmail: msg.sender.email,
                        receiverEmail: msg.receiver.email,
                        senderName: msg.sender.name,
                        receiverName: msg.receiver.name,
                        senderProfilePicUrl: msg.sender.profilePicUrl,
                        receiverProfilePicUrl: msg.receiver.profilePicUrl,
                    };
                    sendJSON(ws, { type: "receiveMessage", message: enriched });
                    msg.status = "delivered";
                    await msg.save();
                }
            }
            if (data.type === "sendMessage") {
                const sender = await schema_1.UserModel.findOne({ email: data.senderEmail });
                const receiver = await schema_1.UserModel.findOne({ email: data.receiverEmail });
                if (!sender || !receiver)
                    return;
                const message = await schema_1.MessageModel.create({
                    sender: sender._id,
                    receiver: receiver._id,
                    text: data.text,
                    timestamp: new Date(),
                    status: onlineUsers.has(receiver.email) ? "delivered" : "sent",
                });
                const enriched = {
                    _id: message._id,
                    text: message.text,
                    timestamp: message.timestamp,
                    status: message.status,
                    senderEmail: sender.email,
                    receiverEmail: receiver.email,
                    senderName: sender.name,
                    receiverName: receiver.name,
                    senderProfilePicUrl: sender.profilePicUrl,
                    receiverProfilePicUrl: receiver.profilePicUrl,
                };
                const receiverWS = onlineUsers.get(receiver.email);
                if (receiverWS)
                    sendJSON(receiverWS, { type: "receiveMessage", message: enriched });
                const senderWS = onlineUsers.get(sender.email);
                if (senderWS)
                    sendJSON(senderWS, { type: "receiveMessage", message: enriched });
            }
            if (data.type === "markAsRead") {
                const sender = await schema_1.UserModel.findOne({ email: data.senderEmail });
                const receiver = await schema_1.UserModel.findOne({ email: data.receiverEmail });
                if (!sender || !receiver)
                    return;
                await schema_1.MessageModel.updateMany({ sender: sender._id, receiver: receiver._id, status: "delivered" }, { $set: { status: "read" } });
                const chatId = [data.senderEmail, data.receiverEmail].sort().join("-");
                const senderWS = onlineUsers.get(sender.email);
                const receiverWS = onlineUsers.get(receiver.email);
                if (senderWS)
                    sendJSON(senderWS, { type: "markAsRead", chatId });
                if (receiverWS)
                    sendJSON(receiverWS, { type: "markAsRead", chatId });
            }
        }
        catch (err) {
            console.error("Invalid WS message:", err);
        }
    });
    ws.on("close", async () => {
        for (const [email, sock] of onlineUsers.entries()) {
            if (sock === ws) {
                onlineUsers.delete(email);
                const user = await schema_1.UserModel.findOne({ email });
                if (user) {
                    user.status = "offline";
                    await user.save();
                }
                break;
            }
        }
        console.log("WS Disconnected");
    });
});
(async function main() {
    try {
        await mongoose_1.default.connect(process.env.DB_URL);
        console.log("Database Connected");
        server.listen(process.env.PORT || 8080, () => console.log(`Server running on port ${process.env.PORT || 8080}`));
    }
    catch (e) {
        console.error("Could not connect to database", e);
    }
})();
//# sourceMappingURL=index.js.map