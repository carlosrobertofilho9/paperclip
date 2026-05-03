# MetaClip — Phase 1: Scientific Agent Workspace (MVP Prompt)

> **Status:** Draft  
> **Base:** Fork do Paperclip (`HenkDz/paperclip`, branch `feat/externalize-hermes-adapter`)  
> **Diretriz Geral:** REFACTORING PROFUNDO. Transformar o domínio core do Paperclip de "empresa de agentes" para "laboratório editorial científico". Renomear tabelas, tipos, rotas, serviços e UI completamente.

---

## 1. Visão do Produto

Transformar o Paperclip em um **laboratório editorial científico** onde o usuário cria um projeto de revisão sistemática e "contrata" agentes especializados para executar etapas do manuscrito.

A metáfora de "empresa de agentes" vira "laboratório editorial". Todo o domínio é refatorado para refletir esse novo contexto.

---

## 2. Refactoring Profundo do Domínio (Regras de Ouro)

1. **Renomear tabelas/core internos.** O banco de dados, backend, frontend e pacotes compartilhados devem usar o novo domínio científico.
2. **Manter a orquestração existente.** O sistema de heartbeats, delegação de tarefas, approval gates e logs de auditoria do Paperclip é preservado, mas renomeado.
3. **Modificar > Adicionar.** Quando possível, renomear arquivos e funções existentes ao invés de criar novos paralelos.
4. **O motor de workflow é o Paperclip refatorado.** O Research Director é um agente registrado que cria `scientific_objectives`, `research_milestones` e `tasks` usando o próprio sistema do MetaClip.

---

## 3. Mapeamento de Domínio (Refatoração Completa)

| Paperclip (Antigo) | MetaClip (Novo) | Escopo |
|--------------------|-----------------|--------|
| `Company` | `ResearchProject` | Banco, API, UI, Shared |
| `Employee` | `Agent` | Banco, API, UI, Shared |
| `Mission` | `ScientificObjective` | Banco, API, UI, Shared |
| `Goal` | `ResearchMilestone` | Banco, API, UI, Shared |
| `Ticket` | `Task` | Banco, API, UI, Shared |
| `Company Settings` | `ProjectSettings` | Banco, API, UI, Shared |
| `Employee Role` | `AgentRole` | Banco, API, UI, Shared |
| `Hire Employee` | `Hire Agent` | UI labels, rotas |
| `Org Chart` | `Research Team` | UI labels, componentes |
| `Adapter` | `Adapter` (mantido) | Sistema de plugins existente |

### Convenções de Nomenclatura
- **Tabelas DB:** `snake_case` (`research_projects`, `agents`, `scientific_objectives`, `research_milestones`, `tasks`)
- **Tipos TypeScript:** `PascalCase` (`ResearchProject`, `Agent`, `ScientificObjective`, `ResearchMilestone`, `Task`)
- **Rotas API:** `kebab-case` (`/api/research-projects`, `/api/agents`, `/api/tasks`)
- **Funções/Variáveis:** `camelCase` (`createResearchProject`, `hireAgent`, `assignTask`)

---

## 4. Adapters Científicos como Plugins (Opção A)

Os 8 agentes científicos são implementados como **adapters reais** usando o sistema de plugin existente do Paperclip (`packages/adapters/`). Eles não são templates abstratos — são adapters concretos que se registram no sistema, definem capabilities, tools, system prompts e UI parsers.

### Como funciona
- Cada agente científico é um **adapter especializado** que estende a interface base de adapters do Paperclip.
- Usa o mesmo mecanismo de registro: podem ser built-in (código) ou carregados via `~/.paperclip/adapter-plugins.json` (externo).
- Definem `capabilities` específicas (ex: `pubmed_search`, `screening`, `prisma_count`, `manuscript_write`).
- O Research Director "contrata" (ativa/registra) esses adapters no projeto automaticamente.

### Lista de Adapters Científicos

1. **Research Director Adapter**
   - `name`: `research-director`
   - *Papel:* Orquestra o projeto. É o **primeiro e único adapter ativado automaticamente** quando o usuário cria um Research Project.
   - *Capabilities:* `team_assembly`, `objective_planning`, `milestone_creation`, `task_delegation`, `plan_adaptation`, `adapter_creation`
   - *Ações:* Analisa o tipo de projeto, **cria e ativa os demais adapters científicos dinamicamente** usando a infraestrutura do Paperclip, cria objectives/milestones/tasks, adapta o plano se adapters forem desativados. Pode criar novos adapters sob demanda quando identificar necessidades não cobertas pelos adapters base.

2. **Search Agent Adapter**
   - `name`: `search-agent`
   - *Capabilities:* `pubmed_search`, `strategy_generation`, `pico_formulation`, `study_import`
   - *Ações:* Gera string de busca PICO, chama PubMed API, salva resultados em `studies`.

3. **Screening Agent Adapter**
   - `name`: `screening-agent`
   - *Capabilities:* `inclusion_criteria`, `abstract_screening`, `study_classification`
   - *Ações:* Analisa títulos/abstracts, propõe critérios de inclusão/exclusão, atualiza `inclusion_status`.

4. **PRISMA Agent Adapter**
   - `name`: `prisma-agent`
   - *Capabilities:* `prisma_flow`, `study_counting`, `diagram_generation`
   - *Ações:* Atualiza a tabela `prisma_flow`, contagem por stage (identification, screening, eligibility, included).

5. **Data Extraction Agent Adapter**
   - `name`: `extraction-agent`
   - *Capabilities:* `data_extraction`, `extraction_protocol`, `study_synthesis`
   - *Ações:* Preenche `study_extractions` baseado em protocolo definido.

6. **Methodology Agent Adapter**
   - `name`: `methodology-agent`
   - *Capabilities:* `protocol_write`, `methods_section`, `search_description`
   - *Ações:* Gera texto da seção Methods, descreve protocolo PRISMA e estratégia de busca.

7. **Manuscript Writer Adapter**
   - `name`: `manuscript-writer`
   - *Capabilities:* `section_write`, `introduction_write`, `results_write`, `discussion_write`, `reference_integration`
   - *Ações:* Preenche seções do `manuscript` com base em dados extraídos e referências verificadas.

8. **Peer Reviewer Adapter**
   - `name`: `peer-reviewer`
   - *Capabilities:* `manuscript_review`, `critical_analysis`, `comment_generation`, `rework_task_creation`
   - *Ações:* Lê seções do manuscrito, gera comentários críticos, cria tasks de rework.

### Estrutura de cada Adapter
Cada adapter deve implementar a interface base do Paperclip (`createServerAdapter` ou equivalente) e incluir:
- `name`, `displayName`, `description`
- `configSchema`: campos de configuração (ex: modelo LLM preferido, temperatura)
- `capabilities`: array de strings
- `tools`: funções que o agente pode chamar (ex: `searchPubMed`, `updateStudyStatus`, `writeManuscriptSection`)
- `systemPrompt`: instruções de comportamento científico
- `detectModel` (opcional): detectar qual modelo está disponível
- `uiParser` (opcional): como renderizar outputs específicos na UI

### Registro
- Built-in: código em `packages/adapters/src/scientific/` ou similar.
- Externo: podem ser empacotados como npm packages e carregados via `~/.paperclip/adapter-plugins.json`, usando o mesmo mecanismo de plugin do fork.

---

## 5. Fluxo de Trabalho Automático (Workflow Engine)

O fluxo é **acionado automaticamente** quando um projeto é criado.

```
Usuário cria ResearchProject (define tema/pergunta)
  ↓
Research Director Adapter é automaticamente ativado
  ↓
Research Director analisa o tipo de projeto e ativa os demais adapters:
  - search-agent
  - screening-agent
  - prisma-agent
  - extraction-agent
  - methodology-agent
  - manuscript-writer
  - peer-reviewer
  ↓
Research Director cria ScientificObjective: "Systematic Review: [Tema]"
  ↓
Research Director cria ResearchMilestones:
  - Milestone 1: Definir Pergunta e Protocolo
  - Milestone 2: Busca e Screening
  - Milestone 3: Extração de Dados
  - Milestone 4: Síntese e Manuscrito
  - Milestone 5: Revisão por Pares
  ↓
Para cada Milestone, o Research Director cria Tasks:
  - Task -> Delega para search-agent (Milestone 2)
  - Task -> Delega para screening-agent (Milestone 2)
  - Task -> Delega para prisma-agent (Milestone 2)
  - Task -> Delega para extraction-agent (Milestone 3)
  - Task -> Delega para methodology-agent (Milestone 4)
  - Task -> Delega para manuscript-writer (Milestone 4)
  - Task -> Delega para peer-reviewer (Milestone 5)
```

**Comportamento de Delegação:** O Research Director usa a API interna para criar tasks e atribuí-las aos agents (adapters ativados). Se um adapter for desativado/pausado pelo usuário, o Director detecta e adapta o plano (delega para outro adapter com capabilities similares, cria task genérica, ou **cria um novo adapter dinamicamente** para cobrir a necessidade).

**Adaptação da Equipe:** Se o usuário desativar um adapter (ex: extraction-agent), o Research Director adapta o plano automaticamente (ex: delega extração para methodology-agent, cria task genérica, ou **gera e registra um novo adapter especializado** para substituir a função).

---

## 6. Novas Entidades do Domínio Científico

Criar no `packages/db/src/schema/` (e exportar em `index.ts`). Manter todas **project-scoped** (ligadas a `research_project_id`).

### 6.1 `research_projects`
- `id`, `name`, `description`, `research_question`, `pico_p`, `pico_i`, `pico_c`, `pico_o`, `status` (draft, active, completed, archived), `created_at`, `updated_at`.
- **Nota:** Substitui `companies` como a entidade raiz de escopo. Todas as outras tabelas apontam para `research_project_id`.

### 6.2 `agents`
- `id`, `research_project_id`, `name`, `adapter_id` (referência ao adapter registrado), `role` (research_director, search, screening, prisma, extraction, methodology, writer, reviewer), `status` (active, paused, terminated), `configuration` (JSONB), `cost_per_task`, `created_at`, `updated_at`.
- **Nota:** Substitui `employees`. Cada agent é uma instância de um adapter ativado no projeto.

### 6.3 `scientific_objectives`
- `id`, `research_project_id`, `title`, `description`, `status` (active, completed, cancelled), `priority`, `created_at`, `updated_at`.
- **Nota:** Substitui `missions`.

### 6.4 `research_milestones`
- `id`, `scientific_objective_id`, `research_project_id`, `title`, `description`, `status` (pending, active, completed, blocked), `due_date`, `created_at`, `updated_at`.
- **Nota:** Substitui `goals`.

### 6.5 `tasks`
- `id`, `research_milestone_id`, `scientific_objective_id`, `research_project_id`, `agent_id`, `title`, `description`, `status` (pending, in_progress, blocked, completed, failed), `approval_status` (not_required, pending, approved, rejected), `cost`, `created_at`, `updated_at`, `completed_at`.
- **Nota:** Substitui `tickets`.

### 6.6 `studies`
- `id`, `research_project_id`, `pmid`, `doi`, `title`, `authors`, `abstract`, `journal`, `year`, `source` (pubmed, crossref, manual), `search_strategy_id`, `inclusion_status` (pending, included, excluded), `exclusion_reason`, `created_at`.

### 6.7 `prisma_flow`
- `id`, `research_project_id`, `stage` (identification, screening, eligibility, included), `count`, `description`, `updated_at`.

### 6.8 `manuscripts`
- `id`, `research_project_id`, `title`, `introduction`, `methods`, `results`, `discussion`, `conclusion`, `references_json`, `version`, `status` (draft, under_review, approved), `created_at`, `updated_at`.

### 6.9 `study_extractions`
- `id`, `research_project_id`, `study_id`, `extraction_data` (JSONB), `extracted_by_agent_id`, `created_at`.

### 6.10 `references`
- `id`, `research_project_id`, `study_id`, `doi`, `pmid`, `url`, `citation_text`, `verified` (boolean), `created_at`.
- **Regra:** Nenhuma referência entra no artigo sem `doi`, `pmid` ou `url` validável.

### 6.11 `activity_logs`
- **Nota:** Renomear/Adaptar tabela existente de logs. `entity_type` deve suportar os novos nomes (`research_project`, `agent`, `task`, etc.).

---

## 7. Editor de Manuscrito Estruturado

Nova página na UI: `/research-projects/:id/manuscript`.

### Layout
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

### Funcionalidades do Editor
- Cada seção (Intro, Methods, Results, Discussion, Conclusion) é um **textarea Markdown**.
- O **Manuscript Writer** preenche esses campos via tool calls.
- O humano edita manualmente.
- **Painel de Referências:** Lista `references` com status `verified`. Botão "Add Reference" (manual) ou "Import from Studies".
- **Painel de Revisão:** Comentários gerados pelo Peer Reviewer (associados a seções/linhas do manuscrito).

### Tecnologia
- Usar componentes React existentes do Paperclip como base.
- Markdown puro é suficiente para Phase 1.

---

## 8. Integrações Científicas (Fonte de Verdade)

### 8.1 PubMed (E-utilities)
- **Endpoint:** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
- **Funções:**
  - `esearch.fcgi` — busca por termo, retorna PMIDs.
  - `efetch.fcgi` — busca metadados (title, abstract, authors, journal) por PMID.
- **Rate limit:** 3 requisições/segundo sem API key; 10 com API key. Implementar throttling.
- **Localização:** `packages/integrations/src/pubmed/`.

### 8.2 CrossRef
- **Endpoint:** `https://api.crossref.org/works/`
- **Função:** Resolver DOI -> metadados. Validar existência de DOI.
- **Localização:** `packages/integrations/src/crossref/`.

### 8.3 Upload Manual de PDFs
- **Localização:** `server/src/routes/uploads.ts`.
- **Funcionalidade:** Endpoint para upload de PDF. Salvar arquivo e referenciar.
- **Nota:** Extração automática complexa de PDF **fica fora** da Phase 1.

---

## 9. Governança Científica (Approval Gates)

Reaproveitar e renomear o sistema de approval do Paperclip. Criar novos tipos:

1. **Approve Search Strategy** — Aprova string de busca PICO.
2. **Approve Inclusion Criteria** — Aprova critérios de inclusão/exclusão.
3. **Approve Extraction Protocol** — Aprova campos da tabela de extração.
4. **Approve Manuscript Version** — Aprova rascunho do manuscrito.

**Comportamento:** Enquanto o approval não for dado, as tasks dependentes ficam em estado `blocked`. O humano aprova via UI.

---

## 10. Estrutura de Refatoração por Camada

### 10.1 Database (`packages/db/`)
- [ ] Renomear schema `companies.ts` → `research_projects.ts` (ou criar novo e remover antigo).
- [ ] Renomear schema `employees.ts` → `agents.ts`.
- [ ] Renomear schema `missions.ts` → `scientific_objectives.ts`.
- [ ] Renomear schema `goals.ts` → `research_milestones.ts`.
- [ ] Renomear schema `tickets.ts` → `tasks.ts`.
- [ ] Criar schemas: `studies.ts`, `prisma_flow.ts`, `manuscripts.ts`, `study_extractions.ts`, `references.ts`.
- [ ] Atualizar `index.ts` de exports.
- [ ] Gerar novas migrações (`pnpm db:generate`).

### 10.2 Shared (`packages/shared/`)
- [ ] Renomear tipos: `Company` → `ResearchProject`, `Employee` → `Agent`, etc.
- [ ] Renomear validadores (Zod schemas).
- [ ] Renomear constantes de API paths (`/api/companies` → `/api/research-projects`).
- [ ] Atualizar exports.

### 10.3 Server (`server/`)
- [ ] Renomear rotas: `companies.routes.ts` → `research-projects.routes.ts`.
- [ ] Renomear serviços: `companies.service.ts` → `research-projects.service.ts`.
- [ ] Atualizar middlewares de company-scoping para project-scoping.
- [ ] Atualizar auth/permissions.
- [ ] Criar novas rotas: `studies.routes.ts`, `manuscripts.routes.ts`, `search.routes.ts`.
- [ ] Criar novos serviços: `pubmed.service.ts`, `crossref.service.ts`.

### 10.4 UI (`ui/`)
- [ ] Renomear páginas: `CompaniesPage` → `ResearchProjectsPage`.
- [ ] Renomear componentes: `EmployeeCard` → `AgentCard`, `OrgChart` → `ResearchTeam`.
- [ ] Atualizar hooks de API (`useCompanies` → `useResearchProjects`).
- [ ] Atualizar rotas do React Router.
- [ ] Criar novas páginas: `ManuscriptEditorPage`, `StudiesPage`, `PRISMAViewPage`.
- [ ] Criar novos componentes: `IMRaDEditor`, `ReferencePanel`, `AgentSidebar`.

### 10.5 Adapters (`packages/adapters/`)
- [ ] Criar diretório `packages/adapters/src/scientific/`.
- [ ] Implementar 8 adapters científicos usando a interface base existente.
- [ ] Cada adapter deve exportar `createServerAdapter()` com `name`, `capabilities`, `tools`, `systemPrompt`, `configSchema`.
- [ ] O Research Director deve conseguir ativar/desativar adapters dinamicamente via API.
- [ ] Garantir que adapters científicos funcionem tanto built-in quanto via plugin externo (`~/.paperclip/adapter-plugins.json`).

---

## 11. Critérios de Aceitação do MVP (Definition of Done)

- [ ] Domínio completamente refatorado: `ResearchProject`, `Agent`, `ScientificObjective`, `ResearchMilestone`, `Task` substituem `Company`, `Employee`, `Mission`, `Goal`, `Ticket` em todo o stack (DB, Shared, Server, UI).
- [ ] Migrações de banco geradas e aplicadas com sucesso.
- [ ] Usuário pode criar um `ResearchProject`.
- [ ] Ao criar um Research Project, o Research Director Adapter é automaticamente ativado e **cria/ativa os demais adapters científicos dinamicamente** usando a infraestrutura do Paperclip.
- [ ] O Research Director automaticamente cria objectives/milestones/tasks.
- [ ] Search Agent Adapter pode receber uma task, gerar string de busca PICO e buscar no PubMed. Resultados salvos em `studies`.
- [ ] Screening Agent Adapter pode receber uma task e atualizar `inclusion_status` de estudos.
- [ ] PRISMA Agent Adapter pode atualizar a tabela `prisma_flow`.
- [ ] Manuscript Writer Adapter pode receber uma task e preencher seções do `manuscript`.
- [ ] Peer Reviewer Adapter pode receber uma task e gerar comentários críticos.
- [ ] Editor de Manuscrito Estruturado (IMRaD) funciona na UI.
- [ ] Sistema de Approval Gates funciona para "Search Strategy", "Inclusion Criteria" e "Manuscript Version".
- [ ] Nenhuma referência sem DOI/PMID/URL pode ser marcada como `verified`.
- [ ] Logs de auditoria mostram ações dos agents científicos.
- [ ] Adapters científicos são compatíveis com o sistema de plugin existente (podem ser built-in ou carregados externamente).
- [ ] Typecheck passa (`pnpm -r typecheck`).
- [ ] Testes unitários passam (`pnpm test:run`).
- [ ] Build passa (`pnpm build`).

---

## 12. Fora do Escopo da Phase 1

- Meta-análise automática ou estatística.
- Geração de Forest Plot, Funnel Plot.
- Extração automática complexa de PDF (OCR, tabelas).
- Escrita final 100% pronta para submissão.
- Submissão automática para revistas.
- Criação livre de adapters pelo usuário (só os 8 adapters científicos pré-definidos).
- Editor rich-text colaborativo real-time.
- Integrações além de PubMed e CrossRef.

---

## 13. Notas Técnicas Específicas do Fork

- **Porta:** O fork roda em `3101+` (auto-detecta se 3100 está ocupada).
- **Build UI NTFS:** Se `npx vite build` travar, usar `node node_modules/vite/bin/vite.js build`.
- **Startup:** Servidor pode levar 30-60s para iniciar em NTFS.
- **Kill processes:** `pkill -f "paperclip"; pkill -f "tsx.*index.ts"` antes de reiniciar.
- **Cache Vite:** `rm -rf ui/dist ui/node_modules/.vite` se houver problemas.
- **DB Dev:** Deixar `DATABASE_URL` unset para usar PGlite. Resetar com `rm -rf data/pglite`.

---

## 14. Próximos Passos Imediatos para o Agente

1. Ler `doc/GOAL.md`, `doc/PRODUCT.md`, `doc/SPEC-implementation.md`, `doc/DEVELOPING.md`, `doc/DATABASE.md`.
2. Explorar `packages/db/src/schema/` para mapear todas as tabelas a serem renomeadas.
3. Explorar `packages/shared/src/` para mapear tipos e constantes.
4. Explorar `packages/adapters/` para entender a interface base de adapters e como criar novos.
5. Explorar `server/src/routes/` e `server/src/services/` para mapear renomeações.
6. Explorar `ui/src/pages/` e `ui/src/components/` para mapear renomeações.
7. Criar plano técnico detalhado em `doc/plans/YYYY-MM-DD-metaclip-phase1-refactor.md`.
8. Iniciar pela camada de banco (DB schema + migrações), depois Shared, Adapters, Server e UI.
