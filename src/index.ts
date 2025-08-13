import mongoose from "mongoose";
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { ContactModel, MessageModel, UserModel } from "./model/schema";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

function generateToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

// Middleware to verify token
function verifyToken(
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (err) {
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

    let user = await UserModel.findOne({ email });

    if (!user) {
      console.log("User does not exist, creating new");
      user = await UserModel.create({ name, email });
      const token = generateToken(user._id.toString());
      return res.status(201).json({ message: "User registered", token });
    }

    const token = generateToken(user._id.toString());
    return res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET all contacts for logged-in user
app.get("/contact", verifyToken, async (req: Request & { user?: any }, res) => {
  console.log("requested for contacts")
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

// POST add contact
app.post(
  "/contact",
  verifyToken,
  async (req: Request & { user?: any }, res) => {
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
  }
);

app.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;

    const change = payload.metaData.entry[0].changes[0].value;
    const contact = change.contacts[0];
    const message = change.messages[0];
    const receiverNumber = change.metadata.display_phone_number;

    let sender = await UserModel.findOne({ wa_id: contact.wa_id });
    if (!sender) {
      sender = await UserModel.create({
        wa_id: contact.wa_id,
        name: contact.profile?.name,
        phoneNumber: contact.wa_id,
      });
    }

    let receiver = await UserModel.findOne({ wa_id: receiverNumber });
    if (!receiver) {
      receiver = await UserModel.create({
        wa_id: receiverNumber,
        phoneNumber: receiverNumber,
      });
    }

    const exists = await MessageModel.findOne({ waMessageId: message.id });
    if (!exists) {
      await MessageModel.create({
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

async function main() {
  try {
    await mongoose.connect(process.env.DB_URL as string);
    console.log("Database Connected");
    app.listen(process.env.PORT || 8080, () => {
      console.log(`Server running on port ${process.env.PORT || 8080}`);
    });
  } catch (e) {
    console.log("Could Not connect to Database");
  }
}
main();
