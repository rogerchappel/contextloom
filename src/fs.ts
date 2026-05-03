import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { SourceKind } from './types.js';
const supported = new Map<string, SourceKind>([['.json', 'json'], ['.jsonl', 'jsonl'], ['.md', 'markdown'], ['.markdown', 'markdown'], ['.txt', 'text']]);
export function sourceKind(filePath: string): SourceKind | undefined { return supported.get(path.extname(filePath).toLowerCase()); }
export async function listSourceFiles(root: string): Promise<string[]> { const stat = await fs.stat(root); if (stat.isFile()) return sourceKind(root) ? [path.resolve(root)] : []; const found: string[] = []; async function walk(dir: string): Promise<void> { const entries = await fs.readdir(dir, { withFileTypes: true }); entries.sort((a, b) => a.name.localeCompare(b.name)); for (const entry of entries) { if (entry.name.startsWith('.') || ['node_modules', 'dist', 'out'].includes(entry.name)) continue; const full = path.join(dir, entry.name); if (entry.isDirectory()) await walk(full); else if (entry.isFile() && sourceKind(full)) found.push(path.resolve(full)); } } await walk(root); return found; }
export async function ensureDir(dir: string): Promise<void> { await fs.mkdir(dir, { recursive: true }); }
export function normalizeRelative(root: string, file: string): string { return path.relative(path.resolve(root), path.resolve(file)).split(path.sep).join('/'); }
