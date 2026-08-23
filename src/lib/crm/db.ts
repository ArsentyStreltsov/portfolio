import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "crm.db");

export type LeadStatus =
  | "draft"
  | "ready"
  | "sent"
  | "opened"
  | "engaged"
  | "replied"
  | "interested"
  | "brief_sent"
  | "client"
  | "lost";

export type LeadRow = {
  id: number;
  lead_id: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  channel: string | null;
  status: LeadStatus;
  campaign: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

export type TouchRow = {
  id: number;
  lead_id: string;
  touch_id: string;
  subject_variant: string | null;
  outreach_url: string;
  sent_at: string | null;
  created_at: string;
};

export type EventRow = {
  id: number;
  lead_id: string | null;
  touch_id: string | null;
  event_type: string;
  summary: string | null;
  payload: string | null;
  created_at: string;
};

export type BriefRow = {
  id: number;
  lead_id: string | null;
  business_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  payload: string;
  created_at: string;
};

let db: Database.Database | null = null;

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL UNIQUE,
      business_name TEXT NOT NULL,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      channel TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      campaign TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sent_at TEXT
    );

    CREATE TABLE IF NOT EXISTS touches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL,
      touch_id TEXT NOT NULL UNIQUE,
      subject_variant TEXT,
      outreach_url TEXT NOT NULL,
      sent_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT,
      touch_id TEXT,
      event_type TEXT NOT NULL,
      summary TEXT,
      payload TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS briefs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT,
      business_name TEXT,
      contact_name TEXT,
      contact_email TEXT,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_lead ON events(lead_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_touches_lead ON touches(lead_id);
    CREATE INDEX IF NOT EXISTS idx_briefs_lead ON briefs(lead_id);
  `);
}

export function getDb() {
  if (db) return db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

export function nowIso() {
  return new Date().toISOString();
}
