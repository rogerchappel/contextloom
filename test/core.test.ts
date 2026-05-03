import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
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

test('findChunk supports stable chunk ids and hash prefixes', async () => {
  const manifest = await inspect({ input: fixture });
  const first = manifest.chunks[0]!;
  assert.equal(findChunk(manifest, first.id)?.id, first.id);
  assert.equal(findChunk(manifest, first.sha256.slice(0, 12))?.id, first.id);
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
