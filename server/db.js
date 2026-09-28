import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Chargement des variables d'environnement (.env.local prioritaire pour Neon)
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DATABASE_URL = process.env.DATABASE_URL;

let isPostgres = false;
let sql = null;
let sqliteDb = null;

if (DATABASE_URL) {
  try {
    const { neon } = await import("@neondatabase/serverless");
    sql = neon(DATABASE_URL);
    isPostgres = true;
    console.log("[DATABASE] Mode: Neon PostgreSQL (Cloud)");
  } catch (err) {
    console.warn("[DATABASE] Impossible de charger @neondatabase/serverless, repli sur SQLite:", err.message);
  }
}

if (!isPostgres) {
  console.log("[DATABASE] Mode: SQLite local (carnet.db)");
  const { DatabaseSync } = await import("node:sqlite");
  const DB_PATH = path.join(__dirname, "carnet.db");
  sqliteDb = new DatabaseSync(DB_PATH);
  sqliteDb.exec("PRAGMA foreign_keys = ON;");
  sqliteDb.exec("PRAGMA journal_mode = WAL;");
  sqliteDb.exec("PRAGMA synchronous = NORMAL;");
  sqliteDb.exec("PRAGMA cache_size = -64000;");
  sqliteDb.exec("PRAGMA temp_store = MEMORY;");
  sqliteDb.exec("PRAGMA busy_timeout = 5000;");
}

export function isUsingPostgres() {
  return isPostgres;
}

// Initialisation du schéma
export async function initDB() {
  if (isPostgres) {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        temp_password TEXT,
        nom TEXT DEFAULT '',
        prenom TEXT DEFAULT '',
        classe TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));`;

    await sql`
      CREATE TABLE IF NOT EXISTS carnet_data (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_carnet_user_id ON carnet_data (user_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        email TEXT,
        sujet TEXT,
        message TEXT,
        diagnostic TEXT,
        status TEXT DEFAULT 'ouvert',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("[DATABASE] Schéma Neon PostgreSQL vérifié et prêt.");
  } else {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        temp_password TEXT,
        nom TEXT DEFAULT '',
        prenom TEXT DEFAULT '',
        classe TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email COLLATE NOCASE);

      CREATE TABLE IF NOT EXISTS carnet_data (
        user_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_carnet_user_id ON carnet_data(user_id);

      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        email TEXT,
        sujet TEXT,
        message TEXT,
        diagnostic TEXT,
        status TEXT DEFAULT 'ouvert',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DATABASE] Schéma SQLite local prêt.");
  }
}

// Helpers Utilisateurs
export async function createUser({ id, email, passwordHash, tempPassword, nom, prenom, classe }) {
  const cleanEmail = email.toLowerCase().trim();
  if (isPostgres) {
    await sql`
      INSERT INTO users (id, email, password_hash, temp_password, nom, prenom, classe)
      VALUES (${id}, ${cleanEmail}, ${passwordHash}, ${tempPassword || null}, ${nom || ""}, ${prenom || ""}, ${classe || ""})
    `;
  } else {
    const stmt = sqliteDb.prepare(`
      INSERT INTO users (id, email, password_hash, temp_password, nom, prenom, classe)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, cleanEmail, passwordHash, tempPassword || null, nom || "", prenom || "", classe || "");
  }
}

export async function findUserByEmail(email) {
  const cleanEmail = email.toLowerCase().trim();
  if (isPostgres) {
    const rows = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${cleanEmail}) LIMIT 1`;
    return rows[0] || null;
  } else {
    const stmt = sqliteDb.prepare(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`);
    return stmt.get(cleanEmail) || null;
  }
}

export async function findUserById(id) {
  if (isPostgres) {
    const rows = await sql`SELECT id, email, nom, prenom, classe, temp_password, created_at FROM users WHERE id = ${id} LIMIT 1`;
    return rows[0] || null;
  } else {
    const stmt = sqliteDb.prepare(`SELECT id, email, nom, prenom, classe, temp_password, created_at FROM users WHERE id = ?`);
    return stmt.get(id) || null;
  }
}

export async function updateUserPassword(id, passwordHash, tempPassword = null) {
  if (isPostgres) {
    await sql`UPDATE users SET password_hash = ${passwordHash}, temp_password = ${tempPassword} WHERE id = ${id}`;
  } else {
    const stmt = sqliteDb.prepare(`UPDATE users SET password_hash = ?, temp_password = ? WHERE id = ?`);
    stmt.run(passwordHash, tempPassword, id);
  }
}

export async function updateUserProfile(id, { nom, prenom, classe }) {
  if (isPostgres) {
    await sql`UPDATE users SET nom = ${nom || ""}, prenom = ${prenom || ""}, classe = ${classe || ""} WHERE id = ${id}`;
  } else {
    const stmt = sqliteDb.prepare(`UPDATE users SET nom = ?, prenom = ?, classe = ? WHERE id = ?`);
    stmt.run(nom || "", prenom || "", classe || "", id);
  }
}

// Helpers Carnet Data
export async function getCarnetData(userId) {
  if (isPostgres) {
    const rows = await sql`SELECT data, updated_at FROM carnet_data WHERE user_id = ${userId} LIMIT 1`;
    if (!rows || rows.length === 0) return null;
    const raw = rows[0].data;
    if (typeof raw === "object" && raw !== null) return raw;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  } else {
    const stmt = sqliteDb.prepare(`SELECT data, updated_at FROM carnet_data WHERE user_id = ?`);
    const row = stmt.get(userId);
    if (!row) return null;
    try {
      return JSON.parse(row.data);
    } catch (e) {
      return null;
    }
  }
}

export async function saveCarnetData(userId, dataObject) {
  if (isPostgres) {
    const jsonString = JSON.stringify(dataObject);
    await sql`
      INSERT INTO carnet_data (user_id, data, updated_at)
      VALUES (${userId}, ${jsonString}::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = CURRENT_TIMESTAMP
    `;
  } else {
    const stmt = sqliteDb.prepare(`
      INSERT INTO carnet_data (user_id, data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        data = excluded.data,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(userId, JSON.stringify(dataObject));
  }
}

export async function createSupportTicket({ id, userId, email, sujet, message, diagnostic }) {
  if (isPostgres) {
    await sql`
      INSERT INTO support_tickets (id, user_id, email, sujet, message, diagnostic)
      VALUES (${id}, ${userId || null}, ${email || ""}, ${sujet || ""}, ${message || ""}, ${diagnostic || ""})
    `;
  } else {
    const stmt = sqliteDb.prepare(`
      INSERT INTO support_tickets (id, user_id, email, sujet, message, diagnostic)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId || null, email || "", sujet || "", message || "", diagnostic || "");
  }
}
