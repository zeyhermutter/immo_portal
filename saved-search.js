(function(){
'use strict';
const STORAGE_KEY='immoradar-private-immoscout-search-v1';
const ROOT='https://www.immobilienscout24.de/Suche/radius/haus-kaufen';
const ADDRESS='M%C3%BCnchen%20(Kreis);;;;;Feldkirchen;';
const COORDS='48.14786;11.72973';
const $=id=>document.getElementById(id);
function anonymousSearch(radius) {
  return ROOT+'?centerofsearchaddress='+ADDRESS+'&geocoordinates='+COORDS+';'+radius+'.0';
}
function validPersonalUrl(value){
  try{
    const u=new URL(String(value||'').trim());
    return u.protocol==='https:'&&
      ['www.immobilienscout24.de','immobilienscout24.de'].includes(u.hostname.toLowerCase())&&
      u.pathname.startsWith('/Suche/')&&!u.username&&!u.password&&
      u.href.length<4096?u.href:null;
  }catch{return null}
}
function stored(){try{return validPersonalUrl(localStorage.getItem(STORAGE_KEY)||'')}catch{return null}}
function persist(url){
  try{if(url)localStorage.setItem(STORAGE_KEY,url);else localStorage.removeItem(STORAGE_KEY);return true}catch{return false}
}
function init(){
  const sources=$('sourcesView');if(!sources||$('savedSearchPanel'))return;
  const pane=document.createElement('section');
  pane.id='savedSearchPanel';pane.className='panel';pane.style.margin='16px 0';
  pane.innerHTML=`
    <div class="row" style="align-items:flex-start">
      <h2 style="margin:0">ImmoScout24 · dein Suchauftrag</h2>
      <span class="tag">Häuser kaufen · Feldkirchen</span>
    </div>
    <p class="muted" style="line-height:1.6;margin:14px 0">
      Mittelpunkt 48,14786 / 11,72973. Deine ursprüngliche Suche hat <strong>50 km</strong> Umkreis;
      ImmoRadar bietet zusätzlich einen direkten Suchlink für <strong>100 km</strong>.
      Beide Links enthalten keine persönlichen Suchauftrags- oder E-Mail-Tracking-IDs.
    </p>
    <div class="buttons">
      <a class="button" id="searchScout50" target="_blank" rel="noopener noreferrer">Häuser · 50 km ↗</a>
      <a class="button secondary" id="searchScout100" target="_blank" rel="noopener noreferrer">Häuser · 100 km ↗</a>
    </div>
    <p class="helper">
      Die 100-km-Variante verändert nicht deinen gespeicherten Suchauftrag oder dessen E-Mail-Benachrichtigungen
      bei ImmoScout24. Den Radius für Benachrichtigungen dort selbst ändern.
    </p>
    <details style="margin-top:14px">
      <summary style="cursor:pointer;color:#a9c9d8">Persönlichen Original-Suchlink nur in diesem Browser speichern</summary>
      <label class="field"><span>Dein persönlicher ImmoScout24-Suchlink</span>
        <input id="searchScoutPersonal" type="url" placeholder="https://www.immobilienscout24.de/Suche/..." autocomplete="off">
      </label>
      <div class="buttons">
        <button type="button" class="button secondary" id="saveScoutPersonal">Link lokal speichern</button>
        <a id="openScoutPersonal" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>Meinen Suchauftrag öffnen ↗</a>
        <button type="button" class="button ghost" id="deleteScoutPersonal">Link entfernen</button>
      </div>
      <p class="helper" id="scoutPersonalStatus" role="status">
        Nur ImmoScout24-Suchlinks werden akzeptiert. Sie werden nicht zu GitHub übertragen.
      </p>
    </details>`;
  const grid=$('sourceGrid');
  if(grid)sources.insertBefore(pane,grid);else sources.appendChild(pane);
  $('searchScout50').href=anonymousSearch(50);
  $('searchScout100').href=anonymousSearch(100);
  const input=$('searchScoutPersonal'),open=$('openScoutPersonal'),status=$('scoutPersonalStatus');
  function updatePersonal(){
    const value=stored();open.hidden=!value;
    if(value)open.href=value;else open.removeAttribute('href');
    input.value=value||'';
  }
  $('saveScoutPersonal').onclick=()=>{
    const value=validPersonalUrl(input.value);
    if(!value){status.textContent='Bitte einen gültigen HTTPS-Suchlink von immobilienscout24.de eingeben.';return}
    if(!persist(value)){status.textContent='Lokales Speichern wurde vom Browser verhindert.';return}
    updatePersonal();status.textContent='Nur in diesem Browser gespeichert. Kein Upload, keine automatische Portalabfrage.';
  };
  $('deleteScoutPersonal').onclick=()=>{
    if(!persist(null)){status.textContent='Lokales Entfernen wurde vom Browser verhindert.';return}
    updatePersonal();status.textContent='Persönlicher Suchlink aus diesem Browser entfernt.';
  };
  updatePersonal();
}
init();
})();