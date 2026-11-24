import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { authenticate, authorize } from "@/lib/auth";

export async function POST(request) {
  try {
    const auth = await authenticate(request);

    if (!auth.success) {
      return Response.json(
        {
          success: false,
          message: auth.message,
        },
        { status: auth.status }
      );
    }

    const permission = authorize(auth.user, ["admin"]);

    if (!permission.success) {
      return Response.json(
        {
          success: false,
          message: permission.message,
        },
        { status: permission.status }
      );
    }

    const { name, email, password } = await request.json();

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

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "staff",
    });

    return Response.json(
      {
        success: true,
        message: "Staff account created successfully",
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create staff error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create staff account",
      },
      { status: 500 }
    );
  }
}