import fs from 'node:fs/promises';
import path from 'node:path';
export class DiagnosticLogger {
  constructor(private readonly directory: string) {}
  async info(event: string, metadata: Record<string, unknown> = {}): Promise<void> { await this.write('info', event, metadata); }
  async error(event: string, error: unknown): Promise<void> { await this.write('error', event, { message: error instanceof Error ? error.message : String(error) }); }
  private async write(level: string, event: string, metadata: Record<string, unknown>): Promise<void> { const safe = JSON.stringify(metadata, (_key, value) => typeof value === 'string' && /(key|token|secret|password|authorization)/iu.test(_key) ? '[REDACTED]' : value); await fs.mkdir(this.directory, { recursive: true }); await fs.appendFile(path.join(this.directory, 'diagnostic.jsonl'), `${JSON.stringify({ timestamp: new Date().toISOString(), level, event, metadata: JSON.parse(safe) })}\n`, 'utf8'); }
}
