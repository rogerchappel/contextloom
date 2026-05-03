import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const cli = path.resolve('dist/src/cli.js');
const fixture = path.resolve('fixtures/sample');

test('cli inspect/search/show/verify work against a real fixture', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'contextloom-cli-'));
  try {
    const inspect = spawnSync(process.execPath, [cli, 'inspect', fixture, '--output', tmp], { encoding: 'utf8' });
    assert.equal(inspect.status, 0, inspect.stderr);
    assert.match(inspect.stdout, /indexed/);

    const manifest = path.join(tmp, 'manifest.json');
    const search = spawnSync(process.execPath, [cli, 'search', manifest, 'branch protection', '--limit', '1'], { encoding: 'utf8' });
    assert.equal(search.status, 0, search.stderr);
    assert.match(search.stdout, /branch protection/i);

    const show = spawnSync(process.execPath, [cli, 'show', manifest, 'chunk-0001'], { encoding: 'utf8' });
    assert.equal(show.status, 0, show.stderr);
    assert.match(show.stdout, /Citation:/);

    const verify = spawnSync(process.execPath, [cli, 'verify', manifest], { encoding: 'utf8' });
    assert.equal(verify.status, 0, verify.stderr);
    assert.match(verify.stdout, /Verified/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
