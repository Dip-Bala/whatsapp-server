import { Router } from "express";
import { verifyToken } from "../middleware/middleware";
import { ContactModel, UserModel } from "../model/schema";

const contactRouter = Router();
contactRouter.use(verifyToken);

contactRouter.get("/", async (req, res) => {
  const contacts = await ContactModel.find({ owner: req.user._id }).sort({
    isOnWhatsApp: -1,
    name: 1,
  });
  res.json(contacts);
});

contactRouter.post("/", async (req, res) => {
  console.log("passed the token verification");
  console.log(req.user.id)
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: "Name and email are required" });

  const waUser = await UserModel.findOne({ email });
  const contactData: any = {
    owner: req.user._id,
    name,
    email,
    isOnWhatsApp: !!waUser,
    profilePicUrl: waUser?.profilePicUrl || "",  
    status: waUser?.status || "offline",   //need to check with ws for sync
  };

  const contact = await ContactModel.create(contactData);
  res.status(201).json(contact);
});

export default contactRouter;
