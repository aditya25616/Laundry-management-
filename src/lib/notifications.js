import Notification from "@/models/Notification";

export async function createNotification({
  userId,
  title,
  message,
  type = "system",
  laundryId = null,
  disputeId = null,
}) {
  if (!userId || !title || !message) {
    return null;
  }

  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      laundry: laundryId,
      dispute: disputeId,
    });

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);

    return null;
  }
}