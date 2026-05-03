# Design Notes

## Local-first by default

The MVP has no remote services, embeddings, telemetry, or credential lookup. It is a deterministic file-to-manifest transformer.

## Lossless enough for V1

`contextloom` does not replace the original transcript. Instead, it stores source hashes plus citations so a chunk can be tied back to the exact local file that produced it.

## Retrieval tradeoff

Search uses lightweight keyword scoring. That keeps installs fast and behavior inspectable. Semantic retrieval can be layered later without changing the manifest basics.

## Agent workflow fit

The first target workflow is agent handoff: preserve decisions, blockers, test output, and citations from a long session so the next agent can retrieve exact excerpts instead of trusting a lossy summary.
