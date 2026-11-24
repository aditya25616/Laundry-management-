import { connectDB } from "@/lib/db";
import Batch from "@/models/Batch";
import Laundry from "@/models/Laundry";
import { authenticate, authorize } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

const allowedTransitions = {
  created: ["processing"],
  processing: ["quality_check"],
  quality_check: ["ready_for_pickup"],
  ready_for_pickup: ["completed"],
};

const laundryStatusMap = {
  processing: "processing",
  quality_check: "quality_check",
  ready_for_pickup: "ready_for_pickup",
};

const notificationMessages = {
  processing: {
    title: "Laundry Processing Started",
    message:
      "Your laundry is now being processed.",
  },

  quality_check: {
    title: "Laundry Quality Check",
    message:
      "Your laundry has reached the quality check stage.",
  },

  ready_for_pickup: {
    title: "Laundry Ready for Pickup",
    message:
      "Your laundry has passed the quality check and is ready for pickup.",
  },
};

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

    const permission = authorize(auth.user, [
      "staff",
      "admin",
    ]);

    if (!permission.success) {
      return Response.json(
        {
          success: false,
          message: permission.message,
        },
        { status: permission.status }
      );
    }

    const {
      batchId,
      status,
      remarks,
    } = await request.json();

    if (!batchId || !status) {
      return Response.json(
        {
          success: false,
          message: "Batch ID and status are required",
        },
        { status: 400 }
      );
    }

    if (
      !Object.values(allowedTransitions)
        .flat()
        .includes(status)
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid batch status",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const batch = await Batch.findById(batchId);

    if (!batch) {
      return Response.json(
        {
          success: false,
          message: "Batch not found",
        },
        { status: 404 }
      );
    }

    const nextStatuses =
      allowedTransitions[batch.status] || [];

    if (!nextStatuses.includes(status)) {
      return Response.json(
        {
          success: false,
          message: `Cannot change batch status from ${batch.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    /*
      A batch can only be completed after
      every laundry request inside it has been picked up.
    */
    if (status === "completed") {
      const batchLaundry = await Laundry.find({
        batch: batch._id,
      }).select("status");

      if (batchLaundry.length === 0) {
        return Response.json(
          {
            success: false,
            message: "This batch has no laundry items",
          },
          { status: 400 }
        );
      }

      const allPickedUp = batchLaundry.every(
        (item) =>
          item.status === "picked_up" ||
          item.status === "completed"
      );

      if (!allPickedUp) {
        return Response.json(
          {
            success: false,
            message:
              "Batch cannot be completed until all laundry has been picked up",
          },
          { status: 400 }
        );
      }

      batch.status = "completed";
      batch.completedAt = now;

      if (remarks !== undefined) {
        batch.remarks = remarks;
      }

      await batch.save();

      return Response.json({
        success: true,
        message: "Batch completed successfully",
        batch,
      });
    }

    batch.status = status;

    if (status === "processing") {
      batch.processingStartedAt = now;
    }

    if (status === "quality_check") {
      batch.qualityCheckAt = now;
    }

    if (status === "ready_for_pickup") {
      batch.readyAt = now;
    }

    if (remarks !== undefined) {
      batch.remarks = remarks;
    }

    await batch.save();

    const laundryStatus =
      laundryStatusMap[status];

    const batchLaundry = await Laundry.find({
      batch: batch._id,
    });

    await Laundry.updateMany(
      {
        batch: batch._id,
      },
      {
        $set: {
          status: laundryStatus,
          ...(status === "ready_for_pickup"
            ? { pickupDate: now }
            : {}),
        },
        $push: {
          statusHistory: {
            status: laundryStatus,
            changedBy: auth.user._id,
            remarks:
              remarks ||
              `Batch ${batch.batchNumber} moved to ${status}`,
          },
        },
      }
    );

    const notification =
      notificationMessages[status];

    if (notification) {
      for (const laundry of batchLaundry) {
        await createNotification({
          userId: laundry.student,
          title: notification.title,
          message: notification.message,
          type:
            status === "ready_for_pickup"
              ? "pickup"
              : "laundry",
          laundryId: laundry._id,
        });
      }
    }

    return Response.json({
      success: true,
      message: "Batch status updated successfully",
      batch,
    });
  } catch (error) {
    console.error(
      "Update batch status error:",
      error
    );

    return Response.json(
      {
        success: false,
        message: "Failed to update batch status",
      },
      { status: 500 }
    );
  }
}