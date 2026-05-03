export class ContextloomError extends Error { constructor(message: string, readonly code = 'CONTEXTLOOM_ERROR') { super(message); this.name = 'ContextloomError'; } }
