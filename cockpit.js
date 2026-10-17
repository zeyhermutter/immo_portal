/* ImmoRadar Cockpit – all personal data stays in this browser unless exported. */
(()=>{'use strict';
const KEY='immoradar-cockpit-v1';
const CATS={dach:'Dach / Fassade',fenster:'Fenster',heizung:'Heizung',elektrik:'Elektrik',innen:'Innenausbau',energie:'Energie / Dämmung',sonstiges:'Sonstige'};
const CENTER=[48.148,11.731];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||0);
const num=v=>Math.max(0,Number(v)||0);
const httpUrl=v=>{try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:''}catch{return''}};
const date=s=>{const d=new Date(s);return Number.isFinite(d.getTime())?d.toLocaleDateString('de-DE'):'—'};
const uid=()=>crypto?.randomUUID?.()||('p-'+Date.now()+'-'+Math.random().toString(36).slice(2));
function read(){try{const r=JSON.parse(localStorage.getItem(KEY)||'{}');return r&&typeof r==='object'?r:{}}catch{return{}}}
const saved=read();
const state={history:saved.history||{},plans:saved.plans||{},notes:saved.notes||{},profiles:Array.isArray(saved.profiles)?saved.profiles:[],minDrop:Number.isFinite(+saved.minDrop)?+saved.minDrop:5,feedCount:0,feedTimestamp:null,feedStatus:'Noch keine Datenfeeds eingelesen.'};
const persist=()=>localStorage.setItem(KEY,JSON.stringify({history:state.history,plans:state.plans,notes:state.notes,profiles:state.profiles,minDrop:state.minDrop}));
const hasCoords=o=>o.lat!=null&&o.lon!=null&&Number.isFinite(Number(o.lat))&&Number.isFinite(Number(o.lon))&&Math.abs(Number(o.lat))<=90&&Math.abs(Number(o.lon))<=180;
const radius=o=>hasCoords(o)?km(Number(o.lat),Number(o.lon)):null;
const tracked=()=>Array.isArray(listings)?listings:[];
function trackPrices(items){
 let changed=false;
 for(const o of items){
  if(!httpUrl(o.url)||num(o.price)===0)continue;
  const k=o.url,arr=Array.isArray(state.history[k])?state.history[k]:[];
  const last=arr[arr.length-1];
  if(!last||last.price!==num(o.price)){
   arr.push({price:num(o.price),at:new Date().toISOString()});
   state.history[k]=arr.slice(-50);changed=true;
  }
 }
 if(changed)persist();
}
function budget(o){
 const p=state.plans[o.id];if(!p||!Object.keys(CATS).some(k=>num(p[k])>0))return null;
 const base=Object.keys(CATS).reduce((s,k)=>s+num(p[k]),0);
 return Math.round(base*(1+Math.min(100,num(p.reservePct??15))/100));
}
window.cockpitRenoCost=o=>budget(o);
window.cockpitTrackPrices=trackPrices;
function reduction(o){
 const h=state.history[o.url]||[];
 if(h.length<2)return null;
 const prev=h[h.length-2].price,current=h[h.length-1].price;
 return prev>current?{amount:prev-current,pct:100*(prev-current)/prev,at:h[h.length-1].at}:null;
}
function score(o){
 const p=num(o.price),v=num(o.marketValue);if(!(p>0&&v>0))return null;
 const diff=calculations(o).discount;
 const location=radius(o),complete=Boolean(o.description&&num(o.area)>0);
 const points=Math.max(0,Math.min(100,Math.round(50+2*diff+(location!==null&&location<=100?5:0)+(complete?5:0)+(reduction(o)?5:0))));
 return {points,discount:diff,location,complete};
}
function matchProfile(o,p){
 if(p.keyword&&!((o.title||'')+' '+(o.description||'')+' '+(o.location||'')).toLowerCase().includes(p.keyword.toLowerCase()))return false;
 if(p.kind&&o.kind!==p.kind)return false;
 if(num(p.maxPrice)&&num(o.price)>num(p.maxPrice))return false;
 if(p.renoOnly&&!renovation(o))return false;
 const d=radius(o);
 if(d!==null&&d>num(p.maxRadius||100))return false;
 if(num(p.minDiscount)>0&&(calculations(o).discount??-Infinity)<num(p.minDiscount))return false;
 return true;
}
function block(title,inside){return '<section class="cockpit-box"><h3>'+title+'</h3>'+inside+'</section>'}
function short(o){const c=score(o),d=radius(o),r=reduction(o);
 return '<article class="cockpit-result"><div><strong>'+esc(o.title)+'</strong><div class="small">'+esc(o.location||'Standort unbekannt')+' · '+esc(o.source||'Quelle unbekannt')+'</div><div class="small">'+(d===null?'Entfernung ungeprüft':Math.round(d)+' km')+(r?' · Preisrückgang '+money(r.amount):'')+'</div></div><div class="cockpit-result-right"><strong>'+money(o.price)+'</strong><span class="cockpit-score">'+(c?c.points+'/100':'Score —')+'</span><a class="cockpit-link" href="'+esc(httpUrl(o.url)||'#')+'" target="_blank" rel="noopener noreferrer">Anzeige ↗</a></div></article>'}
function ranking(){return tracked().filter(o=>score(o)).sort((a,b)=>score(b).points-score(a).points)}
function overview(){
 const items=tracked(),deals=ranking(),drops=items.filter(o=>reduction(o)),mapped=items.filter(o=>radius(o)!==null);
 const summary='<div class="cockpit-kpis"><div><span>Erfasste Objekte</span><strong>'+items.length+'</strong></div><div><span>Mit Vergleichswert</span><strong>'+deals.length+'</strong></div><div><span>Preisreduzierungen</span><strong>'+drops.length+'</strong></div><div><span>Standort verifiziert</span><strong>'+mapped.length+'</strong></div></div>';
 const help='<div class="notice"><strong>Keine erfundenen Schnäppchen:</strong> Der Score ist eine modellbasierte Arbeitshilfe, keine Marktwertermittlung. Ohne selbst erfassten Marktwert wird kein Deal-Score vergeben. Standortprüfung nur bei Koordinaten. Automatische Portalabfragen erfolgen ausschließlich über gesondert freigegebene Datenfeeds.</div>';
 const method='<p class="muted">Score-Formel: 50 + 2 × rechnerischer Abschlag in Prozentpunkten (nach Kaufneben- und Sanierungskosten) + 5 bei Koordinaten im 100-km-Kreis + 5 bei vollständiger Fläche/Beschreibung + 5 bei dokumentierter Preisreduzierung, begrenzt auf 0–100. Der Wert hängt von deinen Annahmen ab.</p>';
 const top=deals.length?deals.slice(0,8).map(short).join(''):'<div class="cockpit-empty">Noch keine bewertbaren Objekte. Ergänze Kaufpreis und geschätzten Marktwert in „Meine Objekte“.</div>';
 const status=block('Datenquellen & Aktualität','<p class="muted" id="feedStatus">'+esc(state.feedStatus)+'</p><p class="helper">Öffentliche Feed-Daten werden beim Seitenaufruf geladen, falls im Repository konfiguriert. Manuelle CSV-/JSON-Importe sind jederzeit möglich. Es werden keine fremden Portale automatisch ausgelesen.</p><div class="buttons"><button class="button secondary" type="button" data-action="sync">Freigegebene Daten neu laden</button><button class="button ghost" type="button" data-action="csv">Analyse als CSV exportieren</button></div>');
 const links=block('Standort und Rechtliches prüfen','<p class="muted">Amtliche Karten und Richtwerte sind Prüfquellen, keine automatischen Objektbewertungen.</p><div class="buttons"><a class="button secondary" href="https://www.umweltatlas.bayern.de/" target="_blank" rel="noopener noreferrer">UmweltAtlas Bayern ↗</a><a class="button secondary" href="https://www.boris-bayern.de/" target="_blank" rel="noopener noreferrer">BORIS Bayern ↗</a></div>');
 $('overviewView').innerHTML=summary+help+'<div class="cockpit-columns">'+block('Potenzielle Chancen',top)+block('So wird bewertet',method)+'</div>'+status+links;
}
let map=null,layer=null;
function showMap(){
 const items=tracked(),points=items.filter(o=>hasCoords(o)&&radius(o)<=100),unplaced=items.filter(o=>!hasCoords(o));
 $('mapView').innerHTML='<div class="notice">Die Karte zeigt nur Objekte mit gültigen Koordinaten innerhalb von 100 km um 85622. '+unplaced.length+' Objekte ohne Koordinaten bleiben ungeprüft und erscheinen nicht als Marker. Kartenmaterial: OpenStreetMap.</div><div id="propertyMap" role="region" aria-label="Immobilienkarte"></div><div class="cockpit-box"><h3>Objekte auf der Karte ('+points.length+')</h3>'+(points.length?points.map(short).join(''):'<div class="cockpit-empty">Noch keine Objekte mit Koordinaten vorhanden.</div>')+'</div>';
 if(!window.L){$('propertyMap').textContent='Die interaktive Karte kann derzeit nicht geladen werden (Leaflet benötigt eine Internetverbindung).';return}
 map?.remove();
 map=L.map('propertyMap',{scrollWheelZoom:false}).setView(CENTER,9);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-Mitwirkende'}).addTo(map);
 L.circle(CENTER,{radius:100000,color:'#4be0b9',weight:1,fillOpacity:.025}).addTo(map);
 layer=L.featureGroup().addTo(map);
 for(const o of points){const marker=L.marker([Number(o.lat),Number(o.lon)]).addTo(layer);const safeLink=httpUrl(o.url);
  marker.bindPopup('<strong>'+esc(o.title)+'</strong><br>'+esc(o.location||'')+'<br>'+money(o.price)+(safeLink?'<br><a target="_blank" rel="noopener noreferrer" href="'+esc(safeLink)+'">Zur Anzeige ↗</a>':''))}
 if(points.length)map.fitBounds(layer.getBounds().pad(.25),{maxZoom:12});
 setTimeout(()=>map?.invalidateSize(),60);
}
function renovationView(){
 const items=tracked(),id=$('renoplanSelect')?.value||items[0]?.id||'',o=items.find(x=>x.id===id);
 let h='<div class="notice">Sanierungsbudgets sind nur grobe Annahmen. Je nach Gebäude können zusätzliche Gutachten, Förderbedingungen und unvorhersehbare Kosten entscheidend sein.</div><label class="field"><span>Immobilie auswählen</span><select id="renoplanSelect"><option value="">Bitte auswählen</option>'+items.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===id?' selected':'')+'>'+esc(x.title)+'</option>').join('')+'</select></label>';
 if(o){const p=state.plans[o.id]||{},base=Object.keys(CATS).reduce((sum,k)=>sum+num(p[k]),0),reservePct=p.reservePct??15;
  h+='<div class="cockpit-box"><h3>Sanierungskosten für '+esc(o.title)+'</h3><div class="cockpit-fields">'+Object.entries(CATS).map(([k,name])=>'<label class="field"><span>'+name+' (€)</span><input type="number" min="0" step="100" data-cost="'+k+'" value="'+(p[k]??'')+'" placeholder="0"></label>').join('')+'<label class="field"><span>Sicherheitspuffer (%)</span><input id="reservePct" type="number" min="0" max="100" step="1" value="'+reservePct+'"></label></div><div class="buttons"><button type="button" class="button" data-action="plan">Budget speichern</button></div><p class="muted">Geplante Einzelmaßnahmen: '+money(base)+' · Puffer: '+money(base*num(reservePct)/100)+'</p><p><strong>Gesamtbudget: '+money(budget(o)??num(o.renovationCost))+'</strong></p><p class="helper">Ein gespeichertes Budget ersetzt in der Objektbewertung die bisherige pauschale Sanierungsschätzung. Alles wird nur in deinem Browser gespeichert.</p></div>';
 }else h+='<div class="cockpit-empty">Erfasse zuerst ein Objekt unter „Meine Objekte“.</div>';
 $('renoplanView').innerHTML=h;
}
function priceView(){
 const items=tracked(),id=$('priceSelect')?.value||items[0]?.id||'',o=items.find(x=>x.id===id);
 let h='<div class="notice">Preisverläufe entstehen erst, sobald für dieselbe Anzeigen-URL unterschiedliche Preise erfasst oder importiert werden. Keine historische Preisbehauptung ohne gespeicherte Daten.</div><label class="field"><span>Immobilie auswählen</span><select id="priceSelect"><option value="">Bitte auswählen</option>'+items.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===id?' selected':'')+'>'+esc(x.title)+'</option>').join('')+'</select></label>';
 if(o){const hist=state.history[o.url]||[];
  const min=Math.min(...hist.map(x=>x.price)),max=Math.max(...hist.map(x=>x.price)),diff=Math.max(1,max-min);
  const poly=hist.map((x,i)=>{const xx=24+(i/(Math.max(1,hist.length-1)))*510,yy=150-120*(x.price-min)/diff;return xx.toFixed(1)+','+yy.toFixed(1)}).join(' ');
  h+=block('Gespeicherte Preisbeobachtungen ('+hist.length+')',hist.length?'<svg viewBox="0 0 560 180" class="price-chart" role="img" aria-label="Preisverlauf"><line x1="20" y1="155" x2="545" y2="155" stroke="#536780"/><polyline points="'+poly+'" fill="none" stroke="#4be0b9" stroke-width="4" stroke-linecap="round"/>'+hist.map((x,i)=>{const xx=24+(i/Math.max(1,hist.length-1))*510,yy=150-120*(x.price-min)/diff;return '<circle cx="'+xx+'" cy="'+yy+'" r="4" fill="#4be0b9"/>'}).join('')+'</svg><div class="cockpit-table-wrap"><table class="cockpit-table"><thead><tr><th>Erfasst am</th><th>Preis</th><th>Veränderung</th></tr></thead><tbody>'+hist.map((x,i)=>'<tr><td>'+date(x.at)+'</td><td>'+money(x.price)+'</td><td>'+(i?money(x.price-hist[i-1].price):'Start')+'</td></tr>').join('')+'</tbody></table></div>':'Noch keine Preisbeobachtungen.');
 }
 $('priceView').innerHTML=h;
}
function profilesView(){
 const prof=state.profiles;
 const form='<form id="profileForm" class="cockpit-box"><h3>Suchprofil speichern</h3><div class="cockpit-fields"><label class="field"><span>Profilname *</span><input name="name" required maxlength="80" placeholder="Sanierungsobjekte bis 500.000 €"></label><label class="field"><span>Suchwort</span><input name="keyword" maxlength="100" placeholder="z. B. Reihenhaus"></label><label class="field"><span>Immobilienart</span><select name="kind"><option value="">Alle</option><option>Haus</option><option>Wohnung</option><option>Grundstück</option><option>Sonstige</option></select></label><label class="field"><span>Maximalpreis (€)</span><input name="maxPrice" type="number" min="0"></label><label class="field"><span>Maximale Entfernung (km)</span><select name="maxRadius"><option>10</option><option>25</option><option>50</option><option selected>100</option></select></label><label class="field"><span>Mindestabschlag (%)</span><input name="minDiscount" type="number" min="0" max="99" value="0"></label></div><label class="check"><input name="renoOnly" type="checkbox"> Nur Sanierungskandidaten</label><button class="button" type="submit">Profil speichern</button></form>';
 const list=prof.length?prof.map(p=>{const matches=tracked().filter(o=>matchProfile(o,p)),newMatches=p.reviewedAt?matches.filter(o=>o.addedAt&&o.addedAt>p.reviewedAt):matches;
  return block(esc(p.name)+' · '+matches.length+' Treffer','<p class="helper">'+esc(p.keyword||'Alle Suchwörter')+' · maximal '+(p.maxPrice?money(p.maxPrice):'unbegrenzt')+' · '+p.maxRadius+' km · '+(p.renoOnly?'nur Sanierung':'alle Zustände')+'</p><p class="muted">'+newMatches.length+' Treffer seit der letzten Durchsicht (nach Erfassungsdatum)</p>'+(matches.length?matches.slice(0,4).map(short).join(''):'<div class="cockpit-empty">Keine passenden lokal vorhandenen Angebote.</div>')+'<div class="buttons"><button type="button" class="button secondary" data-action="review" data-id="'+esc(p.id)+'">Als durchgesehen markieren</button><button type="button" class="button ghost" data-action="delete-profile" data-id="'+esc(p.id)+'">Profil löschen</button></div>');
 }).join(''):'<div class="cockpit-empty">Noch keine gespeicherten Suchprofile.</div>';
 $('profilesView').innerHTML='<div class="notice">Suchprofile prüfen vorhandene und neu importierte Daten beim Öffnen des Portals. Es gibt derzeit keine Hintergrundüberwachung, Push-Nachrichten oder E-Mails.</div>'+form+'<h3>Meine Suchprofile</h3>'+list;
 $('profileForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget),p={id:uid(),name:String(fd.get('name')||'').trim(),keyword:String(fd.get('keyword')||'').trim(),kind:String(fd.get('kind')||''),maxPrice:num(fd.get('maxPrice')),maxRadius:num(fd.get('maxRadius'))||100,minDiscount:num(fd.get('minDiscount')),renoOnly:fd.has('renoOnly'),createdAt:new Date().toISOString(),reviewedAt:null};if(!p.name)return;state.profiles.unshift(p);persist();profilesView()};
}
function alertsView(){
 const items=tracked(),drops=items.map(o=>({o,d:reduction(o)})).filter(x=>x.d&&x.d.pct>=state.minDrop).sort((a,b)=>b.d.at.localeCompare(a.d.at));
 const profileAlerts=state.profiles.map(p=>({p,matches:items.filter(o=>matchProfile(o,p)&&(!p.reviewedAt||(o.addedAt&&o.addedAt>p.reviewedAt)))})).filter(x=>x.matches.length);
 const h='<label class="field" style="max-width:240px"><span>Preisrückgang mindestens (%)</span><input id="alertThreshold" type="number" min="0" max="99" step="1" value="'+state.minDrop+'"></label>'+block('Dokumentierte Preisrückgänge',drops.length?drops.map(x=>'<div class="cockpit-result"><div><strong>'+esc(x.o.title)+'</strong><div class="small">'+date(x.d.at)+' · −'+x.d.pct.toFixed(1)+' %</div></div><div class="cockpit-result-right"><strong>−'+money(x.d.amount)+'</strong><a class="cockpit-link" href="'+esc(httpUrl(x.o.url)||'#')+'" target="_blank" rel="noopener noreferrer">Anzeige ↗</a></div></div>').join(''):'<div class="cockpit-empty">Noch keine beobachteten Preisrückgänge.</div>')+block('Treffer aus Suchprofilen',profileAlerts.length?profileAlerts.map(x=>'<p><strong>'+esc(x.p.name)+'</strong>: '+x.matches.length+' seit letzter Durchsicht</p>').join(''):'<div class="cockpit-empty">Derzeit keine neuen Treffer aus gespeicherten Suchprofilen.</div>');
 $('alertsView').innerHTML='<div class="notice">Das sind lokale Hinweise aus gespeicherten Beobachtungen, keine automatischen Echtzeit-Benachrichtigungen. Du musst die Seite öffnen und Daten laden bzw. importieren.</div>'+h;
 $('alertThreshold').onchange=e=>{state.minDrop=Math.max(0,Math.min(99,num(e.target.value)));persist();alertsView()};
}
function dossierView(){
 const items=tracked(),id=$('dossierSelect')?.value||items[0]?.id||'',o=items.find(x=>x.id===id);
 let h='<label class="field"><span>Immobilie auswählen</span><select id="dossierSelect"><option value="">Bitte auswählen</option>'+items.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===id?' selected':'')+'>'+esc(x.title)+'</option>').join('')+'</select></label>';
 if(o){const c=score(o),d=radius(o),n=state.notes[o.id]||{};
  h+=block('Objektakte: '+esc(o.title),'<div class="cockpit-kpis"><div><span>Deal-Score</span><strong>'+(c?c.points+'/100':'—')+'</strong></div><div><span>Gesamtkosten (modelliert)</span><strong>'+money(calculations(o).total)+'</strong></div><div><span>Abstand zum Marktwert</span><strong>'+(c?c.discount.toFixed(1)+' %':'—')+'</strong></div><div><span>Entfernung</span><strong>'+(d===null?'ungeprüft':Math.round(d)+' km')+'</strong></div></div><label class="field"><span>Besichtigungsdatum</span><input type="date" id="visitDate" value="'+esc(n.visitDate||'')+'"></label><label class="field"><span>Meine Notizen</span><textarea id="dossierNotes" rows="5" placeholder="Zustand, offene Fragen, Ansprechpartner, Besonderheiten">'+esc(n.text||'')+'</textarea></label><div class="cockpit-checks">'+['Energieausweis anfordern','Grundbuch / Baulasten prüfen','Finanzierung prüfen','Bausubstanz fachlich prüfen','Sanierungsangebote einholen','Hochwasserrisiko prüfen'].map((name,i)=>'<label class="check"><input type="checkbox" data-check="'+i+'"'+(n.checks?.[i]?' checked':'')+'> '+name+'</label>').join('')+'</div><button class="button" type="button" data-action="notes" data-id="'+esc(o.id)+'">Objektakte speichern</button><p class="helper">Prüfpunkte sind Erinnerungen, keine amtliche Bestätigung. Persönliche Notizen werden ausschließlich lokal im Browser gespeichert.</p>');
 }else h+='<div class="cockpit-empty">Bitte zunächst eine Immobilie erfassen.</div>';
 $('dossierView').innerHTML=h;
}
function csvExport(){
 const rows=[['Titel','Quelle','Ort','URL','Kaufpreis EUR','Marktwert EUR','Sanierung EUR','Nebenkosten %','Modellierte Differenz EUR','Score','Preisrueckgang EUR']];
 for(const o of tracked()){const c=calculations(o),s=score(o),drop=reduction(o);rows.push([o.title,o.source,o.location,o.url,o.price,o.marketValue,budget(o)??o.renovationCost,($('costRate')?.value||10),c.margin??'',s?.points??'',drop?.amount??''])}
 const cell=value=>{let s=String(value??'');if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='immoradar-analyse.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function cockpitRender(){
 const active=document.querySelector('.tab.active')?.dataset.tab;
 if(active==='overview')overview();
 if(active==='map')showMap();
 if(active==='renoplan')renovationView();
 if(active==='price')priceView();
 if(active==='profiles')profilesView();
 if(active==='alerts')alertsView();
 if(active==='dossier')dossierView();
}
window.cockpitRender=cockpitRender;
function initTabs(){
 const entries=[['overview','Cockpit'],['map','Karte'],['renoplan','Sanierungsplan'],['price','Preisverlauf'],['profiles','Suchprofile'],['alerts','Hinweise'],['dossier','Objektakte']];
 const tabs=document.querySelector('.tabs'),section=$('guideView').parentElement;
 for(const [key,label] of entries){const b=document.createElement('button');b.className='tab';b.dataset.tab=key;b.textContent=label;tabs.appendChild(b);b.addEventListener('click',()=>switchTab(key));
 const box=document.createElement('div');box.id=key+'View';box.hidden=true;section.appendChild(box)}
 document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b||!b.closest('#overviewView,#renoplanView,#profilesView,#dossierView'))return;
 const act=b.dataset.action,id=b.dataset.id;
 if(act==='sync')loadFeeds(true);
 if(act==='csv')csvExport();
 if(act==='delete-profile'){if(confirm('Suchprofil wirklich löschen?')){state.profiles=state.profiles.filter(p=>p.id!==id);persist();profilesView()}}
 if(act==='review'){const p=state.profiles.find(p=>p.id===id);if(p){p.reviewedAt=new Date().toISOString();persist();profilesView()}}
 if(act==='plan'){
   const o=tracked().find(x=>x.id===$('renoplanSelect').value);if(!o)return;
   const p={reservePct:Math.min(100,num($('reservePct').value))};for(const input of document.querySelectorAll('[data-cost]'))p[input.dataset.cost]=num(input.value);
   state.plans[o.id]=p;persist();update();renovationView();
 }
 if(act==='notes'){
   const checks={};for(const input of document.querySelectorAll('[data-check]'))checks[input.dataset.check]=input.checked;
   state.notes[id]={text:$('dossierNotes').value.slice(0,12000),visitDate:$('visitDate').value,checks};persist();dossierView();
 }
 });
 document.addEventListener('change',e=>{
  if(e.target.id==='renoplanSelect')renovationView();
  if(e.target.id==='priceSelect')priceView();
  if(e.target.id==='dossierSelect')dossierView();
 });
}
async function loadFeeds(manual=false){
 const status=manual?'Datenfeed wird geprüft.':state.feedStatus;state.feedStatus=status;
 try{
  const res=await fetch('./data/listings.json',{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const body=await res.json(),entries=Array.isArray(body)?body:body.listings;
  if(!Array.isArray(entries))throw Error('ungültiges Dateiformat');
  state.feedCount=entries.length;state.feedTimestamp=body.updatedAt||null;
  let changed=0;
  for(const input of entries){
   if(!input||typeof input!=='object')continue;
   const url=httpUrl(input.url),title=String(input.title||'').trim().slice(0,180);
   if(!url||!title||!Number.isFinite(Number(input.price))||Number(input.price)<=0)continue;
   const old=tracked().find(x=>x.url===url);
   const obj={id:old?.id||uid(),title,source:String(input.source||'Freigegebener Datenfeed').slice(0,80),kind:String(input.kind||'Sonstige'),url,location:String(input.location||'').slice(0,150),description:String(input.description||'').slice(0,3000),area:num(input.area),price:num(input.price),marketValue:old?.marketValue||num(input.marketValue),renovationCost:old?.renovationCost||num(input.renovationCost),lat:input.lat==null?null:Number(input.lat),lon:input.lon==null?null:Number(input.lon),favorite:old?.favorite||false,addedAt:old?.addedAt||new Date().toISOString()};
   if(!hasCoords(obj)){obj.lat=null;obj.lon=null}
   if(old){if(['price','title','description','location','area','lat','lon'].some(k=>old[k]!==obj[k])){Object.assign(old,obj);changed++}}
   else{listings.push(obj);changed++}
  }
  if(changed)save();else trackPrices(tracked());
  state.feedStatus=entries.length+' Feed-Einträge verfügbar'+(state.feedTimestamp?' · Stand '+date(state.feedTimestamp):'')+'. '+changed+' lokal übernommen.';
 }catch(err){state.feedStatus='Kein veröffentlichter Datenfeed verfügbar: '+err.message+'. CSV/JSON-Import und manuelle Erfassung bleiben möglich.'}
 if(document.querySelector('.tab.active')?.dataset.tab==='overview')overview();
}
initTabs();trackPrices(tracked());loadFeeds();switchTab('overview');
})();