import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    laundry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laundry",
      required: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "missing_item",
        "damaged_item",
        "wrong_item",
        "wrong_quantity",
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "open",
        "under_review",
        "resolved",
        "rejected",
      ],
      default: "open",
      index: true,
    },

    resolution: {
      type: String,
      default: "",
      trim: true,
    },

    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Dispute =
  mongoose.models.Dispute ||
  mongoose.model("Dispute", disputeSchema);

export default Dispute;