import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import lookRoutes from "./routes/looks.js";
import productRoutes from "./routes/products.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = new Set([
  clientUrl,
  clientUrl.replace(/\/$/, ""),
  "http://localhost:5173"
]);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
      callback(null, true);
      return;
    }

    callback(new Error("Origine non autorisee par CORS."));
  }
}));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "premium-affiliate-shop" });
});

app.use("/api/products", productRoutes);
app.use("/api/looks", lookRoutes);
app.use("/api/auth", authRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Erreur serveur." });
});

connectDatabase(process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`API disponible sur http://localhost:${port}/api`);
    });
  })
  .catch((error) => {
    console.error("Impossible de demarrer le serveur", error);
    process.exit(1);
  });
