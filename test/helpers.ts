import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spyOn } from "bun:test";
import type { AppState, City } from "../src/types";

export function makeCity(overrides: Partial<City> = {}): City {
  return {
    id: 1,
    name: "Ottawa",
    country: "Canada",
    admin1: "Ontario",
    latitude: 45.41117,
    longitude: -75.69812,
    ...overrides,
  };
}

export function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    cities: [],
    defaultCityId: null,
    unit: "C",
    ...overrides,
  };
}

export async function createTempDir(prefix = "weather-test-"): Promise<string> {
  return await mkdtemp(join(tmpdir(), prefix));
}

export async function removeTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

export interface ConsoleCapture {
  lines: string[];
  output(): string;
  restore(): void;
}

export function captureConsole(): ConsoleCapture {
  const lines: string[] = [];
  const spy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    lines.push(args.map((arg) => String(arg)).join(" "));
  });

  return {
    lines,
    output: () => lines.join("\n"),
    restore: () => spy.mockRestore(),
  };
}
