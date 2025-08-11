import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import { MessageModel, UserModel } from './model/schema';
dotenv.config();
const app = express();
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Welcome to Whatsapp");
});

app.post('/messages', async(req, res) => {
    const message = req.body;

})
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

async function main(){
    try{
        await mongoose.connect(process.env.DB_URL as string);
        console.log("Database Connected");
    }catch(e){
        console.log("Could Not connected to Database")
    }
    app.listen(process.env.PORT as string | 8080)
}

main();