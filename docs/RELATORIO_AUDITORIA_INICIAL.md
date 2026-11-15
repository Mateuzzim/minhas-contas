# Relatório de Auditoria Inicial — Minhas Contas

- **Data:** 2026-11-15
- **Escopo:** análise integral da estrutura, Git, GitHub, Vercel, testes, segurança e integridade de dados. Sem alterações na aplicação.
- **Condição da missão:** nenhum push em `main`, nenhuma publicação em produção.

---

## 1. Inventário do projeto

PWA estático, zero dependências npm, sem build:

| Arquivo | Papel |
|---|---|
| `index.html` | UI, 3 `<dialog>`, 4 views/tabs |
| `styles.css` | CSS completo (2 linhas, minificado) |
| `logic.js` | Lógica pura testável (extraída nesta sessão) |
| `app.js` | Estado + DOM + `localStorage` |
| `sw.js` | Service worker cache-first (`CACHE='minhas-contas-cache-v1'`) |
| `manifest.webmanifest` | Manifesto PWA |
| `test/logic.test.js` | 17 testes `node:test` |
| `package.json` | Script `test` apenas |
| `.githooks/` | `pre-commit` e `pre-push` → `npm test` |
| `.github/workflows/ci.yml` | CI → `npm test` em push/PR |

## 2. Estado do Git / GitHub

| Item | Status |
|---|---|
| Branch local | `main` (outra branch em uso nesta missão: `docs/auditoria-inicial`) |
| Commit de origem | `d157e4f chore: versao inicial do Minhas Contas` (15/11/2026 12:12 -0300) |
| Remoto | `origin` → `https://github.com/Mateuzzim/minhas-contas.git` (fetch/push OK) |
| Branches no remoto | apenas `main` |
| Hooks ativos | `core.hooksPath=.githooks` (local) |
| Alteração pendente (não commitada) | `styles.css` — remoção de `max-width:960px` (pedido anterior do usuário, aguarda commit em branch) |

**Verificações externas que NÃO puderam ser confirmadas nesta máquina:**

- **GitHub CLI ausente** (`gh` não instalado) e sem `GITHUB_TOKEN` → não foi possível ler a API do repositório.
- O acesso anônimo à API GitHub retornou **404** → indício de repositório **privado** (bom para segurança), mas precisa confirmação manual.
- **Proteção da branch `main`** (required reviews/status checks): retorna 401 sem autenticação → **precisa verificação manual** em `https://github.com/Mateuzzim/minhas-contas/settings/branches`.
- Execuções do **GitHub Actions**: não verificadas (sem `gh`/token).

## 3. Estado do Vercel / publicação

| Item | Status |
|---|---|
| Produção | `https://minhas-contas-six.vercel.app/` → **HTTP 200**, HSTS ativo (2 anos, includeSubDomains, preload) |
| Deploy atual | corresponde ao commit `d157e4f` (`Last-Modified: 2026-11-15 15:23 UTC`, logo após o push) |
| `logic.js` em produção | presente (200) |
| Integração GitHub ↔ Vercel | **confirmada indiretamente**: o push na `main` virou deploy de produção automaticamente |
| `vercel.json` / `.vercel/` | não existem (configuração fica na conta Vercel) |
| CLI `vercel` | não instalada → **não foi possível inspecionar Preview Deployments, env vars ou proteção de ambientes** |

**Consequência:** existe configuração automática de produção a partir da `main`. Se a proteção de branch do GitHub estiver desativada, qualquer push direto em `main` publica em produção. Verificação manual necessária (ver §2 e §6).

## 4. Testes

- Comando: `npm test` → `node --test "test/**/*.test.js"`.
- Resultado na auditoria: **17 executados, 17 aprovados, 0 reprovados**.
- Cobertura: apenas `logic.js` (cálculos, datas, escaping). **`app.js` (render, dialogs, localStorage) não tem testes.**
- Hooks `pre-commit`/`pre-push` verificados em execução real: rodam `npm test` e bloqueiam se falhar.
- `npm audit`: não aplicável (sem dependências e sem lockfile). `npm ls` → vazio.

## 5. Riscos de segurança e integridade de dados

### Críticos / altos

1. **Dados financeiros só no `localStorage`** — sem exportação/backup. Limpar dados do navegador = perda total e irreversível. *(Maior risco do produto.)*
2. **Proteção da `main` não confirmada** — push direto = produção automática (integração Vercel confirmada). Precisa conferir na mão.
3. **Service worker cache-first sem mecanismo de atualização** — `CACHE='minhas-contas-cache-v1'` nunca muda; cliente instalado pode ficar preso em versão antiga de `app.js`/`styles.css` mesmo após novo deploy, até o `sw.js` mudar de bytes. Risco de "deploy invisível" e de correções de segurança não chegarem ao usuário.

### Médios

4. **Amostra de dívida gravada no primeiro acesso** (`loadState`) — mistura dado fictício (R$ 17.000) com dados reais do usuário; risco de confusão contábil. Existe aviso no README, mas não no app.
5. **Nenhum teste em `app.js`** — regressões de UI/render passam despercebidas; o gate de qualidade cobre só a camada `logic.js`.
6. **Sem linter/formatter** — erros de sintaxe em `app.js` só aparecem no navegador (o CI não faz `node --check`).
7. **XSS depende de disciplina manual** — `esc()` existe e é usado nos templates, mas não há teste garantindo que todo interpolação de dado do usuário passa por ele.

### Baixos

8. Nenhum segredo/token encontrado no código (varredura `api_key|secret|token|password|sk-…` → 0 ocorrências).
9. Sem dependências de terceiros → superfície de ataque de supply-chain zero.
10. `crypto.randomUUID` com fallback para `Date.now()+Math.random()` (colisão improvável, aceitável).
11. E-mail do autor aparece no histórico Git (normal; repo aparenta ser privado).
12. Cabeçalhos: HSTS ok; não há CSP (oportunidade futura, sem urgência para app sem backend).

## 6. Pendências que exigem verificação manual (eu não tenho acesso)

1. **GitHub:** repositório privado? `Settings → Branches → main` com *Require a pull request before merging* + *Require status checks* (CI)?
2. **GitHub:** Actions habilitado e workflow `ci.yml` verde no último push?
3. **Vercel:** integração com o repo, Produção protegida (só `main`), Preview Deployment automático por branch/PR ativado?
4. **Vercel:** algum env var configurado? (não deve haver — o app não usa, mas confirmar)

## 7. Plano de evolução por etapas

> Ordem por risco × valor. Cada etapa em branch própria, com teste e PR aguardando aprovação.

**Etapa 0 — Governança (esta missão)** ✅
`AGENTS.md` + este relatório, sem alteração de aplicação.

**Etapa 1 — Fechar o gate de produção** *(manual, do dono do repo)*
Ativar proteção da `main` (PR obrigatório + status check `ci.yml`), confirmar proteção da Produção na Vercel, confirmar Preview Deployments. Reduz risco #2 a zero.

**Etapa 2 — Commit do ajuste pendente + qualidade mínima de CI**
- Commitar a remoção de `max-width:960px` (`styles.css`) em `feat/layout-full-width`.
- CI: `node --check app.js` e `node --check logic.js` (sintaxe) além dos testes.
- Testes de escaping: varredura garantindo que interpolações em templates passam por `esc()`.
- Bump/estratégia de `CACHE` no `sw.js` para as atualizações reach installed clients.

**Etapa 3 — Segurança dos dados do usuário** *(maior valor para o produto)*
- Exportação de backup JSON (e importação com validação de esquema) — destrava recuperação de perda de `localStorage`.
- Proteção contra sobrescrever dados: nunca gravar amostra se já existir chave `minhas-contas-v1`.

**Etapa 4 — Testes de `app.js`**
Extrair funções testáveis restantes e/ou testes de integração leves (jsdom) para render e diálogos. Elevar a confiança do gate.

**Etapa 5 — Calendário real de parcelas**
Substituir a estimativa de `nextDue` por cronograma com vencimento real (fim de mês), conforme limitação já documentada.

**Etapa 6 — Funcionalidades do README** (com aprovação prévia)
Lembretes locais, sincronização/backup em nuvem (Firebase), notificações. Só após Etapa 1–3 estarem sólidas.

## 8. Resumo executivo

- Projeto pequeno, limpo, sem dependências e com gate de testes real (hooks + CI + 17 testes verdes).
- Deploy de produção automático a partir da `main` **já está funcionando** — é a maior alavanca e o maior risco: depende de proteção de branch que **não pôde ser confirmada**.
- Risco nº 1 do produto é de **dados**: tudo mora no `localStorage`, sem backup.
- Nenhuma credencial exposta; nenhuma alteração feita na aplicação nesta missão.
