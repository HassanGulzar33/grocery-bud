import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

app.use(cors());
app.use(express.json());

// Authentication Middleware
function authenticate(req, res, next) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return next();
  }

  const authHeader = req.headers["authorization"];
  const headerKey = req.headers["x-api-key"];

  let providedKey = headerKey;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    providedKey = authHeader.substring(7);
  }

  if (!providedKey || providedKey !== apiKey) {
    return res.status(401).json({
      error: "Unauthorized. Invalid or missing API key.",
    });
  }

  next();
}

// Validation Schemas
const createItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  quantity: z.string().trim().max(50).default("1"),
});

const updateItemSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  quantity: z.string().trim().max(50).optional(),
  checked: z.boolean().optional(),
});

// Helper Functions
function getTwoMonthsAgoCutoff() {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return cutoff.toISOString();
}

function purgeAndArchiveOldHistory() {
  const cutoffStr = getTwoMonthsAgoCutoff();

  const oldItems = db.prepare(
    "SELECT * FROM items WHERE created_at < ?"
  ).all(cutoffStr);

  if (oldItems.length > 0) {
    const insertArchive = db.prepare(`
      INSERT INTO archived_items (original_id, name, quantity, created_at, bought_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const deleteOriginal = db.prepare("DELETE FROM items WHERE id = ?");

    const archiveTx = db.transaction((items) => {
      for (const item of items) {
        insertArchive.run(
          item.id,
          item.name,
          item.quantity,
          item.created_at,
          item.bought_at
        );
        deleteOriginal.run(item.id);
      }
    });

    archiveTx(oldItems);
    console.log(`[Database] Archived ${oldItems.length} items.`);
  }
}

// Public Routes
app.get("/", (req, res) => {
  res.send("Grocery Bud API is running.");
});

app.get("/api", (req, res) => {
  res.json({
    status: "running",
    message: "Backend is running successfully",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Protected Routes
app.use("/api", authenticate);

// GET active items
app.get("/api/items", async (req, res) => {
  try {
    purgeAndArchiveOldHistory();

    const stmt = db.prepare(
      "SELECT * FROM items WHERE checked = 0 ORDER BY id DESC"
    );
    const items = stmt.all();

    const mapped = items.map((i) => ({ ...i, checked: !!i.checked }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// POST new item
app.post("/api/items", async (req, res) => {
  const parsed = createItemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0].message,
    });
  }

  const { name, quantity } = parsed.data;
  const createdAt = new Date().toISOString();

  try {
    const stmt = db.prepare(`
      INSERT INTO items (name, quantity, checked, created_at)
      VALUES (?, ?, 0, ?)
    `);

    const result = stmt.run(name, quantity, createdAt);

    res.status(201).json({
      id: result.lastInsertRowid,
      name,
      quantity,
      checked: false,
      created_at: createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create item" });
  }
});

// PUT update item
app.put("/api/items/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid item ID" });
  }

  const parsed = updateItemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0].message,
    });
  }

  try {
    const current = db.prepare("SELECT * FROM items WHERE id = ?").get(id);

    if (!current) {
      return res.status(404).json({ error: "Item not found" });
    }

    const name =
      parsed.data.name !== undefined ? parsed.data.name : current.name;
    const quantity =
      parsed.data.quantity !== undefined
        ? parsed.data.quantity
        : current.quantity;
    const checked =
      parsed.data.checked !== undefined
        ? parsed.data.checked
          ? 1
          : 0
        : current.checked;

    const boughtAt =
      checked && !current.checked
        ? new Date().toISOString()
        : current.bought_at;

    db.prepare(`
      UPDATE items
      SET name = ?, quantity = ?, checked = ?, bought_at = ?
      WHERE id = ?
    `).run(name, quantity, checked, boughtAt, id);

    res.json({
      id,
      name,
      quantity,
      checked: !!checked,
      created_at: current.created_at,
      bought_at: boughtAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE item
app.delete("/api/items/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid item ID" });
  }

  try {
    const result = db.prepare("DELETE FROM items WHERE id = ?").run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// GET history
app.get("/api/history", async (req, res) => {
  try {
    purgeAndArchiveOldHistory();

    const cutoffStr = getTwoMonthsAgoCutoff();

    const stmt = db.prepare(`
      SELECT * FROM items
      WHERE checked = 1 AND created_at >= ?
      ORDER BY created_at DESC
    `);

    const items = stmt.all(cutoffStr);

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.listen(PORT, () => {
  console.log(`Grocery Bud API running on http://localhost:${PORT}`);
});

export default app;