import { contextBridge, ipcRenderer } from 'electron';

const invoke = (channel: string, ...args: unknown[]): Promise<unknown> => ipcRenderer.invoke(channel, ...args);
contextBridge.exposeInMainWorld('ngola', {
	getConfigStatus: () => invoke('app:get-config-status'),
	getProviderStatus: () => invoke('app:get-provider-status'),
	getQuota: () => invoke('quota:get'),
	getUsageToday: () => invoke('usage:get-today'),
	clearUsage: () => invoke('usage:clear'),
	generate: (request: unknown, options: unknown) => invoke('llm:generate', request, options),
	readFile: (filePath: string) => invoke('fs:read', filePath),
	writeFile: (filePath: string, content: string) => invoke('fs:write', filePath, content),
	createFile: (filePath: string, content?: string) => invoke('fs:create', filePath, content),
	makeDirectory: (directory: string) => invoke('fs:mkdir', directory),
	rename: (source: string, destination: string) => invoke('fs:rename', source, destination),
	copy: (source: string, destination: string) => invoke('fs:copy', source, destination),
	move: (source: string, destination: string) => invoke('fs:move', source, destination),
	delete: (filePath: string) => invoke('fs:delete', filePath),
	searchFiles: (directory: string, query: string) => invoke('fs:search', directory, query),
	startTerminal: (command: string, cwd: string) => invoke('terminal:start', command, cwd),
	writeTerminal: (sessionId: string, input: string) => invoke('terminal:write', sessionId, input),
	killTerminal: (sessionId: string) => invoke('terminal:kill', sessionId),
	onTerminalEvent: (listener: (event: unknown) => void) => { const callback = (_event: Electron.IpcRendererEvent, data: unknown) => listener(data); ipcRenderer.on('terminal:event', callback); return () => ipcRenderer.removeListener('terminal:event', callback); },
	searchRegistry: (registry: 'npm' | 'pypi', query: string) => invoke('registry:search', registry, query),
	getPackage: (registry: 'npm' | 'pypi', name: string) => invoke('registry:get', registry, name),
	getVersions: (registry: 'npm' | 'pypi', name: string) => invoke('registry:versions', registry, name)
	, startAgent: (request: string, workspace: string) => invoke('agent:start', request, workspace)
	, cancelAgent: (taskId: string) => invoke('agent:cancel', taskId)
	, getAgent: (taskId: string) => invoke('agent:get', taskId)
	, approveAgent: (approvalId: string, approved: boolean) => invoke('agent:approve', approvalId, approved)
	, listCheckpoints: () => invoke('checkpoint:list')
	, restoreCheckpoint: (id: string) => invoke('checkpoint:restore', id)
	, onAgentEvent: (listener: (event: unknown) => void) => { const callback = (_event: Electron.IpcRendererEvent, data: unknown) => listener(data); ipcRenderer.on('agent:event', callback); return () => ipcRenderer.removeListener('agent:event', callback); }
	, detectPreview: () => invoke('preview:detect')
	, openPreview: (url: string) => invoke('preview:open', url)
});
