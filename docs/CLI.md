# CLI Reference

`contextloom` keeps the command surface intentionally small.

## inspect

```sh
contextloom inspect <input> --output out/sample --format markdown
```

Reads a local file or directory and writes a deterministic manifest. Supported source files are `.json`, `.jsonl`, `.md`, `.markdown`, and `.txt`.

If the requested output directory is nested under the input directory,
`contextloom` excludes that output directory from inspection. Consecutive runs
against unchanged input therefore produce the same sources and chunks.

## search

```sh
contextloom search out/sample/manifest.json "deployment decision" --limit 3
```

Performs lightweight local keyword retrieval over chunk text, roles, and extracted keywords. Search is deliberately dependency-free in the MVP.

`--limit` is optional and defaults to `10`. When supplied, its value must be a
positive integer, such as `--limit 3` or `--limit=3`.

## show

```sh
contextloom show out/sample/manifest.json chunk-0001
```

Prints an exact chunk and its citation. A chunk hash prefix also works when it is unique enough for the current manifest.

## verify

```sh
contextloom verify out/sample/manifest.json
```

Re-reads source files, checks source hashes, checks chunk hashes, and confirms chunk text is recoverable from the original source.
