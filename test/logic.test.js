const { test } = require("node:test");
const assert = require("node:assert/strict");
const { paidFor, remaining, progress, installmentsLeft, nextDue, fmtDate, dueStatus, esc, money, dateBR } = require("../logic.js");

const account = (overrides = {}) => ({
  id: "a1",
  name: "Empréstimo",
  total: 17000,
  installment: 500,
  day: 10,
  start: "2025-10-10",
  category: "Empréstimo",
  notes: "",
  payments: [],
  ...overrides
});

test("paidFor soma os pagamentos", () => {
  const a = account({ payments: [{ amount: 500 }, { amount: 300.5 }] });
  assert.equal(paidFor(a), 800.5);
});

test("paidFor retorna 0 sem pagamentos", () => {
  assert.equal(paidFor(account()), 0);
});

test("remaining nunca fica negativo", () => {
  const a = account({ total: 1000, payments: [{ amount: 1500 }] });
  assert.equal(remaining(a), 0);
});

test("remaining calcula saldo em aberto", () => {
  const a = account({ total: 17000, payments: [{ amount: 7000 }] });
  assert.equal(remaining(a), 10000);
});

test("progress limita a 100%", () => {
  const a = account({ total: 1000, payments: [{ amount: 2000 }] });
  assert.equal(progress(a), 100);
});

test("progress calcula percentual pago", () => {
  const a = account({ total: 200, payments: [{ amount: 50 }] });
  assert.equal(progress(a), 25);
});

test("installmentsLeft arredonda para cima", () => {
  const a = account({ total: 1000, installment: 300, payments: [{ amount: 500 }] });
  assert.equal(installmentsLeft(a), 2);
});

test("installmentsLeft é 0 quando quitada", () => {
  const a = account({ total: 500, installment: 500, payments: [{ amount: 500 }] });
  assert.equal(installmentsLeft(a), 0);
});

test("nextDue retorna null quando quitada", () => {
  const a = account({ total: 500, payments: [{ amount: 500 }] });
  assert.equal(nextDue(a), null);
});

test("nextDue avança um mês por pagamento registrado", () => {
  const a = account({
    start: "2025-10-10",
    total: 3000,
    installment: 500,
    payments: [{ amount: 500 }, { amount: 500 }]
  });
  const d = nextDue(a);
  assert.equal(fmtDate(d), "2025-12-10");
});

test("fmtDate formata ISO ou retorna vazio", () => {
  assert.equal(fmtDate(null), "");
  assert.equal(fmtDate(new Date("2025-12-10T12:00:00")), "2025-12-10");
});

test("dueStatus sem data é quitada", () => {
  assert.deepEqual(dueStatus(null), ["Quitada", "paid"]);
});

test("dueStatus atrasada, próxima e em dia", () => {
  const now = new Date("2026-01-15T12:00:00");
  assert.deepEqual(dueStatus("2026-01-10", now), ["Atrasada", "overdue"]);
  assert.deepEqual(dueStatus("2026-01-18", now), ["Próxima", "pending"]);
  assert.deepEqual(dueStatus("2026-02-20", now), ["Em dia", ""]);
});

test("dueStatus vence hoje conta como em dia/próxima", () => {
  const now = new Date("2026-01-15T12:00:00");
  const [status] = dueStatus("2026-01-15", now);
  assert.equal(status, "Próxima");
});

test("esc neutraliza HTML", () => {
  assert.equal(esc(`<img src=x onerror="alert(1)">`), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(esc(null), "");
  assert.equal(esc("R$ 1 & 2"), "R$ 1 &amp; 2");
});

test("money formata em BRL", () => {
  assert.match(money(17000), /^R\$\s?17\.000,00$/);
  assert.match(money(null), /^R\$\s?0,00$/);
});

test("dateBR formata ou retorna travessão", () => {
  assert.equal(dateBR(null), "—");
  assert.match(dateBR("2025-10-10"), /10/);
});
