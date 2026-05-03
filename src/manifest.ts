import { promises as fs } from 'node:fs';
import type { Manifest } from './types.js';
import { ContextloomError } from './errors.js';
export async function loadManifest(filePath: string): Promise<Manifest> { const parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as Manifest; if (parsed.version !== 1 || !Array.isArray(parsed.chunks) || !Array.isArray(parsed.sources)) throw new ContextloomError(`Invalid contextloom manifest: ${filePath}`, 'INVALID_MANIFEST'); return parsed; }
