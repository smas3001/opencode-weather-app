import { EofError } from "./errors";

const decoder = new TextDecoder();
const reader = Bun.stdin.stream().getReader();
let buffer = "";

async function readLine(): Promise<string | null> {
  while (true) {
    const index = buffer.indexOf("\n");
    if (index !== -1) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      return line.endsWith("\r") ? line.slice(0, -1) : line;
    }

    const { done, value } = await reader.read();
    if (done) {
      if (buffer.length === 0) {
        return null;
      }
      const line = buffer;
      buffer = "";
      return line.endsWith("\r") ? line.slice(0, -1) : line;
    }
    if (value) {
      buffer += decoder.decode(value, { stream: true });
    }
  }
}

export async function ask(question: string): Promise<string> {
  process.stdout.write(question);
  const line = await readLine();
  if (line === null) {
    throw new EofError();
  }
  return line;
}

export async function readOption(): Promise<number | null> {
  const input = (await ask("  Selecciona una opción: ")).trim();
  if (input === "") {
    return null;
  }
  const value = Number(input);
  return Number.isInteger(value) ? value : null;
}

export async function readIndex(prompt: string): Promise<number | null> {
  const input = (await ask(prompt)).trim();
  if (input === "") {
    return null;
  }
  const value = Number(input);
  return Number.isInteger(value) ? value : null;
}
