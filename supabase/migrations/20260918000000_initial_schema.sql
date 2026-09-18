create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text not null,
  settings jsonb not null default '{}'::jsonb,
  agent_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  request text not null,
  status text not null check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  plan jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  iterations integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  provider text not null,
  model text,
  category text not null,
  request_count integer not null default 0,
  tokens integer,
  sandbox_minutes numeric,
  task text,
  recorded_at timestamptz not null default now()
);

create table if not exists public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.project_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  path text not null,
  last_opened_at timestamptz not null default now(),
  last_agent_task_id uuid references public.agent_tasks(id) on delete set null
);

create index if not exists usage_records_recorded_at_idx on public.usage_records(recorded_at);
create index if not exists usage_records_provider_idx on public.usage_records(provider);
create index if not exists agent_tasks_workspace_id_idx on public.agent_tasks(workspace_id);
create index if not exists checkpoints_workspace_id_idx on public.checkpoints(workspace_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.usage_records enable row level security;
alter table public.checkpoints enable row level security;
alter table public.project_history enable row level security;

comment on table public.workspaces is 'Workspaces persistentes do Ngola AI.';
comment on table public.usage_records is 'Histórico de uso; limites diários são aplicados localmente pelo Ngola.';
comment on table public.checkpoints is 'Metadados de checkpoints; os arquivos locais permanecem no computador do usuário.';
