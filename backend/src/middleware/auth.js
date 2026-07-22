import crypto from "crypto";

const tokenDurationMs = 1000 * 60 * 60 * 8;

function getSecret() {
  return process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_PASSWORD || "change-this-secret";
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createAdminToken(email) {
  const payload = encode({ email, exp: Date.now() + tokenDurationMs });
  return `${payload}.${sign(payload)}`;
}

function verifyAdminToken(token) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature || sign(payload) !== signature) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return decoded.exp && decoded.exp >= Date.now() ? decoded : null;
  } catch {
    return null;
  }
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const admin = token ? verifyAdminToken(token) : null;

  if (!admin) {
    return res.status(401).json({ message: "Acces administrateur requis." });
  }

  req.admin = admin;
  return next();
}
