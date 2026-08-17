import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { inspect, searchManifest, findChunk, verifyManifest } from '../src/index.js';

const fixture = path.resolve('fixtures/sample');

test('inspect builds a deterministic manifest from fixtures', async () => {
  const manifest = await inspect({ input: fixture });
  assert.equal(manifest.version, 1);
  assert.equal(manifest.generatedAt, '1970-01-01T00:00:00.000Z');
  assert.equal(manifest.stats.sourceCount, 3);
  assert.ok(manifest.stats.chunkCount >= 6);
  assert.ok(manifest.chunks.every((chunk) => chunk.citation.startLine >= 1));
  assert.ok(manifest.chunks.some((chunk) => chunk.text.includes('No telemetry')));
});

test('inspect extracts roles from json transcripts', async () => {
  const manifest = await inspect({ input: fixture });
  const branchChunk = manifest.chunks.find((chunk) => chunk.text.includes('branch protection blocker'));
  assert.equal(branchChunk?.role, 'user');
  assert.equal(branchChunk?.createdAt, '2026-05-04T09:05:00Z');
});

test('search finds cited deployment decisions', async () => {
  const manifest = await inspect({ input: fixture });
  const results = searchManifest(manifest, 'deployment decision', 3);
  assert.ok(results.length > 0);
  assert.match(results[0]!.chunk.text, /deployment decision|Decision:/i);
  assert.ok(results[0]!.chunk.citation.sourcePath);
});

test('findChunk resolves exact ids and unique hash prefixes', async () => {
  const manifest = await inspect({ input: fixture });
  const first = manifest.chunks[0]!;
  assert.equal(findChunk(manifest, first.id)?.id, first.id);
  assert.equal(findChunk(manifest, first.sha256.slice(0, 12))?.id, first.id);
  assert.equal(findChunk(manifest, 'missing'), undefined);
});

test('findChunk rejects ambiguous hash prefixes without shadowing exact ids', async () => {
  const manifest = await inspect({ input: fixture });
  const [first, second] = manifest.chunks;
  assert.ok(first && second);
  const ambiguous = {
    ...manifest,
    chunks: [
      { ...first, sha256: 'abc111' },
      { ...second, id: 'abc', sha256: 'abc222' },
    ],
  };
  assert.equal(findChunk(ambiguous, 'abc')?.id, 'abc');
  assert.throws(() => findChunk({ ...ambiguous, chunks: ambiguous.chunks.map((chunk, index) => index === 1 ? { ...chunk, id: 'other' } : chunk) }, 'abc'), /ambiguous chunk hash prefix: abc matches 2 chunks/);
});

test('written manifests verify against original sources', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-'));
  try {
    const manifest = await inspect({ input: fixture, output: tmp });
    const result = await verifyManifest(manifest);
    assert.equal(result.ok, true);
    assert.equal(result.checkedChunks, manifest.stats.chunkCount);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('inspect excludes a nested output directory on repeated runs', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-nested-output-'));
  try {
    await writeFile(path.join(tmp, 'notes.md'), '# Stable source\n');
    const output = path.join(tmp, 'generated', 'context');
    const first = await inspect({ input: tmp, output });
    const second = await inspect({ input: tmp, output });
    assert.deepEqual(second.sources, first.sources);
    assert.deepEqual(second.chunks, first.chunks);
    assert.deepEqual(second.stats, first.stats);
    assert.equal(second.stats.sourceCount, 1);
    assert.equal(second.sources[0]?.relativePath, 'notes.md');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('json citations track escaped content across chunks', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-json-'));
  try {
    const source = JSON.stringify({ messages: [{ role: 'user', content: 'first line\nquoted "value" and \\path' }] }, null, 2);
    await writeFile(path.join(tmp, 'escaped.json'), source);
    const manifest = await inspect({ input: tmp, maxChunkLines: 1 });
    assert.equal(manifest.chunks.length, 2);
    for (const chunk of manifest.chunks) {
      const raw = source.slice(chunk.citation.startOffset, chunk.citation.endOffset);
      assert.equal(JSON.parse(`"${raw}"`), chunk.text);
      assert.equal(chunk.citation.startLine, chunk.citation.endLine);
    }
    assert.equal((await verifyManifest(manifest)).ok, true);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('json transcripts preserve mixed structured message content and citations', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-structured-json-'));
  try {
    const source = JSON.stringify({ messages: [
      { role: 'user', content: 'escaped "question"' },
      { role: 'assistant', content: [{ type: 'text', text: 'array answer' }, 'tail'] },
      { role: 'tool', content: { text: 'object result', ok: true } }
    ] }, null, 2);
    await writeFile(path.join(tmp, 'structured.json'), source);
    const first = await inspect({ input: tmp });
    const second = await inspect({ input: tmp });
    assert.deepEqual(second.chunks, first.chunks);
    assert.deepEqual(first.chunks.map((chunk) => chunk.role), ['user', 'assistant', 'tool']);
    assert.match(first.chunks[1]!.text, /array answer/);
    assert.match(first.chunks[2]!.text, /object result/);
    for (const chunk of first.chunks) assert.ok(source.slice(chunk.citation.startOffset, chunk.citation.endOffset).length > 0);
    assert.equal((await verifyManifest(first)).ok, true);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('jsonl transcripts preserve array and object message content', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-structured-jsonl-'));
  try {
    const source = [
      { role: 'user', content: ['first', { type: 'text', text: 'second' }] },
      { role: 'assistant', content: { text: 'third', escaped: 'a\\b' } }
    ].map((message) => JSON.stringify(message)).join('\n') + '\n';
    await writeFile(path.join(tmp, 'structured.jsonl'), source);
    const manifest = await inspect({ input: tmp });
    assert.equal(manifest.chunks.length, 2);
    assert.match(manifest.chunks[0]!.text, /second/);
    assert.match(manifest.chunks[1]!.text, /a\\\\b/);
    assert.equal((await verifyManifest(manifest)).ok, true);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('verification rejects incorrect json citation offsets', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-json-'));
  try {
    const source = JSON.stringify({ messages: [{ content: 'escaped\ncontent' }] }, null, 2);
    await writeFile(path.join(tmp, 'escaped.json'), source);
    const manifest = await inspect({ input: tmp });
    const chunk = manifest.chunks[0]!;
    const invalid = { ...manifest, chunks: [{ ...chunk, citation: { ...chunk.citation, startOffset: chunk.citation.startOffset - 1 } }] };
    const result = await verifyManifest(invalid);
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /citation does not match source/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('jsonl citations track escaped content across chunks', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-jsonl-'));
  try {
    const messages = [
      { role: 'user', content: 'first line\nquoted "value" and \\path' },
      { role: 'assistant', text: 'snowman: \u2603' }
    ];
    const source = `${messages.map((message) => JSON.stringify(message)).join('\n')}\n`.replace('☃', '\\u2603');
    await writeFile(path.join(tmp, 'escaped.jsonl'), source);
    const manifest = await inspect({ input: tmp, maxChunkLines: 1 });
    assert.equal(manifest.chunks.length, 3);
    assert.notEqual(manifest.chunks[0]?.citation.startOffset, manifest.chunks[1]?.citation.startOffset);
    for (const chunk of manifest.chunks) {
      const raw = source.slice(chunk.citation.startOffset, chunk.citation.endOffset);
      assert.equal(JSON.parse(`"${raw}"`), chunk.text);
      assert.equal(chunk.citation.startLine, chunk.citation.endLine);
    }
    assert.equal((await verifyManifest(manifest)).ok, true);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('verification rejects incorrect jsonl citation offsets', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-jsonl-'));
  try {
    const source = `${JSON.stringify({ content: 'escaped\ncontent' })}\n`;
    await writeFile(path.join(tmp, 'escaped.jsonl'), source);
    const manifest = await inspect({ input: tmp });
    const chunk = manifest.chunks[0]!;
    const invalid = { ...manifest, chunks: [{ ...chunk, citation: { ...chunk.citation, endOffset: chunk.citation.endOffset + 1 } }] };
    const result = await verifyManifest(invalid);
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /citation does not match source/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
