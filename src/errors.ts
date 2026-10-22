export class EofError extends Error {
  constructor() {
    super("Entrada terminada (EOF).");
    this.name = "EofError";
  }
}
