import { DEFAULT_QUOTA_LIMITS, type ProviderQuota, type QuotaCategory, type QuotaLimits, type QuotaSnapshot } from './QuotaPolicy.js';

function localDate(): string { const date = new Date(); const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 10); }

export class QuotaManager {
  private date = localDate();
  private readonly usage = new Map<string, number>();
  constructor(private readonly limits: QuotaLimits = DEFAULT_QUOTA_LIMITS) {}
  private resetIfNeeded(): void { const current = localDate(); if (current !== this.date) { this.date = current; this.usage.clear(); } }
  private key(category: QuotaCategory, provider: ProviderQuota): string { return `${category}:${provider}`; }
  snapshot(category: QuotaCategory, provider: ProviderQuota = 'global'): QuotaSnapshot { this.resetIfNeeded(); const limit = this.limits[category]; const used = this.usage.get(this.key(category, provider)) ?? 0; const ratio = limit > 0 ? used / limit : 1; return { date: this.date, category, provider, used, limit, ratio, level: ratio >= 1 ? 'exceeded' : ratio >= .85 ? 'alert' : ratio >= .7 ? 'warning' : 'ok' }; }
  canConsume(category: QuotaCategory, amount: number, provider: ProviderQuota = 'global'): boolean { return this.snapshot(category, provider).used + amount <= this.limits[category]; }
  consume(category: QuotaCategory, amount: number, provider: ProviderQuota = 'global'): QuotaSnapshot { this.resetIfNeeded(); if (!this.canConsume(category, amount, provider)) throw new Error(`Você atingiu o limite diário configurado para ${provider === 'global' ? category : provider}.`); const key = this.key(category, provider); this.usage.set(key, (this.usage.get(key) ?? 0) + amount); return this.snapshot(category, provider); }
  all(): QuotaSnapshot[] { return (Object.keys(this.limits) as QuotaCategory[]).map((category) => this.snapshot(category)); }
}
