/* ImmoRadar property map: visible pins, locality focus, clustering + spiderfy.
 * Unlocated apartment drawer is non-geographic. Any locality position is APPROXIMATE.
 * Leaflet tiles and markers share ONE map transform; static iframe is used only when Leaflet is unavailable.
 */
(function(root){'use strict';
const D=root.ImmoRadarMapCore,$=id=>document.getElementById(id);
let map=null,groupLayer=null,spiderLayer=null,circle=null,rows=[],tilesReady=false,expandedKey=null,fallbackExpanded=null;
const initialBounds={west:10.35,south:47.23,east:13.11,north:49.07};
let fallbackBounds={...initialBounds};
function node(tag,value,cls){
  const el=document.createElement(tag);
  if(value!==undefined)el.textContent=value;
  if(cls)el.className=cls;
  return el;
}
function openObject(o){if(o?.url&&typeof root.ImmoRadarOpenDetail==='function')root.ImmoRadarOpenDetail(o.url)}
function analyzeButton(o){
  const btn=node('button','Objekt analysieren','map-popup-action');
  btn.type='button';btn.addEventListener('click',()=>openObject(o));return btn;
}
function popup(o,approximate){
  const wrap=node('div',undefined,'map-popup');
  wrap.appendChild(node('strong',o.title||'Immobilienangebot'));
  wrap.appendChild(node('div',o.location||'Ort unbekannt'));
  wrap.appendChild(node('p',approximate?'Ungefährer Ortsmittelpunkt – KEINE Objektadresse.':'Koordinaten aus dem Datensatz – nicht zusätzlich geprüft.','map-popup-disclaimer'));
  if(o.price!==null&&o.price!==undefined&&o.price!==''&&Number.isFinite(Number(o.price)))
    wrap.appendChild(node('div',Number(o.price).toLocaleString('de-DE')+' €'));
  wrap.appendChild(analyzeButton(o));
  return wrap;
}
function listingRow(o){
  const row=node('div',undefined,'map-area-listing');
  row.appendChild(node('span',o.title||'Immobilienangebot'));
  row.appendChild(node('small',[o.location||'Ort unbekannt',o.portal||''].filter(Boolean).join(' · ')));
  row.appendChild(analyzeButton(o));
  return row;
}
function setUnlocatedVisible(open){
  const toggle=$('unlocatedToggle'),panel=$('unlocatedPanel');
  if(!toggle||!panel)return;
  panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
}
function drawUnlocated(data){
  const apartments=data.unlocated.filter(o=>root.ImmoRadarCore?.type(o)==='apartment');
  const btn=$('unlocatedToggle'),count=$('unlocatedCount'),list=$('unlocatedList');
  if(!btn||!count||!list)return;
  btn.hidden=!apartments.length;
  count.textContent=apartments.length;
  list.replaceChildren(...apartments.map(listingRow));
  if(!apartments.length)setUnlocatedVisible(false);
}
function centerOf(positions){
  const center=positions.reduce((a,p)=>({lat:a.lat+p.lat,lon:a.lon+p.lon}),{lat:0,lon:0});
  return {lat:center.lat/positions.length,lon:center.lon/positions.length};
}
function showGroup(positions){
  if(!positions.length)return;
  const c=centerOf(positions);
  setUnlocatedVisible(false);
  $('propertyMap')?.scrollIntoView({behavior:'smooth',block:'center'});
  if(map){
    const zoom=Math.max(12,map.getZoom());
    clearSpiders();
    map.once('moveend',()=>{
      renderMarkers();
      // Listings sharing an approximate town location fan out immediately.
      const same=positions.filter(p=>Math.abs(p.lat-c.lat)<0.00001&&Math.abs(p.lon-c.lon)<0.00001);
      if(same.length>1)drawSpider(same,[c.lat,c.lon],'selected-group:'+same.map(p=>p.listing.url).join('|'));
    });
    map.flyTo([c.lat,c.lon],zoom,{duration:.45});
  }else{
    focusFallback(c.lat,c.lon);
    const keys=positions.map(p=>p.listing.url).sort().join('|');
    fallbackExpanded=keys;
    drawFallback();
  }
}
function drawGroups(data){
  const host=$('mapAreaGroups');
  if(!host)return;
  host.replaceChildren();
  const groups=new Map();
  for(const p of data.positions){
    const key=p.approximate?p.key:'Koordinaten aus Datenquelle';
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(p);
  }
  for(const [key,positions] of groups){
    const details=node('details',undefined,'map-area-group');
    details.appendChild(node('summary',key+' · '+positions.length+' Angebote · auf Karte zeigen'));
    details.addEventListener('toggle',()=>{if(details.open)showGroup(positions)});
    const inner=node('div',undefined,'map-area-group-content');
    inner.appendChild(node('p',key==='Koordinaten aus Datenquelle'?'Koordinaten wurden nicht unabhängig überprüft.':'Ortsmitte, keine Objektadresse.','map-popup-disclaimer'));
    for(const p of positions)inner.appendChild(listingRow(p.listing));
    details.appendChild(inner);
    host.appendChild(details);
  }
  if(data.unlocated.length){
    const details=node('details',undefined,'map-area-group');
    details.appendChild(node('summary','Ohne Standort · '+data.unlocated.length+' Angebote'));
    const inner=node('div',undefined,'map-area-group-content');
    for(const o of data.unlocated)inner.appendChild(listingRow(o));
    details.appendChild(inner);host.appendChild(details);
  }
  if(!host.children.length)host.appendChild(node('p','Keine Angebote in dieser Auswahl.'));
}
function clearSpiders(){
  if(spiderLayer)spiderLayer.clearLayers();
  expandedKey=null;
}
function icon(type,count=1){
  const many=count>1;
  const cls='map-pin-symbol '+(many?'map-pin-cluster':'map-pin-single')+
    ' '+(type==='apartment'?'map-pin-apartment':'map-pin-house');
  return root.L.divIcon({className:cls,html:'<span>'+ (many?count:(type==='apartment'?'W':'H'))+'</span>',
    iconSize:[many?40:30,many?40:30],iconAnchor:[many?20:15,many?20:15]});
}
function addSingle(p,tip,layer=groupLayer){
  const marker=root.L.marker(tip||[p.lat,p.lon],{
    icon:icon(root.ImmoRadarCore?.type(p.listing)),
    title:(p.listing.title||'Immobilie')+(p.approximate?' – Ortsmittelpunkt':''),
    keyboard:true
  }).bindPopup(popup(p.listing,p.approximate),{maxWidth:330});
  marker.on('click',ev=>root.L.DomEvent.stopPropagation(ev));
  marker.addTo(layer);
  return marker;
}
function drawSpider(group,latLng,key){
  if(!map||!spiderLayer)return;
  clearSpiders();expandedKey=key;
  const origin=map.latLngToLayerPoint(latLng),offsets=D.spiderOffsets(group.length);
  group.forEach((p,i)=>{
    const tip=map.layerPointToLatLng(root.L.point(origin.x+offsets[i].x,origin.y+offsets[i].y));
    root.L.polyline([latLng,tip],{color:'#795c37',weight:1.8,opacity:.85,interactive:false,className:'map-spider-leg'}).addTo(spiderLayer);
    addSingle(p,tip,spiderLayer);
  });
}
function renderMarkers(){
  if(!map||!groupLayer||!root.L)return;
  clearSpiders();groupLayer.clearLayers();
  const clusters=D.clusters(D.pins(rows).positions,(lat,lon)=>{
    const pt=map.latLngToLayerPoint([lat,lon]);return {x:pt.x,y:pt.y};
  },46);
  for(const group of clusters){
    if(group.length===1){addSingle(group[0]);continue}
    const mean=group.reduce((a,p)=>{
      const v=map.latLngToLayerPoint([p.lat,p.lon]);a.x+=v.x;a.y+=v.y;return a;
    },{x:0,y:0});
    const center=map.layerPointToLatLng(root.L.point(mean.x/group.length,mean.y/group.length));
    const type=group.some(p=>root.ImmoRadarCore?.type(p.listing)==='apartment')?'apartment':'house';
    const marker=root.L.marker(center,{icon:icon(type,group.length),keyboard:true,title:group.length+' Objekte – anklicken zum Auffächern'});
    marker.on('click',ev=>{
      root.L.DomEvent.stopPropagation(ev);
      const key=group.map(p=>p.listing.url||p.listing.title).join('|');
      if(expandedKey===key){clearSpiders();return}
      drawSpider(group,center,key);
    });
    marker.addTo(groupLayer);
  }
}
/* Fallback single pins use a geographic projection and can zoom to localities.
 * They never claim house-accurate coordinates when a city centre was used.
 */
const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
function fallbackPoint(lat,lon,width,height){
  const b=fallbackBounds;
  return {
    x:(lon-b.west)/(b.east-b.west)*width,
    y:(merc(b.north)-merc(lat))/(merc(b.north)-merc(b.south))*height
  };
}
function updateFrame(){
  const frame=$('mapFallback');if(!frame||frame.hidden)return;
  const b=fallbackBounds;
  const bounds=[b.west,b.south,b.east,b.north].map(n=>n.toFixed(6)).join('%2C');
  const url='https://www.openstreetmap.org/export/embed.html?bbox='+bounds+'&layer=mapnik';
  if(frame.getAttribute('src')!==url)frame.setAttribute('src',url);
}
function focusFallback(lat,lon){
  const width=0.18,height=0.12;
  fallbackBounds={west:lon-width/2,east:lon+width/2,south:lat-height/2,north:lat+height/2};
  updateFrame();
  drawFallback();
}
function drawFallback(){
  const host=$('mapFallbackPins');if(!host)return;
  host.replaceChildren();
  if(map){host.hidden=true;return}
  host.hidden=false;
  const width=host.clientWidth||$('propertyMap')?.clientWidth||800;
  const height=host.clientHeight||$('propertyMap')?.clientHeight||350;
  const positions=D.pins(rows).positions;
  const project=(lat,lon)=>fallbackPoint(lat,lon,width,height);
  const clusters=D.clusters(positions,project,46);
  const all=clusters.map(group=>{
    const center=group.reduce((a,p)=>{const v=project(p.lat,p.lon);a.x+=v.x;a.y+=v.y;return a},{x:0,y:0});
    return {group,x:center.x/group.length,y:center.y/group.length};
  }).filter(g=>g.x>=15&&g.x<=width-15&&g.y>=16&&g.y<=height-16);
  const makeButton=(label,x,y,title,cls,action)=>{
    const btn=node('button',label,'map-fallback-pin '+cls);
    btn.type='button';btn.title=title;btn.setAttribute('aria-label',title);
    btn.style.left=x+'px';btn.style.top=y+'px';
    btn.addEventListener('click',action);host.appendChild(btn);
  };
  for(const record of all){
    const {group,x,y}=record;
    if(group.length===1){
      const p=group[0];
      makeButton(root.ImmoRadarCore?.type(p.listing)==='apartment'?'W':'H',x,y,(p.listing.title||'Immobilie')+' – '+(p.approximate?'ungefährer Ortsmittelpunkt':'Koordinaten aus Anzeige'),'map-fallback-single',()=>openObject(p.listing));
      continue;
    }
    const key=group.map(p=>p.listing.url||p.listing.title).sort().join('|');
    makeButton(String(group.length),x,y,group.length+' Objekte aufklappen','map-fallback-cluster',()=>{
      fallbackExpanded=fallbackExpanded===key?null:key;drawFallback();
    });
    if(fallbackExpanded===key){
      const offsets=D.spiderOffsets(group.length);
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.classList.add('map-fallback-lines');
      svg.setAttribute('width',String(width));svg.setAttribute('height',String(height));
      svg.setAttribute('aria-hidden','true');
      for(let i=0;i<group.length;i++){
        const tip={x:x+offsets[i].x,y:y+offsets[i].y};
        const line=document.createElementNS('http://www.w3.org/2000/svg','line');
        for(const [k,v] of Object.entries({x1:x,y1:y,x2:tip.x,y2:tip.y}))line.setAttribute(k,String(v));
        svg.appendChild(line);
        const p=group[i],type=root.ImmoRadarCore?.type(p.listing);
        makeButton(type==='apartment'?'W':'H',tip.x,tip.y,(p.listing.title||'Immobilie')+' – einzeln öffnen','map-fallback-single map-fallback-spider',()=>openObject(p.listing));
      }
      host.prepend(svg);
    }
  }
}
function update(next){
  rows=Array.isArray(next)?next:[];
  const data=D.pins(rows);
  drawGroups(data);drawUnlocated(data);
  const approximate=data.positions.filter(p=>p.approximate).length;
  const missing=data.unlocated.filter(o=>root.ImmoRadarCore?.type(o)==='apartment').length;
  if($('mapCount'))$('mapCount').textContent=data.positions.length+' Pins · '+missing+' ohne Ort';
  if($('mapNote'))$('mapNote').textContent=
    data.positions.length+' von '+rows.length+' Angeboten auf der Karte (davon '+approximate+' nur am ungefähren Ortsmittelpunkt). '+
    missing+' Wohnungen ohne Standort rechts gesammelt. Ortsgruppen anklicken zum Zoomen, Cluster anklicken zum Auffächern. Kein Pin steht für eine überprüfte Gebäudeadresse.';
  if(map)renderMarkers();else drawFallback();
}
function init(){
  const el=$('mapInteractive');
  if(!el||!D)return;
  $('unlocatedToggle')?.addEventListener('click',()=>setUnlocatedVisible($('unlocatedPanel')?.hidden));
  $('unlocatedClose')?.addEventListener('click',()=>{setUnlocatedVisible(false);$('unlocatedToggle')?.focus()});
  $('mapReset')?.addEventListener('click',()=>{
    clearSpiders();fallbackExpanded=null;
    if(map)map.fitBounds(circle.getBounds(),{padding:[22,22],maxZoom:11});
    else {fallbackBounds={...initialBounds};updateFrame();drawFallback()}
  });
  root.addEventListener?.('resize',()=>{
    if(map)map.invalidateSize();
    else drawFallback();
  });
  if(!root.L){
    // The fallback iframe is a static reference image with separately
    // positioned pins. Disable iframe gestures so users cannot de-sync them.
    const frame=$('mapFallback');
    if(frame)frame.setAttribute('tabindex','-1');
    const notice=$('mapFallbackNotice');if(notice)notice.hidden=false;
    update(rows);return;
  }
  try{
    map=root.L.map(el,{scrollWheelZoom:false,zoomControl:true});
    // Important: the Leaflet tile layer and property markers MUST share the
    // same coordinate system. Never render the separately pannable OSM iframe
    // underneath Leaflet markers: it drifts as soon as either map moves.
    const frame=$('mapFallback');
    if(frame){frame.hidden=true;frame.setAttribute('aria-hidden','true')}
    const fallbackPins=$('mapFallbackPins');
    if(fallbackPins)fallbackPins.hidden=true;
    const tiles=root.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap-Mitwirkende</a> · Orte: <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a>'
    });
    let errorCount=0,secondary=false;
    tiles.on('tileload',()=>{
      tilesReady=true;
      const note=$('mapTileNotice');if(note)note.hidden=true;
    });
    // If the main OSM tile host is unreachable, try a second OSM-based
    // provider. Either way pins remain attached to the Leaflet map, not an iframe.
    tiles.on('tileerror',()=>{
      if(tilesReady||secondary||++errorCount<4)return;
      secondary=true;
      const note=$('mapTileNotice');
      if(note)note.hidden=false;
      root.L.tileLayer('https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
        maxZoom:19,
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
      }).on('tileload',()=>{tilesReady=true;if(note)note.hidden=true})
        .addTo(map);
      map.removeLayer(tiles);
    });
    tiles.addTo(map);
    const center=[D.searchCenter.lat,D.searchCenter.lon];
    circle=root.L.circle(center,{radius:D.radiusKm*1000,color:'#196b4b',weight:2,fillColor:'#196b4b',fillOpacity:.08,interactive:false}).addTo(map);
    root.L.circleMarker(center,{radius:7,color:'#fff',weight:3,fillColor:'#13251d',fillOpacity:1}).bindPopup('Suchmittelpunkt: 85622 Feldkirchen').addTo(map);
    groupLayer=root.L.layerGroup().addTo(map);
    spiderLayer=root.L.layerGroup().addTo(map);
    map.on('click',clearSpiders);
    map.on('zoomstart',clearSpiders);
    map.on('zoomend',renderMarkers);
    // Leaflet alone owns panning/zooming; do not change a second map's bbox.
    el.style.visibility='visible';el.removeAttribute('aria-hidden');
    const host=$('mapFallbackPins');if(host)host.hidden=true;
    map.fitBounds(circle.getBounds(),{padding:[22,22],maxZoom:11});
    update(rows);
    root.setTimeout(()=>map?.invalidateSize(),0);
  }catch(err){
    if(map)try{map.remove()}catch{}
    map=null;groupLayer=null;spiderLayer=null;
    el.style.visibility='hidden';el.setAttribute('aria-hidden','true');
    const frame=$('mapFallback');if(frame){frame.hidden=false;frame.removeAttribute('aria-hidden')}
    const notice=$('mapFallbackNotice');if(notice)notice.hidden=false;
    if(root.console?.warn)root.console.warn('Falling back to OpenStreetMap embed and local pins',err);
    update(rows);
  }
}
root.ImmoRadarMap=Object.freeze({update,showGroup});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})(globalThis);
