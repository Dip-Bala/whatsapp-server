import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../model/schema";

const loginRouter = Router();

function generateToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

loginRouter.post("/", async (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: "Name and email are required" });

  let user = await UserModel.findOne({ email });

  if (!user) {
    try {
      user = await UserModel.create({ name, email });
      const token = generateToken(user._id.toString());
      return res.status(200).json({
        user: user,
        token: token,
      });
    } catch (e) {
      return res.status(403).json({
        error: e,
      });
    }
  }
  const token = generateToken(user._id.toString());
  return res.status(200).json({
    user: user,
    token: token,
  });
});

export default loginRouter;
