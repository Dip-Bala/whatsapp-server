import { Schema, model } from 'mongoose';

const messageStatusTypes: string[] = ["sent", "delivered", "read"];
const statusType: string[] = ["offline", "online"];

// ===== User Schema =====
const userSchema = new Schema({
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
  status : {
    type: String,
    enum: statusType
  }
}, { timestamps: true });

// ===== Contact Schema =====
const contactSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isOnWhatsApp: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

contactSchema.pre('save', async function (next) {
  const User = model('User');

  if (this.email) {
    const matchedUser = await User.findOne({ email: this.email });

    if (matchedUser) {
      this.linkedUser = matchedUser._id;
      this.isOnWhatsApp = true;
      this.profilePicUrl = matchedUser.profilePicUrl || this.profilePicUrl;
    } else {
      this.isOnWhatsApp = false;
    }
  }

  next();
});

// ===== Message Schema =====
const messageSchema = new Schema({
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

const ChatSchema = new Schema({
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

const UserModel = model('User', userSchema);
const MessageModel = model('Processed_Message', messageSchema); 
const ContactModel = model('Contact', contactSchema);
const ChatModel = model("Chat", ChatSchema);
export { UserModel, ContactModel, MessageModel, ChatModel };
