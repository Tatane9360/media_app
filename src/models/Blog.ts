import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
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
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    image_url: {
      type: String,
      trim: true,
    },
    published_at: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from title before saving
BlogSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-")
      .substring(0, 100);
  }
  next();
});

BlogSchema.index({ admin_id: 1 });
BlogSchema.index({ published_at: -1 });
BlogSchema.index({ status: 1 });
BlogSchema.index({ slug: 1 });

export const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
