/* Leaflet and OpenStreetMap tiles are loaded from external providers. No automatic geocoding. */
(function(root){'use strict';
const D=root.ImmoRadarMapCore;
let map=null,markers=null,rows=[];
const $=id=>document.getElementById(id);
function countText(points){
  const missing=rows.length-points.length;
  return points.length+' von '+rows.length+' gefilterten Objekten auf der Karte · '+missing+' ohne belegte Position im 100-km-Gebiet';
}
function popup(listing){
  const wrap=document.createElement('div');
  wrap.className='map-popup';
  const title=document.createElement('strong');
  title.textContent=listing.title||'Immobilie';
  wrap.appendChild(title);
  const loc=document.createElement('div');
  loc.textContent=listing.location||'Ort nicht angegeben';
  wrap.appendChild(loc);
  if(Number.isFinite(Number(listing.price))&&listing.price!==null&&listing.price!==''){
    const price=document.createElement('div');
    price.textContent=Number(listing.price).toLocaleString('de-DE')+' €';
    wrap.appendChild(price);
  }
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='map-popup-action';
  btn.textContent='Objekt analysieren';
  btn.addEventListener('click',()=>{if(typeof root.ImmoRadarOpenDetail==='function')root.ImmoRadarOpenDetail(listing.url)});
  wrap.appendChild(btn);
  return wrap;
}
function update(next){
  rows=Array.isArray(next)?next:[];
  const points=D.located(rows);
  if($('mapCount'))$('mapCount').textContent=points.length+' Kartenmarker';
  if($('mapNote'))$('mapNote').textContent=countText(points)+'. Objektpositionen werden nicht geschätzt. Kartendaten: OpenStreetMap.';
  if(!markers||!root.L)return;
  markers.clearLayers();
  for(const p of points){
    const listing=p.listing;
    root.L.circleMarker([p.lat,p.lon],{
      radius:7,weight:2,color:'#ffffff',fillColor:listing.propertyType==='apartment'?'#c28d42':'#196b4b',fillOpacity:.95
    }).bindPopup(popup(listing),{maxWidth:280}).addTo(markers);
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
    maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap-Mitwirkende</a>'
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
