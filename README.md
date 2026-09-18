# Ngola AI

> Transforme uma ideia em software.

Fundação de uma IDE desktop Windows com Electron, React, TypeScript, Vite, Tailwind CSS, Monaco Editor e electron-builder.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Verificações e distribuição

```bash
npm run build
npm run lint
npm run dist
```

O instalador Windows é gerado como `release/Ngola-AI-Setup.exe`.

## Segurança local

O renderer não recebe segredos. O processo principal é responsável por operações sensíveis e a comunicação passa por IPC exposto no preload com `contextIsolation: true` e `nodeIntegration: false`. Copie `.env.example` para `.env.local` e preencha as chaves localmente. O Ngola não solicita nem armazena senha de conta Google.

## Fundação atual

A primeira fatia inclui tela inicial, abertura de workspace, explorer, editor visual, terminal preparado, Chat, Chat Programador, status de integrações, `AgentEventBus`, `QuotaManager` e `UsageTracker`. As integrações Gemini, Groq, GitHub, E2B, Daytona, npm e PyPI estão preparadas por contratos e variáveis, sem agente autônomo completo nesta etapa.

Os limites internos iniciais são configuráveis por variáveis `MAX_*`; eles não representam limites oficiais dos provedores.

## Supabase opcional

O funcionamento local não depende do Supabase. A migration inicial em `supabase/migrations/` cria tabelas para workspaces, tarefas do agente, uso, checkpoints e histórico de projetos. Para aplicar usando o Supabase CLI:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

Não coloque `SUPABASE_SECRET_KEY` no renderer ou no repositório. A migration ativa RLS, mas as policies de autenticação devem ser definidas quando a autenticação Supabase for integrada.
