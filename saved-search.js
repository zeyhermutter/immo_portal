(function(){
'use strict';
const STORAGE_KEY='immoradar-private-immoscout-search-v1';
const ROOT='https://www.immobilienscout24.de/Suche/radius/haus-kaufen';
const ADDRESS='M%C3%BCnchen%20(Kreis);;;;;Feldkirchen;';
const COORDS='48.14786;11.72973';
const $=id=>document.getElementById(id);
const verifiedListings=[
 {title:'Teilweise vermietetes Dreifamilienhaus auf sonnigem Westgrundstück in absolut ruhiger Lage',price:1250000,livingArea:183,rooms:6.5,landArea:629,location:'Gartenstadt Trudering, München',url:'https://www.immobilienscout24.de/expose/159101205',date:'2026-10-18'},
 {title:'NEUBAU: Edles Stadthaus mit 4,5 Zimmern im schönen Obermenzing',price:1690000,livingArea:163,rooms:4.5,landArea:105,location:'Obermenzing, München',url:'https://www.immobilienscout24.de/expose/162016931',date:'2026-10-18'},
 {title:'HAUS REGINBALD / Bestlage Obermenzing',price:null,livingArea:340,rooms:10,landArea:881,location:'Obermenzing, München',url:'https://www.immobilienscout24.de/expose/171440343',date:'2026-10-18'}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function anonymousSearch(radius){return ROOT+'?centerofsearchaddress='+ADDRESS+'&geocoordinates='+COORDS+';'+radius+'.0'}
function validPersonalUrl(value){try{const u=new URL(String(value||'').trim());return u.protocol==='https:'&&['www.immobilienscout24.de','immobilienscout24.de'].includes(u.hostname.toLowerCase())&&u.pathname.startsWith('/Suche/')&&!u.username&&!u.password&&u.href.length<4096?u.href:null}catch{return null}}
function stored(){try{return validPersonalUrl(localStorage.getItem(STORAGE_KEY)||'')}catch{return null}}
function persist(url){try{if(url)localStorage.setItem(STORAGE_KEY,url);else localStorage.removeItem(STORAGE_KEY);return true}catch{return false}}
function listingCard(o){const price=Number.isFinite(o.price)?o.price.toLocaleString('de-DE')+' €':'Preis auf Anfrage',sqm=Number.isFinite(o.price)?Math.round(o.price/o.livingArea).toLocaleString('de-DE')+' €/m²':'€/m² nicht berechenbar';return '<article class="card"><div class="meta"><span class="tag good">ImmoScout24</span><span class="tag">gemeldet '+new Date(o.date).toLocaleDateString('de-DE')+'</span></div><h3>'+esc(o.title)+'</h3><p class="description">'+esc(o.location)+' · '+o.livingArea+' m² Wohnfläche · '+o.rooms+' Zimmer · '+o.landArea+' m² Grundstück</p><div class="price">'+esc(price)+'</div><div class="row"><span class="small">'+esc(sqm)+' · Verfügbarkeit nicht live geprüft</span><a class="button secondary" href="'+esc(o.url)+'" target="_blank" rel="noopener noreferrer">Exposé ↗</a></div></article>'}
function renderListings(sources,grid){if($('verifiedListingsPanel'))return;const section=document.createElement('section');section.id='verifiedListingsPanel';section.style.margin='22px 0';section.innerHTML='<div class="section-head"><div><div class="eyebrow">Konkrete Objekte</div><h2 style="margin-top:7px">Aktuelle Treffer aus den Suchbenachrichtigungen</h2><p class="muted" style="margin:7px 0 0;max-width:800px">Hier erscheinen echte Objekte aus den Immobilien-Benachrichtigungen. Es werden nur Objektdaten und bereinigte Original-Exposé-Links gezeigt. Die aktuelle Verfügbarkeit wurde nicht live geprüft.</p></div><span class="pill">'+verifiedListings.length+' Objekte</span></div><div class="cards">'+verifiedListings.map(listingCard).join('')+'</div>';if(grid)sources.insertBefore(section,grid);else sources.appendChild(section)}
function init(){
  const sources=$('sourcesView');if(!sources||$('savedSearchPanel'))return;
  const pane=document.createElement('section');pane.id='savedSearchPanel';pane.className='panel';pane.style.margin='16px 0';pane.innerHTML=`
    <div class="row" style="align-items:flex-start"><h2 style="margin:0">ImmoScout24 · dein Suchauftrag</h2><span class="tag">Häuser kaufen · Feldkirchen</span></div>
    <p class="muted" style="line-height:1.6;margin:14px 0">Mittelpunkt 48,14786 / 11,72973. Deine ursprüngliche Suche hat <strong>50 km</strong> Umkreis; ImmoRadar bietet zusätzlich einen direkten Suchlink für <strong>100 km</strong>. Beide Links enthalten keine persönlichen Suchauftrags- oder E-Mail-Tracking-IDs.</p>
    <div class="buttons"><a class="button" id="searchScout50" target="_blank" rel="noopener noreferrer">Häuser · 50 km ↗</a><a class="button secondary" id="searchScout100" target="_blank" rel="noopener noreferrer">Häuser · 100 km ↗</a></div>
    <p class="helper">Die 100-km-Variante verändert nicht deinen gespeicherten Suchauftrag oder dessen E-Mail-Benachrichtigungen bei ImmoScout24. Den Radius für Benachrichtigungen dort selbst ändern.</p>
    <details style="margin-top:14px"><summary style="cursor:pointer;color:#a9c9d8">Persönlichen Original-Suchlink nur in diesem Browser speichern</summary><label class="field"><span>Dein persönlicher ImmoScout24-Suchlink</span><input id="searchScoutPersonal" type="url" placeholder="https://www.immobilienscout24.de/Suche/..." autocomplete="off"></label><div class="buttons"><button type="button" class="button secondary" id="saveScoutPersonal">Link lokal speichern</button><a id="openScoutPersonal" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>Meinen Suchauftrag öffnen ↗</a><button type="button" class="button ghost" id="deleteScoutPersonal">Link entfernen</button></div><p class="helper" id="scoutPersonalStatus" role="status">Nur ImmoScout24-Suchlinks werden akzeptiert. Sie werden nicht zu GitHub übertragen.</p></details>`;
  const grid=$('sourceGrid');if(grid)sources.insertBefore(pane,grid);else sources.appendChild(pane);renderListings(sources,grid);
  $('searchScout50').href=anonymousSearch(50);$('searchScout100').href=anonymousSearch(100);
  const input=$('searchScoutPersonal'),open=$('openScoutPersonal'),status=$('scoutPersonalStatus');
  function updatePersonal(){const value=stored();open.hidden=!value;if(value)open.href=value;else open.removeAttribute('href');input.value=value||''}
  $('saveScoutPersonal').onclick=()=>{const value=validPersonalUrl(input.value);if(!value){status.textContent='Bitte einen gültigen HTTPS-Suchlink von immobilienscout24.de eingeben.';return}if(!persist(value)){status.textContent='Lokales Speichern wurde vom Browser verhindert.';return}updatePersonal();status.textContent='Nur in diesem Browser gespeichert. Kein Upload, keine automatische Portalabfrage.'};
  $('deleteScoutPersonal').onclick=()=>{if(!persist(null)){status.textContent='Lokales Entfernen wurde vom Browser verhindert.';return}updatePersonal();status.textContent='Persönlicher Suchlink aus diesem Browser entfernt.'};updatePersonal();
}
init();
})();