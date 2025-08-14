"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = exports.ContactModel = exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const messageStatusTypes = ["sent", "delivered", "read"];
const statusType = ["offline", "online"];
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
// Contact Schema
const contactSchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId, // The logged-in user who owns this contact list
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
        type: mongoose_1.Schema.Types.ObjectId, // If the contact is also a WhatsApp user
        ref: 'User',
        default: null,
    },
    isOnWhatsApp: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
const messageSchema = new mongoose_1.Schema({
    // waMessageId: { // id from webhook
    //     type: String,
    //     required: true,
    //     unique: true
    // },
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
        enum: messageStatusTypes,
        default: "sent"
    }
}, { timestamps: true });
contactSchema.pre('save', async function (next) {
    const Contact = this.constructor;
    const User = (0, mongoose_1.model)('User');
    // If phoneNumber or email matches a registered user, link them
    if (this.email) {
        const matchedUser = await User.findOne({
            $or: [
                { email: this.email }
            ],
        });
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
const UserModel = (0, mongoose_1.model)('User', userSchema);
exports.UserModel = UserModel;
const MessageModel = (0, mongoose_1.model)('Processed_Message', messageSchema);
exports.MessageModel = MessageModel;
const ContactModel = (0, mongoose_1.model)('Contact', contactSchema);
exports.ContactModel = ContactModel;
//# sourceMappingURL=schema.js.map