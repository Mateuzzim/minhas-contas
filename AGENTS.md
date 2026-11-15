# AGENTS.md — Regras de desenvolvimento do Minhas Contas

Regras permanentes para qualquer agente ou pessoa que desenvolva neste repositório.
Baseado no código que existe hoje; não descreve funcionalidades imaginárias.

## 1. Visão do projeto

PWA estático (HTML/CSS/JS puro, sem build, sem frameworks, sem dependências npm) para controle de dívidas, parcelas e despesas.

- Produção: https://minhas-contas-six.vercel.app/
- Repositório: https://github.com/Mateuzzim/minhas-contas
- Diretório local: `C:\Projetos\minhas_contas`

## 2. Estrutura e responsabilidades

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Estrutura, diálogos (`<dialog>`), tabs/views, IDs usados pelo JS |
| `styles.css` | Todo o CSS (2 linhas minificadas). Layout responsivo, tema escuro |
| `logic.js` | Lógica pura (sem DOM, sem localStorage): `paidFor`, `remaining`, `progress`, `installmentsLeft`, `nextDue`, `fmtDate`, `dueStatus`, `esc`, `money`, `dateBR`, `uid`, `todayISO`. Exporta via `module.exports` quando carregado no Node |
| `app.js` | Estado (`state`), `localStorage` (chave `minhas-contas-v1`), render, diálogos, eventos, registro do service worker |
| `sw.js` | Service worker: cache-first da lista `ASSETS` |
| `manifest.webmanifest` | Manifesto PWA |
| `assets/` | Ícones 192/512 |
| `test/logic.test.js` | Testes de `logic.js` com `node:test` |
| `.githooks/` | `pre-commit` e `pre-push` que rodam `npm test` |
| `.github/workflows/ci.yml` | CI: `npm test` em push e pull request |

Regras de separação:

- Função nova de cálculo/regra de negócio → `logic.js` + teste em `test/`.
- Acesso a DOM, eventos e `localStorage` → `app.js`.
- `logic.js` nunca referencia `document`, `window` ou `localStorage`.
- Todo conteúdo do usuário interpolado em HTML passa por `esc()` (anti-XSS).

## 3. Dados financeiros (prioridade máxima)

- Chave do `localStorage`: `minhas-contas-v1`. Nunca alterar o nome sem migração explícita e aprovada.
- Esquema atual: `{ accounts: [{id,name,total,installment,day,start,category,notes,payments:[{id,amount,date,note}]}], expenses: [{id,name,amount,due,category,paid,paidAt}], history: [] }`.
- Proibido, sem autorização: apagar/reescrever dados do usuário, mudar o esquema, rodar migrações, remover funcionalidade existente, tratar dados de produção como descartáveis.
- Sempre que o esquema mudar: manter compatibilidade de leitura com dados antigos e documentar a migração.
- Nenhuma credencial, token ou chave no código, no git ou em logs.

## 4. Testes (obrigatório)

- Comando: `npm test` (Node 22, runner nativo `node:test`, zero dependências).
- Nenhuma tarefa é concluída sem `npm test` verde (17 testes hoje).
- Mudança em `logic.js` exige teste novo ou ajuste no teste existente.
- Hooks `pre-commit`/`pre-push` bloqueiam commit/push com teste vermelho. Hooks ativos via `git config core.hooksPath .githooks` (executar uma vez por clone).
- Nunca usar `--no-verify` para contornar os hooks.

## 5. Git e branches

- `main` = produção. **Proibido para agentes:** push direto em `main`, merge de PR em `main`, alterar configurações críticas da Vercel.
- Fluxo de toda tarefa:
  1. Entender o problema e inspecionar os arquivos.
  2. Apresentar plano técnico e aguardar aprovação quando houver impacto em dados/UI existente.
  3. Branch própria: `feat/*`, `fix/*`, `docs/*`, `chore/*` a partir de `main`.
  4. Implementar, `npm test`, commit convencional (`feat:`, `fix:`, `chore:`, `docs:`, `test:` + descrição curta em pt-BR).
  5. `git push -u origin <branch>`.
  6. Abrir Pull Request e apresentar relatório (seção 7) aguardando aprovação.
- Commit não pode conter arquivos fora do escopo da tarefa.

## 6. Publicação (Vercel)

- Deploy de produção sai do push na `main` (integração GitHub ↔ Vercel).
- Validação de mudanças: usar o Preview Deployment da branch/PR, nunca a produção.
- Configuração crítica da Vercel (domínios, env vars, proj settings) só com autorização.
- Ao alterar arquivos em `ASSETS` do `sw.js`, considerar bump de `CACHE` para atualizar clientes já instalados (regra atual: cache-first sem network update).

## 7. Relatório obrigatório de tarefa

Ao terminar cada tarefa, reportar:

1. Objetivo
2. Arquivos criados / modificados
3. Funcionalidades implementadas
4. Problemas encontrados
5. Testes executados (aprovados × reprovados)
6. Validação (se houve)
7. Branch + hash do commit (+ link do PR)
8. Riscos/pendências
9. Próxima recomendação

Não declarar tarefa concluída com teste falhando ou não executado.

## 8. Limitações conhecidas hoje (não "consertar" sem plano)

- Persistência apenas local (`localStorage`), sem backup/exportação.
- `nextDue` estima vencimento por contagem de pagamentos (não calendário real com ajuste de fim de mês).
- Amostra inicial de dívida é gravada no primeiro acesso (`loadState`).
- Service worker não valida atualização sem mudança de `CACHE`.
- Sem linter/formatter; estilo do código é minificado/one-liner — manter consistência com o arquivo editado.
