export interface UsageRecord { provider: string; model?: string; requestCount: number; tokens?: number; timestamp: string; workspace?: string; task?: string; sandboxMinutes?: number; category?: string; }

export class UsageTracker {
  private readonly records: UsageRecord[] = [];
  record(entry: UsageRecord): void { this.records.push({ ...entry, timestamp: entry.timestamp || new Date().toISOString() }); }
  all(): UsageRecord[] { return [...this.records]; }
  today(): UsageRecord[] { const day = new Date().toISOString().slice(0, 10); return this.records.filter((record) => record.timestamp.slice(0, 10) === day); }
  clear(): void { this.records.length = 0; }
}
