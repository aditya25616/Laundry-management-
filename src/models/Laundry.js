import mongoose from "mongoose";

const laundryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    conditionBefore: {
      type: String,
      enum: ["good", "damaged", "stained", "worn"],
      default: "good",
    },

    conditionAfter: {
      type: String,
      enum: ["good", "damaged", "stained", "worn", "missing"],
      default: "good",
    },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const laundrySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tagId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    items: {
      type: [laundryItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "At least one laundry item is required",
      },
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "submitted",
        "tag_verified",
        "batched",
        "processing",
        "quality_check",
        "ready_for_pickup",
        "picked_up",
        "completed",
        "disputed",
      ],
      default: "submitted",
      index: true,
    },

    expectedCompletionDate: {
      type: Date,
      default: null,
    },

    pickupDate: {
      type: Date,
      default: null,
    },

    pickedUp: {
      type: Boolean,
      default: false,
    },

    pickupConfirmedAt: {
      type: Date,
      default: null,
    },

    pickupConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    hasIssue: {
      type: Boolean,
      default: false,
    },

    issueType: {
      type: String,
      enum: ["missing", "damaged", "wrong_item", "other", null],
      default: null,
    },

    issueDescription: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Laundry =
  mongoose.models.Laundry ||
  mongoose.model("Laundry", laundrySchema);

export default Laundry;