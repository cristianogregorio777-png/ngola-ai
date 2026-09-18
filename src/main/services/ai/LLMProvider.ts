export type LLMProviderName = 'gemini' | 'groq';

export interface LLMMessage { role: 'system' | 'user' | 'assistant'; content: string; }
export interface LLMGenerateRequest { model: string; messages: LLMMessage[]; temperature?: number; maxTokens?: number; }
export interface LLMGenerateResponse { provider: LLMProviderName; model: string; text: string; inputTokens?: number; outputTokens?: number; }
export interface LLMProvider { readonly name: LLMProviderName; isConfigured(): boolean; generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse>; }
