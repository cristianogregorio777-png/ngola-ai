import type { LLMGenerateRequest, LLMGenerateResponse, LLMProviderName } from './LLMProvider.js';
import { QuotaManager } from '../quota/QuotaManager.js';
import { UsageTracker } from '../usage/UsageTracker.js';

export class LLMRouter {
  constructor(private readonly providers: Record<LLMProviderName, { isConfigured(): boolean; generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> }>, private readonly quotas: QuotaManager, private readonly usage: UsageTracker) {}
  async generate(request: LLMGenerateRequest, primary: LLMProviderName, fallback?: LLMProviderName, workspace?: string, task?: string): Promise<LLMGenerateResponse> {
    const candidates = [primary, fallback].filter((provider, index, list): provider is LLMProviderName => Boolean(provider) && list.indexOf(provider) === index);
    let lastError: unknown;
    for (const providerName of candidates) {
      const provider = this.providers[providerName];
      if (!provider?.isConfigured() || !this.quotas.canConsume('AI_REQUESTS', 1, providerName)) continue;
      try {
        this.quotas.consume('AI_REQUESTS', 1, providerName);
        const result = await provider.generate(request);
        const tokens = (result.inputTokens ?? 0) + (result.outputTokens ?? 0);
        if (tokens > 0) {
          if (!this.quotas.canConsume('AI_TOKENS', tokens)) throw new Error('Você atingiu o limite diário configurado para tokens de IA.');
          this.quotas.consume('AI_TOKENS', tokens);
        }
        this.usage.record({ provider: providerName, model: result.model, requestCount: 1, tokens: tokens || undefined, timestamp: new Date().toISOString(), workspace, task, category: 'AI_REQUESTS' });
        return result;
      } catch (error) { lastError = error; }
    }
    throw lastError instanceof Error ? lastError : new Error('Nenhum provider de IA configurado ou disponível.');
  }
}
