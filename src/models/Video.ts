import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Admin ID is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    source_type: {
      type: String,
      required: [true, "Source type is required"],
      enum: ["youtube", "vimeo", "upload", "url"],
      default: "upload",
    },
    original_url: {
      type: String,
      required: [true, "Original URL is required"],
      trim: true,
    },
    thumbnail_url: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [0, "Duration must be positive"],
    },
  },
  {
    timestamps: true,
  }
);

VideoSchema.index({ admin_id: 1 });
VideoSchema.index({ created_at: -1 });

export const Video =
  mongoose.models.Video || mongoose.model("Video", VideoSchema);
