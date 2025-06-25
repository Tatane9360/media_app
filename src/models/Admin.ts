import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Nom d'utilisateur requis"],
      unique: true,
      trim: true,
      minlength: [
        3,
        "Le nom d'utilisateur doit comporter au moins 3 caractères",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
  },
  {
    timestamps: true,
  }
);

export const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
