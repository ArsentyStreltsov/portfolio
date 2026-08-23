import fs from "node:fs";
import path from "node:path";
import type { BriefRow, EventRow, LeadRow, TouchRow } from "./db";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "crm-store.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_BACKUPS = 14;

export type CrmStore = {
  leads: LeadRow[];
  touches: TouchRow[];
  events: EventRow[];
  briefs: BriefRow[];
  seq: { lead: number; touch: number; event: number; brief: number };
};

let cache: CrmStore | null = null;
let lastBackupDay = "";

function emptyStore(): CrmStore {
  return { leads: [], touches: [], events: [], briefs: [], seq: { lead: 0, touch: 0, event: 0, brief: 0 } };
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function rotateBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("crm-store-") && f.endsWith(".json"))
      .sort()
      .reverse();
    for (const old of files.slice(MAX_BACKUPS)) {
      fs.unlinkSync(path.join(BACKUP_DIR, old));
    }
  } catch {
    // best-effort
  }
}

/** One dated snapshot per calendar day (keeps last MAX_BACKUPS). */
function maybeBackup() {
  if (!fs.existsSync(STORE_PATH)) return;
  const day = new Date().toISOString().slice(0, 10);
  if (lastBackupDay === day) return;

  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const dest = path.join(BACKUP_DIR, `crm-store-${day}.json`);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(STORE_PATH, dest);
      rotateBackups();
    }
    lastBackupDay = day;
  } catch {
    // best-effort — never block CRM writes
  }
}

function loadFromDisk(): CrmStore {
  ensureDir();
  if (!fs.existsSync(STORE_PATH)) {
    const store = emptyStore();
    saveToDisk(store);
    return store;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as CrmStore;
    if (!parsed.seq) parsed.seq = { lead: 0, touch: 0, event: 0, brief: 0 };
    if (!Array.isArray(parsed.leads)) parsed.leads = [];
    if (!Array.isArray(parsed.touches)) parsed.touches = [];
    if (!Array.isArray(parsed.events)) parsed.events = [];
    if (!Array.isArray(parsed.briefs)) parsed.briefs = [];
    return parsed;
  } catch {
    // Corrupt file — keep a salvage copy, start fresh
    try {
      if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
      const salvage = path.join(BACKUP_DIR, `crm-store-corrupt-${Date.now()}.json`);
      fs.copyFileSync(STORE_PATH, salvage);
    } catch {
      // ignore
    }
    const store = emptyStore();
    saveToDisk(store);
    return store;
  }
}

function saveToDisk(store: CrmStore) {
  ensureDir();
  maybeBackup();
  const tmp = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store), "utf8");
  fs.renameSync(tmp, STORE_PATH);
}

/** In-process cache; single PM2 worker is enough for this CRM volume. */
export function readStore(): CrmStore {
  if (!cache) cache = loadFromDisk();
  return cache;
}

export function writeStore(mutator: (store: CrmStore) => void) {
  const store = readStore();
  mutator(store);
  saveToDisk(store);
}

export function nextRowId(store: CrmStore, table: keyof CrmStore["seq"]) {
  store.seq[table] += 1;
  return store.seq[table];
}

/** Force reload from disk (tests / after manual edit). */
export function reloadStore() {
  cache = null;
  return readStore();
}
