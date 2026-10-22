import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import type { AppState, City, Unit } from "./types";

const DATA_FILE = "weather.json";

export function emptyState(): AppState {
  return { cities: [], defaultCityId: null, unit: "C" };
}

export async function loadState(): Promise<AppState> {
  if (!existsSync(DATA_FILE)) {
    return emptyState();
  }
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      cities: Array.isArray(parsed.cities) ? (parsed.cities as City[]) : [],
      defaultCityId: typeof parsed.defaultCityId === "number" ? parsed.defaultCityId : null,
      unit: parsed.unit === "F" ? "F" : "C",
    };
  } catch {
    return emptyState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  await writeFile(DATA_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
