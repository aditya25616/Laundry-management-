import { connectDB } from "@/lib/db";
import Laundry from "@/models/Laundry";
import Batch from "@/models/Batch";
import { authenticate, authorize } from "@/lib/auth";

export async function PATCH(request) {
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

    const permission = authorize(auth.user, ["student"]);

    if (!permission.success) {
      return Response.json(
        {
          success: false,
          message: permission.message,
        },
        { status: permission.status }
      );
    }

    const { laundryId } = await request.json();

    if (!laundryId) {
      return Response.json(
        {
          success: false,
          message: "Laundry ID is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const laundry = await Laundry.findOne({
      _id: laundryId,
      student: auth.user._id,
    });

    if (!laundry) {
      return Response.json(
        {
          success: false,
          message: "Laundry not found",
        },
        { status: 404 }
      );
    }

    if (laundry.status !== "ready_for_pickup") {
      return Response.json(
        {
          success: false,
          message: "Laundry is not ready for pickup",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    laundry.status = "picked_up";
    laundry.pickedUp = true;
    laundry.pickupConfirmedAt = now;
    laundry.pickupConfirmedBy = auth.user._id;

    laundry.statusHistory.push({
      status: "picked_up",
      changedBy: auth.user._id,
      remarks: "Pickup confirmed by student",
      changedAt: now,
    });

    await laundry.save();

    let batchCompleted = false;

    if (laundry.batch) {
      const batchLaundry = await Laundry.find({
        batch: laundry.batch,
      }).select("status");

      const allPickedUp = batchLaundry.every(
        (item) =>
          item.status === "picked_up" ||
          item.status === "completed"
      );

      if (allPickedUp && batchLaundry.length > 0) {
        await Batch.findByIdAndUpdate(laundry.batch, {
          status: "completed",
          completedAt: now,
        });

        batchCompleted = true;
      }
    }

    return Response.json({
      success: true,
      message: batchCompleted
        ? "Pickup confirmed and batch completed successfully"
        : "Pickup confirmed successfully",
      laundry,
      batchCompleted,
    });
  } catch (error) {
    console.error("Confirm pickup error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to confirm pickup",
      },
      { status: 500 }
    );
  }
}