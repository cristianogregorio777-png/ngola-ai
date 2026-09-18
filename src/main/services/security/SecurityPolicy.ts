import path from 'node:path';
import type { AgentToolName, ToolRisk } from '../agent/AgentTool.js';

const risks: Record<AgentToolName, ToolRisk> = { read_file: 'SAFE', list_files: 'SAFE', search_files: 'SAFE', get_terminal_output: 'SAFE', search_npm: 'SAFE', search_pypi: 'SAFE', write_file: 'REVIEW', edit_file: 'REVIEW', create_file: 'REVIEW', delete_file: 'REVIEW', run_command: 'DANGEROUS', start_process: 'DANGEROUS', stop_process: 'REVIEW', git_status: 'SAFE', git_diff: 'SAFE', git_commit: 'REVIEW', github_create_branch: 'REVIEW', github_create_pull_request: 'REVIEW', run_sandbox: 'REVIEW', get_sandbox_output: 'SAFE' };
const blockedCommands = /(^|\s)(format|del\s+\/|rm\s+-rf|shutdown|restart-computer|remove-item\s+-recurse|diskpart|reg\s+delete)(\s|$)/iu;
export class SecurityPolicy {
  risk(tool: AgentToolName): ToolRisk { return risks[tool]; }
  isInsideWorkspace(workspace: string, candidate: string): boolean { const root = path.resolve(workspace); const target = path.resolve(candidate); return target === root || target.startsWith(`${root}${path.sep}`); }
  validateCommand(command: string, workspace: string, cwd: string): void { if (!this.isInsideWorkspace(workspace, cwd)) throw new Error('Operação fora do workspace bloqueada.'); if (blockedCommands.test(command)) throw new Error('Comando potencialmente destrutivo bloqueado pela política de segurança.'); }
}
