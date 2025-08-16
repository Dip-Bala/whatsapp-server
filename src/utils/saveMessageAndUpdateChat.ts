
import { ChatModel, MessageModel, UserModel } from "../model/schema";

export async function saveMessageAndUpdateChat({
  senderEmail,
  receiverEmail,
  text,
  status,
}: {
  senderEmail: string;
  receiverEmail: string;
  text: string;
  status: "sent" | "delivered" | "read";
}) {
  const sender = await UserModel.findOne({ email: senderEmail });
  const receiver = await UserModel.findOne({ email: receiverEmail });
  if (!sender || !receiver) return null;

  const message = await MessageModel.create({
    sender: sender._id,
    receiver: receiver._id,
    text,
    timestamp: new Date(),
    status,
  });

  const participants = [senderEmail, receiverEmail].sort();
  console.log("Chat Model getting updated");
  let chat = await ChatModel.findOne({ participants });
  if (!chat) {
    chat = await ChatModel.create({
      participants,
      lastMessage: {
        text,
        timestamp: message.timestamp,
        status,
        senderEmail,
      },
      unreadCount: new Map([
        [receiverEmail, 1],
        [senderEmail, 0],
      ]),
    });
  } else {
    chat.lastMessage = {
      text,
      timestamp: message.timestamp,
      status,
      senderEmail,
    };

    chat.unreadCount = {
  ...chat.unreadCount,
  [receiverEmail]: (chat.unreadCount[receiverEmail] || 0) + 1,
};


    await chat.save();
  }

  return { message, sender, receiver };
}
