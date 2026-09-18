import type { LLMGenerateRequest, LLMGenerateResponse, LLMProvider } from './LLMProvider.js';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini' as const;
  constructor(private readonly apiKey?: string) {}
  isConfigured(): boolean { return Boolean(this.apiKey); }
  async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    if (!this.apiKey) throw new Error('Gemini não configurado.');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: request.messages.filter((message) => message.role !== 'system').map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })), systemInstruction: request.messages.find((message) => message.role === 'system') ? { parts: [{ text: request.messages.find((message) => message.role === 'system')?.content }] } : undefined, generationConfig: { temperature: request.temperature, maxOutputTokens: request.maxTokens } }) });
    if (!response.ok) throw new Error(`Gemini retornou HTTP ${response.status}.`);
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } };
    return { provider: this.name, model: request.model, text: data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '', inputTokens: data.usageMetadata?.promptTokenCount, outputTokens: data.usageMetadata?.candidatesTokenCount };
  }
}
