import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
export interface PreviewPort { port: number; url: string; available: boolean; }
export class PreviewManager {
  private readonly ports = [3000, 5173, 8000, 8080];
  async detect(): Promise<PreviewPort[]> { return Promise.all(this.ports.map(async (port) => { try { const response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(700) }); return { port, url: `http://127.0.0.1:${port}`, available: response.ok || response.status < 500 }; } catch { return { port, url: `http://127.0.0.1:${port}`, available: false }; } })); }
  async open(url: string): Promise<void> { if (process.platform === 'win32') await exec('rundll32.exe', ['url.dll,FileProtocolHandler', url]); else await exec(process.platform === 'darwin' ? 'open' : 'xdg-open', [url]); }
}
