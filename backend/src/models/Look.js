import mongoose from "mongoose";

const lookItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    affiliateUrl: { type: String, default: "" }
  },
  { _id: false }
);

const lookCommentSchema = new mongoose.Schema(
  {
    author: { type: String, default: "Invite" },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const lookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    image: { type: String, required: true },
    description: { type: String, required: true },
    items: { type: [lookItemSchema], default: [] },
    weekLabel: { type: String, default: "Look de la semaine" },
    isActive: { type: Boolean, default: false, index: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: [lookCommentSchema], default: [] }
  },
  { timestamps: true }
);

export const Look = mongoose.model("Look", lookSchema);
