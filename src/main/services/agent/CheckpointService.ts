import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export interface Checkpoint { id: string; workspace: string; backupPath: string; createdAt: string; }
export class CheckpointService { private readonly checkpoints = new Map<string, Checkpoint>(); async create(workspace: string): Promise<Checkpoint> { const id = randomUUID(); const backupPath = path.join(os.tmpdir(), 'ngola-ai-checkpoints', id); await fs.mkdir(backupPath, { recursive: true }); await fs.cp(workspace, backupPath, { recursive: true, filter: (source) => !source.includes(`${path.sep}node_modules${path.sep}`) && !source.includes(`${path.sep}.git${path.sep}`) }); const checkpoint = { id, workspace, backupPath, createdAt: new Date().toISOString() }; this.checkpoints.set(id, checkpoint); return checkpoint; } async restore(id: string): Promise<void> { const checkpoint = this.checkpoints.get(id); if (!checkpoint) throw new Error('Checkpoint não encontrado.'); await fs.cp(checkpoint.backupPath, checkpoint.workspace, { recursive: true, force: true }); } list(): Checkpoint[] { return [...this.checkpoints.values()]; } }
