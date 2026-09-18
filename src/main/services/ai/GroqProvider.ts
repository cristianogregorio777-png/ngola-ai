import type { LLMGenerateRequest, LLMGenerateResponse, LLMProvider } from './LLMProvider.js';

export class GroqProvider implements LLMProvider {
  readonly name = 'groq' as const;
  constructor(private readonly apiKey?: string) {}
  isConfigured(): boolean { return Boolean(this.apiKey); }
  async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    if (!this.apiKey) throw new Error('Groq não configurado.');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature, max_tokens: request.maxTokens }) });
    if (!response.ok) throw new Error(`Groq retornou HTTP ${response.status}.`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    return { provider: this.name, model: request.model, text: data.choices?.[0]?.message?.content ?? '', inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens };
  }
}
