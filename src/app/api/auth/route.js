import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Please define JWT_SECRET in .env.local");
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      action,
      name,
      email,
      password,
    } = body;

    if (action === "login") {
      if (!email || !password) {
        return Response.json(
          {
            success: false,
            message: "Email and password are required",
          },
          { status: 400 }
        );
      }

      const user = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (!user) {
        return Response.json(
          {
            success: false,
            message: "Invalid email or password",
          },
          { status: 401 }
        );
      }

      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatch) {
        return Response.json(
          {
            success: false,
            message: "Invalid email or password",
          },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          role: user.role,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return Response.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    if (!name || !email || !password) {
      return Response.json(
        {
          success: false,
          message: "Name, email and password are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "User already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "student",
    });

    return Response.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Authentication error:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}