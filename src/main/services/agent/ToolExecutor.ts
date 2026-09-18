import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import type { AgentToolRequest, AgentToolResult } from './AgentTool.js';
import { FileSystemService } from '../filesystem/FileSystemService.js';
import { TerminalManager } from '../terminal/TerminalManager.js';
import { SecurityPolicy } from '../security/SecurityPolicy.js';
import { QuotaManager } from '../quota/QuotaManager.js';
import { PackageRegistryService } from '../package-registry/PackageRegistryService.js';
import { GitHubService } from '../github/GitHubService.js';
import { SandboxManager } from '../sandbox/SandboxManager.js';

const exec = promisify(execFile);
export interface ToolExecutorOptions { workspace: string; approve?: (request: AgentToolRequest) => Promise<boolean>; onDiff?: (diff: { file: string; before: string; after: string }) => void; }
export class ToolExecutor {
  setWorkspace(workspace: string): void { this.options.workspace = workspace; }
  constructor(private readonly fileSystem: FileSystemService, private readonly terminals: TerminalManager, private readonly security: SecurityPolicy, private readonly quotas: QuotaManager, private readonly registries: PackageRegistryService, private readonly github: GitHubService, private readonly sandbox: SandboxManager, private readonly options: ToolExecutorOptions) {}
  async execute(request: AgentToolRequest): Promise<AgentToolResult> {
    const risk = this.security.risk(request.name); const approvalRequired = risk !== 'SAFE';
    if (approvalRequired && !(await this.options.approve?.(request))) return { name: request.name, ok: false, error: 'Ação aguardando aprovação do usuário.', risk, approvalRequired };
    try { const output = await this.run(request); return { name: request.name, ok: true, output, risk, approvalRequired }; } catch (error) { return { name: request.name, ok: false, error: error instanceof Error ? error.message : String(error), risk, approvalRequired }; }
  }
  private async run(request: AgentToolRequest): Promise<unknown> {
    const input = request.input;
    switch (request.name) {
      case 'read_file': return this.fileSystem.read(this.workspacePath(String(input.path), String(input.workspace ?? this.options.workspace)));
      case 'write_file': { const file = this.workspacePath(String(input.path), String(input.workspace ?? this.options.workspace)); const before = await this.fileSystem.read(file).catch(() => ''); const after = String(input.content ?? ''); await this.fileSystem.write(file, after); this.options.onDiff?.({ file, before, after }); return { file }; }
      case 'edit_file': { const file = this.workspacePath(String(input.path), String(input.workspace ?? this.options.workspace)); const before = await this.fileSystem.read(file); const after = before.replace(String(input.search), String(input.replace)); await this.fileSystem.write(file, after); this.options.onDiff?.({ file, before, after }); return { file }; }
      case 'create_file': { const file = this.workspacePath(String(input.path), String(input.workspace ?? this.options.workspace)); await this.fileSystem.create(file, String(input.content ?? '')); this.options.onDiff?.({ file, before: '', after: String(input.content ?? '') }); return { file }; }
      case 'delete_file': { const file = this.workspacePath(String(input.path), String(input.workspace ?? this.options.workspace)); await this.fileSystem.delete(file); return { file }; }
      case 'list_files': return this.fileSystem.search(this.workspacePath(String(input.directory ?? '.'), String(input.workspace ?? this.options.workspace)), String(input.query ?? ''));
      case 'search_files': return this.fileSystem.search(this.workspacePath(String(input.directory ?? '.'), String(input.workspace ?? this.options.workspace)), String(input.query ?? ''));
      case 'run_command': { const workspace = String(input.workspace ?? this.options.workspace); const cwd = this.workspacePath(String(input.cwd ?? '.'), workspace); const command = String(input.command); this.security.validateCommand(command, workspace, cwd); const result = await exec(process.platform === 'win32' ? 'cmd.exe' : 'sh', process.platform === 'win32' ? ['/d', '/s', '/c', command] : ['-lc', command], { cwd, maxBuffer: 1024 * 1024 }); return { stdout: result.stdout, stderr: result.stderr }; }
      case 'start_process': return this.terminals.start(String(input.command), this.workspacePath(String(input.cwd ?? '.'), String(input.workspace ?? this.options.workspace)), () => undefined);
      case 'stop_process': return this.terminals.kill(String(input.sessionId));
      case 'git_status': return this.git(['status', '--short'], String(input.workspace ?? this.options.workspace));
      case 'git_diff': return this.git(['diff'], String(input.workspace ?? this.options.workspace));
      case 'git_commit': return this.git(['add', '.'], String(input.workspace ?? this.options.workspace)).then(() => this.git(['commit', '-m', String(input.message ?? 'Ngola AI changes')], String(input.workspace ?? this.options.workspace)));
      case 'search_npm': return this.registries.searchPackage('npm', String(input.query));
      case 'search_pypi': return this.registries.searchPackage('pypi', String(input.query));
      case 'github_create_branch': return this.github.createBranch(String(input.owner), String(input.repo), String(input.branch), String(input.sha));
      case 'github_create_pull_request': return this.github.createPullRequest(String(input.owner), String(input.repo), String(input.title), String(input.head), String(input.base), String(input.body ?? ''));
      case 'run_sandbox': { const session = this.sandbox.start((input.provider as 'e2b' | 'daytona' | 'auto') ?? 'auto'); return { session, output: await this.sandbox.run(session.id, String(input.command)) }; }
      case 'get_sandbox_output': return this.sandbox.output(String(input.sessionId));
      case 'get_terminal_output': return 'A saída é transmitida pelos eventos terminal:event.';
      default: throw new Error(`Ferramenta não implementada: ${request.name}`);
    }
  }
  private workspacePath(relativePath: string, workspace: string): string { const candidate = path.resolve(workspace, relativePath); if (!this.security.isInsideWorkspace(workspace, candidate)) throw new Error('Acesso fora do workspace bloqueado.'); return candidate; }
  private async git(args: string[], workspace: string): Promise<string> { const result = await exec('git', args, { cwd: workspace, maxBuffer: 1024 * 1024 }); return `${result.stdout}${result.stderr}`; }
}
