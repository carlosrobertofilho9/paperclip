# MetaClip — Phase 1: Scientific Agent Workspace (MVP Prompt)

> **Status:** Draft  
> **Base:** Fork do Paperclip (`HenkDz/paperclip`, branch `feat/externalize-hermes-adapter`)  
> **Diretriz Geral:** Refactor profundo, mas **progressivo e validado**. Transformar o domínio core do Paperclip de "empresa de agentes" para "laboratório editorial científico", mas **sem quebrar funcionalidades existentes**. Usar compatibility aliases temporários quando necessário. Executar em duas subfases: 1A (domínio + UI) e 1B (workflow científico).

---

## 1. Visão do Produto

Transformar o Paperclip em um **laboratório editorial científico** onde o usuário cria um artigo/projeto de revisão sistemática e o sistema monta automaticamente uma equipe de agentes especializados para executar as etapas do manuscrito.

A UI do Paperclip é preservada com re-skin mínimo:
- **Companies** → **My Articles** (lista de artigos/revisões)
- **Company Dashboard** → **Article Dashboard**
- **Org Chart** → **Research Team**
- **Hire Employee** → **Add Agent**
- **Tickets / Issues** → **Tasks**

A metáfora de "empresa de agentes" vira "laboratório editorial". O domínio de backend/banco é refatorado, mas de forma **incremental e segura**.

---

## 2. Diretriz de Implementação Recomendada

Executar a Phase 1 em **duas subfases** para evitar refactor catastrófico e garantir que o projeto permaneça funcional em cada etapa.

### Phase 1A — Scientific Domain Refactor + UI Reskin
- Refatorar domínio principal: `Company` → `ResearchProject`, `Employee` → `Agent`, `Issue/Ticket` → `Task`.
- Atualizar DB (`packages/db/`), Shared (`packages/shared/`), Server (`server/`) e UI (`ui/`).
- **Manter compatibility aliases temporários** quando necessário para evitar quebra de funcionalidades existentes (ex: exports duplos, rotas alias, tipos alias).
- Re-skin visual mínimo: Companies → My Articles, Employees → Agents, Org Chart → Research Team.
- **Garantir que typecheck, testes e build passem** antes de iniciar a próxima subfase.

### Phase 1B — Scientific Workflow MVP
- Criar Research Director automaticamente ao criar ResearchProject.
- Permitir criação dinâmica de agentes científicos via API interna.
- Criar templates/configurações iniciais de agentes científicos.
- Implementar integrações PubMed/CrossRef básicas.
- Criar entidades `studies`, `prisma_flow`, `manuscripts`, `study_extractions`, `references`.
- Criar Manuscript Editor estruturado em IMRaD.
- Implementar approval gates científicos.

---

## 3. Mapeamento de Domínio (Refatoração Progressiva)

| Paperclip (Antigo) | MetaClip (Novo) | Escopo | Notas |
|--------------------|-----------------|--------|-------|
| `Company` | `ResearchProject` | Banco, API, UI, Shared | Refatorar progressivamente. Manter aliases internos temporários se necessário. |
| `Employee` | `Agent` | Banco, API, UI, Shared | Mesmo que acima. |
| `Mission` | `ScientificObjective` | Banco, API, UI, Shared | Reaproveitar tabela `goals` com `level=company`. |
| `Goal` (team/agent) | `ResearchMilestone` | Banco, API, UI, Shared | Reaproveitar tabela `goals` com `level=team/agent`. |
| `Issue / Ticket` | `Task` | Banco, API, UI, Shared | Renomear tabela `issues` → `tasks`. |
| `Company Settings` | `ProjectSettings` | Banco, API, UI, Shared | |
| `Employee Role` | `AgentRole` | Banco, API, UI, Shared | |
| `Hire Employee` | `Add Agent` | UI labels, rotas | |
| `Org Chart` | `Research Team` | UI labels, componentes | |
| `My Companies` | `My Articles` | UI labels | |

### Convenções de Nomenclatura
- **Tabelas DB:** `snake_case` (`research_projects`, `agents`, `scientific_objectives`, `research_milestones`, `tasks`)
- **Tipos TypeScript:** `PascalCase` (`ResearchProject`, `Agent`, `ScientificObjective`, `ResearchMilestone`, `Task`)
- **Rotas API:** `kebab-case` (`/api/research-projects`, `/api/agents`, `/api/tasks`)
- **Funções/Variáveis:** `camelCase` (`createResearchProject`, `addAgent`, `assignTask`)

### Compatibility Aliases (Temporários)
Durante a transição, quando a troca global gerar risco alto:
- Manter aliases de tipos: `export type Company = ResearchProject` (com `@deprecated`)
- Manter rotas alias: `POST /api/companies/:companyId/agents` → redireciona para `POST /api/research-projects/:researchProjectId/agents`
- Manter exports duplos no `packages/shared/` até que todas as dependências sejam atualizadas
- **Remover aliases apenas quando toda a base estiver migrada e validada**

---

## 4. Agentes Científicos Dinâmicos

Os agentes científicos são **agents (employees) criados dinamicamente pelo Research Director** usando a API interna do Paperclip. Eles usam adapters de LLM **já registrados no sistema** (ex: `claude_local`, `codex_local`, `openai`, etc.) e são configurados com system prompts, capabilities e tools específicas para cada função.

### Arquitetura

| Conceito | O que é | Exemplo |
|----------|---------|---------|
| **Adapter** | Motor de execução de LLM | `claude_local`, `codex_local`, `openai` |
| **Agent** | Instância configurada usando um adapter | "Search Agent" usando `claude_local` com prompt de busca PICO |

### Como o Research Director monta a equipe

```
Usuário cria ResearchProject (define tema/pergunta)
  ↓
Research Director Agent é criado automaticamente
  (adapterType: claude_local, role: research_director, canCreateAgents: true)
  ↓
Research Director chama API interna para criar os demais agents:
  - Cria "Search Agent" (claude_local + systemPrompt de busca)
  - Cria "Screening Agent" (claude_local + systemPrompt de screening)
  - Cria "PRISMA Agent" (claude_local + systemPrompt PRISMA)
  - Cria "Data Extraction Agent" (claude_local + systemPrompt extração)
  - Cria "Methodology Agent" (claude_local + systemPrompt metodologia)
  - Cria "Manuscript Writer" (claude_local + systemPrompt escrita)
  - Cria "Peer Reviewer" (claude_local + systemPrompt revisão)
```

### Configuração de cada Agent

Cada agente científico é criado com:
- `name`: nome do agente (ex: "Search Agent")
- `role`: função (ex: `search_agent`)
- `adapterType`: um adapter de LLM existente (ex: `claude_local`)
- `adapterConfig`: `{ systemPrompt: "...", model: "...", temperature: 0.2 }`
- `capabilities`: string com capabilities (ex: `"pubmed_search,strategy_generation"`)
- `runtimeConfig`: heartbeat, budget, permissões
- `permissions`: `{ canCreateAgents: false, tasks: { assign: true } }`

### ⚠️ Configuração Crítica: `requireBoardApprovalForNewAgents`
A tabela `research_projects` (ex-`companies`) tem o campo `requireBoardApprovalForNewAgents`. Se `true`, todo agente criado pelo Director fica em `status: "pending_approval"` e **nunca executa** até o humano aprovar.

**Recomendação:** Definir `requireBoardApprovalForNewAgents: false` por padrão nos `research_projects`, ou dar ao Research Director permissão explícita de bypass (`permissions.canApproveHires: true`). Caso contrário, o fluxo automático de criação de equipe quebra na primeira etapa.

### Lista de Agentes Científicos (Kit Padrão)

1. **Research Director**
   - `role`: `research_director`
   - *Papel:* Orquestra o projeto. Criado automaticamente. Tem `canCreateAgents: true` para poder criar os demais.
   - *Capabilities:* `team_assembly`, `objective_planning`, `milestone_creation`, `task_delegation`, `plan_adaptation`

2. **Search Agent**
   - `role`: `search_agent`
   - *Capabilities:* `pubmed_search`, `strategy_generation`, `pico_formulation`, `study_import`

3. **Screening Agent**
   - `role`: `screening_agent`
   - *Capabilities:* `inclusion_criteria`, `abstract_screening`, `study_classification`

4. **PRISMA Agent**
   - `role`: `prisma_agent`
   - *Capabilities:* `prisma_flow`, `study_counting`, `diagram_generation`

5. **Data Extraction Agent**
   - `role`: `extraction_agent`
   - *Capabilities:* `data_extraction`, `extraction_protocol`, `study_synthesis`

6. **Methodology Agent**
   - `role`: `methodology_agent`
   - *Capabilities:* `protocol_write`, `methods_section`, `search_description`

7. **Manuscript Writer**
   - `role`: `manuscript_writer`
   - *Capabilities:* `section_write`, `introduction_write`, `results_write`, `discussion_write`, `reference_integration`

8. **Peer Reviewer**
   - `role`: `peer_reviewer`
   - *Capabilities:* `manuscript_review`, `critical_analysis`, `comment_generation`, `rework_task_creation`

### Criação Dinâmica Ilimitada (Suporte Nativo do Paperclip)
O Research Director **não está limitado aos 8 agents pré-definidos**. Ele pode criar **qualquer agente dinamicamente** conforme a necessidade do projeto:
- Novos roles especializados (ex: "Statistical Analyst", "Ethics Reviewer", "Data Visualizer")
- Sub-equipes para subtarefas complexas
- Agents temporários para tarefas pontuais

### Fluxo Personalizado (Workflow Dinâmico)
O Director pode criar **milestones e tasks fora do plano padrão**:
- Adicionar etapas não previstas (ex: "Subgroup Analysis", "Sensitivity Analysis")
- Reorganizar ordem de execução baseado em resultados intermediários
- Criar branches paralelos de trabalho quando apropriado
- Adaptar o workflow ao tipo específico de revisão (narrative review, scoping review, meta-analysis, etc.)

---

## 5. Fluxo de Trabalho Automático (Workflow Engine)

```
Usuário cria ResearchProject (define tema/pergunta PICO)
  ↓
Research Director Agent é criado automaticamente
  ↓
Research Director cria os demais agents da equipe via API
  ↓
Research Director cria ScientificObjective: "Revisão Sistemática: [Tema]"
  ↓
Research Director cria ResearchMilestones:
  - Milestone 1: Definir Pergunta e Protocolo
  - Milestone 2: Busca e Screening
  - Milestone 3: Extração de Dados
  - Milestone 4: Síntese e Manuscrito
  - Milestone 5: Revisão por Pares
  ↓
Para cada Milestone, o Research Director cria Tasks:
  - Task → Search Agent (Milestone 2)
  - Task → Screening Agent (Milestone 2)
  - Task → PRISMA Agent (Milestone 2)
  - Task → Data Extraction Agent (Milestone 3)
  - Task → Methodology Agent (Milestone 4)
  - Task → Manuscript Writer (Milestone 4)
  - Task → Peer Reviewer (Milestone 5)
```

**Comportamento de Delegação:** O Research Director usa a API interna do Paperclip para criar tasks e atribuí-las aos agents. Se um agente for pausado/removido, o Director detecta e adapta (redistribui ou cria novo agente).

---

## 6. Novas Entidades do Domínio Científico

Criar no `packages/db/src/schema/` (e exportar em `index.ts`). Manter todas **project-scoped** (ligadas a `research_project_id`).

### 6.1 `research_projects`
- `id`, `name`, `description`, `research_question`, `pico_p`, `pico_i`, `pico_c`, `pico_o`, `status` (draft, active, completed, archived), `created_at`, `updated_at`.
- **Nota:** Substitui `companies`.

### 6.2 `agents`
- `id`, `research_project_id`, `name`, `role`, `title`, `icon`, `status`, `reports_to`, `adapter_type`, `adapter_config` (JSONB), `runtime_config` (JSONB), `capabilities`, `budget_monthly_cents`, `spent_monthly_cents`, `permissions` (JSONB), `last_heartbeat_at`, `metadata` (JSONB), `created_at`, `updated_at`.
- **Nota:** Substitui `employees`. Mesma estrutura, nomes novos.

### 6.3 `scientific_objectives`
- `id`, `research_project_id`, `title`, `description`, `status` (active, completed, cancelled), `priority`, `parent_id`, `owner_agent_id`, `created_at`, `updated_at`.
- **Nota:** Substitui `goals` com `level=company`.

### 6.4 `research_milestones`
- `id`, `scientific_objective_id`, `research_project_id`, `title`, `description`, `status` (pending, active, completed, blocked), `due_date`, `owner_agent_id`, `created_at`, `updated_at`.
- **Nota:** Substitui `goals` com `level=team/agent`.

### 6.5 `tasks`
- `id`, `research_project_id`, `scientific_objective_id`, `research_milestone_id`, `parent_id`, `title`, `description`, `status`, `priority`, `assignee_agent_id`, `assignee_user_id`, `checkout_run_id`, `execution_run_id`, `execution_locked_at`, `created_by_agent_id`, `created_by_user_id`, `identifier`, `request_depth`, `execution_policy`, `execution_state`, `execution_workspace_id`, `created_at`, `updated_at`.
- **Nota:** Substitui `issues`.

### 6.6 `studies`
- `id`, `research_project_id`, `pmid`, `doi`, `title`, `authors`, `abstract`, `journal`, `year`, `source` (pubmed, crossref, manual), `search_strategy_id`, `inclusion_status` (pending, included, excluded), `exclusion_reason`, `created_at`.

### 6.7 `prisma_flow`
- `id`, `research_project_id`, `stage` (identification, screening, eligibility, included), `count`, `description`, `updated_at`.

### 6.8 `manuscripts` (via Documents do Paperclip)
**Recomendação arquitetural:** Reaproveitar o sistema de documents existente do Paperclip (`documents`, `document_revisions`, `issue_documents`) em vez de criar uma tabela nova.

- Criar um documento com `key: "manuscript"` ligado ao `research_project_id`.
- O Manuscript Writer edita o documento via API de documents já existente (`PUT /issues/:issueId/documents/:key`).
- `document_revisions` fornece versionamento automático do rascunho.
- Se necessário, criar tabela auxiliar `manuscript_metadata` para campos específicos (status, references_json, etc.).
- **Benefícios:** Versionamento, histórico, audit trail e colaboração já prontos.

### 6.9 Uso de `projects` para Sub-fases do Artigo
**Recomendação arquitetural:** Reaproveitar a tabela `projects` existente do Paperclip para representar sub-fases do artigo, em vez de sobrecarregar `research_projects`.

- Projeto "Fase 1: Busca e Screening" → `lead_agent_id: search_agent_id`
- Projeto "Fase 2: Extração e Síntese" → `lead_agent_id: extraction_agent_id`
- Cada fase tem seu próprio `goal_id`, `env`, `status` e execution workspace.
- Tasks (`issues`) são ligadas ao `project_id` correspondente.
- **Benefícios:** Hierarquia natural, workspaces isolados por fase, lead agent por fase, já suportado nativamente.

### 6.10 `references`
- `id`, `research_project_id`, `study_id`, `doi`, `pmid`, `url`, `citation_text`, `verified` (boolean), `created_at`.
- **Regra:** Nenhuma referência entra no artigo sem `doi`, `pmid` ou `url` validável.

### 6.11 `study_extractions`
- `id`, `research_project_id`, `study_id`, `extraction_data` (JSONB), `extracted_by_agent_id`, `created_at`.

### 6.12 `activity_logs`
- **Nota:** Adaptar tabela existente. `entity_type` suporta novos nomes.

---

## 7. Editor de Manuscrito Estruturado

**Baseado no sistema de Documents do Paperclip.** O editor manipula um documento `manuscript` ligado ao projeto, com versionamento automático via `document_revisions`.

Nova página na UI: `/research-projects/:id/manuscript`.

### Layout (mesmo padrão visual do Paperclip)
```
+-------------------------------------------------------------+
|  Sidebar Agents  |  Editor Central  |  Painel Ref/Logs      |
|  (lista de agents|  (Form IMRaD)    |  (refs validadas,     |
|   ativos,        |                  |   logs de revisão,    |
|   status)        |  - Introduction  |   comentários do      |
|                  |  - Methods       |   Peer Reviewer)      |
|                  |  - Results       |                       |
|                  |  - Discussion    |                       |
|                  |  - Conclusion    |                       |
|                  |  - References    |                       |
+-------------------------------------------------------------+
```

### Funcionalidades
- Seções IMRaD como **textarea Markdown**.
- Manuscript Writer preenche via tool calls.
- Painel de Referências: lista `references` com `verified`.
- Painel de Revisão: comentários do Peer Reviewer.

---

## 8. Integrações Científicas

### 8.1 PubMed (E-utilities)
- **Endpoint:** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
- **Funções:** `esearch.fcgi` (busca → PMIDs), `efetch.fcgi` (metadados)
- **Rate limit:** 3 req/s sem API key; 10 com API key.
- **Localização:** `packages/integrations/src/pubmed/`.

### 8.2 CrossRef
- **Endpoint:** `https://api.crossref.org/works/`
- **Localização:** `packages/integrations/src/crossref/`.

### 8.3 Upload Manual de PDFs
- **Localização:** `server/src/routes/uploads.ts`.
- **Nota:** Extração complexa fica fora da Phase 1.

---

## 9. Governança Científica — Human Review Obrigatório (Hard Gates)

Na Fase 1, o sistema **trava automaticamente** o workflow em 4 pontos críticos até aprovação humana obrigatória. Nenhuma task subsequente pode avançar sem o board aprovar.

### 4 Hard Gates Obrigatórios

1. **PICO Question Approval**
   - **Quando:** Após o Research Director propor a pergunta de pesquisa PICO.
   - **Bloqueia:** Criação de milestones/tasks subsequentes até aprovação.
   - **UI:** Botão "Approve PICO" no dashboard do projeto.

2. **Search Strategy Approval**
   - **Quando:** Após o Search Agent propor a string de busca PICO e bancos de dados.
   - **Bloqueia:** Execução da busca no PubMed e importação de studies.
   - **UI:** Painel de revisão da estratégia com opção de editar antes de aprovar.

3. **Inclusion/Exclusion Criteria Approval**
   - **Quando:** Após o Screening Agent propor critérios de inclusão/exclusão.
   - **Bloqueia:** Screening de studies e atualização de `inclusion_status`.
   - **UI:** Tabela de critérios editável com approve/reject.

4. **Manuscript Final Approval**
   - **Quando:** Após o Manuscript Writer gerar o rascunho completo do artigo.
   - **Bloqueia:** Marcação do manuscrito como "approved" e geração de versão final.
   - **UI:** Editor de manuscrito com botão "Approve Final Version".

### Comportamento do Sistema
- O Research Director cria as tasks normalmente, mas as tasks dependentes de um hard gate recebem `status: blocked` e `approval_status: pending`.
- O board (humano) recebe notificação visual no dashboard quando há gates pendentes.
- Após aprovação, as tasks blocked são automaticamente desbloqueadas (`status: todo`) e o workflow continua.
- Se rejeitado, o Research Director recebe uma task de rework para corrigir o artefato.
- Toda decisão de approve/reject é logada em `activity_log` para auditoria.

---

## 10. Estrutura de Refatoração por Camada (Phase 1A)

### 10.1 Database (`packages/db/`)
- [ ] Renomear schema `companies.ts` → `research_projects.ts`.
- [ ] Renomear schema `employees.ts` → `agents.ts`.
- [ ] Renomear schema `goals.ts` → `scientific_objectives.ts` (level=company) + `research_milestones.ts` (level=team/agent).
- [ ] Renomear schema `issues.ts` → `tasks.ts`.
- [ ] Criar schemas: `studies.ts`, `prisma_flow.ts`, `manuscripts.ts`, `study_extractions.ts`, `references.ts`.
- [ ] Atualizar `index.ts` de exports.
- [ ] Gerar migrações (`pnpm db:generate`).

### 10.2 Shared (`packages/shared/`)
- [ ] Renomear tipos: `Company` → `ResearchProject`, `Employee` → `Agent`, `Goal` → `ScientificObjective`/`ResearchMilestone`, `Issue` → `Task`.
- [ ] Renomear validadores (Zod).
- [ ] Renomear constantes de API paths (`/api/companies` → `/api/research-projects`).
- [ ] Adicionar aliases temporários (`export type Company = ResearchProject`) com `@deprecated` se necessário para compatibilidade.

### 10.3 Server (`server/`)
- [ ] Criar novas rotas: `/api/research-projects` (companies renomeado).
- [ ] Criar novas rotas: `/api/tasks` (issues renomeado).
- [ ] Manter rotas antigas como **alias temporários** (ex: `/api/companies/*` → `/api/research-projects/*`) durante a transição.
- [ ] Renomear serviços internos.
- [ ] Atualizar middlewares de company-scoping para project-scoping.
- [ ] Criar novas rotas: `studies.routes.ts`, `manuscripts.routes.ts`, `search.routes.ts`.
- [ ] Criar serviços: `pubmed.service.ts`, `crossref.service.ts`.

### 10.4 UI (`ui/`)
- [ ] Re-skin de labels: `Companies` → `Articles`, `Employees` → `Agents`, etc.
- [ ] Renomear hooks: `useCompanies` → `useResearchProjects`.
- [ ] Atualizar rotas do React Router.
- [ ] Criar páginas: `ManuscriptEditorPage`, `StudiesPage`.
- [ ] Criar componentes: `IMRaDEditor`, `ReferencePanel`.

---

## 11. Critérios de Aceitação do MVP

### Phase 1A — Domain Refactor + UI Reskin
- [ ] Domínio refatorado: `ResearchProject`, `Agent`, `ScientificObjective`, `ResearchMilestone`, `Task` em todo o stack (DB, Shared, Server, UI).
- [ ] Migrações geradas e aplicadas com sucesso.
- [ ] Compatibility aliases funcionam (rotas antigas redirecionam, tipos antigos ainda compilam com `@deprecated`).
- [ ] UI com re-skin mínimo: labels trocadas, navegação preservada.
- [ ] Typecheck passa (`pnpm -r typecheck`).
- [ ] Testes passam (`pnpm test:run`).
- [ ] Build passa (`pnpm build`).

### Phase 1B — Scientific Workflow MVP
- [ ] Usuário pode criar um `ResearchProject`.
- [ ] Research Director Agent é criado automaticamente ao criar projeto.
- [ ] Research Director cria dinamicamente os demais agents da equipe via API interna.
- [ ] Cada agente científico usa adapter de LLM existente (claude_local, etc.) com system prompt e capabilities específicas.
- [ ] Research Director cria objectives/milestones/tasks automaticamente.
- [ ] Search Agent busca PubMed e salva em `studies`.
- [ ] Screening Agent atualiza `inclusion_status`.
- [ ] PRISMA Agent atualiza `prisma_flow`.
- [ ] Manuscript Writer preenche seções do `manuscript`.
- [ ] Peer Reviewer gera comentários críticos.
- [ ] Editor de Manuscrito Estruturado funciona (IMRaD + referências).
- [ ] Human Review Hard Gates funcionam: PICO Question, Search Strategy, Inclusion/Exclusion Criteria, Manuscript Final Approval.
- [ ] Tasks dependentes de gates pendentes ficam `blocked` automaticamente.
- [ ] Aprovação humana desbloqueia tasks subsequentes automaticamente.
- [ ] Rejeição cria task de rework para o Research Director.
- [ ] Nenhuma referência sem DOI/PMID/URL pode ser `verified`.
- [ ] Typecheck passa (`pnpm -r typecheck`).
- [ ] Testes passam (`pnpm test:run`).
- [ ] Build passa (`pnpm build`).

---

## 12. Fora do Escopo da Phase 1

- Meta-análise estatística ou Forest Plots.
- Extração automática complexa de PDF.
- Escrita final 100% pronta para submissão.
- Submissão automática para revistas.
- Criação de novos adapters/types (só agents usando adapters existentes).
- Editor rich-text colaborativo real-time.
- Integrações além de PubMed/CrossRef.
- Remoção completa de aliases de compatibilidade (isso vem em Phase 2).

---

## 13. Notas Técnicas do Fork

- **Porta:** `3101+` (auto-detecta se 3100 ocupada).
- **Build UI NTFS:** Usar `node node_modules/vite/bin/vite.js build` se `npx vite build` travar.
- **Startup:** 30-60s em NTFS.
- **Kill processes:** `pkill -f "paperclip"; pkill -f "tsx.*index.ts"`.
- **Cache Vite:** `rm -rf ui/dist ui/node_modules/.vite`.
- **DB Dev:** `DATABASE_URL` unset → PGlite. Reset: `rm -rf data/pglite`.

---

## 14. Próximos Passos

1. Ler docs do projeto (`doc/GOAL.md`, `doc/PRODUCT.md`, etc.).
2. Explorar `packages/db/src/schema/` para mapear tabelas.
3. Explorar `packages/shared/src/` para tipos e constantes.
4. Explorar `server/src/routes/` e `server/src/services/`.
5. Explorar `server/src/services/agents.ts` para entender criação dinâmica de agents.
6. Explorar `ui/src/pages/` para mapear renomeações.
7. Criar plano técnico em `doc/plans/YYYY-MM-DD-metaclip-phase1.md`.
8. Iniciar pela **Phase 1A** (banco → shared → server → UI), validar, depois **Phase 1B**.
