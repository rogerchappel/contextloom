export interface LineSpan { readonly text: string; readonly startLine: number; readonly endLine: number; readonly startOffset: number; readonly endOffset: number; }

export function lineStarts(text: string): number[] {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) if (text[index] === '\n') starts.push(index + 1);
  return starts;
}

export function offsetToLine(starts: readonly number[], offset: number): number {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const start = starts[mid] ?? 0;
    if (start <= offset) low = mid + 1;
    else high = mid - 1;
  }
  return Math.max(1, high + 1);
}

function safeSliceEnd(text: string, start: number, maxChars: number): number {
  let end = Math.min(start + maxChars, text.length);
  const finalCodeUnit = text.charCodeAt(end - 1);
  if (end < text.length && finalCodeUnit >= 0xd800 && finalCodeUnit <= 0xdbff) end -= 1;
  return end > start ? end : Math.min(start + 2, text.length);
}

export function splitLineSpans(text: string, maxLines: number, maxChars: number): LineSpan[] {
  const starts = lineStarts(text);
  const spans: LineSpan[] = [];
  let batchStart = 0;
  let batchEnd = 0;
  let batchLines = 0;

  function flush(): void {
    const raw = text.slice(batchStart, batchEnd);
    const trimmed = raw.trim();
    if (trimmed) {
      const startOffset = batchStart + raw.indexOf(trimmed);
      const endOffset = startOffset + trimmed.length;
      spans.push({
        text: trimmed,
        startLine: offsetToLine(starts, startOffset),
        endLine: offsetToLine(starts, Math.max(startOffset, endOffset - 1)),
        startOffset,
        endOffset,
      });
    }
    batchStart = batchEnd;
    batchLines = 0;
  }

  let cursor = 0;
  for (const line of text.split(/(?<=\n)/u)) {
    let lineCursor = 0;
    while (lineCursor < line.length) {
      if (batchLines >= maxLines || batchEnd - batchStart >= maxChars) flush();
      if (batchEnd === batchStart) batchStart = cursor + lineCursor;
      const available = maxChars - (batchEnd - batchStart);
      const segmentEnd = safeSliceEnd(line, lineCursor, available);
      batchEnd = cursor + segmentEnd;
      lineCursor = segmentEnd;
      if (lineCursor === line.length) batchLines += 1;
    }
    cursor += line.length;
  }
  flush();
  return spans;
}
