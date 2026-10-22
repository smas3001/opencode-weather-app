# AGENTS.md

## Runtime
- This is a **Bun** project (not Node). Use `bun run <file>` / `bun test` / `bun install` — Node commands will not work as expected.
- TypeScript peer dep is `^7` and `@types/bun` provides runtime types; do not add a separate Node/TS toolchain.

## Commands
- Run: `bun run index.ts`
- Typecheck: `bun run typecheck` (alias for `bun check`)
- Test: `bun run test` (alias for `bun test`)
- Test + typecheck: `bun run verify`
- Build executable (goal of the course, see README): `bun run build` — runs `bun test` first, so **the binary is only produced when the suite passes**.

## Project
- Entry point: `index.ts` (root, `package.json` `module` field).
- Goal: interactive console weather CLI backed by the OpenMeteo APIs (geocoding then forecast), producing a standalone binary.
- `README.md` is written in Spanish — respond in Spanish when the user does.
- Secrets/env files (`.env*`) are gitignored; no env vars are required yet.

## Structure
- `src/types.ts` — `City`, `AppState`, `Unit`, `WeatherInfo`.
- `src/storage.ts` — load/save runtime state to `weather.json` (gitignored).
- `src/services/geocoding.ts` — OpenMeteo geocoding (`count=1`).
- `src/services/forecast.ts` — OpenMeteo current temperature (`temperature_unit=fahrenheit` for °F).
- `src/menu.ts` — menu rendering and option dispatch; `src/io.ts` — readline helpers.
- Menu option numbers intentionally skip 6 and 7 (match the README mockup) — keep 1,2,3,4,5,8,9.
- `test/` — automated test suite (Bun's built-in runner). `bunfig.toml` sets `[test] root = "./test"`, so `bun test` only picks up files in that folder.

## Testing
- Runner: Bun's built-in (`bun:test`); no extra test dependencies.
- `test/helpers.ts` — shared factories (`makeCity`, `makeState`), temp-dir helpers and `captureConsole()`.
- `test/fixtures/io-runner.ts` — helper script; `src/io.ts` reads stdin at module level, so it is tested through a subprocess.
- `test/storage.test.ts` — persistence; runs in a temp dir via `process.chdir()` (the app code is not modified for testability).
- `test/geocoding.test.ts`, `test/forecast.test.ts` — HTTP layer with `fetch` spied (no network).
- `test/menu.test.ts` — `mock.module()` replaces `src/io` and both services **before** a dynamic `import("../src/menu")`; the mocks read from a mutable control object.
- `test/io.test.ts` — stdin parsing via subprocess.
- `test/index.test.ts` — end-to-end CLI: spawns `index.ts` with a piped stdin in a temp cwd.
- The suite must stay green and offline; never add a test that hits the real OpenMeteo APIs.

## Data
- State file `weather.json` (`{ cities, defaultCityId, unit }`) is created at runtime and gitignored.

## Conventions
- `tsconfig.json` uses `moduleResolution: "bundler"` with `verbatimModuleSyntax`; use `import type` for type-only imports.
- Strict mode is on, including `noUncheckedIndexedAccess` — index/array access must be narrowed.
- **Do not use `node:readline/promises`**: in Bun it hangs when stdin is piped (and is unreliable for non-TTY). `src/io.ts` reads lines from `Bun.stdin.stream()` instead — keep that approach for any interactive prompt.
- `EofError` (src/errors.ts) signals stdin exhaustion; `index.ts` catches it to save state and exit cleanly.
- Weather unit °F is requested from the API via `temperature_unit=fahrenheit`; do not convert manually.
