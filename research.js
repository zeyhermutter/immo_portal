/* Curated official research links + user-authorized OpenImmo XML import.
   Curated links are NOT a live feed or a republication license.
   XML files are processed locally; no file upload or scraping. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const int=n=>Number.isFinite(Number(n))?Number(n):null;
const str=x=>String(x??'').trim();
const url=x=>{try{const a=new URL(str(x));return /^https?:$/.test(a.protocol)&&!a.username&&!a.password?a.href:null}catch{return null}};
let researched=null,feedback='';
function init(){
 const tabs=document.querySelector('.tabs'),section=$('guideView').parentElement;
 const btn=document.createElement('button');btn.className='tab';btn.textContent='Reale Fundstellen';btn.dataset.tab='research';btn.addEventListener('click',()=>switchTab('research'));tabs.appendChild(btn);
 const view=document.createElement('div');view.id='researchView';view.hidden=true;section.appendChild(view);
}
function render(){
 const view=$('researchView');if(!view)return;
 const items=researched?.properties||[];
 const list=items.map(p=>{
  const deadline=new Date(p.deadline+'T23:59:59+01:00').getTime(),expired=Date.now()>deadline;
  return '<article class="cockpit-box"><div class="row"><strong>'+esc(p.title)+'</strong><span class="tag">'+(expired?'Angebotsfrist abgelaufen':'Frist '+esc(p.deadline.split('-').reverse().join('.')))+'</span></div><p class="small">'+esc(p.location)+' · '+esc(p.source)+' · Energieklasse '+esc(p.energyClass||'unbekannt')+'</p><h3>'+euro(p.price)+'</h3><p class="small">'+esc(p.priceLabel)+' · laut Originalquelle am '+esc(researched.checkedAt.split('-').reverse().join('.'))+' geprüft</p><p class="muted">'+esc(p.description)+'</p><div class="buttons"><a class="button secondary" target="_blank" rel="noopener noreferrer" href="'+esc(url(p.url)||'#')+'">Amtliches Angebot prüfen ↗</a><button class="button" type="button" data-research="'+esc(p.id)+'"'+(expired?' disabled title="Angebotsfrist abgelaufen"':'')+'>Zur eigenen Prüfung übernehmen</button></div></article>';
 }).join('');
 const introduction='<div class="notice"><strong>Reale Quellen, keine Live-Datenbank:</strong> Die nachstehenden drei Fundstellen stammen von der offiziellen Immobilienverkaufsseite des Freistaats Bayern (Recherche '+esc(researched?.checkedAt||'unbekannt')+'). Direkte Verweise statt automatisierter Übernahme fremder Webseiten. Vor Verwendung Verfügbarkeit, Frist, Preisvorstellung und Unterlagen stets auf der Originalseite prüfen. Keines dieser Angebote gilt ohne eigene Wertermittlung als Schnäppchen.</div>';
 const importUI='<div class="cockpit-box"><h3>OpenImmo-XML eines berechtigten Anbieters importieren</h3><p class="muted">Direkter Import einer selbst erhaltenen OpenImmo-XML-Datei mit ausdrücklicher Berechtigung zur Nutzung. Der XML-Standard ist nur ein Datenformat und eröffnet keinen Zugriff auf Immobilien anderer Anbieter. Die Datei bleibt im Browser; es wird nichts zu GitHub hochgeladen.</p><label class="field"><span>OpenImmo XML (.xml, maximal 5 MB)</span><input id="openimmoFile" type="file" accept=".xml,text/xml,application/xml"></label><label class="field"><span>Optional: Basis-URL zur Anbieter-Objektseite (endet mit /)</span><input id="openimmoBase" type="url" placeholder="https://makler.example/immobilien/"></label><p class="helper">Falls die XML keinen Deeplink liefert, wird die Basis-URL mit einer externen Objektnummer ergänzt. Diese URL muss vom Datenanbieter ausdrücklich als URL-Schema bestätigt sein. Sonst dieses Feld leer lassen.</p><label class="check"><input id="openimmoPermission" type="checkbox"> Ich habe die ausdrückliche Erlaubnis des Anbieters zur Verarbeitung dieser Objektdaten.</label><div class="buttons"><button id="openimmoRun" class="button" type="button">Berechtigte XML importieren</button></div><p class="helper" id="openimmoReport" role="status"></p></div>';
 const sources='<div class="cockpit-box"><h3>Weitere Originalquellen</h3><div class="buttons"><a class="button secondary" target="_blank" rel="noopener noreferrer" href="https://www.immobilien.bayern.de/immobilien/verkaeufe/">Immobilien Freistaat Bayern ↗</a><a class="button secondary" target="_blank" rel="noopener noreferrer" href="https://www.zvg-portal.de/">Justiz-Zwangsversteigerungen ↗</a><a class="button secondary" target="_blank" rel="noopener noreferrer" href="https://www.openimmo.de/">OpenImmo-Standard ↗</a></div><p class="helper">Originalquellen können sich jederzeit ändern. Die offiziellen Versteigerungsunterlagen sind rechtlich maßgeblich; öffentliche Einsicht bedeutet nicht automatisch freie automatisierte Weiterverwertung.</p></div>';
 view.innerHTML=introduction+'<h3>Geprüfte Quellenlinks ('+items.length+')</h3>'+((!researched)?'<div class="cockpit-empty">Keine Recherchelinks geladen; die externen Suchlinks bleiben verfügbar.</div>':list)+sources+importUI;
 view.querySelectorAll('button[data-research]').forEach(b=>b.onclick=()=>copyResearch(b.dataset.research));
 $('openimmoRun').onclick=importXML;
 if(feedback)$('openimmoReport').textContent=feedback;
}
function copyResearch(id){
 const item=researched?.properties?.find(x=>x.id===id);
 if(!item||!url(item.url))return;
 if(new Date(item.deadline+'T23:59:59+01:00').getTime()<Date.now()){feedback='Angebotsfrist abgelaufen; Objekt wird nicht automatisch übernommen.';render();return}
 const row={title:item.title,url:item.url,kind:item.kind,source:item.source,location:item.location,area:item.area,price:item.price,marketValue:0,renovationCost:0,lat:null,lon:null,
 description:'Amtliche Preisvorstellung (Höchstgebotverfahren), kein Kaufpreis. Stand '+researched.checkedAt+'. Energieklasse '+item.energyClass+'. Quelle und Frist vor Entscheidung prüfen. Nicht automatisch als Schnäppchen bewertbar.'};
 const result=window.immoRadarImportRows?.([row])||{added:0,updated:0,skipped:1};
 feedback='Übernommen: '+result.added+' neu / '+result.updated+' aktualisiert.';
}
function textOf(parent,name){if(!parent)return'';return str(Array.from(parent.getElementsByTagName('*')).find(el=>el.localName?.toLowerCase()===name)?.textContent)}
function first(parent,name){return parent?Array.from(parent.getElementsByTagName('*')).find(el=>el.localName?.toLowerCase()===name):null}
function firstUrl(property){
 const tags=['objekturl','immo_url','link','url'];
 for(const tag of tags){const el=first(property,tag);if(el){const u=url(el.textContent);if(u)return u}}
 const custom=Array.from(property.getElementsByTagName('*')).filter(x=>x.localName==='user_defined_simplefield');
 for(const entry of custom){if(/(url|webseite|expose|link)/i.test(entry.getAttribute('feldname')||'')){const u=url(entry.textContent);if(u)return u}}
 return null;
}
function parseXML(xml,base){
 if(xml.length>5_000_000)throw Error('Datei zu groß');
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('DOCTYPE und XML-Entitäten sind aus Sicherheitsgründen nicht erlaubt.');
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.getElementsByTagName('parsererror').length||doc.documentElement.localName!=='openimmo')throw Error('Keine gültige OpenImmo-XML-Datei');
 const objects=Array.from(doc.getElementsByTagName('*')).filter(el=>el.localName==='immobilie');
 if(objects.length>1000)throw Error('Maximal 1000 Immobilien je Datei');
 const parsed=[];let noLink=0,noPrice=0,notSale=0;
 for(const prop of objects){
  const market=first(prop,'vermarktungsart');
  if(!market||!/^true$|^1$/i.test(market.getAttribute('KAUF')||'')){notSale++;continue}
  const pr=Number(textOf(prop,'kaufpreis').replace(/\s/g,'').replace(',','.'));
  if(!(pr>0)){noPrice++;continue}
  const title=textOf(prop,'objekttitel')||textOf(prop,'objektnr_extern')||'Immobilie ohne Titel';
  const place=[textOf(prop,'plz'),textOf(prop,'ort')].filter(Boolean).join(' ');
  const coords=first(prop,'geokoordinaten');
  const number=textOf(prop,'objektnr_extern').replace(/[^a-z0-9_-]/gi,'');
  let link=firstUrl(prop);
  if(!link&&base&&number)link=url(base+encodeURIComponent(number));
  if(!link){noLink++;continue}
  const objtype=first(prop,'objektart');
  let kind='Sonstige';
  if(objtype&&Array.from(objtype.children).some(x=>x.localName==='haus'))kind='Haus';
  else if(objtype&&Array.from(objtype.children).some(x=>x.localName==='wohnung'))kind='Wohnung';
  else if(objtype&&Array.from(objtype.children).some(x=>x.localName==='grundstueck'))kind='Grundstück';
  const company=textOf(prop.parentElement,'firma')||'Freigegebener OpenImmo-Export';
  const descr=[textOf(prop,'objektbeschreibung'),textOf(prop,'zustand'),textOf(prop,'lage')].filter(Boolean).join(' · ').slice(0,2800);
  const lat=coords?int(coords.getAttribute('breitengrad')):null,lon=coords?int(coords.getAttribute('laengengrad')):null;
  parsed.push({title:title.slice(0,180),url:link,source:company.slice(0,80),kind,location:place.slice(0,150),price:pr,area:Math.max(0,Number(textOf(prop,'wohnflaeche').replace(',','.'))||0),description:descr,
    lat:lat!==null&&Math.abs(lat)<=90?lat:null,lon:lon!==null&&Math.abs(lon)<=180?lon:null});
 }
 return {parsed,ignored:{noLink,noPrice,notSale},total:objects.length};
}
async function importXML(){
 const report=$('openimmoReport'),file=$('openimmoFile').files[0];
 if(!file){report.textContent='Bitte XML-Datei auswählen.';return}
 if(!$('openimmoPermission').checked){report.textContent='Für den Datenimport benötigst du die Bestätigung der Nutzungsberechtigung.';return}
 if(file.size>5_000_000){report.textContent='Datei zu groß (max. 5 MB).';return}
 try{
  const v=str($('openimmoBase').value);
  const base=v?url(v):null;
  if(v&&(!base||!base.endsWith('/')))throw Error('Basis-URL muss mit http(s) beginnen und mit / enden.');
  const {parsed,ignored,total}=parseXML(await file.text(),base);
  if(!parsed.length){report.textContent=total+' Angebote geprüft, keine übernommen: '+ignored.noLink+' ohne gültigen Anzeigenlink, '+ignored.noPrice+' ohne Kaufpreis, '+ignored.notSale+' keine Kaufangebote.';return}
  const r=window.immoRadarImportRows?.(parsed);
  report.textContent=(r?.added||0)+' Angebote neu, '+(r?.updated||0)+' aktualisiert, '+(r?.skipped||0)+' übersprungen. XML: '+ignored.noLink+' ohne Link, '+ignored.noPrice+' ohne Preis, '+ignored.notSale+' Miet-/andere Angebote.';
 }catch(error){report.textContent='XML-Import nicht möglich: '+error.message}
}
async function fetchReferences(){
 try{const r=await fetch('./data/research-links.json',{cache:'no-store'});if(!r.ok)throw Error('Recherchelinks nicht erreichbar');const body=await r.json();
  if(!Array.isArray(body.properties))throw Error('Ungültige Quellenliste');
  researched={checkedAt:body.checkedAt,properties:body.properties.filter(p=>url(p.url)&&int(p.price)>0)};
 }catch{researched=null}
 if(document.querySelector('.tab.active')?.dataset.tab==='research')render();
}
init();
window.researchRender=()=>{if(document.querySelector('.tab.active')?.dataset.tab==='research')render()};
fetchReferences();
})();