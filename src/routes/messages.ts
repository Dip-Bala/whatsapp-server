import  { Router } from "express";
import { verifyToken } from "../middleware/middleware";
import { MessageModel, UserModel } from "../model/schema";
const messageRouter = Router();

messageRouter.get("/:contactEmail", verifyToken, async (req, res) => {
  const me = await UserModel.findById(req.user.id);
  const them = await UserModel.findOne({ email: req.params.contactEmail });
  if (!me || !them) return res.status(404).json({ error: "User not found" });

  const msgs = await MessageModel.find({
    $or: [
      { sender: me._id, receiver: them._id },
      { sender: them._id, receiver: me._id },
    ],
  }).sort({ timestamp: 1 });

  const enriched = msgs.map((m) => ({
    _id: m._id,
    text: m.text,
    timestamp: m.timestamp,
    status: m.status,
    senderEmail: String(m.sender) === String(me._id) ? me.email : them.email,
    receiverEmail:
      String(m.receiver) === String(me._id) ? me.email : them.email,
  }));

  res.json(enriched);
});

export default messageRouter;

