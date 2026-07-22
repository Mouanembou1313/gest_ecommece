import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { Product } from "../models/Product.js";

const router = Router();

function buildSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sanitizeProductPayload(payload) {
  const name = payload.name?.trim();
  const slug = payload.slug?.trim() || buildSlug(name || "");

  return {
    slug,
    name,
    brand: payload.brand?.trim(),
    category: payload.category?.trim(),
    price: payload.price?.trim(),
    rating: Number(payload.rating || 4.5),
    image: payload.image?.trim(),
    affiliateUrl: payload.affiliateUrl?.trim(),
    description: payload.description?.trim(),
    isFeatured: Boolean(payload.isFeatured)
  };
}

function validateProductPayload(payload) {
  const requiredFields = ["slug", "name", "brand", "category", "price", "image", "affiliateUrl", "description"];
  const missingFields = requiredFields.filter((field) => !payload[field]);

  if (missingFields.length > 0) {
    return `Champs obligatoires manquants: ${missingFields.join(", ")}.`;
  }

  if (Number.isNaN(payload.rating) || payload.rating < 0 || payload.rating > 5) {
    return "La note doit etre comprise entre 0 et 5.";
  }

  return null;
}

router.get("/", async (req, res, next) => {
  try {
    const { category, q } = req.query;
    const filters = {};

    if (category && category !== "Tous") {
      filters.category = category;
    }

    if (q) {
      filters.$or = [
        { name: new RegExp(q, "i") },
        { brand: new RegExp(q, "i") },
        { category: new RegExp(q, "i") }
      ];
    }

    const products = await Product.find(filters).sort({ isFeatured: -1, createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await Product.distinct("category");
    res.json(["Tous", ...categories.sort()]);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const payload = sanitizeProductPayload(req.body);
    const validationError = validateProductPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingProduct = await Product.findOne({ slug: payload.slug });

    if (existingProduct) {
      return res.status(409).json({ message: "Un produit utilise deja ce slug." });
    }

    const product = await Product.create(payload);
    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const payload = sanitizeProductPayload(req.body);
    const validationError = validateProductPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const duplicateProduct = await Product.findOne({ slug: payload.slug, _id: { $ne: req.params.id } });

    if (duplicateProduct) {
      return res.status(409).json({ message: "Un autre produit utilise deja ce slug." });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable." });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable." });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.get("/:slug/redirect", async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable." });
    }

    return res.redirect(302, product.affiliateUrl);
  } catch (error) {
    return next(error);
  }
});

export default router;
