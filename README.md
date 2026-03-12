# triage

Paste a support ticket, get its urgency, category, and a ready-to-send draft
reply back — from a browser or straight off the command line. Express +
TypeScript, one shared core, two entry points. Built for the
[Amazon Nova AI Hackathon](https://amazon-nova.devpost.com/) (Feb 2 – Mar 16, 2026).

## Two ways in

**Web**, for pasting a ticket and eyeballing the result:

```bash
npm install
cp .env.example .env
npm run dev          # tsx watch — http://localhost:3000
```

**CLI**, for scripting or piping tickets through in bulk:

```bash
npm run build && npm link
triage "The app crashes on the Reports page after today's update."
triage --file ticket.txt --json
echo "How do I export to CSV?" | triage
```

Both need AWS credentials in the default provider chain (env vars,
`AWS_PROFILE`, or an instance/task role) with `bedrock:InvokeModel` on the
configured model, and model access enabled in the Bedrock console.

**Container**, for the web app only:

```bash
docker build -t triage .
docker run -p 3000:3000 --env-file .env triage
```

## What happens under the hood

Both entry points funnel into one function, `triageTicket()` in
`src/lib/triageService.ts`: send the ticket text to Bedrock with a system
prompt that pins the response to strict JSON —
`{ urgency, category, reply }` — then parse and validate it (urgency has to
be one of a known set; a stray code fence gets stripped rather than trusted).

- **Web**: `src/server/routes/triage.ts` receives `POST /api/triage`, checks
  the body, calls the shared function, and maps a `BedrockInvocationError`
  to a 502 instead of leaking SDK internals.
- **CLI**: `src/cli/triage-cli.ts` pulls ticket text from an argument,
  `--file`, or piped stdin, calls the same function, and either prints a
  formatted summary or raw JSON (`--json`).

## Where things live

```
src/
  lib/           types.ts · bedrockClient.ts · triageService.ts  (shared core)
  server/        index.ts · routes/triage.ts                     (web)
  cli/           triage-cli.ts                                   (terminal)
  public/        index.html · styles.css · app.js                (no framework)
```

`npm run build` compiles `src/` to `dist/` with `tsc` and copies `src/public`
alongside it; `npm start` serves that compiled output.

## Known limitations

- Categories are open strings, not a closed enum enforced at the type level —
  the prompt lists them, but the parser only checks `urgency` strictly.
- No test suite and no CI beyond a build/lint pass — this is a demo-scale
  tool, not a package meant for npm.
