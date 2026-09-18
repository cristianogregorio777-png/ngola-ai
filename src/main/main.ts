import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLocalEnvironment } from './services/security/Environment.js';
import { GeminiProvider } from './services/ai/GeminiProvider.js';
import { GroqProvider } from './services/ai/GroqProvider.js';
import { LLMRouter } from './services/ai/LLMRouter.js';
import { LLMService } from './services/ai/LLMService.js';
import { QuotaManager } from './services/quota/QuotaManager.js';
import { UsageTracker } from './services/usage/UsageTracker.js';
import { FileSystemService } from './services/filesystem/FileSystemService.js';
import { TerminalManager } from './services/terminal/TerminalManager.js';
import { GitHubService } from './services/github/GitHubService.js';
import { PackageRegistryService } from './services/package-registry/PackageRegistryService.js';
import { AgentEventBus } from './services/events/AgentEventBus.js';
import { SecurityPolicy } from './services/security/SecurityPolicy.js';
import { SandboxManager } from './services/sandbox/SandboxManager.js';
import { CheckpointService } from './services/agent/CheckpointService.js';
import { ToolExecutor } from './services/agent/ToolExecutor.js';
import { AgentOrchestrator } from './services/agent/AgentOrchestrator.js';
import { PreviewManager } from './services/preview/PreviewManager.js';
import { DiagnosticLogger } from './services/security/DiagnosticLogger.js';
import { WorkspaceService } from './services/project/WorkspaceService.js';
import { ConnectionHealthService } from './services/security/ConnectionHealthService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadLocalEnvironment(path.join(__dirname, '../..'));
const quotas = new QuotaManager({ AI_REQUESTS: Number(process.env.MAX_AI_REQUESTS_PER_DAY ?? 100), AI_TOKENS: Number(process.env.MAX_AI_TOKENS_PER_DAY ?? 100000), SANDBOX_MINUTES: Number(process.env.MAX_SANDBOX_MINUTES_PER_DAY ?? 30), GITHUB_REQUESTS: Number(process.env.MAX_GITHUB_REQUESTS_PER_DAY ?? 100), AGENT_ITERATIONS: Number(process.env.MAX_AGENT_ITERATIONS_PER_TASK ?? 10) });
const usage = new UsageTracker();
const llm = new LLMService(new LLMRouter({ gemini: new GeminiProvider(process.env.GEMINI_API_KEY), groq: new GroqProvider(process.env.GROQ_API_KEY) }, quotas, usage));
const fileSystem = new FileSystemService();
const terminals = new TerminalManager();
const github = new GitHubService(process.env.GITHUB_TOKEN);
const registries = new PackageRegistryService();
const preview = new PreviewManager();
const logger = new DiagnosticLogger(path.join(process.cwd(), '.ngola', 'logs'));
const workspaces = new WorkspaceService();
const health = new ConnectionHealthService();
const events = new AgentEventBus();
const checkpoints = new CheckpointService();
const sandbox = new SandboxManager(quotas, { e2b: process.env.E2B_API_KEY, daytona: process.env.DAYTONA_API_KEY });
const approvals = new Map<string, (approved: boolean) => void>();
const security = new SecurityPolicy();
const toolExecutor = new ToolExecutor(fileSystem, terminals, security, quotas, registries, github, sandbox, { workspace: process.cwd(), approve: (request) => new Promise((resolve) => { const approvalId = `${Date.now()}-${Math.random()}`; approvals.set(approvalId, resolve); events.emit('agent.approval_required', { approvalId, request }); }), onDiff: (diff) => events.emit('agent.diff', diff) });
const orchestrator = new AgentOrchestrator(llm, events, toolExecutor, checkpoints, Number(process.env.MAX_AGENT_ITERATIONS_PER_TASK ?? 10));
let mainWindow: BrowserWindow | undefined;

function createWindow(): void {
  mainWindow = new BrowserWindow({ width: 1440, height: 900, minWidth: 900, minHeight: 620, backgroundColor: '#0b0d10', titleBarStyle: 'hidden', titleBarOverlay: { color: '#0f1115', symbolColor: '#c8f36a', height: 34 }, webPreferences: { preload: path.join(__dirname, '../preload/preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => { void logger.error(`preload-error:${preloadPath}`, error); });
  mainWindow.webContents.on('render-process-gone', (_event, details) => { void logger.error('render-process-gone', details); });
  mainWindow.webContents.on('did-fail-load', (_event, code, description) => { void logger.error('did-fail-load', { code, description }); });
  if (process.env.NODE_ENV === 'development') mainWindow.loadURL('http://127.0.0.1:5173');
  else mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
}

function sendMenu(id: string): void { mainWindow?.webContents.send('menu:command', id); }
function installMenu(): void { const template: Electron.MenuItemConstructorOptions[] = [
  { label: 'Arquivo', submenu: [
    { label: 'Novo arquivo de texto', accelerator: 'CmdOrCtrl+N', click: () => sendMenu('new-file') },
    { label: 'Novo arquivo...', accelerator: 'CmdOrCtrl+Alt+N', click: () => sendMenu('new-file-dialog') },
    { label: 'Nova janela', accelerator: 'CmdOrCtrl+Shift+N', click: () => createWindow() },
    { type: 'separator' },
    { label: 'Abrir arquivo...', accelerator: 'CmdOrCtrl+O', click: () => sendMenu('open-file') },
    { label: 'Abrir pasta...', accelerator: 'CmdOrCtrl+K', click: () => sendMenu('open-folder') },
    { label: 'Abrir recentes', click: () => sendMenu('recent') },
    { type: 'separator' },
    { label: 'Salvar', accelerator: 'CmdOrCtrl+S', click: () => sendMenu('save') },
    { label: 'Salvar como...', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendMenu('save-as') },
    { label: 'Salvar tudo', click: () => sendMenu('save-all') },
    { type: 'separator' },
    { label: 'Fechar pasta', click: () => sendMenu('close-folder') },
    { label: 'Sair', accelerator: 'Alt+F4', click: () => app.quit() }
  ] },
  { label: 'Editar', submenu: [{ role: 'undo', label: 'Desfazer' }, { role: 'redo', label: 'Refazer' }, { type: 'separator' }, { role: 'cut', label: 'Recortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Colar' }] },
  { label: 'Exibir', submenu: [{ label: 'Alternar terminal', click: () => sendMenu('toggle-terminal') }, { label: 'Alternar painel IA', click: () => sendMenu('toggle-ai') }, { role: 'reload', label: 'Recarregar' }] },
  { label: 'Janela', submenu: [{ role: 'minimize', label: 'Minimizar' }, { role: 'zoom', label: 'Zoom' }, { role: 'togglefullscreen', label: 'Tela cheia' }] },
  { label: 'Ajuda', submenu: [{ label: 'Como configurar Gemini', click: () => void shell.openExternal('https://aistudio.google.com/apikey') }, { label: 'Sobre o Ngola AI', click: () => sendMenu('about') }] }
]; Menu.setApplicationMenu(Menu.buildFromTemplate(template)); }

ipcMain.handle('app:get-config-status', () => ({ gemini: Boolean(process.env.GEMINI_API_KEY), groq: Boolean(process.env.GROQ_API_KEY), github: github.isConfigured(), sandbox: Boolean(process.env.E2B_API_KEY || process.env.DAYTONA_API_KEY) }));
ipcMain.handle('workspace:create', (_event, request: string) => workspaces.createFromRequest(mainWindow!, request));
ipcMain.handle('workspace:open-folder', () => workspaces.openFolder(mainWindow!));
ipcMain.handle('workspace:open-file', () => workspaces.openFile(mainWindow!));
ipcMain.handle('workspace:save-as', async (_event, filePath: string, content: string) => { const result = await dialog.showSaveDialog(mainWindow!, { defaultPath: filePath }); if (!result.canceled && result.filePath) await fileSystem.write(result.filePath, content); return result.filePath; });
ipcMain.handle('external:open', (_event, url: string) => shell.openExternal(url));
ipcMain.handle('app:get-provider-status', () => health.getCached());
ipcMain.handle('app:check-provider', (_event, provider: string) => health.checkProvider(provider));
ipcMain.handle('app:check-providers', () => health.checkAll());
ipcMain.handle('quota:get', () => quotas.all());
ipcMain.handle('usage:get-today', () => usage.today());
ipcMain.handle('usage:clear', () => usage.clear());
ipcMain.handle('llm:generate', (_event, request, options) => llm.generate(request, options));
ipcMain.handle('fs:read', (_event, filePath: string) => fileSystem.read(filePath));
ipcMain.handle('fs:write', (_event, filePath: string, content: string) => fileSystem.write(filePath, content));
ipcMain.handle('fs:create', (_event, filePath: string, content?: string) => fileSystem.create(filePath, content));
ipcMain.handle('fs:mkdir', (_event, directory: string) => fileSystem.mkdir(directory));
ipcMain.handle('fs:rename', (_event, source: string, destination: string) => fileSystem.rename(source, destination));
ipcMain.handle('fs:copy', (_event, source: string, destination: string) => fileSystem.copy(source, destination));
ipcMain.handle('fs:move', (_event, source: string, destination: string) => fileSystem.move(source, destination));
ipcMain.handle('fs:delete', (_event, filePath: string) => fileSystem.delete(filePath));
ipcMain.handle('fs:search', (_event, directory: string, query: string) => fileSystem.search(directory, query));
ipcMain.handle('terminal:start', (_event, command: string, cwd: string) => terminals.start(command, cwd, (event) => mainWindow?.webContents.send('terminal:event', event)));
ipcMain.handle('terminal:write', (_event, sessionId: string, input: string) => terminals.write(sessionId, input));
ipcMain.handle('terminal:kill', (_event, sessionId: string) => terminals.kill(sessionId));
ipcMain.handle('github:list-repositories', () => github.listRepositories());
ipcMain.handle('github:get-repository', (_event, owner: string, repo: string) => github.getRepository(owner, repo));
ipcMain.handle('github:search-repositories', (_event, query: string) => github.searchRepositories(query));
ipcMain.handle('github:search-code', (_event, query: string) => github.searchCode(query));
ipcMain.handle('registry:search', (_event, registry: 'npm' | 'pypi', query: string) => registries.searchPackage(registry, query));
ipcMain.handle('registry:get', (_event, registry: 'npm' | 'pypi', name: string) => registries.getPackage(registry, name));
ipcMain.handle('registry:versions', (_event, registry: 'npm' | 'pypi', name: string) => registries.getVersions(registry, name));
ipcMain.handle('agent:start', (_event, request: string, workspace: string) => { toolExecutor.setWorkspace(workspace); return orchestrator.run(request, workspace); });
ipcMain.handle('agent:cancel', (_event, taskId: string) => orchestrator.cancel(taskId));
ipcMain.handle('agent:get', (_event, taskId: string) => orchestrator.get(taskId));
ipcMain.handle('agent:approve', (_event, approvalId: string, approved: boolean) => { const resolve = approvals.get(approvalId); if (!resolve) return false; approvals.delete(approvalId); resolve(approved); return true; });
ipcMain.handle('checkpoint:list', () => checkpoints.list());
ipcMain.handle('checkpoint:restore', (_event, id: string) => checkpoints.restore(id));
ipcMain.handle('preview:detect', () => preview.detect());
ipcMain.handle('preview:open', (_event, url: string) => preview.open(url));
ipcMain.handle('diagnostic:log', (_event, message: string) => logger.info('renderer', { message }));
events.subscribe((event) => mainWindow?.webContents.send('agent:event', event));

app.whenReady().then(() => { installMenu(); createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
