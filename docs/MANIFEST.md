# Manifest Format

`manifest.json` is the main artifact produced by `contextloom inspect`.

## Top-level fields

- `version`: manifest schema version. The MVP writes `1`.
- `generatedAt`: deterministic timestamp for stable fixture output.
- `inputRoot`: absolute input path used for inspection.
- `sources`: source file metadata, including relative path, kind, byte count, and SHA-256 hash.
- `chunks`: retrievable excerpts with text, hash, keywords, role metadata when present, and citation details.
- `stats`: source/chunk counts and aggregate sizes.

## Citation fields

Each chunk citation includes:

- `sourceId`
- `sourcePath`
- `startLine`
- `endLine`
- `startOffset`
- `endOffset`

Offsets are JavaScript string offsets for the UTF-8-decoded source text. For string-valued JSON and JSONL transcript fields, they delimit the encoded string contents in the source: decode that raw slice as a JSON string to recover the chunk text. This keeps citations exact even when a chunk contains JSON escapes such as `\\n`, `\\"`, `\\\\`, or `\\u2603`. The source hash preserves whole-file integrity.

## Stability

Chunk ids are assigned in deterministic source path order. Source discovery skips hidden directories, `node_modules`, `dist`, and `out`.
