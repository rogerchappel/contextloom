#!/usr/bin/env node
import { inspect } from './inspect.js';
import { loadManifest } from './manifest.js';
import { renderChunkMarkdown, renderSearchMarkdown, renderSummary } from './render.js';
import { findChunk, searchManifest } from './search.js';
import { verifyManifest } from './verify.js';
import type { OutputFormat } from './types.js';

type Command = 'inspect' | 'search' | 'show' | 'verify';
interface ParsedArgs { command: Command; positional: string[]; flags: Record<string, string>; }
const commandOptions: Record<Command, ReadonlySet<string>> = {
  inspect: new Set(['output', 'format']),
  search: new Set(['limit', 'format']),
  show: new Set(['format']),
  verify: new Set(['format']),
};
const positionalCounts: Record<Command, number> = { inspect: 1, search: 2, show: 2, verify: 1 };

class UsageError extends Error {}

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

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  const [rawCommand, ...rest] = argv;
  if (!rawCommand || rawCommand === 'help' || rawCommand === '--help' || rawCommand === '-h') return undefined;
  if (!Object.hasOwn(commandOptions, rawCommand)) throw new UsageError(`unknown command: ${rawCommand}`);

  const command = rawCommand as Command;
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg) continue;
    if (!arg.startsWith('-')) {
      positional.push(arg);
      continue;
    }
    if (!arg.startsWith('--')) throw new UsageError(`unknown option: ${arg}`);

    const equals = arg.indexOf('=');
    const key = arg.slice(2, equals === -1 ? undefined : equals);
    if (!commandOptions[command].has(key)) throw new UsageError(`unknown option: --${key}`);

    const inlineValue = equals === -1 ? undefined : arg.slice(equals + 1);
    const nextValue = rest[index + 1];
    const canConsumeNext = nextValue && (!nextValue.startsWith('-') || (key === 'limit' && /^-\d/.test(nextValue)));
    const value = inlineValue ?? (canConsumeNext ? rest[++index] : undefined);
    if (!value) throw new UsageError(`--${key} requires a value`);
    flags[key] = value;
  }

  const expected = positionalCounts[command];
  if (positional.length !== expected) {
    throw new UsageError(`${command} accepts exactly ${expected} positional argument${expected === 1 ? '' : 's'}`);
  }
  return { command, positional, flags };
}

function asFormat(value: string | undefined): OutputFormat {
  if (value === undefined) return 'markdown';
  if (value !== 'json' && value !== 'markdown') throw new UsageError('--format must be json or markdown');
  return value;
}

function asPositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = /^[1-9]\d*$/.test(value) ? Number(value) : Number.NaN;
  if (!Number.isSafeInteger(parsed)) throw new UsageError('--limit requires a positive integer');
  return parsed;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    console.log(help());
    return;
  }
  const format = asFormat(args.flags.format);
  if (args.command === 'inspect') {
    const input = args.positional[0]!;
    const manifest = await inspect({ input, ...(args.flags.output ? { output: args.flags.output } : {}) });
    console.log(format === 'json' ? JSON.stringify(manifest, null, 2) : renderSummary(manifest));
    return;
  }
  if (args.command === 'search') {
    const manifest = await loadManifest(args.positional[0]!);
    const results = searchManifest(manifest, args.positional[1]!, asPositiveInteger(args.flags.limit, 10));
    console.log(format === 'json' ? JSON.stringify(results, null, 2) : renderSearchMarkdown(results));
    return;
  }
  if (args.command === 'show') {
    const chunkId = args.positional[1]!;
    const manifest = await loadManifest(args.positional[0]!);
    const chunk = findChunk(manifest, chunkId);
    if (!chunk) throw new Error(`chunk not found: ${chunkId}`);
    console.log(format === 'json' ? JSON.stringify(chunk, null, 2) : renderChunkMarkdown(chunk));
    return;
  }

  const manifest = await loadManifest(args.positional[0]!);
  const result = await verifyManifest(manifest);
  console.log(format === 'json' ? JSON.stringify(result, null, 2) : result.ok ? `Verified ${result.checkedChunks} chunks.` : `Verification failed:\n- ${result.errors.join('\n- ')}`);
  if (!result.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(error instanceof UsageError ? `${message}\n\n${help()}` : message);
  process.exitCode = 1;
});
