import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { MessageModel, UserModel } from './model/schema';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

function generateToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d", 
  });
}
app.post('/test', (req, res) => {
  const payload = req.body;
  res.send(`hi ${payload.name}`);
})
app.post('/login', async (req, res) => {
  console.log("login under process");
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    let user = await UserModel.findOne({ email });

    // If user does not exist → create a new one
    if (!user) {
      console.log("User does not exist")
      user = await UserModel.create({ name, email });
      const token = generateToken(user._id.toString());
      return res.status(201).json({ message: "User registered", token });
    }

    // If user exists, always send a fresh token
    const token = generateToken(user._id.toString());
    return res.status(200).json({ message: "Login successful", token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});




app.post('/webhook', async(req, res) => {
  try {
    const payload = req.body;
    
    // Extract data
    const change = payload.metaData.entry[0].changes[0].value;
    const contact = change.contacts[0];
    const message = change.messages[0];
    const receiverNumber = change.metadata.display_phone_number;
    
    // 1. Ensure Sender exists
    let sender = await UserModel.findOne({ wa_id: contact.wa_id });
    if (!sender) {
      sender = await UserModel.create({
        wa_id: contact.wa_id,
        name: contact.profile?.name,
        phoneNumber: contact.wa_id
      });
    }
    
    // 2. Ensure Receiver exists
    let receiver = await UserModel.findOne({ wa_id: receiverNumber });
    if (!receiver) {
      receiver = await UserModel.create({
        wa_id: receiverNumber,
        phoneNumber: receiverNumber
      });
    }
    
    // 3. Save message
    const exists = await MessageModel.findOne({ waMessageId: message.id });
    if (!exists) {
      await MessageModel.create({
        waMessageId: message.id,
        sender: sender._id,
        receiver: receiver._id,
        text: message.text?.body || "",
        type: message.type || "text",
        timestamp: new Date(Number(message.timestamp) * 1000),
        status: "sent"
      });
    }
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process webhook" });
  }
  
})

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