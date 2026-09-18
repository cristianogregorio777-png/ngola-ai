export type ConnectionState = 'connected' | 'invalid' | 'unavailable' | 'not-configured';
export interface ConnectionHealth { provider: string; state: ConnectionState; message: string; checkedAt: string | null; username?: string; }

type Check = { provider: string; key?: string; request: () => Promise<{ username?: string }> };

export class ConnectionHealthService {
  private readonly last = new Map<string, ConnectionHealth>();
  async checkAll(): Promise<ConnectionHealth[]> { const checks = this.checks(); return Promise.all(checks.map((check) => this.check(check))); }
  async checkProvider(provider: string): Promise<ConnectionHealth> { const check = this.checks().find((item) => item.provider === provider); if (!check) throw new Error(`Provider desconhecido: ${provider}`); return this.check(check); }
  getCached(): ConnectionHealth[] { return [...this.last.values()]; }
  private checks(): Check[] { const key = (name: string) => process.env[name]; return [
    { provider: 'gemini', key: key('GEMINI_API_KEY'), request: async () => { await this.fetchJson(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key('GEMINI_API_KEY') ?? '')}`); return {}; } },
    { provider: 'groq', key: key('GROQ_API_KEY'), request: async () => { await this.fetchJson('https://api.groq.com/openai/v1/models', { Authorization: `Bearer ${key('GROQ_API_KEY') ?? ''}` }); return {}; } },
    { provider: 'github', key: key('GITHUB_TOKEN'), request: async () => this.fetchJson('https://api.github.com/user', { Authorization: `Bearer ${key('GITHUB_TOKEN') ?? ''}`, 'X-GitHub-Api-Version': '2022-11-28' }) },
    { provider: 'e2b', key: key('E2B_API_KEY'), request: async () => { await this.fetchJson('https://api.e2b.dev/sandboxes', { 'X-API-Key': key('E2B_API_KEY') ?? '' }); return {}; } },
    { provider: 'daytona', key: key('DAYTONA_API_KEY'), request: async () => { const base = key('DAYTONA_API_URL') ?? 'https://app.daytona.io/api'; await this.fetchJson(`${base.replace(/\/$/u, '')}/workspace`, { Authorization: `Bearer ${key('DAYTONA_API_KEY') ?? ''}` }); return {}; } },
    { provider: 'npm', request: async () => { await this.fetchJson('https://registry.npmjs.org/-/v1/search?text=react&size=1'); return {}; } },
    { provider: 'pypi', request: async () => { await this.fetchJson('https://pypi.org/pypi/requests/json'); return {}; } },
    { provider: 'supabase', key: key('NEXT_PUBLIC_SUPABASE_URL'), request: async () => { const base = key('NEXT_PUBLIC_SUPABASE_URL'); await this.fetchJson(`${base?.replace(/\/$/u, '')}/rest/v1/`, { apikey: key('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ?? '' }); return {}; } }
  ]; }
  private async check(check: Check): Promise<ConnectionHealth> { const checkedAt = new Date().toISOString(); if (check.provider === 'supabase' && !check.key || ['gemini', 'groq', 'github', 'e2b', 'daytona'].includes(check.provider) && !check.key) return this.save({ provider: check.provider, state: 'not-configured', message: `${check.provider} não configurado.`, checkedAt }); try { const result = await check.request(); return this.save({ provider: check.provider, state: 'connected', message: 'Conectado e funcional.', checkedAt, username: result.username }); } catch (error) { const message = error instanceof Error ? error.message : String(error); const state: ConnectionState = message.startsWith('network:') ? 'unavailable' : 'invalid'; return this.save({ provider: check.provider, state, message: state === 'unavailable' ? 'Sem conexão com a internet.' : `Configurado, mas com erro: ${message.replace(/^http \d+:\s*/u, '')}`, checkedAt }); } }
  private save(value: ConnectionHealth): ConnectionHealth { this.last.set(value.provider, value); return value; }
  private async fetchJson(url: string, headers: Record<string, string> = {}): Promise<{ username?: string }> { let response: Response; try { response = await fetch(url, { headers, signal: AbortSignal.timeout(6000) }); } catch { throw new Error('network: serviço indisponível no momento'); } if (!response.ok) throw new Error(`http ${response.status}: ${response.statusText}`); return response.json() as Promise<{ username?: string }>; }
}
