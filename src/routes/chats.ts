
import express from "express";
import { verifyToken } from "../middleware/middleware";
import { ChatModel } from "../model/schema";

const chatsRouter = express.Router();

chatsRouter.get("/", verifyToken, async (req: any, res) => {
  console.log("user email:", req.user.email);
  try {
    const chats = await ChatModel.find({
      participants: req.user.email,
    });
    console.log(chats);

    const formatted = chats.map((chat) => {
      const participantEmail = chat.participants.find(
        (p) => p !== req.user.email
      );
      console.log(participantEmail);
      return {
        chatId: chat.participants.sort().join("-"),
        participant: { email: participantEmail },
        lastMessage: chat.lastMessage,
        unreadCount: chat.unreadCount?.[req.user.email] || 0,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

export default chatsRouter;
