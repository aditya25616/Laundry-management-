import { connectDB } from "@/lib/db";
import Laundry from "@/models/Laundry";
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

    if (laundry.status !== "submitted") {
      return Response.json(
        {
          success: false,
          message: "Only submitted laundry can be tag verified",
        },
        { status: 400 }
      );
    }

    laundry.status = "tag_verified";

    laundry.statusHistory.push({
      status: "tag_verified",
      changedBy: auth.user._id,
      remarks: "Laundry tag verified by staff",
    });

    await laundry.save();

    return Response.json({
      success: true,
      message: "Laundry tag verified successfully",
      laundry,
    });
  } catch (error) {
    console.error("Tag verification error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to verify laundry tag",
      },
      { status: 500 }
    );
  }
}