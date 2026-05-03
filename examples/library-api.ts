import { inspect, searchManifest, verifyManifest } from '../src/index.js';

const manifest = await inspect({ input: 'fixtures/sample', output: 'out/example-library' });
const results = searchManifest(manifest, 'branch protection', 2);
const verification = await verifyManifest(manifest);

console.log({
  chunks: manifest.stats.chunkCount,
  firstMatch: results[0]?.chunk.id ?? null,
  verified: verification.ok
});
