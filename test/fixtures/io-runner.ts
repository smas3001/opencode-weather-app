import { ask, readIndex, readOption } from "../../src/io";

const results: unknown[] = [];

async function capture(operation: () => Promise<unknown>): Promise<void> {
  try {
    results.push(await operation());
  } catch (error) {
    results.push({ error: error instanceof Error ? error.name : String(error) });
  }
}

const mode = process.argv[2] ?? "options";

if (mode === "options") {
  await capture(() => readOption());
  await capture(() => readOption());
  await capture(() => readIndex("index: "));
} else {
  await capture(() => ask("question: "));
}

console.log(`RESULT:${JSON.stringify(results)}`);
