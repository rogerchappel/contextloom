import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const cli = path.resolve('dist/src/cli.js');
const fixture = path.resolve('fixtures/sample');

function run(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
}

test('cli inspect/search/show/verify work against a real fixture', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-cli-'));
  try {
    const inspect = run('inspect', fixture, `--output=${tmp}`, '--format=json');
    assert.equal(inspect.status, 0, inspect.stderr);
    assert.match(inspect.stdout, /"chunks":/);

    const manifest = path.join(tmp, 'manifest.json');
    const search = run('search', manifest, 'branch protection', '--limit=1', '--format=markdown');
    assert.equal(search.status, 0, search.stderr);
    assert.match(search.stdout, /branch protection/i);

    const show = run('show', manifest, 'chunk-0001', '--format=json');
    assert.equal(show.status, 0, show.stderr);
    assert.match(show.stdout, /"id": "chunk-0001"/);

    const verify = run('verify', manifest, '--format=markdown');
    assert.equal(verify.status, 0, verify.stderr);
    assert.match(verify.stdout, /Verified/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('cli renders single-file citations in JSON and Markdown', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-cli-single-file-'));
  try {
    const input = path.join(fixture, 'notes.md');
    const inspect = run('inspect', input, `--output=${tmp}`, '--format=json');
    assert.equal(inspect.status, 0, inspect.stderr);
    assert.match(inspect.stdout, /"relativePath": "notes\.md"/);
    assert.match(inspect.stdout, /"sourcePath": "notes\.md"/);

    const manifest = path.join(tmp, 'manifest.json');
    assert.match(await readFile(path.join(tmp, 'manifest.md'), 'utf8'), /notes\.md:\d+-\d+/);
    const search = run('search', manifest, 'deployment', '--format=markdown');
    assert.equal(search.status, 0, search.stderr);
    assert.match(search.stdout, /Citation: notes\.md:\d+-\d+/);
    const show = run('show', manifest, 'chunk-0001', '--format=markdown');
    assert.equal(show.status, 0, show.stderr);
    assert.match(show.stdout, /Citation: notes\.md:\d+-\d+/);
    const verify = run('verify', manifest, '--format=json');
    assert.equal(verify.status, 0, verify.stderr);
    assert.match(verify.stdout, /"ok": true/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('packed cli inspects and verifies structured transcript content', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-cli-structured-'));
  try {
    const input = path.join(tmp, 'input');
    const output = path.join(tmp, 'output');
    await import('node:fs/promises').then(({ mkdir }) => mkdir(input));
    await writeFile(path.join(input, 'messages.jsonl'), `${JSON.stringify({ content: [{ type: 'text', text: 'packed array' }] })}\n${JSON.stringify({ content: { text: 'packed object' } })}\n`);
    const inspect = run('inspect', input, '--output', output, '--format=json');
    assert.equal(inspect.status, 0, inspect.stderr);
    assert.match(inspect.stdout, /packed array/);
    assert.match(inspect.stdout, /packed object/);
    const verify = run('verify', path.join(output, 'manifest.json'), '--format=json');
    assert.equal(verify.status, 0, verify.stderr);
    assert.match(verify.stdout, /"ok": true/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('cli search rejects invalid limit values', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-cli-limit-'));
  try {
    const inspect = spawnSync(process.execPath, [cli, 'inspect', fixture, '--output', tmp], { encoding: 'utf8' });
    assert.equal(inspect.status, 0, inspect.stderr);
    const manifest = path.join(tmp, 'manifest.json');
    for (const args of [['--limit'], ['--limit', 'nope'], ['--limit', '0'], ['--limit=-1'], ['--limit', '1.5']]) {
      const search = run('search', manifest, 'deployment', ...args);
      assert.notEqual(search.status, 0, `expected ${args.join(' ')} to fail`);
      assert.match(search.stderr, args[0] === '--limit' && args.length === 1 ? /--limit requires a value/ : /--limit requires a positive integer/);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('cli show rejects ambiguous hash prefixes with a clear diagnostic', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-cli-prefix-'));
  try {
    const inspect = run('inspect', fixture, `--output=${tmp}`, '--format=json');
    assert.equal(inspect.status, 0, inspect.stderr);
    const manifestPath = path.join(tmp, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.chunks[0].sha256 = 'abc111';
    manifest.chunks[1].sha256 = 'abc222';
    await writeFile(manifestPath, JSON.stringify(manifest));

    const ambiguous = run('show', manifestPath, 'abc', '--format=json');
    assert.notEqual(ambiguous.status, 0);
    assert.match(ambiguous.stderr, /ambiguous chunk hash prefix: abc matches 2 chunks/);
    assert.equal(ambiguous.stdout, '');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('cli rejects unsupported formats and unknown options with usage guidance', () => {
  for (const args of [
    ['inspect', fixture, '--format', 'yaml'],
    ['inspect', fixture, '--bogus'],
  ]) {
    const result = run(...args);
    assert.notEqual(result.status, 0, `expected ${args.join(' ')} to fail`);
    assert.match(result.stderr, /(?:--format must be json or markdown|unknown option: --bogus)/);
    assert.match(result.stderr, /Usage:/);
  }
});

test('cli rejects missing option values with usage guidance', () => {
  for (const args of [
    ['inspect', fixture, '--output'],
    ['inspect', fixture, '--format'],
  ]) {
    const result = run(...args);
    assert.notEqual(result.status, 0, `expected ${args.join(' ')} to fail`);
    assert.match(result.stderr, /--(?:output|format) requires a value/);
    assert.match(result.stderr, /Usage:/);
  }
});

test('cli rejects duplicate options before reading inputs or writing output', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-cli-duplicate-'));
  try {
    const output = path.join(tmp, 'must-not-exist');
    for (const args of [
      ['inspect', fixture, '--output', output, `--output=${output}-other`],
      ['inspect', fixture, '--format=json', '--format', 'markdown'],
      ['search', path.join(tmp, 'missing.json'), 'query', '--limit', '1', '--limit=2'],
    ]) {
      const result = run(...args);
      assert.notEqual(result.status, 0, `expected ${args.join(' ')} to fail`);
      assert.match(result.stderr, /--(?:output|format|limit) may only be specified once/);
      assert.match(result.stderr, /Usage:/);
    }
    await assert.rejects(readFile(output), { code: 'ENOENT' });
    await assert.rejects(readFile(`${output}-other`), { code: 'ENOENT' });
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('cli rejects unexpected positional arguments with usage guidance', () => {
  const result = run('inspect', fixture, 'extra-positional');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /inspect accepts exactly 1 positional argument/);
  assert.match(result.stderr, /Usage:/);
});
