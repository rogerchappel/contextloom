# contextloom

A local-first context manager for agent sessions. It turns transcripts, notes, and tool traces into a deterministic manifest of retrievable chunks with citations back to exact files, line ranges, byte offsets, and hashes.

Think of it as a small loom for long context: feed it local files, get back a plain JSON index another agent, CLI, or editor plugin can trust.

## Why

Agent work often lives in long chat logs and noisy tool output. Summaries are useful, but they can lose the exact quote that proves a decision. `contextloom` keeps the original thread recoverable while making chunks easy to search and cite.

## Install

```sh
npm install
npm run build
```

For local CLI use while developing:

```sh
node dist/src/cli.js --help
```

When installed from npm in the future, the binary name is `contextloom`.

## Quickstart

```sh
npm run build
node dist/src/cli.js inspect fixtures/sample --output out/sample
node dist/src/cli.js search out/sample/manifest.json "deployment decision"
node dist/src/cli.js show out/sample/manifest.json chunk-0001
node dist/src/cli.js verify out/sample/manifest.json
```

`inspect` writes:

- `manifest.json` — machine-readable chunks, citations, hashes, and stats.
- `manifest.md` — a human skim table.

## CLI

```text
contextloom inspect <input> [--output out/context] [--format json|markdown]
contextloom search <manifest.json> <query> [--limit 5] [--format json|markdown]
contextloom show <manifest.json> <chunk-id-or-hash> [--format json|markdown]
contextloom verify <manifest.json> [--format json|markdown]
```

Supported local input formats in the MVP:

- `.jsonl` transcript/event rows with `role`, `content`/`text`/`message`, and optional `timestamp`.
- `.json` arrays or objects containing `messages`, `turns`, `events`, or `transcript`.
- `.md`, `.markdown`, and `.txt` notes/logs.

## Library API

```ts
import { inspect, searchManifest, verifyManifest } from 'contextloom';

const manifest = await inspect({ input: 'fixtures/sample', output: 'out/sample' });
const results = searchManifest(manifest, 'deployment decision', 3);
const verified = await verifyManifest(manifest);
```

## Safety boundaries

`contextloom` is intentionally boring and local-first:

- Reads only files or directories you explicitly pass in.
- Writes only the output directory you request.
- Performs no telemetry, network calls, scraping, publishing, or credential access.
- Uses deterministic chunk ids and source hashes so generated manifests are easy to diff.

Do not point it at private transcripts unless you are comfortable with the output manifest containing excerpts from those files.

## Source attribution

This is an original implementation inspired by the product idea described in `docs/PRD.md`, which mentions the adjacent `lossless-claw` repository as inspiration. This project does not copy that name or implementation; it focuses on a tiny deterministic TypeScript CLI/library MVP.

## Verify

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Examples

See [`examples/basic-usage.md`](examples/basic-usage.md) and [`fixtures/sample`](fixtures/sample) for a small agent handoff workflow.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes local-first, small, tested, and clear about safety implications.

## Security

See [SECURITY.md](SECURITY.md). Please do not put private transcript excerpts or exploit details in public issues.

## License

MIT
