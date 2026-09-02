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

`startOffset` and `endOffset` are zero-based, half-open UTF-8 byte offsets into the original source file. Read the source as bytes rather than slicing a JavaScript string:

```js
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = await readFile(resolve(manifest.inputRoot, chunk.citation.sourcePath));
const cited = source
  .subarray(chunk.citation.startOffset, chunk.citation.endOffset)
  .toString('utf8');
```

For string-valued JSON and JSONL transcript fields, the offsets delimit the encoded string contents in the exact `content`, `text`, or `message` property selected for that transcript message: decode `cited` as a JSON string to recover the chunk text. An earlier metadata or nested property with the same JSON value is never cited in its place. For array- or object-valued content, the offsets delimit the complete encoded message-property value, which deterministically produces the cited chunk text. This keeps citations exact even when content contains JSON escapes such as `\\n`, `\\"`, `\\\\`, or `\\u2603`, and when decoded text contains multibyte characters. Verification checks both the recovered text and its association with the selected message property, so equal-valued or widened ranges are rejected. The source hash preserves whole-file integrity.

## Stability

Chunk ids are assigned in deterministic source path order. Source discovery skips hidden directories, `node_modules`, `dist`, and `out`.
