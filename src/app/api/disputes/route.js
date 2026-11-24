import { connectDB } from "@/lib/db";
import Dispute from "@/models/Dispute";
import Laundry from "@/models/Laundry";
import { authenticate, authorize } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

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

    const filter =
      auth.user.role === "student"
        ? { student: auth.user._id }
        : {};

    const disputes = await Dispute.find(filter)
      .populate("student", "name email")
      .populate("laundry", "tagId status")
      .populate("handledBy", "name email")
      .sort({ createdAt: -1 });

    return Response.json({
      success: true,
      disputes,
    });
  } catch (error) {
    console.error("Fetch disputes error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch disputes",
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

    const {
      laundryId,
      type,
      description,
    } = await request.json();

    if (!laundryId || !type || !description) {
      return Response.json(
        {
          success: false,
          message:
            "Laundry, dispute type and description are required",
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

    const dispute = await Dispute.create({
      laundry: laundry._id,
      student: auth.user._id,
      type,
      description,
    });

    laundry.hasIssue = true;

    laundry.issueType =
      type === "missing_item"
        ? "missing"
        : type === "damaged_item"
        ? "damaged"
        : type === "wrong_item"
        ? "wrong_item"
        : "other";

    laundry.issueDescription = description;
    laundry.status = "disputed";

    laundry.statusHistory.push({
      status: "disputed",
      changedBy: auth.user._id,
      remarks: "Dispute raised by student",
    });

    await laundry.save();

    await createNotification({
      userId: auth.user._id,
      title: "Dispute Submitted",
      message:
        "Your laundry dispute has been submitted and is waiting for review.",
      type: "dispute",
      laundryId: laundry._id,
      disputeId: dispute._id,
    });

    return Response.json(
      {
        success: true,
        message: "Dispute submitted successfully",
        dispute,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create dispute error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create dispute",
      },
      { status: 500 }
    );
  }
}

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
      disputeId,
      status,
      resolution,
    } = await request.json();

    if (!disputeId || !status) {
      return Response.json(
        {
          success: false,
          message:
            "Dispute ID and status are required",
        },
        { status: 400 }
      );
    }

    if (
      ![
        "under_review",
        "resolved",
        "rejected",
      ].includes(status)
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid dispute status",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      return Response.json(
        {
          success: false,
          message: "Dispute not found",
        },
        { status: 404 }
      );
    }

    dispute.status = status;
    dispute.resolution = resolution || "";
    dispute.handledBy = auth.user._id;

    if (
      status === "resolved" ||
      status === "rejected"
    ) {
      dispute.resolvedAt = new Date();
    }

    await dispute.save();

    const notificationMessages = {
      under_review: {
        title: "Dispute Under Review",
        message:
          "Your laundry dispute is now being reviewed by the hostel staff.",
      },

      resolved: {
        title: "Dispute Resolved",
        message:
          "Your laundry dispute has been resolved. Check the dispute details for the resolution.",
      },

      rejected: {
        title: "Dispute Rejected",
        message:
          "Your laundry dispute has been rejected. Check the dispute details for more information.",
      },
    };

    const notification =
      notificationMessages[status];

    if (notification) {
      await createNotification({
        userId: dispute.student,
        title: notification.title,
        message: notification.message,
        type: "dispute",
        laundryId: dispute.laundry,
        disputeId: dispute._id,
      });
    }

    return Response.json({
      success: true,
      message: "Dispute updated successfully",
      dispute,
    });
  } catch (error) {
    console.error("Update dispute error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to update dispute",
      },
      { status: 500 }
    );
  }
}