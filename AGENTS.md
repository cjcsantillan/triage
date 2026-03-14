# triage

Support-ticket triage assistant. Express + TypeScript, shipped two ways: a
small server-rendered web app and a `commander`-based CLI, both sharing one
Bedrock-backed core library. Built for the Amazon Nova AI Hackathon
(Feb 2 – Mar 16, 2026).

## Commands

| Command | Notes |
|---|---|
| `npm install` | |
| `npm run dev` | `tsx watch` on the Express server, `PORT`/3000 |
| `npm run cli` | run the CLI from source via `tsx` (no build needed) |
| `npm run build` | `tsc` to `dist/`, then copies `src/public` alongside it |
| `npm start` | serves the compiled `dist/server/index.js` |

No test suite by design.

## Architecture

- **`src/lib/`**: the shared core — `types.ts` (Urgency/Category/TriageResult),
  `bedrockClient.ts` (shared `BedrockRuntimeClient`, resolves `AWS_PROFILE`
  via `fromIni` when set), `triageService.ts` (prompt, invoke, strict JSON
  parsing + validation). Both entry points below depend only on this.
- **`src/server/`**: Express app — JSON body parsing, static file serving
  from `public/`, `routes/triage.ts` (`POST /api/triage`, validation +
  `BedrockInvocationError` mapping).
- **`src/cli/triage-cli.ts`**: `commander` entry point. Ticket text comes
  from a positional argument, `--file <path>`, or stdin (auto-detected via
  `process.stdin.isTTY`). `--json` prints the raw result instead of a
  formatted summary.
- **`src/public/`**: textarea + sample-ticket buttons, calls `/api/triage`,
  renders urgency/category chips, the drafted reply, and a session-local
  history list. Plain HTML/CSS/JS — no framework, no build step of its own.

## Conventions

- Route handlers and the CLI both catch `BedrockInvocationError` specifically
  rather than leaking SDK error internals.
- `.env` is gitignored — copy `.env.example` and fill in real values locally.
- TypeScript with `strict` + `noUncheckedIndexedAccess`; see the sibling
  `alttextbot` project for the plain-JS/Next.js variant of this pattern.
