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
const schema_1 = require("./model/schema");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
function generateToken(userId) {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
}
// Middleware to verify token
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1]; // "Bearer <token>"
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
app.post("/test", (req, res) => {
    const payload = req.body;
    res.send(`hi ${payload.name}`);
});
// Login endpoint
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
            return res.status(201).json({ message: "User registered", token });
        }
        const token = generateToken(user._id.toString());
        return res.status(200).json({ message: "Login successful", token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});
// GET all contacts for logged-in user
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
// POST add contact
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
app.post("/webhook", async (req, res) => {
    try {
        const payload = req.body;
        const change = payload.metaData.entry[0].changes[0].value;
        const contact = change.contacts[0];
        const message = change.messages[0];
        const receiverNumber = change.metadata.display_phone_number;
        let sender = await schema_1.UserModel.findOne({ wa_id: contact.wa_id });
        if (!sender) {
            sender = await schema_1.UserModel.create({
                wa_id: contact.wa_id,
                name: contact.profile?.name,
                phoneNumber: contact.wa_id,
            });
        }
        let receiver = await schema_1.UserModel.findOne({ wa_id: receiverNumber });
        if (!receiver) {
            receiver = await schema_1.UserModel.create({
                wa_id: receiverNumber,
                phoneNumber: receiverNumber,
            });
        }
        const exists = await schema_1.MessageModel.findOne({ waMessageId: message.id });
        if (!exists) {
            await schema_1.MessageModel.create({
                waMessageId: message.id,
                sender: sender._id,
                receiver: receiver._id,
                text: message.text?.body || "",
                type: message.type || "text",
                timestamp: new Date(Number(message.timestamp) * 1000),
                status: "sent",
            });
        }
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to process webhook" });
    }
});
async function main() {
    try {
        await mongoose_1.default.connect(process.env.DB_URL);
        console.log("Database Connected");
        app.listen(process.env.PORT || 8080, () => {
            console.log(`Server running on port ${process.env.PORT || 8080}`);
        });
    }
    catch (e) {
        console.log("Could Not connect to Database");
    }
}
main();
//# sourceMappingURL=index.js.map