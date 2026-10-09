import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import mongoose from "mongoose";
import router from "./statistics.js";
import { createAdminToken } from "../middleware/auth.js";

test("statistics permissions, validation and daily totals", async () => {
  process.env.CLIENT_URL = "https://shop.example";
  process.env.ADMIN_TOKEN_SECRET = "test-only-secret";
  const model = mongoose.model("DailyTraffic");
  const original = { find: model.find, findOne: model.findOne, updateOne: model.updateOne };
  const updates = [];
  model.updateOne = async (...args) => { updates.push(args); };
  model.find = () => ({ lean: async () => [{ day: new Date().toISOString().slice(0, 10), shop: 2, looks: 3 }] });
  model.findOne = () => ({ sort: () => ({ lean: async () => null }) });
  const app = express();
  app.use(express.json());
  app.use("/statistics", router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/statistics`;
  try {
    assert.equal((await fetch(url)).status, 401);
    const headers = { Authorization: `Bearer ${createAdminToken("test@example.com")}` };
    assert.equal((await fetch(`${url}?days=9999`, { headers })).status, 400);
    const response = await fetch(`${url}?days=7`, { headers });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const data = await response.json();
    assert.equal(data.daily.length, 7);
    assert.equal(data.daily.at(-1).shop, 2);
    assert.equal(data.daily[0].shop, 0);
    const post = (page, origin) => fetch(`${url}/view`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ page }) });
    assert.equal((await post("admin", "https://shop.example")).status, 400);
    assert.equal((await post("shop", "http://localhost:5173")).status, 403);
    assert.equal((await post("shop", "https://shop.example")).status, 204);
    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0][1], { $inc: { shop: 1 } });
  } finally {
    Object.assign(model, original);
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
