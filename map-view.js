/* Individual property pins, zoom-aware spider clusters, and a separate unlocated-drawer.
 * Never represent an unknown address as a real geographic position.
 * Leaflet + OpenStreetMap tiles; embedded OpenStreetMap remains as fallback.
 */
(function(root){'use strict';
const D=root.ImmoRadarMapCore;
const $=id=>document.getElementById(id);
let map=null,groupLayer=null,spiderLayer=null,circle=null,rows=[],tilesReady=false,expandedKey=null;
const node=(tag,value,cls)=>{
  const el=document.createElement(tag);
  if(value!==undefined)el.textContent=value;
  if(cls)el.className=cls;
  return el;
};
function openObject(listing){
  if(typeof root.ImmoRadarOpenDetail==='function')root.ImmoRadarOpenDetail(listing.url);
}
function analyzeButton(listing){
  const btn=node('button','Objekt analysieren','map-popup-action');
  btn.type='button';
  btn.addEventListener('click',()=>openObject(listing));
  return btn;
}
function popup(listing,approximate=false){
  const wrap=node('div',undefined,'map-popup');
  wrap.appendChild(node('strong',listing.title||'Immobilienangebot'));
  wrap.appendChild(node('div',listing.location||'Ort nicht angegeben'));
  wrap.appendChild(node('p',approximate?'Nur ungefährer Ortsmittelpunkt – KEINE Objektadresse.':'Koordinaten aus dem Datensatz – nicht zusätzlich geprüft.','map-popup-disclaimer'));
  if(listing.price!==null&&listing.price!==undefined&&listing.price!==''&&Number.isFinite(Number(listing.price)))
    wrap.appendChild(node('div',Number(listing.price).toLocaleString('de-DE')+' €'));
  wrap.appendChild(analyzeButton(listing));
  return wrap;
}
function listingRow(listing){
  const el=node('div',undefined,'map-area-listing');
  el.appendChild(node('span',listing.title||'Immobilienangebot'));
  const meta=node('small',[listing.location||'Ort unbekannt',listing.portal||''].filter(Boolean).join(' · '));
  el.appendChild(meta);
  el.appendChild(analyzeButton(listing));
  return el;
}
function drawGroups(pins){
  const host=$('mapAreaGroups');
  if(!host)return;
  host.replaceChildren();
  const keyed=new Map();
  for(const pos of pins.positions){
    const k=pos.approximate?pos.key:'Exakte Koordinaten aus Datenquelle';
    if(!keyed.has(k))keyed.set(k,[]);
    keyed.get(k).push(pos.listing);
  }
  for(const [key,listings] of keyed){
    const d=node('details',undefined,'map-area-group');
    d.appendChild(node('summary',key+' · '+listings.length+' Angebote'));
    const inner=node('div',undefined,'map-area-group-content');
    inner.appendChild(node('p',key==='Exakte Koordinaten aus Datenquelle'?'Koordinaten im Datensatz; nicht zusätzlich überprüft.':'Nur ungefährer Ortsmittelpunkt – keine Objektadresse.','map-popup-disclaimer'));
    for(const o of listings)inner.appendChild(listingRow(o));
    d.appendChild(inner);
    host.appendChild(d);
  }
  if(pins.unlocated.length){
    const d=node('details',undefined,'map-area-group');
    d.appendChild(node('summary','Ohne Standort · '+pins.unlocated.length+' Angebote'));
    const inner=node('div',undefined,'map-area-group-content');
    for(const o of pins.unlocated)inner.appendChild(listingRow(o));
    d.appendChild(inner);
    host.appendChild(d);
  }
  if(!host.children.length)host.appendChild(node('p','Keine Angebote in dieser Auswahl.'));
}
function setUnlocatedVisible(open){
  const toggle=$('unlocatedToggle'),panel=$('unlocatedPanel');
  if(!toggle||!panel)return;
  panel.hidden=!open;
  toggle.setAttribute('aria-expanded',String(open));
}
function unlocated(pins){
  const apartments=pins.unlocated.filter(o=>root.ImmoRadarCore?.type(o)==='apartment');
  const badge=$('unlocatedToggle'),count=$('unlocatedCount'),list=$('unlocatedList');
  if(!badge||!count||!list)return;
  badge.hidden=apartments.length===0;
  count.textContent=apartments.length;
  list.replaceChildren();
  for(const o of apartments)list.appendChild(listingRow(o));
  if(!apartments.length)setUnlocatedVisible(false);
}
function clearSpiders(){
  if(spiderLayer)spiderLayer.clearLayers();
  expandedKey=null;
}
function markerIcon(kind,count=1,expanded=false){
  const cluster=count>1;
  const label=cluster?String(count):(kind==='apartment'?'W':'H');
  const cls='map-pin-symbol '+(cluster?'map-pin-cluster':'map-pin-single')+
    ' '+(kind==='apartment'?'map-pin-apartment':'map-pin-house')+(expanded?' map-pin-expanded':'');
  return root.L.divIcon({className:cls,html:'<span>'+label+'</span>',iconSize:[cluster?40:30,cluster?40:30],iconAnchor:[cluster?20:15,cluster?20:15]});
}
function addSingle(pin,position,layer=groupLayer){
  const marker=root.L.marker(position||[pin.lat,pin.lon],{
    icon:markerIcon(root.ImmoRadarCore?.type(pin.listing)),keyboard:true,
    title:(pin.listing.title||'Immobilie')+(pin.approximate?' – Ortsmittelpunkt, keine Adresse':'')
  });
  marker.bindPopup(popup(pin.listing,pin.approximate),{maxWidth:330});
  marker.on('click',e=>{root.L.DomEvent.stopPropagation(e);});
  marker.addTo(layer);
}
function drawSpider(cluster,latLng,key){
  clearSpiders();
  expandedKey=key;
  const center=map.latLngToLayerPoint(latLng);
  const offsets=D.spiderOffsets(cluster.length);
  cluster.forEach((p,i)=>{
    const offset=offsets[i],tip=map.layerPointToLatLng(root.L.point(center.x+offset.x,center.y+offset.y));
    root.L.polyline([latLng,tip],{color:'#795c37',weight:1.8,opacity:.85,interactive:false,className:'map-spider-leg'}).addTo(spiderLayer);
    addSingle(p,tip,spiderLayer);
  });
}
function renderMarkers(){
  if(!map||!groupLayer||!root.L)return;
  clearSpiders();
  groupLayer.clearLayers();
  const positions=D.pins(rows).positions;
  const clusters=D.clusters(positions,(lat,lon)=>{
    const p=map.latLngToLayerPoint([lat,lon]);
    return {x:p.x,y:p.y};
  },46);
  for(let i=0;i<clusters.length;i++){
    const group=clusters[i];
    if(group.length===1){addSingle(group[0]);continue}
    const center=group.reduce((acc,p)=>{
      const pt=map.latLngToLayerPoint([p.lat,p.lon]);
      acc.x+=pt.x;acc.y+=pt.y;return acc;
    },{x:0,y:0});
    const latLng=map.layerPointToLatLng(root.L.point(center.x/group.length,center.y/group.length));
    const type=group.some(p=>root.ImmoRadarCore?.type(p.listing)==='apartment')?'apartment':'house';
    const marker=root.L.marker(latLng,{icon:markerIcon(type,group.length),keyboard:true,title:group.length+' Immobilien – klicken zum Auffächern'});
    marker.on('click',ev=>{
      root.L.DomEvent.stopPropagation(ev);
      const key=group.map(p=>p.listing.url||p.listing.title).join('|');
      if(expandedKey===key){clearSpiders();return}
      drawSpider(group,latLng,key);
    });
    marker.addTo(groupLayer);
  }
}
function update(next){
  rows=Array.isArray(next)?next:[];
  const pins=D.pins(rows);
  drawGroups(pins);
  unlocated(pins);
  const approximates=pins.positions.filter(p=>p.approximate).length;
  const exact=pins.positions.length-approximates;
  const missingApartments=pins.unlocated.filter(o=>root.ImmoRadarCore?.type(o)==='apartment').length;
  if($('mapCount'))$('mapCount').textContent=pins.positions.length+' Einzelpins · '+missingApartments+' ohne Ort';
  if($('mapNote'))$('mapNote').textContent=
    pins.positions.length+' von '+rows.length+' Angeboten als Einzelpins verfügbar ('+
    approximates+' nur ungefähr am Ortsmittelpunkt, '+exact+' mit Koordinaten im Datensatz). '+
    missingApartments+' Wohnungen ohne zuordenbaren Ort rechts gesammelt. Ein Klick auf eine Zahl fächert alle Objekte auf; die Ortsmarker sind keine Gebäudeadressen. Quellen: GeoNames / OpenStreetMap.';
  renderMarkers();
}
function init(){
  const el=$('mapInteractive');
  if(!el||!D)return;
  $('unlocatedToggle')?.addEventListener('click',()=>setUnlocatedVisible($('unlocatedPanel')?.hidden));
  $('unlocatedClose')?.addEventListener('click',()=>{setUnlocatedVisible(false);$('unlocatedToggle')?.focus()});
  // Embedded map remains readable when external Leaflet resources or tile servers are unavailable.
  if(!root.L){update(rows);return}
  try{
    map=root.L.map(el,{scrollWheelZoom:false,zoomControl:true});
    const tiles=root.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap-Mitwirkende</a> · Orte: <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a>'
    });
    tiles.on('tileload',()=>{
      if(tilesReady)return;
      tilesReady=true;
      el.style.visibility='visible';
      el.removeAttribute('aria-hidden');
      const frame=$('mapFallback');
      if(frame)frame.hidden=true;
    });
    tiles.addTo(map);
    const center=[D.searchCenter.lat,D.searchCenter.lon];
    circle=root.L.circle(center,{radius:D.radiusKm*1000,color:'#196b4b',weight:2,fillColor:'#196b4b',fillOpacity:.08,interactive:false}).addTo(map);
    root.L.circleMarker(center,{radius:7,color:'#fff',weight:3,fillColor:'#13251d',fillOpacity:1})
      .bindPopup('Suchmittelpunkt: 85622 Feldkirchen bei München').addTo(map);
    groupLayer=root.L.layerGroup().addTo(map);
    spiderLayer=root.L.layerGroup().addTo(map);
    $('mapReset')?.addEventListener('click',()=>{
      clearSpiders();
      if(tilesReady)map.fitBounds(circle.getBounds(),{padding:[22,22],maxZoom:11});
      else {const frame=$('mapFallback');if(frame)frame.src=frame.src}
    });
    map.on('click',clearSpiders);
    map.on('zoomstart',clearSpiders);
    map.on('zoomend',renderMarkers);
    map.fitBounds(circle.getBounds(),{padding:[22,22],maxZoom:11});
    update(rows);
    root.setTimeout(()=>{if(map)map.invalidateSize()},0);
  }catch(err){
    if(map){try{map.remove()}catch{}}
    map=null;groupLayer=null;spiderLayer=null;
    el.style.visibility='hidden';el.setAttribute('aria-hidden','true');
    if(root.console?.warn)root.console.warn('Map fallback enabled',err);
    update(rows);
  }
}
root.ImmoRadarMap=Object.freeze({update});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})(globalThis);
