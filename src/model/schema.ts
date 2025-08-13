import {Schema, model} from 'mongoose';

const statusTypes : string[] = ["sent" , "delivered" , "read"];

const userSchema = new Schema({
    // wa_id: {
    //     type: String,
    //     required: true,
    //     unique: true
    // },
    name: { // Profile name from webhook
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    profilePicUrl: { 
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const messageSchema = new Schema({
    waMessageId: { // id from webhook
        type: String,
        required: true,
        unique: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: false // could be media instead
    },
    type: {
        type: String,
        enum: ["text", "image", "video", "document", "audio"],
        default: "text"
    },
    timestamp: { // when the message was sent
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: statusTypes,
        default: "sent"
    }
}, { timestamps: true });

const UserModel = model('User', userSchema);
const MessageModel = model('Processed_Message', messageSchema);

export {UserModel, MessageModel};