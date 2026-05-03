export type OutputFormat = 'json' | 'markdown';
export type SourceKind = 'json' | 'jsonl' | 'markdown' | 'text';
export interface InspectOptions { readonly input: string; readonly output?: string; readonly maxChunkLines?: number; readonly maxChunkChars?: number; readonly include?: readonly string[]; }
export interface SourceFile { readonly id: string; readonly path: string; readonly relativePath: string; readonly kind: SourceKind; readonly bytes: number; readonly sha256: string; }
export interface ChunkCitation { readonly sourceId: string; readonly sourcePath: string; readonly startLine: number; readonly endLine: number; readonly startOffset: number; readonly endOffset: number; }
export interface Chunk { readonly id: string; readonly sourceId: string; readonly sourcePath: string; readonly kind: SourceKind; readonly role?: string; readonly createdAt?: string; readonly text: string; readonly sha256: string; readonly citation: ChunkCitation; readonly keywords: readonly string[]; }
export interface Manifest { readonly version: 1; readonly generatedAt: string; readonly inputRoot: string; readonly sources: readonly SourceFile[]; readonly chunks: readonly Chunk[]; readonly stats: { readonly sourceCount: number; readonly chunkCount: number; readonly totalBytes: number; readonly totalTextChars: number; }; }
export interface SearchResult { readonly chunk: Chunk; readonly score: number; readonly matches: readonly string[]; }
