"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const schema_1 = require("./model/schema");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send("Welcome to Whatsapp");
});
app.post('/messages', async (req, res) => {
    const message = req.body;
});
app.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;
        // Extract data
        const change = payload.metaData.entry[0].changes[0].value;
        const contact = change.contacts[0];
        const message = change.messages[0];
        const receiverNumber = change.metadata.display_phone_number;
        // 1. Ensure Sender exists
        let sender = await schema_1.UserModel.findOne({ wa_id: contact.wa_id });
        if (!sender) {
            sender = await schema_1.UserModel.create({
                wa_id: contact.wa_id,
                name: contact.profile?.name,
                phoneNumber: contact.wa_id
            });
        }
        // 2. Ensure Receiver exists
        let receiver = await schema_1.UserModel.findOne({ wa_id: receiverNumber });
        if (!receiver) {
            receiver = await schema_1.UserModel.create({
                wa_id: receiverNumber,
                phoneNumber: receiverNumber
            });
        }
        // 3. Save message
        const exists = await schema_1.MessageModel.findOne({ waMessageId: message.id });
        if (!exists) {
            await schema_1.MessageModel.create({
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
    }
    catch (e) {
        console.log("Could Not connected to Database");
    }
    app.listen(process.env.PORT);
}
main();
//# sourceMappingURL=index.js.map