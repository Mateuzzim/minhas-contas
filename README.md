# Minhas Contas — MVP inicial

Aplicativo web instalável (PWA), otimizado para iPhone, com funcionamento offline depois do primeiro carregamento.

## O que já funciona
- Painel com saldo em aberto, total pago, contas ativas e vencimentos do mês.
- Cadastro, edição e exclusão de dívidas/parcelamentos.
- Registro de pagamentos por parcela, incluindo valor parcial e data.
- Cadastro e controle de despesas avulsas.
- Histórico de pagamentos.
- Persistência local via `localStorage`.
- Layout responsivo e manifest/service worker para instalação como PWA.

## Dados iniciais
Foi incluída a dívida informada: R$ 17.000, parcela de R$ 500, vencimento dia 10, início em 10/10/2025 e 14 pagamentos de R$ 500 até 10/11/2026 (R$ 7.000 pagos; saldo de R$ 10.000). Confirme o histórico real antes de usar como registro definitivo.

## Executar localmente
É necessário servir os arquivos por HTTP (não abrir diretamente como `file://` para testar o service worker).

Com Python:
```bash
python -m http.server 8000
```
Abra `http://localhost:8000`.

## Testes
Nenhuma alteração deve ir para produção sem passar pelos testes.

```bash
npm test
```
- Lógica de cálculo isolada em `logic.js` (testável fora do navegador).
- Testes em `test/` com o runner nativo do Node (`node:test`), sem dependências.
- Hooks do Git em `.githooks/` (`pre-commit` e `pre-push`) bloqueiam commit/push se os testes falharem. Ativados com `git config core.hooksPath .githooks`.
- CI no GitHub Actions (`.github/workflows/ci.yml`) roda os testes em cada push/PR.

## Instalar no iPhone
1. Publique a pasta em um host HTTPS (por exemplo, GitHub Pages, Vercel ou Netlify).
2. Abra o endereço no Safari do iPhone.
3. Toque em Compartilhar → Adicionar à Tela de Início.
4. Abra pelo ícone criado.

## Limitações importantes desta versão
- Os dados ficam apenas no navegador/dispositivo atual.
- Não há login, sincronização entre aparelhos ou backup na nuvem.
- O calendário de parcelas é uma estimativa mensal baseada na data inicial e na quantidade de pagamentos registrados; pagamentos parciais/antecipados exigem conferência manual.
- Esta versão não envia notificações push.
- Não é um aplicativo nativo distribuído pela App Store.

## Próximas etapas recomendadas
1. Melhorar o cálculo de parcelas com cronograma individual e vencimentos reais.
2. Criar exportação/importação de backup JSON e CSV.
3. Adicionar lembretes locais de vencimento.
4. Integrar Firebase Authentication + Firestore para sincronização e backup.
5. Criar testes automatizados e validar acessibilidade/segurança.
