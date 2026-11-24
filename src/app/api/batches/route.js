import { connectDB } from "@/lib/db";
import Batch from "@/models/Batch";
import Laundry from "@/models/Laundry";
import { authenticate, authorize } from "@/lib/auth";

function generateBatchNumber() {
  return `BATCH-${Date.now()}`;
}

export async function GET(request) {
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

    await connectDB();

    const batches = await Batch.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return Response.json({
      success: true,
      batches,
    });
  } catch (error) {
    console.error("Fetch batches error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch batches",
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
        {
          success: false,
          message: auth.message,
        },
        { status: auth.status }
      );
    }

    const permission = authorize(auth.user, ["staff", "admin"]);

    if (!permission.success) {
      return Response.json(
        {
          success: false,
          message: permission.message,
        },
        { status: permission.status }
      );
    }

    const { laundryIds, remarks } = await request.json();

    if (!Array.isArray(laundryIds) || laundryIds.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Select at least one laundry",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const laundry = await Laundry.find({
      _id: { $in: laundryIds },
      batch: null,
      status: "tag_verified",
    });

    if (laundry.length !== laundryIds.length) {
      return Response.json(
        {
          success: false,
          message:
            "Some laundry is not tag verified or is already in a batch",
        },
        { status: 400 }
      );
    }

    const batch = await Batch.create({
      batchNumber: generateBatchNumber(),
      createdBy: auth.user._id,
      laundryCount: laundry.length,
      status: "created",
      remarks: remarks || "",
    });

    await Laundry.updateMany(
      {
        _id: { $in: laundryIds },
      },
      {
        $set: {
          batch: batch._id,
          status: "batched",
        },
        $push: {
          statusHistory: {
            status: "batched",
            changedBy: auth.user._id,
            remarks: `Added to batch ${batch.batchNumber}`,
          },
        },
      }
    );

    return Response.json(
      {
        success: true,
        message: "Batch created successfully",
        batch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create batch error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create batch",
      },
      { status: 500 }
    );
  }
}