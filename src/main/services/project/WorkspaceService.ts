import fs from 'node:fs/promises';
import path from 'node:path';
import { dialog, type BrowserWindow } from 'electron';

export interface WorkspaceInfo { name: string; path: string; created: boolean; }

function slug(value: string): string { const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/gu, '').replace(/[^a-zA-Z0-9]+/gu, '-').replace(/^-|-$/gu, '').toLowerCase(); return normalized.slice(0, 48) || 'ngola-project'; }

export class WorkspaceService {
  async chooseParent(window: BrowserWindow): Promise<string | undefined> { const result = await dialog.showOpenDialog(window, { title: 'Escolha onde criar o projeto', properties: ['openDirectory', 'createDirectory'] }); return result.canceled ? undefined : result.filePaths[0]; }
  async createFromRequest(window: BrowserWindow, request: string): Promise<WorkspaceInfo | undefined> { const parent = await this.chooseParent(window); if (!parent) return undefined; const base = slug(request); let projectPath = path.join(parent, base); let suffix = 2; while (await this.exists(projectPath)) { projectPath = path.join(parent, `${base}-${suffix}`); suffix += 1; } await fs.mkdir(projectPath, { recursive: true }); return { name: path.basename(projectPath), path: projectPath, created: true }; }
  async openFolder(window: BrowserWindow): Promise<WorkspaceInfo | undefined> { const folder = await this.chooseParent(window); return folder ? { name: path.basename(folder), path: folder, created: false } : undefined; }
  async openFile(window: BrowserWindow): Promise<{ path: string; content: string } | undefined> { const result = await dialog.showOpenDialog(window, { title: 'Abrir arquivo', properties: ['openFile'] }); if (result.canceled || !result.filePaths[0]) return undefined; const filePath = result.filePaths[0]; return { path: filePath, content: await fs.readFile(filePath, 'utf8') }; }
  private async exists(target: string): Promise<boolean> { try { await fs.access(target); return true; } catch { return false; } }
}
