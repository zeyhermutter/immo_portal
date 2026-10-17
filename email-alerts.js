/* Local import of user-exported EML search notifications. No Gmail access, no scraping, no uploads. */
(()=>{'use strict';
const STORE='immoradar-email-expose-links-v1',MAX_MESSAGES=30,MAX_LINKS=600;
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let feedback='';
function get(){
 try{
  const value=JSON.parse(localStorage.getItem(STORE)||'[]');
  if(!Array.isArray(value))return [];
  return value.filter(o=>o&&/^https:\/\/www\.immobilienscout24\.de\/expose\/\d{5,12}$/.test(o.url))
    .map(o=>({url:o.url,firstSeenAt:String(o.firstSeenAt||''),lastSeenAt:String(o.lastSeenAt||''),notificationCount:Math.max(1,Number(o.notificationCount)||1),reviewed:!!o.reviewed})).slice(0,MAX_LINKS);
 }catch{return []}
}
function put(items){try{localStorage.setItem(STORE,JSON.stringify(items));return true}catch{return false}}
const idOf=url=>url.split('/').pop();
const date=v=>{const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleDateString('de-DE'):'—'};
function addLinks(links){
 const items=get(),index=new Map(items.map((o,i)=>[o.url,i])),now=new Date().toISOString();
 let added=0,repeated=0,overLimit=0;
 for(const url of links){
  if(index.has(url)){
   const found=items[index.get(url)];found.lastSeenAt=now;found.notificationCount++;repeated++;continue
  }
  if(items.length>=MAX_LINKS){overLimit++;continue}
  index.set(url,items.length);
  items.push({url,firstSeenAt:now,lastSeenAt:now,notificationCount:1,reviewed:false});added++;
 }
 if(!put(items))throw Error('Browser-Speicher nicht verfügbar oder voll.');
 return {added,repeated,overLimit};
}
function render(){
 const box=$('mailAlertsView');if(!box)return;
 const items=get(),unreviewed=items.filter(x=>!x.reviewed).length;
 let h='<div class="notice"><strong>Persönliche E-Mail-Suche, kein automatischer Postfachzugriff.</strong> Lade selbst erhaltene ImmoScout24-Benachrichtigungen als .eml hoch. Die Datei wird ausschließlich in diesem Browser verarbeitet. Es werden nur bereinigte ImmoScout24-Exposé-Links gespeichert – keine E-Mail-Texte, Absender, Betreffzeilen oder Trackingparameter. Keine Daten werden an das GitHub-Repository übertragen.</div>';
 h+='<div class="cockpit-kpis"><div><span>Gespeicherte Links</span><strong>'+items.length+'</strong></div><div><span>Noch nicht geprüft</span><strong>'+unreviewed+'</strong></div></div>';
 h+='<section class="cockpit-box"><h3>E-Mail-Suchbenachrichtigungen importieren</h3>';
 h+='<p class="muted">In Gmail kannst du eine ImmoScout24-Benachrichtigung öffnen und über das Menü „Nachricht herunterladen“ als .eml speichern. Hier kannst du mehrere Dateien auswählen. Die Such-E-Mails können auch von einem anderen Anbieter stammen; übernommen werden ausschließlich direkte ImmoScout24-Exposé-URLs.</p>';
 h+='<label class="field"><span>EML-Dateien auswählen (maximal 30, je 2 MB)</span><input id="emlFiles" type="file" accept=".eml,message/rfc822" multiple></label>';
 h+='<div class="buttons"><button class="button" id="mailImportRun" type="button">Anzeigenlinks auslesen</button><button class="button ghost" id="mailClearAll" type="button"'+(!items.length?' disabled':'')+'>Lokale Linkliste löschen</button></div>';
 h+='<p class="helper" role="status" id="mailStatus">'+esc(feedback||'Importierte Links werden als persönliche Recherche-Lesezeichen gespeichert. Die Quelle wird nicht live abgefragt.')+'</p></section>';
 h+='<section class="cockpit-box"><h3>Gefundene Exposé-Links ('+items.length+')</h3>';
 if(!items.length)h+='<div class="cockpit-empty">Noch keine Links gespeichert. Importiere eine oder mehrere ImmoScout24-Suchbenachrichtigungen.</div>';
 else {
  h+='<p class="helper">„Neu“ bedeutet neu in deiner lokalen Liste, nicht zwingend neu auf ImmoScout24. Immobilienpreise und Zustände werden nicht automatisch aus E-Mails geschätzt.</p>';
  for(const o of items.slice().sort((a,b)=>Number(a.reviewed)-Number(b.reviewed)||(b.firstSeenAt||'').localeCompare(a.firstSeenAt||''))){
   const url=esc(o.url),id=esc(idOf(o.url));
   h+='<div class="cockpit-result"><div><strong>ImmoScout24 Exposé '+id+'</strong><div class="small">Erstmals importiert: '+esc(date(o.firstSeenAt))+' · '+o.notificationCount+' lokale Benachrichtigung'+(o.notificationCount===1?'':'en')+'</div><div class="small">'+(o.reviewed?'Bereits geprüft':'Neu in deiner Liste')+'</div></div>';
   h+='<div class="cockpit-result-right"><a class="cockpit-link" target="_blank" rel="noopener noreferrer" href="'+url+'">Anzeige öffnen ↗</a>';
   h+='<button type="button" class="button secondary" data-email-action="edit" data-url="'+url+'">Objekt erfassen</button>';
   h+='<button type="button" class="button ghost" data-email-action="review" data-url="'+url+'">'+(o.reviewed?'Wieder öffnen':'Als geprüft markieren')+'</button></div></div>';
  }
 }
 h+='</section>';
 h+='<div class="cockpit-box"><h3>Automatische E-Mails später anbinden</h3><p class="muted">Gmail ist mit dieser Website nicht verbunden. Auch eine Gmail-Verbindung in ChatGPT ist keine automatische Verbindung zu GitHub Pages. Für einen dauerhaft laufenden Postfach-Import wären eine separate, explizite OAuth-Freigabe, ein sicherer Server und vereinbarte Nutzungsrechte erforderlich.</p></div>';
 box.innerHTML=h;
 $('mailImportRun').onclick=importFiles;
 $('mailClearAll').onclick=()=>{if(confirm('Alle lokal gespeicherten E-Mail-Anzeigenlinks wirklich löschen?')){put([]);feedback='Lokale Linkliste entfernt.';render()}};
 box.querySelectorAll('button[data-email-action]').forEach(b=>b.onclick=()=>{
  const action=b.dataset.emailAction,url=b.dataset.url;
  if(action==='edit'){openEditor(url);return}
  const rows=get(),row=rows.find(o=>o.url===url);if(!row)return;
  row.reviewed=!row.reviewed;
  if(!put(rows))feedback='Browser-Speicher nicht verfügbar.';render();
 });
}
function openEditor(url){
 if(typeof showEditor!=='function'){feedback='Objektverwaltung derzeit nicht bereit.';render();return}
 showEditor();
 $('fTitle').value='ImmoScout24 Exposé '+idOf(url);
 $('fUrl').value=url;
 $('fSource').value='ImmoScout24';
 $('fKind').value='Haus';
 $('fDescription').value='Link aus einer persönlich importierten Suchbenachrichtigung. Preis, Zustand, Entfernung und Verfügbarkeit im Original überprüfen. Ohne eingegebenen Marktwert erfolgt keine Deal-Bewertung.';
 $('fPrice').value='';
}
async function importFiles(){
 const fileInput=$('emlFiles'),files=[...(fileInput?.files||[])],status=$('mailStatus');
 if(!files.length){status.textContent='Bitte mindestens eine .eml-Datei auswählen.';return}
 if(files.length>MAX_MESSAGES){status.textContent='Bitte höchstens '+MAX_MESSAGES+' Dateien gleichzeitig importieren.';return}
 let scanned=0,invalid=0,relevantMessages=0;const all=new Set();
 for(const f of files){
  if(!/\.eml$/i.test(f.name||'')||f.size>2_000_000){invalid++;continue}
  try{
   const parsed=window.ImmoEmailParser.parseEml(await f.text());
   scanned++;
   if(parsed.links.length)relevantMessages++;
   for(const url of parsed.links)all.add(url);
  }catch{invalid++}
 }
 try{
  const outcome=addLinks([...all]);
  feedback=scanned+' E-Mails verarbeitet, '+relevantMessages+' mit direkten Exposé-Links; '+outcome.added+' neue, '+outcome.repeated+' schon vorhandene Links.'+(invalid?' '+invalid+' ungültige/zu große Dateien.':'')+(outcome.overLimit?' '+outcome.overLimit+' wegen Listenlimit ausgelassen.':'');
  render();
 }catch(err){status.textContent='Import fehlgeschlagen: '+err.message}
}
function init(){
 const tabs=document.querySelector('.tabs'),section=$('guideView')?.parentElement;
 if(!tabs||!section||$('mailAlertsView'))return;
 const tab=document.createElement('button');tab.className='tab';tab.dataset.tab='mailAlerts';tab.type='button';tab.textContent='E-Mail-Treffer';tab.onclick=()=>switchTab('mailAlerts');tabs.appendChild(tab);
 const view=document.createElement('div');view.id='mailAlertsView';view.hidden=true;section.appendChild(view);
}
init();
window.mailAlertsRender=()=>{if(document.querySelector('.tab.active')?.dataset.tab==='mailAlerts')render()};
})();