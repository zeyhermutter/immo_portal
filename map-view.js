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
function update(next){
  rows=Array.isArray(next)?next:[];
  const grouped=D.grouping(rows);
  const total=grouped.exact.length+grouped.localities.reduce((n,g)=>n+g.listings.length,0);
  const areaCount=grouped.localities.length;
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
  const el=$('propertyMap');
  if(!el||!D)return;
  if(!root.L){
    el.innerHTML='<div class="map-unavailable">Die Karte konnte nicht geladen werden. <a href="https://www.openstreetmap.org/#map=9/48.14786/11.72973" target="_blank" rel="noopener noreferrer">Suchgebiet in OpenStreetMap öffnen ↗</a></div>';
    update(rows);
    return;
  }
  el.textContent='';
  map=root.L.map(el,{scrollWheelZoom:false,zoomControl:true});
  root.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap-Mitwirkende</a> · Orte: <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a>'
  }).addTo(map);
  const center=[D.searchCenter.lat,D.searchCenter.lon];
  const circle=root.L.circle(center,{radius:D.radiusKm*1000,color:'#196b4b',weight:2,fillColor:'#196b4b',fillOpacity:.08,interactive:false}).addTo(map);
  root.L.circleMarker(center,{radius:7,color:'#fff',weight:3,fillColor:'#13251d',fillOpacity:1})
    .bindPopup('Suchmittelpunkt: 85622 Feldkirchen bei München').addTo(map);
  markers=root.L.layerGroup().addTo(map);
  const reset=()=>map.fitBounds(circle.getBounds(),{padding:[22,22],maxZoom:11});
  $('mapReset')?.addEventListener('click',reset);
  reset();
  update(rows);
  root.setTimeout(()=>map.invalidateSize(),0);
}
root.ImmoRadarMap=Object.freeze({update});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})(globalThis);
