/* Leaflet + OpenStreetMap tiles. Locality pins use static GeoNames area centers, NOT listing addresses. */
(function(root){'use strict';
const D=root.ImmoRadarMapCore;
let map=null,markers=null,rows=[];
const $=id=>document.getElementById(id);
function node(tag,text,className){
  const el=document.createElement(tag);
  if(text!==undefined)el.textContent=text;
  if(className)el.className=className;
  return el;
}
function analyzeButton(listing){
  const btn=node('button','Objekt analysieren','map-popup-action');
  btn.type='button';
  btn.addEventListener('click',()=>{if(typeof root.ImmoRadarOpenDetail==='function')root.ImmoRadarOpenDetail(listing.url)});
  return btn;
}
function exactPopup(listing){
  const wrap=node('div',undefined,'map-popup');
  wrap.appendChild(node('strong',listing.title||'Immobilie'));
  wrap.appendChild(node('div',listing.location||'Ort unbekannt'));
  wrap.appendChild(node('small','Koordinaten im Datensatz · Position nicht zusätzlich geprüft'));
  if(listing.price!==null&&listing.price!==undefined&&listing.price!==''&&Number.isFinite(Number(listing.price)))
    wrap.appendChild(node('div',Number(listing.price).toLocaleString('de-DE')+' €'));
  wrap.appendChild(analyzeButton(listing));
  return wrap;
}
function localityPopup(group){
  const wrap=node('div',undefined,'map-popup');
  wrap.appendChild(node('strong',group.key+' · '+group.listings.length+' Angebote'));
  wrap.appendChild(node('p','Ungefährer Ortsmittelpunkt, KEINE Objektposition. Die Anzeigen können an anderer Stelle in diesem Ort liegen.','map-popup-disclaimer'));
  const list=node('div',undefined,'map-popup-list');
  for(const listing of group.listings){
    const row=node('div',undefined,'map-popup-listing');
    row.appendChild(node('span',listing.title||'Immobilienangebot'));
    row.appendChild(analyzeButton(listing));
    list.appendChild(row);
  }
  wrap.appendChild(list);
  return wrap;
}
function drawGroups(grouped){
  const host=$('mapAreaGroups');
  if(!host)return;
  host.replaceChildren();
  if(!grouped.localities.length){
    host.appendChild(node('p','Keine Angebote mit zuordenbarer Ortsangabe in dieser Auswahl.'));
    return;
  }
  for(const group of grouped.localities){
    const details=node('details',undefined,'map-area-group');
    const summary=node('summary',group.key+' · '+group.listings.length+' Angebote');
    details.appendChild(summary);
    const inner=node('div',undefined,'map-area-group-content');
    inner.appendChild(node('p','Ortsmittelpunkt, keine genaue Objektadresse.','map-popup-disclaimer'));
    for(const listing of group.listings){
      const row=node('div',undefined,'map-area-listing');
      row.appendChild(node('span',listing.title||'Immobilienangebot'));
      row.appendChild(analyzeButton(listing));
      inner.appendChild(row);
    }
    details.appendChild(inner);
    host.appendChild(details);
  }
}
function update(next){
  rows=Array.isArray(next)?next:[];
  const grouped=D.grouping(rows);
  const total=grouped.exact.length+grouped.localities.reduce((n,g)=>n+g.listings.length,0);
  const areaCount=grouped.localities.length;
  drawGroups(grouped);
  if($('mapCount'))$('mapCount').textContent=total+' Angebote verortet';
  if($('mapNote'))$('mapNote').textContent=total+' von '+rows.length+' gefilterten Angeboten zugeordnet: '+areaCount+' Ortsgruppen (nur ungefähre Ortspunkte), '+grouped.exact.length+' Datensätze mit Koordinaten. '+grouped.withoutLocation+' ohne zuordenbaren Standort. Keine Adressschätzung. Ortsdaten: GeoNames; Karte: OpenStreetMap.';
  if(!markers||!root.L)return;
  markers.clearLayers();
  for(const p of grouped.exact){
    root.L.circleMarker([p.lat,p.lon],{
      radius:7,weight:2,color:'#fff',fillColor:p.listing.propertyType==='apartment'?'#c28d42':'#196b4b',fillOpacity:.95
    }).bindPopup(exactPopup(p.listing),{maxWidth:320}).addTo(markers);
  }
  for(const group of grouped.localities){
    root.L.marker([group.lat,group.lon],{
      icon:root.L.divIcon({className:'map-area-pin',html:'<span>'+group.listings.length+'</span>',iconSize:[36,36],iconAnchor:[18,18]})
    }).bindPopup(localityPopup(group),{maxWidth:340}).addTo(markers);
  }
}
function init(){
  const el=$('mapInteractive');
  if(!el||!D)return;
  // The embedded OpenStreetMap map is visible in HTML immediately. Leaflet is
  // progressively added only after a REAL tile image was received successfully.
  if(!root.L){
    update(rows);
    return;
  }
  try{
    map=root.L.map(el,{scrollWheelZoom:false,zoomControl:true});
    const tiles=root.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap-Mitwirkende</a> · Orte: <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a>'
    });
    let enhanced=false;
    tiles.on('tileload',()=>{
      if(enhanced)return;
      enhanced=true;
      // Never hide the working fallback until a tile actually renders.
      el.style.visibility='visible';
      el.removeAttribute('aria-hidden');
      const frame=$('mapFallback');
      if(frame)frame.hidden=true;
    });
    tiles.addTo(map);
    const center=[D.searchCenter.lat,D.searchCenter.lon];
    const circle=root.L.circle(center,{radius:D.radiusKm*1000,color:'#196b4b',weight:2,fillColor:'#196b4b',fillOpacity:.08,interactive:false}).addTo(map);
    root.L.circleMarker(center,{radius:7,color:'#fff',weight:3,fillColor:'#13251d',fillOpacity:1})
      .bindPopup('Suchmittelpunkt: 85622 Feldkirchen bei München').addTo(map);
    markers=root.L.layerGroup().addTo(map);
    const reset=()=> {
      if(enhanced)map.fitBounds(circle.getBounds(),{padding:[22,22],maxZoom:11});
      else {
        const frame=$('mapFallback');
        if(frame)frame.src=frame.src; // Reset an optionally panned embedded map.
      }
    };
    $('mapReset')?.addEventListener('click',reset);
    map.fitBounds(circle.getBounds(),{padding:[22,22],maxZoom:11});
    update(rows);
    root.setTimeout(()=>{if(map)map.invalidateSize()},0);
  }catch(error){
    // A failed Leaflet load must not break filters or remove the embedded map.
    if(map){try{map.remove()}catch{}}
    map=null;markers=null;
    el.style.visibility='hidden';
    el.setAttribute('aria-hidden','true');
    update(rows);
    if(root.console?.warn)root.console.warn('OpenStreetMap interactive layer unavailable',error);
  }
}
root.ImmoRadarMap=Object.freeze({update});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})(globalThis);
