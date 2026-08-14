# CLI Reference

`contextloom` keeps the command surface intentionally small.

Options may be written as `--name value` or `--name=value`. Each command only
accepts the options shown below, and every option requires a value. Format
values are `json` and `markdown`. Invalid options, missing values, unsupported
formats, and extra positional arguments exit nonzero and print the usage guide.

## inspect

```sh
contextloom inspect <input> --output out/sample --format markdown
```

Reads a local file or directory and writes a deterministic manifest. Supported source files are `.json`, `.jsonl`, `.md`, `.markdown`, and `.txt`.

JSON transcript containers may use `messages`, `turns`, `events`, or `transcript`; JSONL accepts one message/event per row. The `content`, `text`, or `message` value may be a string, an array of strings/content-part objects, or an object. Structured values are converted deterministically to text while citations cover their encoded JSON source range.

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
Queries containing spaces must be passed as one quoted argument, as in the
example above.

## show

```sh
contextloom show out/sample/manifest.json chunk-0001
```

Prints an exact chunk and its citation. A chunk hash prefix also works when it
matches exactly one chunk in the current manifest. Ambiguous prefixes fail with
a diagnostic instead of selecting an arbitrary chunk; use more hash characters
to disambiguate them.

## verify

```sh
contextloom verify out/sample/manifest.json
```

Re-reads source files, checks source hashes, checks chunk hashes, and confirms chunk text is recoverable from the original source.
