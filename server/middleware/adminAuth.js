import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";

export const isAdmin = async (req, res, next) => {
  try {
    // ✅ First try to get from cookie, then from header
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find admin
    const admin = await Admin.findById(decoded._id).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin; // attach admin to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};
