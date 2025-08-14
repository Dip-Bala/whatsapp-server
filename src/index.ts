import mongoose from "mongoose";
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { ContactModel, MessageModel, UserModel } from "./model/schema";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const onlineUsers = new Map<string, WebSocket>();

function generateToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
}

function verifyToken(
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function sendJSON(ws: WebSocket, data: any) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

// ===== REST API =====
app.post("/login", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

  let user = await UserModel.findOne({ email });
  if (!user) user = await UserModel.create({ name, email });

  const token = generateToken(user._id.toString());
  return res.status(200).json({ message: "Login successful", token, user });
});

app.get("/contact", verifyToken, async (req, res) => {
  const contacts = await ContactModel.find({ owner: req.user.id })
    .sort({ isOnWhatsApp: -1, name: 1 });
  res.json(contacts);
});

app.post("/contact", verifyToken, async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

  const waUser = await UserModel.findOne({ email });
  const contactData: any = {
    owner: req.user.id,
    name,
    email,
    isOnWhatsApp: !!waUser,
    profilePicUrl: waUser?.profilePicUrl || "",
    status: waUser?.status || "offline"
  };

  const contact = await ContactModel.create(contactData);
  res.status(201).json(contact);
});

app.get("/chats", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const chats = await MessageModel.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
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
                  { $eq: ["$receiver", new mongoose.Types.ObjectId(userId)] },
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
  const me = await UserModel.findById(req.user.id);
  const them = await UserModel.findOne({ email: req.params.contactEmail });
  if (!me || !them) return res.status(404).json({ error: "User not found" });

  const msgs = await MessageModel.find({
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
wss.on("connection", (ws: WebSocket) => {
  console.log("New WS connection");

  ws.on("message", async (raw: any) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === "join") {
        onlineUsers.set(data.email, ws);

        const user = await UserModel.findOne({ email: data.email });
        if (user) {
          user.status = "online";
          await user.save();
        }

        const undelivered = await MessageModel.find({
          receiver: user?._id, status: "sent"
        }).populate("sender receiver", "email name profilePicUrl");

        for (const msg of undelivered) {
          const enriched = {
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
          };
          sendJSON(ws, { type: "receiveMessage", message: enriched });
          msg.status = "delivered";
          await msg.save();
        }
      }

      if (data.type === "sendMessage") {
        const sender = await UserModel.findOne({ email: data.senderEmail });
        const receiver = await UserModel.findOne({ email: data.receiverEmail });
        if (!sender || !receiver) return;

        const message = await MessageModel.create({
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
        if (receiverWS) sendJSON(receiverWS, { type: "receiveMessage", message: enriched });

        const senderWS = onlineUsers.get(sender.email);
        if (senderWS) sendJSON(senderWS, { type: "receiveMessage", message: enriched });
      }

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
      console.error("Invalid WS message:", err);
    }
  });

  ws.on("close", async () => {
    for (const [email, sock] of onlineUsers.entries()) {
      if (sock === ws) {
        onlineUsers.delete(email);
        const user = await UserModel.findOne({ email });
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
    await mongoose.connect(process.env.DB_URL as string);
    console.log("Database Connected");
    server.listen(process.env.PORT || 8080, () =>
      console.log(`Server running on port ${process.env.PORT || 8080}`)
    );
  } catch (e) {
    console.error("Could not connect to database", e);
  }
})();
