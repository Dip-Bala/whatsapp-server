import express, { NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { MessageModel, UserModel } from "./model/schema";
import loginRouter from "./routes/login";
import contactRouter from "./routes/contact";
import messageRouter from "./routes/messages";
import chatsRouter from "./routes/chats";
import { saveMessageAndUpdateChat } from "./utils/saveMessageAndUpdateChat";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// ===== REST API =====
app.use("/login", loginRouter);
app.use("/contact", contactRouter);
app.use("/chats", chatsRouter);
app.use("/messages", messageRouter);

// Map to store online users
const onlineUsers = new Map<string, WebSocket>();

function sendJSON(ws: WebSocket, data: any) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

// ===== WEBSOCKET =====
wss.on("connection", (ws: WebSocket) => {

  ws.on("message", async (raw: any) => {
    try {
      const data = JSON.parse(raw.toString());
      // === JOIN EVENT ===
      if (data.type === "join") {
        // console.log(data.email)
        onlineUsers.set(data.email, ws);
        // console.log("online users" + onlineUsers.get());
        const user = await UserModel.findOne({ email: data.email });
        if (user) {
          user.status = "online";
          await user.save();
        }
        console.log("user" + user)
        // Send undelivered messages
        if (user) {
          console.log(user._id);
          const undelivered = await MessageModel.find({
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
                senderEmail: (msg.sender as any).email,
                receiverEmail: (msg.receiver as any).email,
                senderName: (msg.sender as any).name,
                receiverName: (msg.receiver as any).name,
                senderProfilePicUrl: (msg.sender as any).profilePicUrl,
                receiverProfilePicUrl: (msg.receiver as any).profilePicUrl,
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
        const result = await saveMessageAndUpdateChat({
          senderEmail: data.senderEmail,
          receiverEmail: data.receiverEmail,
          text: data.text,
          status: onlineUsers.has(data.receiverEmail) ? "delivered" : "sent",
        });

        if (!result) return;
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
        if (receiverWS) sendJSON(receiverWS, { type: "refreshChats" });
        if (senderWS) sendJSON(senderWS, { type: "refreshChats" });
      }

      // === MARK AS READ ===
      if (data.type === "markAsRead") {
        const sender = await UserModel.findOne({ email: data.senderEmail });
        const receiver = await UserModel.findOne({ email: data.receiverEmail });
        if (!sender || !receiver) return;

        await MessageModel.updateMany(
          { sender: sender._id, receiver: receiver._id, status: "delivered" },
          { $set: { status: "read" } }
        );

        const chatId = [data.senderEmail, data.receiverEmail].sort().join("-");
        const senderWS = onlineUsers.get(sender.email);
        const receiverWS = onlineUsers.get(receiver.email);
        if (senderWS) sendJSON(senderWS, { type: "markAsRead", chatId });
        if (receiverWS) sendJSON(receiverWS, { type: "markAsRead", chatId });
      }
    } catch (err) {
      console.error("❌ Invalid WS message:", err);
    }
  });

  ws.on("close", async () => {
    for (const [email, sock] of onlineUsers.entries()) {
      if (sock === ws) {
        onlineUsers.delete(email);
        await UserModel.findOneAndUpdate({ email }, { status: "offline" });
        console.log(`🔴 ${email} disconnected`);
        break;
      }
    }
  });
});

// ===== START SERVER =====
(async function main() {
  try {
    await mongoose.connect(process.env.DB_URL as string);
    console.log("✅ Database Connected");
    server.listen(process.env.PORT || 8080, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 8080}`)
    );
  } catch (e) {
    console.error("❌ Could not connect to database", e);
  }
})();
