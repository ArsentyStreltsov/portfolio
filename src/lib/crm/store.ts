import fs from "node:fs";
import path from "node:path";
import type { BriefRow, EventRow, LeadRow, TouchRow } from "./db";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "crm-store.json");

export type CrmStore = {
  leads: LeadRow[];
  touches: TouchRow[];
  events: EventRow[];
  briefs: BriefRow[];
  seq: { lead: number; touch: number; event: number; brief: number };
};

let cache: CrmStore | null = null;

function emptyStore(): CrmStore {
  return { leads: [], touches: [], events: [], briefs: [], seq: { lead: 0, touch: 0, event: 0, brief: 0 } };
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
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
    return parsed;
  } catch {
    const store = emptyStore();
    saveToDisk(store);
    return store;
  }
}

function saveToDisk(store: CrmStore) {
  ensureDir();
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
