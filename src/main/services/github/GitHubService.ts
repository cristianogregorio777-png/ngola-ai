export class GitHubService {
  constructor(private readonly token?: string) {}
  isConfigured(): boolean { return Boolean(this.token); }
  private async request<T>(url: string, init?: RequestInit): Promise<T> { if (!this.token) throw new Error('GitHub não configurado.'); const response = await fetch(url, { ...init, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${this.token}`, 'X-GitHub-Api-Version': '2022-11-28', ...init?.headers } }); if (!response.ok) throw new Error(`GitHub retornou HTTP ${response.status}.`); return response.json() as Promise<T>; }
  listRepositories(): Promise<unknown> { return this.request('https://api.github.com/user/repos?sort=updated'); }
  getRepository(owner: string, repo: string): Promise<unknown> { return this.request(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`); }
  searchRepositories(query: string): Promise<unknown> { return this.request(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`); }
  searchCode(query: string): Promise<unknown> { return this.request(`https://api.github.com/search/code?q=${encodeURIComponent(query)}`); }
  createBranch(owner: string, repo: string, branch: string, sha: string): Promise<unknown> { return this.request(`https://api.github.com/repos/${owner}/${repo}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }), headers: { 'Content-Type': 'application/json' } }); }
  createPullRequest(owner: string, repo: string, title: string, head: string, base: string, body?: string): Promise<unknown> { return this.request(`https://api.github.com/repos/${owner}/${repo}/pulls`, { method: 'POST', body: JSON.stringify({ title, head, base, body }), headers: { 'Content-Type': 'application/json' } }); }
}
