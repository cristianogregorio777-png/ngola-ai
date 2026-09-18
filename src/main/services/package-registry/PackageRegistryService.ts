export type Registry = 'npm' | 'pypi';
export class PackageRegistryService {
  async searchPackage(registry: Registry, query: string): Promise<unknown> { const url = registry === 'npm' ? `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}` : `https://pypi.org/pypi/${encodeURIComponent(query)}/json`; const response = await fetch(url); if (!response.ok) throw new Error(`${registry} retornou HTTP ${response.status}.`); return response.json(); }
  async getPackage(registry: Registry, name: string): Promise<unknown> { const url = registry === 'npm' ? `https://registry.npmjs.org/${encodeURIComponent(name)}` : `https://pypi.org/pypi/${encodeURIComponent(name)}/json`; const response = await fetch(url); if (!response.ok) throw new Error(`${registry} retornou HTTP ${response.status}.`); return response.json(); }
  async getVersions(registry: Registry, name: string): Promise<string[]> { const data = await this.getPackage(registry, name) as { versions?: string[]; releases?: Record<string, unknown> }; return registry === 'npm' ? Object.keys(data.versions ?? {}) : Object.keys(data.releases ?? {}); }
}
