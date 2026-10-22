import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createTempDir, removeTempDir } from "./helpers";

const projectRoot = join(import.meta.dir, "..");
const entryPoint = join(projectRoot, "index.ts");
const projectStateFile = join(projectRoot, "weather.json");

interface AppResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

let tempDir = "";
let stateFile = "";

beforeAll(async () => {
  tempDir = await createTempDir("weather-e2e-");
  stateFile = join(tempDir, "weather.json");
});

afterAll(async () => {
  await removeTempDir(tempDir);
});

beforeEach(() => {
  if (existsSync(stateFile)) {
    rmSync(stateFile);
  }
});

async function runApp(input: string): Promise<AppResult> {
  const proc = Bun.spawn(["bun", "run", entryPoint], {
    cwd: tempDir,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  proc.stdin.write(input);
  proc.stdin.end();

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

describe("CLI (end to end)", () => {
  test("muestra el menú y sale con la opción 9", async () => {
    const { stdout, exitCode } = await runApp("9\n");

    expect(stdout).toContain("WEATHER CLI");
    expect(stdout).toContain("  1. Clima de ciudad default");
    expect(stdout).toContain("  9. Salir");
    expect(exitCode).toBe(0);
  });

  test("cambia la unidad y guarda el estado antes de salir", async () => {
    const { stdout, exitCode } = await runApp("8\n9\n");

    expect(stdout).toContain("Unidad cambiada a");
    expect(exitCode).toBe(0);
    expect(existsSync(stateFile)).toBe(true);

    const saved = JSON.parse(readFileSync(stateFile, "utf8")) as { unit?: string };
    expect(saved.unit).toBe("F");
  });

  test("sale limpiamente cuando stdin se agota (EOF)", async () => {
    const { stderr, exitCode } = await runApp("");

    expect(exitCode).toBe(0);
    expect(stderr).not.toContain("Error inesperado");
    expect(existsSync(stateFile)).toBe(true);

    const saved = JSON.parse(readFileSync(stateFile, "utf8")) as {
      cities?: unknown[];
      defaultCityId?: number | null;
      unit?: string;
    };
    expect(saved.cities).toEqual([]);
    expect(saved.defaultCityId).toBeNull();
    expect(saved.unit).toBe("C");
  });

  test("no modifica el weather.json del proyecto", async () => {
    const before = existsSync(projectStateFile) ? readFileSync(projectStateFile, "utf8") : null;

    await runApp("8\n9\n");

    const after = existsSync(projectStateFile) ? readFileSync(projectStateFile, "utf8") : null;
    expect(after).toBe(before);
  });
});
