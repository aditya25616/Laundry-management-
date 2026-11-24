import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET;

export async function authenticate(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        status: 401,
        message: "Authentication token is required",
      };
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    await connectDB();

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return {
        success: false,
        status: 401,
        message: "User not found",
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      status: 401,
      message: "Invalid or expired token",
    };
  }
}

export function authorize(user, allowedRoles = []) {
  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Authentication required",
    };
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return {
      success: false,
      status: 403,
      message: "You are not authorized to perform this action",
    };
  }

  return {
    success: true,
  };
}