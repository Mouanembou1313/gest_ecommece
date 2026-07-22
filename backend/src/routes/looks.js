import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { Look } from "../models/Look.js";

const router = Router();

function sanitizeLookPayload(payload) {
  return {
    title: payload.title?.trim(),
    subtitle: payload.subtitle?.trim() || "",
    image: payload.image?.trim(),
    description: payload.description?.trim(),
    weekLabel: payload.weekLabel?.trim() || "Look de la semaine",
    isActive: Boolean(payload.isActive),
    items: Array.isArray(payload.items)
      ? payload.items
          .map((item) => ({
            name: item.name?.trim(),
            category: item.category?.trim(),
            image: item.image?.trim(),
            affiliateUrl: item.affiliateUrl?.trim() || ""
          }))
          .filter((item) => item.name && item.category && item.image)
      : []
  };
}

function validateLookPayload(payload) {
  const requiredFields = ["title", "image", "description"];
  const missingFields = requiredFields.filter((field) => !payload[field]);

  if (missingFields.length > 0) {
    return `Champs obligatoires manquants: ${missingFields.join(", ")}.`;
  }

  if (payload.items.length === 0) {
    return "Ajoute au moins un article qui compose le look.";
  }

  return null;
}

async function makeOnlyActiveLook(id) {
  await Look.updateMany({ _id: { $ne: id } }, { isActive: false });
}

router.get("/", async (_req, res, next) => {
  try {
    const looks = await Look.find().sort({ isActive: -1, updatedAt: -1 });
    return res.json(looks);
  } catch (error) {
    return next(error);
  }
});

router.get("/active", async (_req, res, next) => {
  try {
    const look = await Look.findOne({ isActive: true }).sort({ updatedAt: -1 });

    if (!look) {
      return res.status(404).json({ message: "Aucun look actif." });
    }

    return res.json(look);
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/view", async (req, res, next) => {
  try {
    const look = await Look.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!look) {
      return res.status(404).json({ message: "Look introuvable." });
    }

    return res.json(look);
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/like", async (req, res, next) => {
  try {
    const look = await Look.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!look) {
      return res.status(404).json({ message: "Look introuvable." });
    }

    return res.json(look);
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/comments", async (req, res, next) => {
  try {
    const message = req.body.message?.trim();
    const author = req.body.author?.trim() || "Invite";

    if (!message) {
      return res.status(400).json({ message: "Le commentaire est obligatoire." });
    }

    const look = await Look.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { author, message } } },
      { new: true, runValidators: true }
    );

    if (!look) {
      return res.status(404).json({ message: "Look introuvable." });
    }

    return res.status(201).json(look);
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const payload = sanitizeLookPayload(req.body);
    const validationError = validateLookPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const look = await Look.create(payload);

    if (look.isActive) {
      await makeOnlyActiveLook(look._id);
    }

    return res.status(201).json(look);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const payload = sanitizeLookPayload(req.body);
    const validationError = validateLookPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const look = await Look.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!look) {
      return res.status(404).json({ message: "Look introuvable." });
    }

    if (look.isActive) {
      await makeOnlyActiveLook(look._id);
    }

    return res.json(look);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const look = await Look.findByIdAndDelete(req.params.id);

    if (!look) {
      return res.status(404).json({ message: "Look introuvable." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
