import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { authenticate } from "@/lib/auth";

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

    const notifications = await Notification.find({
      user: auth.user._id,
    })
      .populate("laundry", "tagId status")
      .populate("dispute", "type status")
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter(
      (notification) => !notification.isRead
    ).length;

    return Response.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch notifications",
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

    const { notificationId } = await request.json();

    if (!notificationId) {
      return Response.json(
        {
          success: false,
          message: "Notification ID is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const notification = await Notification.findOne({
      _id: notificationId,
      user: auth.user._id,
    });

    if (!notification) {
      return Response.json(
        {
          success: false,
          message: "Notification not found",
        },
        { status: 404 }
      );
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();

    return Response.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Update notification error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to update notification",
      },
      { status: 500 }
    );
  }
}