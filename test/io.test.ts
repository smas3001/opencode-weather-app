import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const runnerPath = join(import.meta.dir, "fixtures", "io-runner.ts");

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function runRunner(mode: string, input: string): Promise<RunResult> {
  const proc = Bun.spawn(["bun", "run", runnerPath, mode], {
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

function parseResults(stdout: string): unknown[] {
  const match = stdout.match(/RESULT:(\[.*\])/);
  expect(match).not.toBeNull();
  return JSON.parse(match?.[1] ?? "[]") as unknown[];
}

describe("readOption / readIndex", () => {
  test("devuelve el número leído", async () => {
    const { stdout } = await runRunner("options", "3\n7\n2\n");

    expect(parseResults(stdout)).toEqual([3, 7, 2]);
  });

  test("ignora los espacios alrededor del número", async () => {
    const { stdout } = await runRunner("options", "  5  \n  1  \n  4  \n");

    expect(parseResults(stdout)).toEqual([5, 1, 4]);
  });

  test("devuelve null con una entrada vacía", async () => {
    const { stdout } = await runRunner("options", "\n\n\n");

    expect(parseResults(stdout)).toEqual([null, null, null]);
  });

  test("devuelve null con una entrada no numérica", async () => {
    const { stdout } = await runRunner("options", "abc\nxyz\n\n");

    expect(parseResults(stdout)).toEqual([null, null, null]);
  });

  test("devuelve null con un número decimal", async () => {
    const { stdout } = await runRunner("options", "3.5\n\n\n");

    expect(parseResults(stdout)).toEqual([null, null, null]);
  });
});

describe("ask", () => {
  test("devuelve la línea leída", async () => {
    const { stdout } = await runRunner("ask", "Ciudad Nueva\n");

    expect(parseResults(stdout)).toEqual(["Ciudad Nueva"]);
  });

  test("devuelve la línea sin el salto de retorno de carro", async () => {
    const { stdout } = await runRunner("ask", "Ciudad Nueva\r\n");

    expect(parseResults(stdout)).toEqual(["Ciudad Nueva"]);
  });

  test("lanza EofError cuando stdin se agota", async () => {
    const { stdout } = await runRunner("ask", "");

    expect(parseResults(stdout)).toEqual([{ error: "EofError" }]);
  });
});
