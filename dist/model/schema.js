"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const statusTypes = ["sent", "delivered", "read"];
const userSchema = new mongoose_1.Schema({
    wa_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: false
    },
    phoneNumber: {
        type: String,
        required: false
    },
    profilePicUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
const messageSchema = new mongoose_1.Schema({
    waMessageId: {
        type: String,
        required: true,
        unique: true
    },
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
        required: false // could be media instead
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
        enum: statusTypes,
        default: "sent"
    }
}, { timestamps: true });
const UserModel = (0, mongoose_1.model)('User', userSchema);
exports.UserModel = UserModel;
const MessageModel = (0, mongoose_1.model)('Processed_Message', messageSchema);
exports.MessageModel = MessageModel;
//# sourceMappingURL=schema.js.map