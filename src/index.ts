import mongoose from "mongoose";
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { ContactModel, MessageModel, UserModel } from "./model/schema";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

interface ExtWebSocket extends WebSocket {
  on(arg0: string, arg1: (msg: any) => Promise<void>): unknown;
  userId?: string;
}

// Create HTTP server for both Express & WS
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Map of online users: userId → ws connection
const onlineUsers = new Map<string, any>();

function generateToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

// Middleware to verify token for REST API
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
  } catch (err) {
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

    let user = await UserModel.findOne({ email });

    if (!user) {
      console.log("User does not exist, creating new");
      user = await UserModel.create({ name, email });
      const token = generateToken(user._id.toString());
      return res.status(201).json({ message: "User registered", token, user });
    }

    const token = generateToken(user._id.toString());
    return res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/contact", verifyToken, async (req: Request & { user?: any }, res) => {
  console.log("requested for contacts");
  try {
    const contacts = await ContactModel.find({ owner: req.user.id }).sort({
      isOnWhatsApp: -1,
      name: 1,
    });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

app.post("/contact", verifyToken, async (req: Request & { user?: any }, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const waUser = await UserModel.findOne({ email });

    const contactData: any = {
      owner: req.user.id,
      name,
      email,
      isOnWhatsApp: !!waUser,
    };

    if (waUser) {
      contactData.profilePicUrl = waUser.profilePicUrl || "";
      contactData.status = waUser.status || "offline";
    }

    const contact = await ContactModel.create(contactData);
    res.status(201).json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add contact" });
  }
});

// ===== WS Server =====
function sendJSON(ws: any, data: any) {
  ws.send(JSON.stringify(data));
}

wss.on("connection", (ws: ExtWebSocket) => {
  console.log("New WS connection");

  ws.on("message", async (msg: any) => {
    try {
      const data = JSON.parse(msg.toString());
      // User joins socket
      if (data.type === "join") {
        // @ts-ignore
        ws.userId = data.userId;
        onlineUsers.set(data.userId, ws);

        await UserModel.findByIdAndUpdate(data.userId, { status: "online" });
        console.log(`User ${data.userId} is now online`);

        // Send queued messages
        const undelivered = await MessageModel.find({
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

        const message = await MessageModel.create({
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
        await MessageModel.updateMany(
          {
            sender: data.senderId,
            receiver: data.receiverId,
            status: "delivered",
          },
          { $set: { status: "read" } }
        );
      }
    } catch (err) {
      console.error("Invalid WS message:", err);
    }
  });

  ws.on("close", async () => {
    if (ws.userId) {
      onlineUsers.delete(ws.userId);
      await UserModel.findByIdAndUpdate(ws.userId, { status: "offline" });
      console.log(`User ${ws.userId} disconnected`);
    }
  });
});

// ===== Start Server =====
(async function main() {
  try {
    await mongoose.connect(process.env.DB_URL as string);
    console.log("Database Connected");
    server.listen(process.env.PORT || 8080, () => {
      console.log(`Server running on port ${process.env.PORT || 8080}`);
    });
  } catch (e) {
    console.log("Could Not connect to Database", e);
  }
})();
