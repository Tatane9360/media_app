import mongoose from "mongoose";

// Sous-schéma pour les effets appliqués à un clip
const EffectSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, "Effect type is required"],
    enum: ["filter", "transition", "text", "overlay", "audio", "speed", "crop"],
  },
  name: {
    type: String,
    required: [true, "Effect name is required"],
    trim: true,
  },
  params: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  startTime: {
    type: Number,
    default: 0,
    min: [0, "Start time must be positive"],
  },
  endTime: {
    type: Number,
    min: [0, "End time must be positive"],
  },
});

// Sous-schéma pour un clip dans la timeline
const ClipSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VideoAsset",
    required: [true, "Video asset ID is required"],
  },
  trackIndex: {
    type: Number,
    required: [true, "Track index is required"],
    min: [0, "Track index must be positive"],
  },
  startTime: {
    type: Number,
    required: [true, "Start time is required"],
    min: [0, "Start time must be positive"],
  },
  endTime: {
    type: Number,
    required: [true, "End time is required"],
    min: [0, "End time must be positive"],
  },
  trimStart: {
    type: Number,
    default: 0,
    min: [0, "Trim start must be positive"],
  },
  trimEnd: {
    type: Number,
    default: 0,
    min: [0, "Trim end must be positive"],
  },
  volume: {
    type: Number,
    default: 1,
    min: [0, "Volume must be positive"],
    max: [1, "Volume cannot exceed 1"],
  },
  effects: [EffectSchema],
});

// Sous-schéma pour les pistes audio
const AudioTrackSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VideoAsset",
  },
  externalUrl: {
    type: String,
    trim: true,
  },
  trackIndex: {
    type: Number,
    required: [true, "Track index is required"],
    min: [0, "Track index must be positive"],
  },
  startTime: {
    type: Number,
    required: [true, "Start time is required"],
    min: [0, "Start time must be positive"],
  },
  endTime: {
    type: Number,
    required: [true, "End time is required"],
    min: [0, "End time must be positive"],
  },
  volume: {
    type: Number,
    default: 1,
    min: [0, "Volume must be positive"],
    max: [1, "Volume cannot exceed 1"],
  },
  fadeIn: {
    type: Number,
    default: 0,
    min: [0, "Fade in must be positive"],
  },
  fadeOut: {
    type: Number,
    default: 0,
    min: [0, "Fade out must be positive"],
  },
});

// Schéma principal de la timeline
const TimelineSchema = new mongoose.Schema({
  duration: {
    type: Number,
    required: [true, "Timeline duration is required"],
    min: [0, "Duration must be positive"],
  },
  aspectRatio: {
    type: String,
    default: "16:9",
    enum: ["16:9", "9:16", "1:1", "4:3", "21:9"],
  },
  resolution: {
    width: {
      type: Number,
      default: 1920,
      min: [0, "Width must be positive"],
    },
    height: {
      type: Number,
      default: 1080,
      min: [0, "Height must be positive"],
    },
  },
  clips: [ClipSchema],
  audioTracks: [AudioTrackSchema],
  globalEffects: [EffectSchema],
});

// Schéma du projet
const ProjectSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Admin ID is required"],
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    videoAssets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VideoAsset",
      },
    ],
    timeline: TimelineSchema,
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "rendering", "completed", "published", "error"],
      default: "draft",
    },
    publishedUrl: {
      type: String,
      trim: true,
    },
    renderProgress: {
      type: Number,
      default: 0,
      min: [0, "Progress must be at least 0"],
      max: [100, "Progress cannot exceed 100"],
    },
    renderError: {
      type: String,
      trim: true,
    },
    renderSettings: {
      format: {
        type: String,
        enum: ["mp4", "webm", "mov", "gif"],
        default: "mp4",
      },
      quality: {
        type: String,
        enum: ["low", "medium", "high", "ultra"],
        default: "high",
      },
      codec: {
        type: String,
        enum: ["h264", "h265", "vp9", "av1"],
        default: "h264",
      },
      bitrateVideo: {
        type: Number,
        default: 5000,
      },
      bitrateAudio: {
        type: Number,
        default: 128,
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ProjectSchema.index({ admin_id: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ isPublic: 1 });
ProjectSchema.index({ tags: 1 });

export const Project =
  mongoose.models.Project || mongoose.model("Project", ProjectSchema);
