const KEY = "minhas-contas-v1";
let state = loadState();

function loadState(){
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if(saved) return saved;
  } catch(e) {}
  const sample = {
    accounts:[{
      id:"debt-inicial",name:"Dívida inicial",total:17000,installment:500,day:10,
      start:"2025-10-10",category:"Empréstimo",notes:"Cadastro inicial informado pelo usuário",
      payments:Array.from({length:14},(_,i)=>({id:"p"+i,amount:500,date:new Date(2025,9+i,10).toISOString().slice(0,10),note:"Parcela mensal"}))
    }],
    expenses:[], history:[]
  };
  localStorage.setItem(KEY,JSON.stringify(sample)); return sample;
}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function showToast(msg){const t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function empty(msg){return `<div class="empty">${msg}</div>`}
function accountCard(a){
  const next=nextDue(a),due=next?fmtDate(next):null,[status,cls]=dueStatus(due);
  return `<article class="item-card">
    <div class="item-top"><div><div class="item-title">${esc(a.name)}</div><div class="item-sub">${esc(a.category)} · ${a.installment?money(a.installment)+"/parcela":""} · Vencimento dia ${a.day}</div></div><div class="amount">${money(remaining(a))}</div></div>
    <div class="item-sub">${money(paidFor(a))} pagos de ${money(a.total)} · ${installmentsLeft(a)} parcelas estimadas restantes</div>
    <div class="item-progress"><div class="progress-track"><div class="progress-fill" style="width:${progress(a)}%"></div></div><div class="progress-labels"><span>${progress(a).toFixed(1).replace(".",",")}% pago</span><span>${due?`Próxima: ${dateBR(due)}`:"Concluída"}</span></div></div>
    <div class="item-actions">${remaining(a)>0?`<button class="primary small-btn" data-pay="${a.id}">＋ Registrar pagamento</button>`:"<span class='status'>Quitada</span>"}<button class="secondary small-btn" data-edit-account="${a.id}">Editar</button><button class="secondary small-btn" data-delete-account="${a.id}">Excluir</button></div>
  </article>`;
}
function expenseCard(e){
 const [status,cls]=e.paid?["Paga",""]:dueStatus(e.due);
 return `<article class="item-card"><div class="item-top"><div><div class="item-title">${esc(e.name)}</div><div class="item-sub">${esc(e.category)} · Vencimento: ${dateBR(e.due)}</div></div><div class="amount">${money(e.amount)}</div></div><div class="item-actions">${!e.paid?`<button class="primary small-btn" data-pay-expense="${e.id}">Marcar como paga</button>`:`<span class="status">Paga</span>`}<button class="secondary small-btn" data-edit-expense="${e.id}">Editar</button><button class="secondary small-btn" data-delete-expense="${e.id}">Excluir</button><span class="status ${cls}">${status}</span></div></article>`;
}
function render(){
 const total=state.accounts.reduce((s,a)=>s+remaining(a),0);
 const paid=state.accounts.reduce((s,a)=>s+paidFor(a),0);
 const original=state.accounts.reduce((s,a)=>s+Number(a.total),0);
 document.querySelector("#totalOpen").textContent=money(total);
 document.querySelector("#paidTotal").textContent=money(paid)+" pagos";
 document.querySelector("#paidPercent").textContent=(original?paid/original*100:0).toFixed(1).replace(".",",")+"% pago";
 document.querySelector("#overallProgress").style.width=(original?paid/original*100:0)+"%";
 document.querySelector("#activeCount").textContent=state.accounts.filter(a=>remaining(a)>0).length;
 const now=new Date(),month=now.getMonth(),year=now.getFullYear();
 const debtDue=state.accounts.reduce((s,a)=>{const d=nextDue(a);return s+(d&&d.getMonth()===month&&d.getFullYear()===year?Math.min(a.installment,remaining(a)):0)},0);
 const expDue=state.expenses.filter(e=>!e.paid&&new Date(e.due+"T12:00:00").getMonth()===month&&new Date(e.due+"T12:00:00").getFullYear()===year).reduce((s,e)=>s+Number(e.amount),0);
 document.querySelector("#dueMonth").textContent=money(debtDue+expDue);
 const upcoming=[
  ...state.accounts.filter(a=>remaining(a)>0).map(a=>({name:a.name,due:fmtDate(nextDue(a)),amount:Math.min(a.installment,remaining(a)),kind:"Parcela"})),
  ...state.expenses.filter(e=>!e.paid).map(e=>({name:e.name,due:e.due,amount:e.amount,kind:"Despesa"}))
 ].sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5);
 document.querySelector("#upcoming").innerHTML=upcoming.length?upcoming.map(x=>`<article class="item-card"><div class="item-top"><div><div class="item-title">${esc(x.name)}</div><div class="item-sub">${x.kind} · ${dateBR(x.due)}</div></div><div class="amount">${money(x.amount)}</div></div></article>`).join(""):empty("Nenhum vencimento cadastrado.");
 const cards=state.accounts.map(accountCard).join("")||empty("Cadastre sua primeira conta para acompanhar o progresso.");
 document.querySelector("#accountList").innerHTML=cards;
 document.querySelector("#dashboardAccounts").innerHTML=state.accounts.slice(0,3).map(accountCard).join("")||empty("Nenhuma conta cadastrada.");
 const filter=document.querySelector("#expenseFilter").value;
 const expenses=state.expenses.filter(e=>filter==="all"||(filter==="paid"?e.paid:!e.paid));
 document.querySelector("#expenseList").innerHTML=expenses.map(expenseCard).join("")||empty("Nenhuma despesa encontrada.");
 const history=[...state.accounts.flatMap(a=>a.payments.map(p=>({...p,title:a.name}))),...state.expenses.filter(e=>e.paidAt).map(e=>({date:e.paidAt,amount:e.amount,title:e.name,note:"Despesa paga"}))].sort((a,b)=>b.date.localeCompare(a.date));
 document.querySelector("#historyList").innerHTML=history.length?history.map(h=>`<div class="history-row"><div class="history-left"><strong>${esc(h.title)}</strong><small>${dateBR(h.date)} ${h.note?"· "+esc(h.note):""}</small></div><strong class="green">− ${money(h.amount)}</strong></div>`).join(""):empty("Os pagamentos registrados aparecerão aqui.");
}
function openDialog(id){document.getElementById(id).showModal()}
function closeDialog(id){document.getElementById(id).close()}
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeDialog(b.dataset.close)));
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>goto(b.dataset.tab)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>goto(b.dataset.goto)));
function goto(tab){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===tab))}
function resetAccountForm(){document.querySelector("#accountForm").reset();document.querySelector("#accountId").value="";document.querySelector("#accountStart").value=todayISO();document.querySelector("#accountDialogTitle").textContent="Nova conta"}
function openNewAccount(){resetAccountForm();openDialog("accountDialog")}
document.querySelector("#addMain").onclick=openNewAccount;
document.querySelector("#addDebt").onclick=openNewAccount;
document.querySelector("#accountForm").addEventListener("submit",e=>{
 e.preventDefault();const id=document.querySelector("#accountId").value;
 const obj={id:id||uid(),name:document.querySelector("#accountName").value.trim(),total:Number(document.querySelector("#accountAmount").value),installment:Number(document.querySelector("#accountInstallment").value),day:Number(document.querySelector("#accountDay").value),start:document.querySelector("#accountStart").value,category:document.querySelector("#accountCategory").value,notes:document.querySelector("#accountNotes").value,payments:id?(state.accounts.find(a=>a.id===id)?.payments||[]):[]};
 if(id)state.accounts=state.accounts.map(a=>a.id===id?obj:a);else state.accounts.push(obj);
 closeDialog("accountDialog");save();showToast(id?"Conta atualizada":"Conta cadastrada");
});
function editAccount(id){const a=state.accounts.find(x=>x.id===id);if(!a)return;document.querySelector("#accountId").value=a.id;document.querySelector("#accountName").value=a.name;document.querySelector("#accountAmount").value=a.total;document.querySelector("#accountInstallment").value=a.installment;document.querySelector("#accountDay").value=a.day;document.querySelector("#accountStart").value=a.start;document.querySelector("#accountCategory").value=a.category;document.querySelector("#accountNotes").value=a.notes||"";document.querySelector("#accountDialogTitle").textContent="Editar conta";openDialog("accountDialog")}
function openPayment(id){const a=state.accounts.find(x=>x.id===id);if(!a)return;document.querySelector("#paymentAccountId").value=id;document.querySelector("#paymentInfo").textContent=`${a.name} · Saldo restante: ${money(remaining(a))} · Parcela prevista: ${money(Math.min(a.installment,remaining(a)))}`;document.querySelector("#paymentAmount").value=Math.min(a.installment,remaining(a)).toFixed(2);document.querySelector("#paymentDate").value=todayISO();document.querySelector("#paymentNote").value="";openDialog("paymentDialog")}
document.querySelector("#paymentForm").addEventListener("submit",e=>{e.preventDefault();const a=state.accounts.find(x=>x.id===document.querySelector("#paymentAccountId").value);const amount=Number(document.querySelector("#paymentAmount").value);if(!a||amount>remaining(a)+0.001){showToast("Valor maior que o saldo restante");return}a.payments.push({id:uid(),amount,date:document.querySelector("#paymentDate").value,note:document.querySelector("#paymentNote").value});closeDialog("paymentDialog");save();showToast("Pagamento registrado")});
document.querySelector("#accountList").addEventListener("click",handleAccountAction);
document.querySelector("#dashboardAccounts").addEventListener("click",handleAccountAction);
function handleAccountAction(e){const b=e.target.closest("button");if(!b)return;if(b.dataset.pay)openPayment(b.dataset.pay);if(b.dataset.editAccount)editAccount(b.dataset.editAccount);if(b.dataset.deleteAccount&&confirm("Excluir esta conta e todo o histórico de pagamentos?")){state.accounts=state.accounts.filter(a=>a.id!==b.dataset.deleteAccount);save();showToast("Conta excluída")}}
document.querySelector("#addExpense").onclick=()=>{document.querySelector("#expenseForm").reset();document.querySelector("#expenseId").value="";document.querySelector("#expenseDue").value=todayISO();openDialog("expenseDialog")};
document.querySelector("#expenseFilter").onchange=render;
document.querySelector("#expenseForm").addEventListener("submit",e=>{e.preventDefault();const id=document.querySelector("#expenseId").value;const old=state.expenses.find(x=>x.id===id);const obj={id:id||uid(),name:document.querySelector("#expenseName").value.trim(),amount:Number(document.querySelector("#expenseAmount").value),due:document.querySelector("#expenseDue").value,category:document.querySelector("#expenseCategory").value,paid:old?.paid||false,paidAt:old?.paidAt||null};if(id)state.expenses=state.expenses.map(x=>x.id===id?obj:x);else state.expenses.push(obj);closeDialog("expenseDialog");save();showToast("Despesa salva")});
function editExpense(id){const x=state.expenses.find(e=>e.id===id);if(!x)return;document.querySelector("#expenseId").value=x.id;document.querySelector("#expenseName").value=x.name;document.querySelector("#expenseAmount").value=x.amount;document.querySelector("#expenseDue").value=x.due;document.querySelector("#expenseCategory").value=x.category;openDialog("expenseDialog")}
document.querySelector("#expenseList").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const id=b.dataset.payExpense||b.dataset.editExpense||b.dataset.deleteExpense;const x=state.expenses.find(v=>v.id===id);if(!x)return;if(b.dataset.payExpense){x.paid=true;x.paidAt=todayISO();save();showToast("Despesa marcada como paga")}if(b.dataset.editExpense)editExpense(id);if(b.dataset.deleteExpense&&confirm("Excluir esta despesa?")){state.expenses=state.expenses.filter(v=>v.id!==id);save()}});
if("serviceWorker" in navigator && location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{});
render();
