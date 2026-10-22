import { loadState, saveState } from "./src/storage";
import { runMenu } from "./src/menu";
import { EofError } from "./src/errors";

async function main(): Promise<void> {
  const state = await loadState();

  try {
    let running = true;
    while (running) {
      running = await runMenu(state);
      await saveState(state);
    }
  } catch (error) {
    if (error instanceof EofError) {
      await saveState(state);
    } else {
      console.error("Error inesperado:", error);
      process.exitCode = 1;
    }
  }
}

await main();
