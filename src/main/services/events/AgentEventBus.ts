export type AgentEventName = 'agent.started' | 'agent.planning' | 'agent.reading_file' | 'agent.creating_file' | 'agent.editing_file' | 'agent.running_command' | 'agent.command_finished' | 'agent.testing' | 'agent.error' | 'agent.fixing' | 'agent.completed' | 'agent.cancelled' | 'agent.quota_warning' | 'agent.quota_exceeded' | 'agent.approval_required' | 'agent.diff';
export interface AgentEvent { name: AgentEventName; timestamp: string; payload?: unknown; }

export class AgentEventBus {
  private listeners = new Set<(event: AgentEvent) => void>();
  emit(name: AgentEventName, payload?: unknown): void { const event = { name, timestamp: new Date().toISOString(), payload }; this.listeners.forEach((listener) => listener(event)); }
  subscribe(listener: (event: AgentEvent) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}
