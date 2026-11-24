import { connectDB } from "@/lib/db";
import Laundry from "@/models/Laundry";
import Batch from "@/models/Batch";
import { authenticate, authorize } from "@/lib/auth";

function generateTagId() {
  return `TAG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function GET(request) {
  try {
    const auth = await authenticate(request);

    if (!auth.success) {
      return Response.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();

    const filter =
      auth.user.role === "student"
        ? { student: auth.user._id }
        : {};

    const laundry = await Laundry.find(filter)
      .populate("student", "name email")
      .populate("batch", "batchNumber status")
      .sort({ createdAt: -1 });

    return Response.json({
      success: true,
      laundry,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Failed to fetch laundry",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await authenticate(request);

    if (!auth.success) {
      return Response.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const permission = authorize(auth.user, ["student"]);

    if (!permission.success) {
      return Response.json(
        { success: false, message: permission.message },
        { status: permission.status }
      );
    }

    const { items, expectedCompletionDate } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json(
        {
          success: false,
          message: "At least one laundry item is required",
        },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.name || !item.quantity || item.quantity < 1) {
        return Response.json(
          {
            success: false,
            message: "Each item needs a valid name and quantity",
          },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const laundry = await Laundry.create({
      student: auth.user._id,
      tagId: generateTagId(),
      items,
      expectedCompletionDate: expectedCompletionDate || null,
      status: "submitted",
      statusHistory: [
        {
          status: "submitted",
          changedBy: auth.user._id,
          remarks: "Laundry submitted",
        },
      ],
    });

    return Response.json(
      {
        success: true,
        message: "Laundry submitted successfully",
        laundry,
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Failed to submit laundry",
      },
      { status: 500 }
    );
  }
}