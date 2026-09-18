interface ProviderHealth { provider: string; state: string; message: string; checkedAt: string | null; username?: string }
interface Window {
  ngola?: {
    getConfigStatus: () => Promise<{ gemini: boolean; groq: boolean; github: boolean; sandbox: boolean }>;
    createWorkspace: (request: string) => Promise<{ name: string; path: string; created: boolean } | undefined>;
    openFolder: () => Promise<{ name: string; path: string; created: boolean } | undefined>;
    openFile: () => Promise<{ path: string; content: string } | undefined>;
    saveAs: (filePath: string, content: string) => Promise<string | undefined>;
    openExternal: (url: string) => Promise<void>;
    getProviderStatus: () => Promise<ProviderHealth[]>;
    checkProvider: (provider: string) => Promise<ProviderHealth>;
    checkProviders: () => Promise<ProviderHealth[]>;
    getQuota: () => Promise<Array<{ category: string; provider: string; used: number; limit: number; ratio: number; level: string }>>;
    getUsageToday: () => Promise<unknown[]>;
    clearUsage: () => Promise<void>;
    readFile: (filePath: string) => Promise<string>;
    writeFile: (filePath: string, content: string) => Promise<void>;
    generate: (request: unknown, options: unknown) => Promise<unknown>;
    startTerminal: (command: string, cwd: string) => Promise<string>;
    writeTerminal: (sessionId: string, input: string) => Promise<void>;
    killTerminal: (sessionId: string) => Promise<void>;
    onTerminalEvent: (listener: (event: { sessionId: string; type: string; data: string; code?: number | null }) => void) => () => void;
    onAgentEvent: (listener: (event: unknown) => void) => () => void;
    onMenuCommand: (listener: (command: string) => void) => () => void;
    startAgent: (request: string, workspace: string) => Promise<unknown>;
    cancelAgent: (taskId: string) => Promise<void>;
    approveAgent: (approvalId: string, approved: boolean) => Promise<boolean>;
    detectPreview: () => Promise<Array<{ port: number; url: string; available: boolean }>>;
    openPreview: (url: string) => Promise<void>;
  };
}
