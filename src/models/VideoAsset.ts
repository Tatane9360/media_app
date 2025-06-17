import mongoose from "mongoose";

const VideoAssetSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Admin ID is required"],
    },
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },
    storageUrl: {
      type: String,
      required: [true, "Storage URL is required"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [0, "Duration must be positive"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size must be positive"],
    },
    metadata: {
      width: { type: Number },
      height: { type: Number },
      codec: { type: String },
      framerate: { type: Number },
      bitrate: { type: Number },
      thumbnailUrl: { type: String },
      audioChannels: { type: Number },
      audioSampleRate: { type: Number },
    },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
VideoAssetSchema.index({ admin_id: 1 });
VideoAssetSchema.index({ createdAt: -1 });
VideoAssetSchema.index({ tags: 1 });

export const VideoAsset =
  mongoose.models.VideoAsset || mongoose.model("VideoAsset", VideoAssetSchema);
