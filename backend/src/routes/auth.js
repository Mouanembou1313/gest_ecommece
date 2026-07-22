import { Router } from "express";
import { createAdminToken } from "../middleware/auth.js";

const router = Router();

router.post("/login", (req, res) => {
  const email = req.body.email?.trim();
  const password = req.body.password || "";

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ message: "Les identifiants administrateur ne sont pas configures." });
  }

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Adresse email ou mot de passe incorrect." });
  }

  return res.json({ token: createAdminToken(email), admin: { email } });
});

export default router;
