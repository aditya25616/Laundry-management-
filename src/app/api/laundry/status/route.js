import { connectDB } from "@/lib/db";
import Laundry from "@/models/Laundry";
import { authenticate, authorize } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

const allowedTransitions = {
  submitted: ["tag_verified"],
  tag_verified: ["batched"],
  batched: ["processing"],
  processing: ["quality_check"],
  quality_check: ["ready_for_pickup"],
  ready_for_pickup: ["picked_up"],
  picked_up: ["completed"],
};

const notificationMessages = {
  tag_verified: {
    title: "Laundry Tag Verified",
    message:
      "Your laundry tag has been verified and your laundry is ready for batching.",
  },

  batched: {
    title: "Laundry Added to Batch",
    message:
      "Your laundry has been added to a processing batch.",
  },

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

  picked_up: {
    title: "Pickup Confirmed",
    message:
      "Your laundry pickup has been confirmed.",
  },

  completed: {
    title: "Laundry Completed",
    message:
      "Your laundry request has been completed successfully.",
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

    const { laundryId, status, remarks } =
      await request.json();

    if (!laundryId || !status) {
      return Response.json(
        {
          success: false,
          message: "Laundry ID and status are required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const laundry = await Laundry.findById(laundryId);

    if (!laundry) {
      return Response.json(
        {
          success: false,
          message: "Laundry not found",
        },
        { status: 404 }
      );
    }

    const nextStatuses =
      allowedTransitions[laundry.status] || [];

    if (!nextStatuses.includes(status)) {
      return Response.json(
        {
          success: false,
          message: `Cannot change status from ${laundry.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    laundry.status = status;

    laundry.statusHistory.push({
      status,
      changedBy: auth.user._id,
      remarks: remarks || "",
    });

    if (status === "ready_for_pickup") {
      laundry.pickupDate = new Date();
    }

    if (status === "completed") {
      laundry.pickedUp = true;
      laundry.pickupConfirmedAt = new Date();
      laundry.pickupConfirmedBy = auth.user._id;
    }

    await laundry.save();

    const notification =
      notificationMessages[status];

    if (notification) {
      await createNotification({
        userId: laundry.student,
        title: notification.title,
        message: notification.message,
        type:
          status === "ready_for_pickup" ||
          status === "picked_up" ||
          status === "completed"
            ? "pickup"
            : "laundry",
        laundryId: laundry._id,
      });
    }

    return Response.json({
      success: true,
      message: "Laundry status updated",
      laundry,
    });
  } catch (error) {
    console.error(
      "Update laundry status error:",
      error
    );

    return Response.json(
      {
        success: false,
        message: "Failed to update laundry status",
      },
      { status: 500 }
    );
  }
}