import {Schema, model} from 'mongoose';

const messageStatusTypes : string[] = ["sent" , "delivered" , "read"];
const statusType : string[] = ["offline", "online"];

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
    },
    status : {
        type: String,
        enum: statusType,
        required : true
    }
}, { timestamps: true });


// Contact Schema
const contactSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId, // The logged-in user who owns this contact list
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
      type: Schema.Types.ObjectId, // If the contact is also a WhatsApp user
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

const messageSchema = new Schema({
    // waMessageId: { // id from webhook
    //     type: String,
    //     required: true,
    //     unique: true
    // },
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
        enum: messageStatusTypes,
        default: "sent"
    }
}, { timestamps: true });

contactSchema.pre('save', async function (next) {
  const Contact = this.constructor as any;
  const User = model('User');

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
    } else {
      this.isOnWhatsApp = false;
    }
  }

  next();
});



const UserModel = model('User', userSchema);
const MessageModel = model('Processed_Message', messageSchema);
const ContactModel = model('Contact', contactSchema);

export {UserModel, ContactModel, MessageModel};