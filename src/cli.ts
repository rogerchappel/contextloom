#!/usr/bin/env node
import { inspect } from './inspect.js';
import { loadManifest } from './manifest.js';
import { renderChunkMarkdown, renderSearchMarkdown, renderSummary } from './render.js';
import { findChunk, searchManifest } from './search.js';
import { verifyManifest } from './verify.js';
import type { OutputFormat } from './types.js';
interface ParsedArgs { command: string | undefined; positional: string[]; flags: Record<string, string | boolean>; }
function parseArgs(argv: readonly string[]): ParsedArgs { const [command, ...rest] = argv; const positional: string[] = []; const flags: Record<string, string | boolean> = {}; for (let index = 0; index < rest.length; index += 1) { const arg = rest[index]; if (!arg) continue; if (arg.startsWith('--')) { const [rawKey, inlineValue] = arg.slice(2).split('=', 2); if (!rawKey) continue; if (inlineValue !== undefined) flags[rawKey] = inlineValue; else if (rest[index + 1] && !rest[index + 1]?.startsWith('-')) flags[rawKey] = rest[++index] ?? true; else flags[rawKey] = true; } else positional.push(arg); } return { command, positional, flags }; }
function help(): string { return `contextloom — local-first context manager for agent transcripts

Usage:
  contextloom inspect <input> [--output out/context] [--format json|markdown]
  contextloom search <manifest.json> <query> [--limit 5] [--format json|markdown]
  contextloom show <manifest.json> <chunk-id-or-hash> [--format json|markdown]
  contextloom verify <manifest.json> [--format json|markdown]

Examples:
  contextloom inspect fixtures/sample --output out/sample
  contextloom search out/sample/manifest.json "deployment decision"
  contextloom show out/sample/manifest.json chunk-0001 --format markdown

Safety: contextloom only reads local files you point at and writes local output you request. No telemetry, network, or credential access.`; }
function asFormat(value: unknown): OutputFormat { return value === 'json' ? 'json' : 'markdown'; }
async function main(): Promise<void> { const args = parseArgs(process.argv.slice(2)); if (!args.command || args.command === 'help' || args.flags.help || args.flags.h) { console.log(help()); return; } if (args.command === 'inspect') { const input = args.positional[0]; if (!input) throw new Error('inspect requires an input file or directory'); const manifest = await inspect({ input, ...(typeof args.flags.output === 'string' ? { output: args.flags.output } : {}) }); console.log(asFormat(args.flags.format) === 'json' ? JSON.stringify(manifest, null, 2) : renderSummary(manifest)); return; } if (args.command === 'search') { const manifestPath = args.positional[0]; const query = args.positional.slice(1).join(' '); if (!manifestPath || !query) throw new Error('search requires a manifest path and query'); const manifest = await loadManifest(manifestPath); const limit = Number(args.flags.limit ?? 10); const results = searchManifest(manifest, query, Number.isFinite(limit) ? limit : 10); console.log(asFormat(args.flags.format) === 'json' ? JSON.stringify(results, null, 2) : renderSearchMarkdown(results)); return; } if (args.command === 'show') { const manifestPath = args.positional[0]; const chunkId = args.positional[1]; if (!manifestPath || !chunkId) throw new Error('show requires a manifest path and chunk id'); const manifest = await loadManifest(manifestPath); const chunk = findChunk(manifest, chunkId); if (!chunk) throw new Error(`chunk not found: ${chunkId}`); console.log(asFormat(args.flags.format) === 'json' ? JSON.stringify(chunk, null, 2) : renderChunkMarkdown(chunk)); return; } if (args.command === 'verify') { const manifestPath = args.positional[0]; if (!manifestPath) throw new Error('verify requires a manifest path'); const manifest = await loadManifest(manifestPath); const result = await verifyManifest(manifest); console.log(asFormat(args.flags.format) === 'json' ? JSON.stringify(result, null, 2) : result.ok ? `Verified ${result.checkedChunks} chunks.` : `Verification failed:\n- ${result.errors.join('\n- ')}`); if (!result.ok) process.exitCode = 1; return; } throw new Error(`unknown command: ${args.command}\n\n${help()}`); }
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
