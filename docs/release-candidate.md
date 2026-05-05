# Release candidate readiness

Status: **READY**

Generated: 2026-05-05 21:26:54 UTC

## Scope

Release-candidate readiness pass for `rogerchappel/contextloom` against `origin/main`.

## Local verification

- npm ci:pass
- release:check:pass
- validate.sh:pass
- releasebox:pass

## Blockers

- None found in local readiness gates.

## ReleaseBox check / command log

```text
      "kind": "jsonl",
      "bytes": 588,
      "sha256": "0d849bcd7f8691fe418412c6941ea30e76f84eab7ba3cc6559059efe456ec35f"
    }
  ],
  "chunks": [
    {
      "id": "chunk-0001",
      "sourceId": "src-0001",
      "sourcePath": "notes.md",
      "kind": "markdown",
      "text": "# Agent handoff\n\nThe deployment decision is to ship a small CLI first. The library API should expose inspect, search, show, and verify primitives.\n\nSafety boundaries:\n\n- Read local files only when the operator provides a path.\n- Write manifests only to requested output directories.\n- Never scrape credentials, phone home, or publish data.\n\nOpen question: richer semantic retrieval can wait until the exact excerpt path is boring and reliable.",
      "sha256": "a5f457aadca8e8fd41e0d7995763b09da8cace7d3eb7b97a98cbc123b23f26ff",
      "citation": {
        "sourceId": "src-0001",
        "sourcePath": "notes.md",
        "startLine": 1,
        "endLine": 11,
        "startOffset": 0,
        "endOffset": 443
      },
      "keywords": [
        "is",
        "path",
        "to",
        "api",
        "boring",
        "boundarie",
        "can",
        "cli",
        "credential",
        "data",
        "decision",
        "deployment"
      ]
    },
    {
      "id": "chunk-0002",
      "sourceId": "src-0002",
      "sourcePath": "session.json",
      "kind": "json",
      "role": "user",
      "createdAt": "2026-05-04T09:05:00Z",
      "text": "Please keep the exact excerpt for the branch protection blocker. We need proof if GitHub rejects a rule update.",
      "sha256": "3daf37c81a5bb5b9b6b0ddac852abcaa17a49933f34aca701c54322ef2fc99ce",
      "citation": {
        "sourceId": "src-0002",
        "sourcePath": "session.json",
        "startLine": 6,
        "endLine": 6,
        "startOffset": 107,
        "endOffset": 218
      },
      "keywords": [
        "blocker",
        "branch",
        "exact",
        "excerpt",
        "for",
        "github",
        "if",
        "keep",
        "please",
        "proof",
        "protection",
        "reject"
      ]
    },
    {
      "id": "chunk-0003",
      "sourceId": "src-0002",
      "sourcePath": "session.json",
      "kind": "json",
      "role": "assistant",
      "createdAt": "2026-05-04T09:06:00Z",
      "text": "Branch protection status should be recorded as protected, skipped, or blocked with the command output.",
      "sha256": "d83675665a9518da962b3287b80ffcb12bbfbea6925a53ed460ed5eed23f85d9",
      "citation": {
        "sourceId": "src-0002",
        "sourcePath": "session.json",
        "startLine": 11,
        "endLine": 11,
        "startOffset": 321,
        "endOffset": 423
      },
      "keywords": [
        "as",
        "be",
        "blocked",
        "branch",
        "command",
        "or",
        "output",
        "protected",
        "protection",
        "recorded",
        "should",
        "skipped"
      ]
    },
    {
      "id": "chunk-0004",
      "sourceId": "src-0003",
      "sourcePath": "session.jsonl",
      "kind": "jsonl",
      "role": "user",
      "createdAt": "2026-05-04T09:00:00Z",
      "text": "We need a local-first way to preserve agent session context. It must keep citations back to exact files and offsets.",
      "sha256": "599f555f142adf1127d5c381d93d35f7842848f3f43b9818652e150c57ffa092",
      "citation": {
        "sourceId": "src-0003",
        "sourcePath": "session.jsonl",
        "startLine": 1,
        "endLine": 1,
        "startOffset": 0,
        "endOffset": 180
      },
      "keywords": [
        "to",
        "back",
        "citation",
        "exact",
        "file",
        "it",
        "keep",
        "local-first",
        "must",
        "offset",
        "preserve",
        "session"
      ]
    },
    {
      "id": "chunk-0005",
      "sourceId": "src-0003",
      "sourcePath": "session.jsonl",
      "kind": "jsonl",
      "role": "assistant",
      "createdAt": "2026-05-04T09:01:00Z",
      "text": "Decision: build a deterministic manifest with source hashes, chunk ids, line ranges, byte offsets, and searchable keywords. No telemetry or hidden network calls.",
      "sha256": "23e55f2078ec816cc341decb88d167075e638644dce485707d8b7a4ad4020a26",
      "citation": {
        "sourceId": "src-0003",
        "sourcePath": "session.jsonl",
        "startLine": 2,
        "endLine": 2,
        "startOffset": 180,
        "endOffset": 410
      },
      "keywords": [
        "build",
        "byte",
        "call",
        "chunk",
        "decision",
        "deterministic",
        "hashe",
        "hidden",
        "ids",
        "keyword",
        "line",
        "manifest"
      ]
    },
    {
      "id": "chunk-0006",
      "sourceId": "src-0003",
      "sourcePath": "session.jsonl",
      "kind": "jsonl",
      "role": "tool",
      "createdAt": "2026-05-04T09:03:00Z",
      "text": "npm test passed on the fixture parser. CLI smoke should inspect fixtures/sample and verify the generated manifest.",
      "sha256": "9b77cbbeafe26eea5b5fd43f77ee9db00a9c5d61bc47a518d9ce5461a753558b",
      "citation": {
        "sourceId": "src-0003",
        "sourcePath": "session.jsonl",
        "startLine": 3,
        "endLine": 3,
        "startOffset": 410,
        "endOffset": 588
      },
      "keywords": [
        "fixture",
        "cli",
        "generated",
        "inspect",
        "manifest",
        "npm",
        "on",
        "parser",
        "passed",
        "sample",
        "should",
        "smoke"
      ]
    }
  ],
  "stats": {
    "sourceCount": 3,
    "chunkCount": 6,
    "totalBytes": 1469,
    "totalTextChars": 1047
  }
}
## chunk-0001 (score 8)
Citation: notes.md:1-11
Matches: decision

# Agent handoff

The deployment decision is to ship a small CLI first. The library API should expose inspect, search, show, and verify primitives.

Safety boundaries:

- Read local files only when the operator provides a path.
- Write manifests only to requested output directories.
- Never scrape credentials, phone home, or publish data.

Open question: richer semantic retrieval can wait until the exact excerpt path is boring and reliable.

## chunk-0005 (score 8)
Citation: session.jsonl:2-2
Matches: decision

Decision: build a deterministic manifest with source hashes, chunk ids, line ranges, byte offsets, and searchable keywords. No telemetry or hidden network calls.

## chunk-0001
Citation: notes.md:1-11
```text
# Agent handoff

The deployment decision is to ship a small CLI first. The library API should expose inspect, search, show, and verify primitives.

Safety boundaries:

- Read local files only when the operator provides a path.
- Write manifests only to requested output directories.
- Never scrape credentials, phone home, or publish data.

Open question: richer semantic retrieval can wait until the exact excerpt path is boring and reliable.
```
Verified 6 chunks.
PASS: package script: smoke
NOTE: agent-qc not installed; skipping optional agent check

Validation passed.
EXIT_CODE=0
\n===== releasebox check =====
+ node /Users/roger/Developer/my-opensource/releasebox/bin/releasebox.js check /Users/roger/Developer/my-opensource/_worktrees/contextloom-release-candidate-readiness
✅ releasebox config: node-cli
✅ ci workflow: .github/workflows/ci.yml
✅ release dry run workflow: .github/workflows/release-dry-run.yml
✅ task breakdown: docs/TASKS.md
✅ orchestration plan: docs/ORCHESTRATION.md
✅ dependabot config: .github/dependabot.yml
✅ npm test script: node --test dist/**/*.test.js
✅ build script: tsc -p tsconfig.json
✅ smoke script: npm run build && node dist/src/cli.js inspect fixtures/sample --output out/sample --format json && node dist/src/cli.js search out/sample/manifest.json decisions --limit 3 && node dist/src/cli.js show out/sample/manifest.json chunk-0001 --format markdown && node dist/src/cli.js verify out/sample/manifest.json
✅ bin entry: {"contextloom":"./dist/src/cli.js"}
EXIT_CODE=0
```
