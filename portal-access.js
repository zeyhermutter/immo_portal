/* Provider connection overview. No portal websites are scraped or connected here. */
(()=>{'use strict';
const providers=[
 {name:'ImmoScout24',type:'Content-Partner-API',status:'Sonderfreigabe erforderlich',
  detail:'Eine Such-API existiert, ist aber Content-Partnern vorbehalten. Die regulären Nutzungsbedingungen untersagen eigene Datenbanken und Preisanalysen und beschränken das Speichern. Für den ImmoRadar-Score ist daher eine ausdrücklich abweichende Vereinbarung nötig.',
  docs:'https://api.immobilienscout24.de/api-docs/search/introduction/',
  terms:'https://api.immobilienscout24.de/terms-of-use/de/',
  access:'https://api.immobilienscout24.de/more/api-permission-request/'},
 {name:'immowelt',type:'SOAP-Webservices / Partner-API',status:'Partnerzugang erforderlich',
  detail:'Die API ist dokumentiert, benötigt aber einen API-Key und vereinbarte Nutzungsrechte. Die Standardanbindung ist auf Partner und deren eigene Immobilienangebote ausgelegt; eine portalübergreifende Preisanalyselizenz muss gesondert vereinbart werden.',
  docs:'https://www.immowelt.de/anbieten/gewerbe/apitechdoku',
  terms:'https://www.immowelt.de/meineimmowelt/apinutzungsbedingungen.aspx',
  access:'https://www.immowelt.de/anbieten/gewerbe/homepage-extras'},
 {name:'Kleinanzeigen',type:'OpenImmo-Import für Inserenten',status:'Keine freie Such-API bestätigt',
  detail:'Der dokumentierte OpenImmo-Weg dient Partnern zum Hochladen ihrer eigenen Immobilienanzeigen. Er ist keine allgemeine Such- oder Download-Schnittstelle für fremde Angebote.',
  docs:'https://hilfe-gewerblich.kleinanzeigen.de/artikel/schnittstellen',
  terms:null,access:null},
 {name:'Immonet',type:'Aktuell kein gesonderter Feed bestätigt',status:'Zugang individuell klären',
  detail:'Für Immonet ist in diesem Projekt keine gesonderte dokumentierte API-Suchberechtigung nachgewiesen. Die bisherigen externen Suchlinks bleiben nutzbar.',
  docs:null,terms:null,access:null},
 {name:'Freigegebene Maklerfeeds',type:'JSON / OpenImmo-XML',status:'Technik vorbereitet',
  detail:'Mit ausdrücklicher Genehmigung eines Dateninhabers können dessen Immobilien per JSON-Feed (automatisch) oder OpenImmo XML (manuell) ins Cockpit übernommen werden. Rechte für Speicherung, Vergleich, Analyse und Veröffentlichung einzeln prüfen.',
  docs:'https://www.openimmo.de/',terms:null,access:null}
];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const $=id=>document.getElementById(id);
function render(){
 const pane=$('portalsView');if(!pane)return;
 const banner='<div class="notice"><strong>Stand der Anbindungen: kein automatischer Portalabruf aktiv.</strong> Wir verlinken weiterhin auf die Originalportale. Eine API-Beschreibung allein gibt noch keine Rechte, Daten zu speichern, zu kombinieren oder für die Schnäppchen-Erkennung auszuwerten. Keine Zugangsdaten auf dieser öffentlichen Website eingeben.</div>';
 const cards=providers.map(p=>{
 const links=[p.docs&&'<a class="button secondary" target="_blank" rel="noopener noreferrer" href="'+esc(p.docs)+'">Offizielle Dokumentation ↗</a>',p.terms&&'<a class="button ghost" target="_blank" rel="noopener noreferrer" href="'+esc(p.terms)+'">Nutzungsbedingungen ↗</a>',p.access&&'<a class="button ghost" target="_blank" rel="noopener noreferrer" href="'+esc(p.access)+'">Zugang beantragen ↗</a>'].filter(Boolean).join('');
 return '<article class="cockpit-box"><div class="row"><h3 style="margin:0">'+esc(p.name)+'</h3><span class="tag">'+esc(p.status)+'</span></div><p class="small" style="margin:10px 0">'+esc(p.type)+'</p><p class="muted">'+esc(p.detail)+'</p><div class="buttons">'+links+'</div></article>';
 }).join('');
 const settings='<div class="cockpit-box"><h3>Einrichtung eines zulässigen Datenfeeds</h3><p class="muted">Ein Feed funktioniert nur mit schriftlicher oder vertraglicher Erlaubnis für automatischen Abruf, Speicherung, Preisanalysen und Anzeige gemeinsam mit anderen Quellen. Berechtigte JSON-Feeds lassen sich unter <code>config/feeds.json</code> einrichten. Zugangstoken gehören ausschließlich in GitHub Actions Secrets – niemals in den Browser oder ins Repository.</p><p class="helper">Für ImmoScout24 und immowelt gelten gesonderte produktspezifische API-Verträge. Die allgemeine JSON-Anbindung ist kein Ersatz für deren Authentifizierung oder Nutzungsfreigabe.</p><div class="buttons"><a class="button secondary" href="https://github.com/zeyhermutter/immo_portal/blob/main/docs/PORTAL_ACCESS.md" target="_blank" rel="noopener noreferrer">Einrichtungsanleitung ↗</a><button class="button" id="sourceSearch" type="button">Externe Suchlinks anzeigen</button></div></div>';
 pane.innerHTML=banner+'<div class="source-grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))">'+cards+'</div>'+settings;
 $('sourceSearch').onclick=()=>switchTab('sources');
}
function init(){
 const bar=document.querySelector('.tabs'),section=$('guideView')?.parentElement;
 if(!bar||!section||$('portalsView'))return;
 const tab=document.createElement('button');tab.className='tab';tab.dataset.tab='portals';tab.textContent='API-Anbindungen';tab.type='button';tab.onclick=()=>switchTab('portals');bar.appendChild(tab);
 const view=document.createElement('div');view.id='portalsView';view.hidden=true;section.appendChild(view);
}
init();
window.portalAccessRender=()=>{if(document.querySelector('.tab.active')?.dataset.tab==='portals')render()};
})();