import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "grocery.db");
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity TEXT DEFAULT '1',
    checked INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    bought_at TEXT
  );

  CREATE TABLE IF NOT EXISTS archived_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_id INTEGER,
    name TEXT NOT NULL,
    quantity TEXT,
    created_at TEXT,
    bought_at TEXT,
    archived_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Check if we need to migrate from grocery.json
const jsonPath = path.join(__dirname, "grocery.json");
if (fs.existsSync(jsonPath)) {
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const parsed = JSON.parse(rawData);
    if (parsed.items && parsed.items.length > 0) {
      // Check if items table is empty
      const count = db.prepare("SELECT count(*) as count FROM items").get().count;
      if (count === 0) {
        console.log("Migrating items from grocery.json to SQLite database...");
        const insert = db.prepare(`
          INSERT INTO items (id, name, quantity, checked, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        const insertMany = db.transaction((items) => {
          for (const item of items) {
            insert.run(
              item.id,
              item.name,
              item.quantity || "1",
              item.checked ? 1 : 0,
              item.created_at
            );
          }
        });
        
        insertMany(parsed.items);
        console.log(`Successfully migrated ${parsed.items.length} items to SQLite.`);
      }
    }
    // Rename grocery.json so we don't migrate again
    fs.renameSync(jsonPath, path.join(__dirname, "grocery.json.backup"));
  } catch (err) {
    console.error("Migration error:", err);
  }
}

export default db;
