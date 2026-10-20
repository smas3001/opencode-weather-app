# AGENTS.md

## Runtime
- This is a **Bun** project (not Node). Use `bun run <file>` / `bun test` / `bun install` — Node commands will not work as expected.
- TypeScript peer dep is `^7` and `@types/bun` provides runtime types; do not add a separate Node/TS toolchain.

## Commands
- Run: `bun run index.ts`
- Typecheck: `bun run typecheck` (alias for `bun check`)
- Build executable (goal of the course, see README): `bun build --compile --outfile weather index.ts`
- There is no test, lint, or format script configured yet.

## Project
- Entry point: `index.ts` (root, `package.json` `module` field). Currently a stub.
- Goal: interactive console weather CLI backed by the OpenMeteo APIs (geocoding then forecast), producing a standalone binary.
- `README.md` is written in Spanish — respond in Spanish when the user does.
- Secrets/env files (`.env*`) are gitignored; no env vars are required yet.

## Conventions
- `tsconfig.json` uses `moduleResolution: "bundler"` with `verbatimModuleSyntax`; use `import type` for type-only imports.
- Strict mode is on, including `noUncheckedIndexedAccess` — index/array access must be narrowed.
