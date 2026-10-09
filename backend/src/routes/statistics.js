import { Router } from "express";
import mongoose from "mongoose";
import { requireAdmin } from "../middleware/auth.js";

const dailySchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  shop: { type: Number, default: 0 },
  looks: { type: Number, default: 0 }
});
const DailyTraffic = mongoose.model("DailyTraffic", dailySchema);
const router = Router();

// Store daily totals only, without visitor identifiers or IP addresses.
router.post("/view", async (req, res, next) => {
  const page = req.body?.page;
  if (page !== "shop" && page !== "looks") {
    return res.status(400).json({ message: "Page invalide." });
  }
  const origin = req.get("origin");
  const expected = process.env.CLIENT_URL?.replace(/\/$/, "");
  if (!expected || origin !== expected) return res.sendStatus(403);
  try {
    const day = new Date().toISOString().slice(0, 10);
    try {
      await DailyTraffic.updateOne({ day }, { $inc: { [page]: 1 } }, { upsert: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
      await DailyTraffic.updateOne({ day }, { $inc: { [page]: 1 } });
    }
    return res.sendStatus(204);
  } catch (error) { return next(error); }
});

router.get("/", requireAdmin, async (req, res, next) => {
  const days = Number(req.query.days || 30);
  if (![7, 30, 90].includes(days)) return res.status(400).json({ message: "Periode invalide." });
  try {
    const today = new Date();
    const dates = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - days + index + 1);
      return date.toISOString().slice(0, 10);
    });
    const rows = await DailyTraffic.find({ day: { $gte: dates[0], $lte: dates.at(-1) } }).lean();
    const first = await DailyTraffic.findOne().sort({ day: 1 }).lean();
    const byDay = new Map(rows.map((row) => [row.day, row]));
    const daily = dates.map((day) => ({ day, shop: byDay.get(day)?.shop || 0, looks: byDay.get(day)?.looks || 0 }));
    res.set("Cache-Control", "no-store");
    return res.json({ daily, startedAt: first?.day || null });
  } catch (error) { return next(error); }
});

export default router;
