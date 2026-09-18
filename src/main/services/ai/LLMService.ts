import type { LLMGenerateRequest, LLMGenerateResponse, LLMProviderName } from './LLMProvider.js';
import { LLMRouter } from './LLMRouter.js';

export class LLMService {
  constructor(private readonly router: LLMRouter) {}
  generate(request: LLMGenerateRequest, options: { primary: LLMProviderName; fallback?: LLMProviderName; workspace?: string; task?: string }): Promise<LLMGenerateResponse> { return this.router.generate(request, options.primary, options.fallback, options.workspace, options.task); }
}
