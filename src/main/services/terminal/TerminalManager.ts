import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export interface TerminalEvent { sessionId: string; type: 'stdout' | 'stderr' | 'exit'; data: string; code?: number | null; }
export class TerminalManager {
  private readonly sessions = new Map<string, ChildProcessWithoutNullStreams>();
  start(command: string, cwd: string, onEvent: (event: TerminalEvent) => void): string { const sessionId = randomUUID(); const shell = process.platform === 'win32' ? 'cmd.exe' : 'sh'; const child = spawn(shell, process.platform === 'win32' ? ['/d', '/s', '/c', command] : ['-lc', command], { cwd, stdio: 'pipe', windowsHide: true }); this.sessions.set(sessionId, child); child.stdout.on('data', (data: Buffer) => onEvent({ sessionId, type: 'stdout', data: data.toString() })); child.stderr.on('data', (data: Buffer) => onEvent({ sessionId, type: 'stderr', data: data.toString() })); child.on('exit', (code) => { this.sessions.delete(sessionId); onEvent({ sessionId, type: 'exit', data: '', code }); }); return sessionId; }
  write(sessionId: string, input: string): void { this.sessions.get(sessionId)?.stdin.write(input); }
  kill(sessionId: string): void { this.sessions.get(sessionId)?.kill(); }
}
