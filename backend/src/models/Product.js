import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: String, required: true },
    rating: { type: Number, default: 4.5 },
    image: { type: String, required: true },
    affiliateUrl: { type: String, required: true },
    description: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
    clicks: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
