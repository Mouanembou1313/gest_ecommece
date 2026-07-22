import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { Product } from "../models/Product.js";

dotenv.config();

const products = [
  {
    slug: "manteau-laine-structure",
    name: "Manteau laine structure",
    brand: "Atelier Nord",
    category: "Vetements",
    price: "249 EUR",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/manteau-laine-structure",
    description: "Un manteau en laine melangee avec une coupe nette, pense pour une silhouette moderne et durable.",
    isFeatured: true
  },
  {
    slug: "robe-satin-minuit",
    name: "Robe satin minuit",
    brand: "Lys Studio",
    category: "Vetements",
    price: "139 EUR",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/robe-satin-minuit",
    description: "Une robe fluide au fini satine, ideale pour une selection chic et feminine.",
    isFeatured: true
  },
  {
    slug: "sneakers-cuir-creme",
    name: "Sneakers cuir creme",
    brand: "Monceau",
    category: "Chaussures",
    price: "119 EUR",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/sneakers-cuir-creme",
    description: "Des sneakers minimalistes en cuir, faciles a associer avec des looks casual premium."
  },
  {
    slug: "sac-cuir-noir",
    name: "Sac cuir noir",
    brand: "Maison Elan",
    category: "Accessoires",
    price: "189 EUR",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/sac-cuir-noir",
    description: "Un sac structure en cuir noir, concu pour completer une garde-robe premium.",
    isFeatured: true
  },
  {
    slug: "montre-acier-doree",
    name: "Montre acier doree",
    brand: "Velours Time",
    category: "Accessoires",
    price: "159 EUR",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/montre-acier-doree",
    description: "Une montre elegante avec bracelet acier, parfaite pour les pages accessoires et cadeaux."
  },
  {
    slug: "casque-audio-premium",
    name: "Casque audio premium",
    brand: "NOVA Sound",
    category: "Maison & Tech",
    price: "229 EUR",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/casque-audio-premium",
    description: "Un casque haut de gamme pour completer une categorie lifestyle, bureau et technologie."
  }
];

await connectDatabase(process.env.MONGODB_URI);
await Product.deleteMany({});
await Product.insertMany(products);
await mongoose.disconnect();

console.log(`${products.length} produits ajoutes.`);
