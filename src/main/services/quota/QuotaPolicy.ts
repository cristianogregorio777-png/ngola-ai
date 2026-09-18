export type QuotaCategory = 'AI_REQUESTS' | 'AI_TOKENS' | 'SANDBOX_MINUTES' | 'GITHUB_REQUESTS' | 'AGENT_ITERATIONS';
export type ProviderQuota = 'gemini' | 'groq' | 'global';

export interface QuotaLimits { AI_REQUESTS: number; AI_TOKENS: number; SANDBOX_MINUTES: number; GITHUB_REQUESTS: number; AGENT_ITERATIONS: number; }
export interface QuotaSnapshot { date: string; category: QuotaCategory; provider: ProviderQuota; used: number; limit: number; ratio: number; level: 'ok' | 'warning' | 'alert' | 'exceeded'; }
export const DEFAULT_QUOTA_LIMITS: QuotaLimits = { AI_REQUESTS: 100, AI_TOKENS: 100000, SANDBOX_MINUTES: 30, GITHUB_REQUESTS: 100, AGENT_ITERATIONS: 10 };
