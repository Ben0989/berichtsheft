const STORAGE_KEY='fahrlehrer-berichtsheft-v1';
const categories=[
  {id:'2.1',label:'Teilnahme – theoretischer Unterricht',target:10},
  {id:'2.2',label:'Teilnahme – praktischer Unterricht / Prüfung',target:15,detail:'davon 5 UE nach § 5 Abs. 2 FahrschAusbO'},
  {id:'3.1',label:'Theorie mit Ausbildungsfahrlehrer',target:12},
  {id:'3.2',label:'Praxis mit Ausbildungsfahrlehrer',target:16,detail:'davon 8 UE nach § 5 Abs. 2 FahrschAusbO'},
  {id:'3.3',label:'Feststellung der Prüfungsreife mit Ausbildungsfahrlehrer',target:8},
  {id:'4.1',label:'Theorie ohne Ausbildungsfahrlehrer',target:18},
  {id:'4.2',label:'Praxis ohne Ausbildungsfahrlehrer',target:120},
  {id:'4.3',label:'Feststellung der Prüfungsreife',target:5},
  {id:'5',label:'Vorstellung zur praktischen Prüfung',target:6},
  {id:'6',label:'Individuelle Aufteilung (Nummern 2–5)',target:120}
];
const $=id=>document.getElementById(id); let entries=readEntries();
function readEntries(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return[]}}
function saveEntries(){localStorage.setItem(STORAGE_KEY,JSON.stringify(entries))}
function localDate(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function mondayOf(value){const d=new Date(value+'T12:00:00');const day=d.getDay()||7;d.setDate(d.getDate()-day+1);return d.toISOString().slice(0,10)}
function formatDate(value){return new Intl.DateTimeFormat('de-DE').format(new Date(value+'T12:00:00'))}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function totals(){return Object.fromEntries(categories.map(c=>[c.id,entries.filter(e=>e.category===c.id).reduce((s,e)=>s+e.units,0)]))}
function render(){const byCategory=totals();const total=entries.reduce((s,e)=>s+e.units,0);const week=entries.filter(e=>mondayOf(e.date)===mondayOf(localDate())).reduce((s,e)=>s+e.units,0);$('totalValue').textContent=`${total} / 330 UE`;$('totalPercent').textContent=`${Math.round(total/330*100)} % des Musterplans`;$('weekValue').textContent=`${week} UE`;$('weekState').textContent=`20–32 UE · ${week<20?'unter dem Mindestwert':week>32?'über dem Höchstwert':'im zulässigen Bereich'}`;$('completeValue').textContent=`${categories.filter(c=>byCategory[c.id]>=c.target).length} / ${categories.length}`;$('entryCount').textContent=`${entries.length} ${entries.length===1?'Eintrag':'Einträge'}`;
  $('progressGrid').innerHTML=categories.map(c=>{const actual=byCategory[c.id]||0;return `<article><div class="progress-item-head"><div><span class="progress-title"><span class="progress-id">${c.id}</span>${c.label}</span>${c.detail?`<small class="detail">${c.detail}</small>`:''}</div><span class="pill ${actual>=c.target?'done':''}">${actual}/${c.target}</span></div><div class="bar"><span style="width:${Math.min(100,actual/c.target*100)}%"></span></div></article>`}).join('');
  const sorted=[...entries].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);$('history').innerHTML=sorted.length?sorted.map(e=>{const c=categories.find(x=>x.id===e.category);return `<article class="history-row"><div><span class="pill">${e.category}</span> <strong>${c?.label||'Bereich'}</strong><p>${formatDate(e.date)}${e.note?' · '+escapeHtml(e.note):''}</p></div><div class="history-actions"><strong>${e.units} UE</strong><button class="delete-button" data-delete="${e.id}" aria-label="Eintrag löschen">×</button></div></article>`}).join(''):'<div class="empty">Noch keine Unterrichtseinheiten eingetragen.</div>';
}
$('category').innerHTML=categories.map(c=>`<option value="${c.id}">${c.id} · ${c.label}</option>`).join('');$('category').value='4.2';$('entryDate').value=localDate();
$('units').addEventListener('input',e=>$('minuteHint').textContent=`${Math.max(0,Number(e.target.value)||0)*45} Minuten`);
$('entryForm').addEventListener('submit',e=>{e.preventDefault();const date=$('entryDate').value,category=$('category').value,units=Number($('units').value),note=$('note').value.trim();if(!date||!categories.some(c=>c.id===category)||!Number.isInteger(units)||units<1||units>32){$('error').hidden=false;$('error').textContent='Bitte Datum, Bereich und 1 bis 32 UE korrekt angeben.';return}$('error').hidden=true;entries.push({id:crypto.randomUUID(),date,category,units,note,createdAt:Date.now()});saveEntries();$('note').value='';$('units').value=1;$('minuteHint').textContent='45 Minuten';render()});
$('history').addEventListener('click',e=>{const button=e.target.closest('[data-delete]');if(!button)return;if(confirm('Diesen Eintrag wirklich löschen?')){entries=entries.filter(item=>item.id!==button.dataset.delete);saveEntries();render()}});
$('printButton').addEventListener('click',()=>window.print());render();
