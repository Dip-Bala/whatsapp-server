"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModel = exports.MessageModel = exports.ContactModel = exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const messageStatusTypes = ["sent", "delivered", "read"];
const statusType = ["offline", "online"];
// ===== User Schema =====
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    profilePicUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: statusType
    }
}, { timestamps: true });
// ===== Contact Schema =====
const contactSchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
    },
    profilePicUrl: {
        type: String,
        default: null,
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    linkedUser: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    isOnWhatsApp: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
contactSchema.pre('save', async function (next) {
    const User = (0, mongoose_1.model)('User');
    if (this.email) {
        const matchedUser = await User.findOne({ email: this.email });
        if (matchedUser) {
            this.linkedUser = matchedUser._id;
            this.isOnWhatsApp = true;
            this.profilePicUrl = matchedUser.profilePicUrl || this.profilePicUrl;
        }
        else {
            this.isOnWhatsApp = false;
        }
    }
    next();
});
// ===== Message Schema =====
const messageSchema = new mongoose_1.Schema({
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: false
    },
    type: {
        type: String,
        enum: ["text", "image", "video", "document", "audio"],
        default: "text"
    },
    timestamp: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: messageStatusTypes,
        default: "sent"
    }
}, { timestamps: true });
// export interface IChat extends Document {
//   participants: string[];
//   lastMessage?: {
//     text: string;
//     timestamp: Date;
//     status: string;
//     senderEmail: string;
//   };
//   unreadCount: Object
// }
const ChatSchema = new mongoose_1.Schema({
    participants: { type: [String], required: true },
    lastMessage: {
        text: String,
        timestamp: Date,
        status: String,
        senderEmail: String,
    },
    unreadCount: {
        type: Object,
        default: {},
    }
});
const UserModel = (0, mongoose_1.model)('User', userSchema);
exports.UserModel = UserModel;
const MessageModel = (0, mongoose_1.model)('Processed_Message', messageSchema);
exports.MessageModel = MessageModel;
const ContactModel = (0, mongoose_1.model)('Contact', contactSchema);
exports.ContactModel = ContactModel;
const ChatModel = (0, mongoose_1.model)("Chat", ChatSchema);
exports.ChatModel = ChatModel;
//# sourceMappingURL=schema.js.map