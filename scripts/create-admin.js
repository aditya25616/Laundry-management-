import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);

    const email = "admin@hostel.com";
    const password = "admin123";
    const name = "Hostel Admin";

    const existingAdmin = await User.findOne({
      email,
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin account created successfully.");
    console.log("Email:", admin.email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Failed to create admin:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();