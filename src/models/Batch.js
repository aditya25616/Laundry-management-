import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    laundryCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "created",
        "processing",
        "quality_check",
        "ready_for_pickup",
        "completed",
      ],
      default: "created",
      index: true,
    },

    processingStartedAt: {
      type: Date,
      default: null,
    },

    qualityCheckAt: {
      type: Date,
      default: null,
    },

    readyAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Batch =
  mongoose.models.Batch ||
  mongoose.model("Batch", batchSchema);

export default Batch;