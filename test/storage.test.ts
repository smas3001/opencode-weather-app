import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { emptyState, loadState, saveState } from "../src/storage";
import { createTempDir, makeCity, makeState, removeTempDir } from "./helpers";

const originalCwd = process.cwd();
let tempDir = "";
let stateFile = "";

beforeAll(async () => {
  tempDir = await createTempDir("weather-storage-");
  stateFile = join(tempDir, "weather.json");
  process.chdir(tempDir);
});

afterAll(async () => {
  process.chdir(originalCwd);
  await removeTempDir(tempDir);
});

beforeEach(() => {
  if (existsSync(stateFile)) {
    rmSync(stateFile);
  }
});

describe("emptyState", () => {
  test("devuelve el estado inicial vacío", () => {
    expect(emptyState()).toEqual({ cities: [], defaultCityId: null, unit: "C" });
  });
});

describe("loadState", () => {
  test("devuelve el estado vacío cuando no existe el archivo", async () => {
    expect(await loadState()).toEqual(emptyState());
  });

  test("carga un archivo válido", async () => {
    const city = makeCity({ id: 42, name: "Ottawa" });
    writeFileSync(
      stateFile,
      JSON.stringify({ cities: [city], defaultCityId: 42, unit: "F" }),
      "utf8",
    );

    const state = await loadState();

    expect(state.cities).toHaveLength(1);
    expect(state.cities[0]?.name).toBe("Ottawa");
    expect(state.defaultCityId).toBe(42);
    expect(state.unit).toBe("F");
  });

  test("normaliza los campos inválidos del archivo", async () => {
    writeFileSync(
      stateFile,
      JSON.stringify({ cities: "no-es-un-array", defaultCityId: "42", unit: "K" }),
      "utf8",
    );

    const state = await loadState();

    expect(state.cities).toEqual([]);
    expect(state.defaultCityId).toBeNull();
    expect(state.unit).toBe("C");
  });

  test("devuelve el estado vacío si el JSON está corrupto", async () => {
    writeFileSync(stateFile, "{ esto no es json", "utf8");

    expect(await loadState()).toEqual(emptyState());
  });
});

describe("saveState", () => {
  test("escribe JSON formateado con newline final", async () => {
    const state = makeState({ cities: [makeCity()], defaultCityId: 1, unit: "F" });

    await saveState(state);

    const raw = readFileSync(stateFile, "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    expect(raw).toContain('\n  "cities"');
    expect(JSON.parse(raw)).toEqual(state);
  });

  test("saveState y loadState conservan el estado (round-trip)", async () => {
    const state = makeState({
      cities: [makeCity({ id: 7, name: "Caracas" })],
      defaultCityId: 7,
      unit: "F",
    });

    await saveState(state);

    expect(await loadState()).toEqual(state);
  });
});
