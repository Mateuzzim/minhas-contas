const todayISO = () => new Date().toISOString().slice(0,10);
const money = n => Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const dateBR = s => s ? new Date(s+"T12:00:00").toLocaleDateString("pt-BR") : "—";
const uid = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random();

function paidFor(a){return a.payments.reduce((s,p)=>s+Number(p.amount),0)}
function remaining(a){return Math.max(0,Number(a.total)-paidFor(a))}
function progress(a){return Math.min(100,paidFor(a)/Number(a.total)*100)}
function installmentsLeft(a){return Math.ceil(remaining(a)/Number(a.installment))}
function nextDue(a){
  if(remaining(a)<=0)return null;
  const paidCount=a.payments.length;
  const d=new Date(a.start+"T12:00:00");
  d.setMonth(d.getMonth()+paidCount);
  return d;
}
function fmtDate(d){return d ? d.toISOString().slice(0,10) : ""}
function dueStatus(date, now){
  if(!date)return ["Quitada","paid"];
  now = now || new Date();now.setHours(0,0,0,0);
  const d=new Date(date+"T12:00:00");d.setHours(0,0,0,0);
  if(d<now)return ["Atrasada","overdue"];
  if(d.getTime()-now.getTime()<7*86400000)return ["Próxima","pending"];
  return ["Em dia",""];
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {todayISO,money,dateBR,uid,paidFor,remaining,progress,installmentsLeft,nextDue,fmtDate,dueStatus,esc};
}
