import type { LineSpan } from './lines.js';
import { lineStarts, offsetToLine, splitLineSpans } from './lines.js';
import type { SourceKind } from './types.js';

export interface ParsedSpan extends LineSpan {
  readonly role?: string;
  readonly createdAt?: string;
  readonly representation?: 'json';
  readonly representationStartOffset?: number;
  readonly representationEndOffset?: number;
}

interface JsonMessage { role?: unknown; content?: unknown; text?: unknown; message?: unknown; createdAt?: unknown; timestamp?: unknown; }
interface ValueRange { start: number; end: number; value: unknown; }

function messageValue(value: JsonMessage): unknown { return value.content ?? value.text ?? value.message; }
function messageField(value: JsonMessage): 'content' | 'text' | 'message' | undefined {
  if (value.content != null) return 'content';
  if (value.text != null) return 'text';
  if (value.message != null) return 'message';
  return undefined;
}
function textFromValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item : JSON.stringify(item)).join('\n');
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
  return undefined;
}
function findMessages(value: unknown): JsonMessage[] {
  if (Array.isArray(value)) return value.flatMap(findMessages);
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  for (const key of ['messages', 'turns', 'events', 'transcript']) if (Array.isArray(record[key])) return findMessages(record[key]);
  if ('content' in record || 'text' in record || 'message' in record) return [record as JsonMessage];
  return [];
}
function byteOffset(text: string, charOffset: number): number { return Buffer.byteLength(text.slice(0, charOffset)); }
function rawSpans(text: string, maxLines: number, maxChars: number): ParsedSpan[] {
  return splitLineSpans(text, maxLines, maxChars).map((span) => ({ ...span, startOffset: byteOffset(text, span.startOffset), endOffset: byteOffset(text, span.endOffset) }));
}
function jsonValueRanges(text: string): ValueRange[] {
  const ranges: ValueRange[] = [];
  for (let start = 0; start < text.length; start += 1) {
    if (!/[[{"tfn\d-]/u.test(text[start] ?? '')) continue;
    let quoted = false; let escaped = false; let depth = 0;
    for (let end = start; end < text.length; end += 1) {
      const char = text[end]!;
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') quoted = true;
      else if (char === '{' || char === '[') depth += 1;
      else if (char === '}' || char === ']') depth -= 1;
      const next = text[end + 1];
      const terminal = !quoted && depth === 0 && (char === '}' || char === ']' || char === '"' || next === undefined || /[,\s}\]]/u.test(next));
      if (!terminal) continue;
      try { ranges.push({ start, end: end + 1, value: JSON.parse(text.slice(start, end + 1)) }); } catch { /* not a complete value */ }
      break;
    }
  }
  return ranges;
}
function sameJson(left: unknown, right: unknown): boolean { return JSON.stringify(left) === JSON.stringify(right); }
function messageRange(text: string, ranges: ValueRange[], message: JsonMessage, searchFrom = 0): ValueRange | undefined {
  const objectRange = ranges.find((item) => item.start >= searchFrom && sameJson(item.value, message));
  const field = messageField(message);
  if (!objectRange || !field) return undefined;
  const keyBeforeValue = new RegExp(`${JSON.stringify(field)}\\s*:\\s*$`, 'u');
  return ranges.find((item) => item.start > objectRange.start && item.end <= objectRange.end && sameJson(item.value, messageValue(message)) && keyBeforeValue.test(text.slice(objectRange.start, item.start)));
}
export function isMessageFieldRange(text: string, start: number, end: number): boolean {
  const ranges = jsonValueRanges(text);
  for (const item of ranges) {
    if (!item.value || typeof item.value !== 'object' || Array.isArray(item.value)) continue;
    const message = item.value as JsonMessage;
    if (!messageField(message)) continue;
    const valueRange = messageRange(text, ranges, message, item.start);
    if (!valueRange) continue;
    if (typeof messageValue(message) === 'string' && start >= valueRange.start + 1 && end <= valueRange.end - 1) return true;
    if (typeof messageValue(message) !== 'string' && start === valueRange.start && end === valueRange.end) return true;
  }
  return false;
}
function stringBoundaries(raw: string): number[] { const boundaries = [0]; let rawOffset = 0; let decodedOffset = 0; while (rawOffset < raw.length) { const escaped = raw[rawOffset] === '\\'; const rawLength = escaped ? (raw[rawOffset + 1] === 'u' ? 6 : 2) : ((raw.codePointAt(rawOffset) ?? 0) > 0xffff ? 2 : 1); const decoded = JSON.parse(`"${raw.slice(rawOffset, rawOffset + rawLength)}"`) as string; for (let index = 1; index <= decoded.length; index += 1) boundaries[decodedOffset + index] = rawOffset + Math.ceil(rawLength * index / decoded.length); decodedOffset += decoded.length; rawOffset += rawLength; } return boundaries; }
function mappedSpans(source: string, message: JsonMessage, range: ValueRange, maxLines: number, maxChars: number, byteBase = 0, lineBase = 0): ParsedSpan[] {
  const value = messageValue(message);
  const content = textFromValue(value);
  if (!content?.trim()) return [];
  const starts = lineStarts(source);
  return splitLineSpans(content, maxLines, maxChars).map((span) => {
    const metadata = { ...(typeof message.role === 'string' ? { role: message.role } : {}), ...(typeof message.createdAt === 'string' ? { createdAt: message.createdAt } : typeof message.timestamp === 'string' ? { createdAt: message.timestamp } : {}) };
    if (typeof value === 'string') {
      const boundaries = stringBoundaries(source.slice(range.start + 1, range.end - 1));
      const encodedStart = boundaries[span.startOffset]!;
      const encodedEnd = boundaries[span.endOffset]!;
      const start = range.start + 1 + encodedStart; const end = range.start + 1 + encodedEnd;
      return { ...span, startLine: lineBase + offsetToLine(starts, start), endLine: lineBase + offsetToLine(starts, Math.max(start, end - 1)), startOffset: byteBase + byteOffset(source, start), endOffset: byteBase + byteOffset(source, end), ...metadata };
    }
    return { ...span, startLine: lineBase + offsetToLine(starts, range.start), endLine: lineBase + offsetToLine(starts, Math.max(range.start, range.end - 1)), startOffset: byteBase + byteOffset(source, range.start), endOffset: byteBase + byteOffset(source, range.end), representation: 'json' as const, representationStartOffset: span.startOffset, representationEndOffset: span.endOffset, ...metadata };
  });
}

export function parseSource(text: string, kind: SourceKind, maxLines: number, maxChars: number): ParsedSpan[] {
  if (kind === 'json') return parseJson(text, maxLines, maxChars);
  if (kind === 'jsonl') return parseJsonl(text, maxLines, maxChars);
  return rawSpans(text, maxLines, maxChars);
}
function parseJson(text: string, maxLines: number, maxChars: number): ParsedSpan[] {
  try {
    const messages = findMessages(JSON.parse(text));
    if (messages.length === 0) return rawSpans(text, maxLines, maxChars);
    const ranges = jsonValueRanges(text); let searchFrom = 0;
    return messages.flatMap((message) => {
      const range = messageRange(text, ranges, message, searchFrom);
      if (!range) return [];
      searchFrom = range.end;
      return mappedSpans(text, message, range, maxLines, maxChars);
    });
  } catch { return rawSpans(text, maxLines, maxChars); }
}
function parseJsonl(text: string, maxLines: number, maxChars: number): ParsedSpan[] {
  const spans: ParsedSpan[] = []; let charBase = 0; let byteBase = 0;
  for (const line of text.split(/(?<=\n)/u)) {
    const trimmed = line.trim(); const leading = line.indexOf(trimmed);
    if (trimmed) {
      try {
        const message = JSON.parse(trimmed) as JsonMessage;
        const ranges = jsonValueRanges(trimmed);
        const range = messageRange(trimmed, ranges, message);
        if (range) spans.push(...mappedSpans(trimmed, message, range, maxLines, maxChars, byteBase + byteOffset(line, leading), offsetToLine(lineStarts(text), charBase + leading) - 1));
      } catch {
        for (const span of rawSpans(trimmed, maxLines, maxChars)) spans.push({ ...span, startOffset: byteBase + byteOffset(line, leading) + span.startOffset, endOffset: byteBase + byteOffset(line, leading) + span.endOffset });
      }
    }
    charBase += line.length; byteBase += Buffer.byteLength(line);
  }
  return spans;
}
