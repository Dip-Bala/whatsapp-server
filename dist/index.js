"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const ws_1 = require("ws");
const schema_1 = require("./model/schema");
const login_1 = __importDefault(require("./routes/login"));
const contact_1 = __importDefault(require("./routes/contact"));
const messages_1 = __importDefault(require("./routes/messages"));
const chats_1 = __importDefault(require("./routes/chats"));
const saveMessageAndUpdateChat_1 = require("./utils/saveMessageAndUpdateChat");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
// ===== REST API =====
app.use("/login", login_1.default);
app.use("/contact", contact_1.default);
app.use("/chats", chats_1.default);
app.use("/messages", messages_1.default);
// Map to store online users
const onlineUsers = new Map();
function sendJSON(ws, data) {
    if (ws.readyState === ws_1.WebSocket.OPEN)
        ws.send(JSON.stringify(data));
}
// ===== WEBSOCKET =====
wss.on("connection", (ws) => {
    ws.on("message", async (raw) => {
        try {
            const data = JSON.parse(raw.toString());
            // === JOIN EVENT ===
            if (data.type === "join") {
                // console.log(data.email)
                onlineUsers.set(data.email, ws);
                // console.log("online users" + onlineUsers.get());
                const user = await schema_1.UserModel.findOne({ email: data.email });
                if (user) {
                    user.status = "online";
                    await user.save();
                }
                console.log("user" + user);
                // Send undelivered messages
                if (user) {
                    console.log(user._id);
                    const undelivered = await schema_1.MessageModel.find({
                        receiver: user._id,
                        status: "sent",
                    });
                    console.log("unedelivered messages : " + undelivered);
                    for (const msg of undelivered) {
                        console.log(msg);
                        sendJSON(ws, {
                            type: "receiveMessage",
                            message: {
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
                            },
                        });
                        msg.status = "delivered";
                        await msg.save();
                    }
                }
            }
            // === SEND MESSAGE ===
            if (data.type === "sendMessage") {
                console.log("chatting");
                const result = await (0, saveMessageAndUpdateChat_1.saveMessageAndUpdateChat)({
                    senderEmail: data.senderEmail,
                    receiverEmail: data.receiverEmail,
                    text: data.text,
                    status: onlineUsers.has(data.receiverEmail) ? "delivered" : "sent",
                });
                if (!result)
                    return;
                const { message, sender, receiver } = result;
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
                // Send to receiver if online
                const receiverWS = onlineUsers.get(receiver.email);
                if (receiverWS)
                    sendJSON(receiverWS, { type: "receiveMessage", message: enriched });
                // Send to sender
                const senderWS = onlineUsers.get(sender.email);
                if (senderWS)
                    sendJSON(senderWS, { type: "receiveMessage", message: enriched });
                // Tell both to refresh chat list
                if (receiverWS)
                    sendJSON(receiverWS, { type: "refreshChats" });
                if (senderWS)
                    sendJSON(senderWS, { type: "refreshChats" });
            }
            // === MARK AS READ ===
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
            console.error("❌ Invalid WS message:", err);
        }
    });
    ws.on("close", async () => {
        for (const [email, sock] of onlineUsers.entries()) {
            if (sock === ws) {
                onlineUsers.delete(email);
                await schema_1.UserModel.findOneAndUpdate({ email }, { status: "offline" });
                console.log(`🔴 ${email} disconnected`);
                break;
            }
        }
    });
});
// ===== START SERVER =====
(async function main() {
    try {
        await mongoose_1.default.connect(process.env.DB_URL);
        console.log("✅ Database Connected");
        server.listen(process.env.PORT || 8080, () => console.log(`🚀 Server running on port ${process.env.PORT || 8080}`));
    }
    catch (e) {
        console.error("❌ Could not connect to database", e);
    }
})();
//# sourceMappingURL=index.js.map