import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserModel } from "../model/schema";

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    // Query DB with decoded.id
    const user = await UserModel.findById(decoded.id).lean();
    if (!user) return res.status(404).send("You are not on WhatsApp");

    // Attach user object to request
    console.log(user)
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
