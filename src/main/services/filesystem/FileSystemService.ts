import fs from 'node:fs/promises';
import path from 'node:path';

export class FileSystemService {
  async read(filePath: string): Promise<string> { return fs.readFile(filePath, 'utf8'); }
  async write(filePath: string, content: string): Promise<void> { await fs.mkdir(path.dirname(filePath), { recursive: true }); await fs.writeFile(filePath, content, 'utf8'); }
  async create(filePath: string, content = ''): Promise<void> { await this.write(filePath, content); }
  async mkdir(directory: string): Promise<void> { await fs.mkdir(directory, { recursive: true }); }
  async rename(source: string, destination: string): Promise<void> { await fs.rename(source, destination); }
  async copy(source: string, destination: string): Promise<void> { await fs.cp(source, destination, { recursive: true }); }
  async move(source: string, destination: string): Promise<void> { await this.rename(source, destination); }
  async delete(filePath: string): Promise<void> { await fs.rm(filePath, { recursive: true, force: false }); }
  async search(directory: string, query: string): Promise<string[]> { const entries = await fs.readdir(directory, { recursive: true }); return entries.filter((entry) => entry.toLowerCase().includes(query.toLowerCase())).map((entry) => path.join(directory, entry)); }
}
