import { openDB, type IDBPDatabase } from "idb";
import type { Preset } from "@/types/editor";
import { DEFAULT_PRESETS } from "./defaults";

const DB_NAME = "scapestudio";
const DB_VERSION = 1;
const STORE_NAME = "presets";

interface ScapeStudioDB {
  presets: {
    key: string;
    value: Preset;
  };
}

async function getDB(): Promise<IDBPDatabase<ScapeStudioDB>> {
  return openDB<ScapeStudioDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

export async function getAllPresets(): Promise<Preset[]> {
  const db = await getDB();
  const userPresets = await db.getAll(STORE_NAME);

  // Merge default presets (if not already in DB) with user presets
  const now = Date.now();
  const defaultPresets: Preset[] = DEFAULT_PRESETS.map((p) => ({
    ...p,
    createdAt: now,
    updatedAt: now,
  }));

  // User presets override defaults with the same ID
  const userIds = new Set(userPresets.map((p) => p.id));
  const merged = [
    ...defaultPresets.filter((p) => !userIds.has(p.id)),
    ...userPresets,
  ];

  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPreset(id: string): Promise<Preset | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function savePreset(
  preset: Omit<Preset, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<Preset> {
  const db = await getDB();
  const now = Date.now();

  const full: Preset = {
    id: preset.id ?? `preset-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: preset.name,
    curves: preset.curves,
    threshold: preset.threshold,
    createdAt: now,
    updatedAt: now,
  };

  await db.put(STORE_NAME, full);
  return full;
}

export async function updatePreset(
  id: string,
  updates: Partial<Pick<Preset, "name" | "curves" | "threshold">>
): Promise<Preset | null> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, id);

  if (!existing) {
    // If it's a default preset being updated, create a user copy
    const defaultPreset = DEFAULT_PRESETS.find((p) => p.id === id);
    if (!defaultPreset) return null;

    const now = Date.now();
    const full: Preset = {
      ...defaultPreset,
      ...updates,
      createdAt: now,
      updatedAt: now,
    };
    await db.put(STORE_NAME, full);
    return full;
  }

  const updated: Preset = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  await db.put(STORE_NAME, updated);
  return updated;
}

export async function deletePreset(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export function isBuiltInPreset(id: string): boolean {
  return DEFAULT_PRESETS.some((p) => p.id === id);
}
