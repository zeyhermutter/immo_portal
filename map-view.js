/* ImmoRadar map: dependency-free Web Mercator (EPSG:3857).
 * OpenStreetMap raster tiles and real/approximate listing pins use exactly
 * the same pixel projection during zoom, drag and resize. No iframe overlay.
 */
(function(root){'use strict';
const D=root.ImmoRadarMapCore;
const $=id=>document.getElementById(id);
const LIMIT={minZoom:6,maxZoom:17};
const initial={lat:D.searchCenter.lat,lon:D.searchCenter.lon,zoom:9};
let state={...initial},rows=[],viewport=null,tiles=null,pinsLayer=null,legsLayer=null,landmarkLayer=null;
let activeTiles=new Map(),expanded=null,drag=null,scheduled=false,tileErrors=0,tileSuccess=0;
const landmarks=[
  {name:'München',lat:48.13743,lon:11.57549},
  {name:'Moosach',lat:48.179519,lon:11.512963},
  {name:'Milbertshofen',lat:48.184,lon:11.573},
  {name:'Fürstenfeldbruck',lat:48.1765,lon:11.2536},
  {name:'Haar',lat:48.108807,lon:11.726532},
  {name:'Rosenheim',lat:47.856366,lon:12.122469},
  {name:'Feldkirchen',lat:48.14786,lon:11.72973}
];
const node=(tag,content,cls)=>{
  const el=document.createElement(tag);
  if(content!==undefined)el.textContent=content;
  if(cls)el.className=cls;
  return el;
};
const svgNode=tag=>document.createElementNS('http://www.w3.org/2000/svg',tag);
const type=o=>root.ImmoRadarCore?.type(o)||o?.propertyType;
const openObject=o=>{if(o?.url&&root.ImmoRadarOpenDetail)root.ImmoRadarOpenDetail(o.url)};
const worldSize=()=>256*2**state.zoom;
function normalizeLongitude(lon){return (lon+180+360)%360-180}
function worldCenter(){return D.project(state.lat,state.lon,state.zoom)}
function size(){return {w:viewport?.clientWidth||800,h:viewport?.clientHeight||390}}
function screenPoint(lat,lon){
  const a=D.project(lat,lon,state.zoom),b=worldCenter(),{w,h}=size(),wrap=worldSize();
  let dx=a.x-b.x;
  if(dx>wrap/2)dx-=wrap;
  if(dx<-wrap/2)dx+=wrap;
  return {x:w/2+dx,y:h/2+a.y-b.y};
}
function coordinateAt(x,y){
  const b=worldCenter(),{w,h}=size();
  const loc=D.unproject(b.x+x-w/2,b.y+y-h/2,state.zoom);
  return {lat:loc.lat,lon:normalizeLongitude(loc.lon)};
}
function button(text,cls,onClick,title){
  const b=node('button',text,cls);
  b.type='button';b.title=title||text;
  b.addEventListener('pointerdown',e=>e.stopPropagation());
  b.addEventListener('click',e=>{e.stopPropagation();onClick()});
  return b;
}
function tileUri(tx,ty,zoom,alternative=false){
  const range=2**zoom,wrapped=((tx%range)+range)%range;
  return alternative
    ?'https://basemaps.cartocdn.com/light_all/'+zoom+'/'+wrapped+'/'+ty+'.png'
    :'https://tile.openstreetmap.org/'+zoom+'/'+wrapped+'/'+ty+'.png';
}
function warning(visible){
  const el=$('mapTileNotice');if(!el)return;
  el.hidden=!visible;
  el.textContent='Kartenkacheln momentan nicht erreichbar. Die Pins bleiben korrekt geografisch berechnet; als Orientierung werden Ortsnamen eingeblendet.';
  if(landmarkLayer)landmarkLayer.hidden=!visible;
}
function paintTiles(){
  if(!tiles||!viewport)return;
  const {w,h}=size(),center=worldCenter();
  const baseX=center.x-w/2,baseY=center.y-h/2,n=2**state.zoom;
  const firstX=Math.floor(baseX/256)-1,lastX=Math.floor((baseX+w)/256)+1;
  const firstY=Math.max(0,Math.floor(baseY/256)-1),lastY=Math.min(n-1,Math.floor((baseY+h)/256)+1);
  const requested=new Set();
  for(let y=firstY;y<=lastY;y++)for(let x=firstX;x<=lastX;x++){
    const key=state.zoom+'/'+x+'/'+y;
    requested.add(key);
    let image=activeTiles.get(key);
    if(!image){
      image=node('img');
      image.alt='';image.draggable=false;
      image.className='map-native-tile';
      image.dataset.source='primary';
      image.addEventListener('load',()=>{tileSuccess++;if(tileSuccess>0)warning(false)});
      image.addEventListener('error',()=>{
        if(image.dataset.source==='primary'){
          image.dataset.source='secondary';
          image.src=tileUri(x,y,state.zoom,true);
        }else{
          tileErrors++;
          if(tileSuccess===0&&tileErrors>=3)warning(true);
          image.style.visibility='hidden';
        }
      });
      image.src=tileUri(x,y,state.zoom);
      activeTiles.set(key,image);
      tiles.appendChild(image);
    }
    image.style.left=Math.round(x*256-baseX)+'px';
    image.style.top=Math.round(y*256-baseY)+'px';
  }
  for(const [key,element] of activeTiles){
    if(!requested.has(key)){element.remove();activeTiles.delete(key)}
  }
}
function paintLandmarks(){
  if(!landmarkLayer)return;
  landmarkLayer.replaceChildren();
  const {w,h}=size();
  for(const place of landmarks){
    const p=screenPoint(place.lat,place.lon);
    if(p.x<0||p.x>w||p.y<0||p.y>h)continue;
    const name=node('span',place.name,'map-native-landmark');
    name.style.left=p.x+'px';name.style.top=p.y+'px';
    landmarkLayer.appendChild(name);
  }
}
function showUnlocated(visible){
  const btn=$('unlocatedToggle'),panel=$('unlocatedPanel');
  if(!btn||!panel)return;
  panel.hidden=!visible;
  btn.setAttribute('aria-expanded',String(visible));
}
function analyzeButton(o){return button('Objekt analysieren','map-popup-action',()=>openObject(o))}
function row(o){
  const wrap=node('div',undefined,'map-area-listing');
  wrap.appendChild(node('span',o.title||'Immobilienangebot'));
  wrap.appendChild(node('small',[o.location||'Ort unbekannt',o.portal||''].filter(Boolean).join(' · ')));
  wrap.appendChild(analyzeButton(o));
  return wrap;
}
function paintUnlocated(all){
  const apartments=all.unlocated.filter(o=>type(o)==='apartment');
  const btn=$('unlocatedToggle'),count=$('unlocatedCount'),list=$('unlocatedList');
  if(!btn||!count||!list)return;
  btn.hidden=apartments.length===0;
  count.textContent=apartments.length;
  list.replaceChildren(...apartments.map(row));
  if(!apartments.length)showUnlocated(false);
}
function focus(positions){
  if(!positions.length)return;
  const lat=positions.reduce((sum,p)=>sum+p.lat,0)/positions.length;
  const lon=positions.reduce((sum,p)=>sum+p.lon,0)/positions.length;
  state={lat,lon,zoom:Math.max(13,state.zoom)};
  expanded=positions.length>1?{key:'focused',positions,lat,lon}:null;
  schedule();
  $('propertyMap')?.scrollIntoView({behavior:'smooth',block:'center'});
}
function paintGroupList(all){
  const host=$('mapAreaGroups');if(!host)return;
  host.replaceChildren();
  const groups=new Map();
  for(const pos of all.positions){
    const key=pos.approximate?pos.key:'Koordinaten aus Angebotsdaten';
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(pos);
  }
  for(const [key,group] of groups){
    const d=node('details',undefined,'map-area-group');
    const title=node('summary',key+' · '+group.length+' Angebote · auf Karte zoomen');
    d.appendChild(title);
    d.addEventListener('toggle',()=>{if(d.open)focus(group)});
    const inner=node('div',undefined,'map-area-group-content');
    inner.appendChild(node('p','Ortsmittelpunkt bedeutet keine genaue Gebäudeadresse.','map-popup-disclaimer'));
    for(const p of group)inner.appendChild(row(p.listing));
    d.appendChild(inner);host.appendChild(d);
  }
  if(all.unlocated.length){
    const d=node('details',undefined,'map-area-group');
    d.appendChild(node('summary','Ohne Standort · '+all.unlocated.length+' Angebote'));
    const inner=node('div',undefined,'map-area-group-content');
    for(const o of all.unlocated)inner.appendChild(row(o));
    d.appendChild(inner);host.appendChild(d);
  }
  if(!host.children.length)host.appendChild(node('p','Keine Angebote in dieser Auswahl.'));
}
function positionedPin(x,y,label,cls,onClick,title){
  const p=button(label,'map-native-pin '+cls,onClick,title);
  p.style.left=x+'px';p.style.top=y+'px';
  pinsLayer.appendChild(p);
  return p;
}
function spider(group,center){
  if(!group.length)return;
  const offsets=D.spiderOffsets(group.length);
  for(let i=0;i<group.length;i++){
    const p=group[i],off=offsets[i],x=center.x+off.x,y=center.y+off.y;
    const ln=svgNode('line');
    for(const [name,value] of Object.entries({x1:center.x,y1:center.y,x2:x,y2:y}))ln.setAttribute(name,String(value));
    legsLayer.appendChild(ln);
    positionedPin(x,y,type(p.listing)==='apartment'?'W':'H',
      type(p.listing)==='apartment'?'map-native-apartment':'map-native-house',
      ()=>openObject(p.listing),(p.listing.title||'Immobilie')+' – einzelnes Angebot'+(p.approximate?' (ungefähre Ortsmitte)':''));
  }
}
function paintPins(){
  if(!pinsLayer||!legsLayer)return;
  pinsLayer.replaceChildren();
  legsLayer.replaceChildren();
  const all=D.pins(rows),{w,h}=size();
  const project=(lat,lon)=>screenPoint(lat,lon);
  const clusters=D.clusters(all.positions,project,46);
  for(const group of clusters){
    const p=group.map(v=>project(v.lat,v.lon));
    const x=p.reduce((a,v)=>a+v.x,0)/p.length;
    const y=p.reduce((a,v)=>a+v.y,0)/p.length;
    if(x<0||x>w||y<0||y>h)continue;
    if(group.length===1){
      const listing=group[0];
      positionedPin(x,y,type(listing.listing)==='apartment'?'W':'H',
        type(listing.listing)==='apartment'?'map-native-apartment':'map-native-house',
        ()=>openObject(listing.listing),(listing.listing.title||'Immobilie')+(listing.approximate?' – ungefähre Ortsmitte':''));
      continue;
    }
    const id=group.map(p=>p.listing.url||p.listing.title).sort().join('|');
    positionedPin(x,y,String(group.length),'map-native-cluster',()=>{
      expanded=expanded?.key===id?null:{key:id,positions:group,lat:group[0].lat,lon:group[0].lon,anchor:{x,y}};
      schedule();
    },group.length+' Objekte – anklicken zum Auffächern');
  }
  if(expanded){
    let origin=expanded.anchor||screenPoint(expanded.lat,expanded.lon);
    // Recalculate the center after every pan so the spider legs stay attached.
    if(expanded.key!=='focused'){
      const pts=expanded.positions.map(p=>screenPoint(p.lat,p.lon));
      origin={x:pts.reduce((a,p)=>a+p.x,0)/pts.length,y:pts.reduce((a,p)=>a+p.y,0)/pts.length};
    }
    if(origin.x>=-80&&origin.x<=w+80&&origin.y>=-80&&origin.y<=h+80)
      spider(expanded.positions,origin);
  }
}
function render(){
  if(!viewport)return;
  scheduled=false;
  paintTiles();paintLandmarks();paintPins();
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  root.requestAnimationFrame(render);
}
function zoomTo(z,anchorX,anchorY){
  z=Math.max(LIMIT.minZoom,Math.min(LIMIT.maxZoom,Math.round(z)));
  if(z===state.zoom)return;
  const {w,h}=size();
  const x=anchorX??w/2,y=anchorY??h/2;
  const geographic=coordinateAt(x,y);
  const point=D.project(geographic.lat,geographic.lon,z),scale=256*2**z;
  const center=D.unproject(point.x+w/2-x,point.y+h/2-y,z);
  state={lat:Math.max(-85,Math.min(85,center.lat)),lon:normalizeLongitude(center.lon),zoom:z};
  expanded=null;
  schedule();
}
function pan(dx,dy){
  const center=worldCenter();
  const loc=D.unproject(center.x-dx,center.y-dy,state.zoom);
  state.lat=Math.max(-85,Math.min(85,loc.lat));
  state.lon=normalizeLongitude(loc.lon);
  expanded=null;schedule();
}
function init(){
  viewport=$('mapInteractive');
  if(!viewport||viewport.dataset.initialized==='true')return;
  viewport.dataset.initialized='true';
  viewport.replaceChildren();
  viewport.removeAttribute('aria-hidden');
  viewport.classList.add('map-native');
  // All layers are children of a single interactive viewport, not an iframe.
  tiles=node('div',undefined,'map-native-tiles');
  landmarkLayer=node('div',undefined,'map-native-landmarks');
  legsLayer=svgNode('svg');legsLayer.classList.add('map-native-legs');
  legsLayer.setAttribute('aria-hidden','true');
  pinsLayer=node('div',undefined,'map-native-pins');
  viewport.append(tiles,landmarkLayer,legsLayer,pinsLayer);
  const zoomBox=node('div',undefined,'map-native-zoom');
  zoomBox.append(
    button('+','map-native-zoom-button',()=>zoomTo(state.zoom+1),'Vergrößern'),
    button('−','map-native-zoom-button',()=>zoomTo(state.zoom-1),'Verkleinern')
  );
  viewport.appendChild(zoomBox);
  const attribution=node('div',undefined,'map-native-attribution');
  const osm=node('a','© OpenStreetMap-Mitwirkende');
  osm.href='https://www.openstreetmap.org/copyright';osm.target='_blank';osm.rel='noopener noreferrer';
  attribution.appendChild(osm);
  viewport.appendChild(attribution);
  viewport.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest('button,a'))return;
    drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,lat:state.lat,lon:state.lon,moved:false};
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
    if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;
    const base=D.project(drag.lat,drag.lon,state.zoom);
    const coord=D.unproject(base.x-dx,base.y-dy,state.zoom);
    state.lat=Math.max(-85,Math.min(85,coord.lat));
    state.lon=normalizeLongitude(coord.lon);
    expanded=null;schedule();
  });
  viewport.addEventListener('pointerup',e=>{if(drag?.id===e.pointerId)drag=null});
  viewport.addEventListener('pointercancel',()=>{drag=null});
  viewport.addEventListener('wheel',e=>{
    if(!e.ctrlKey)return; // keep ordinary page scrolling usable
    e.preventDefault();
    const rect=viewport.getBoundingClientRect();
    zoomTo(state.zoom+(e.deltaY<0?1:-1),e.clientX-rect.left,e.clientY-rect.top);
  },{passive:false});
  viewport.addEventListener('keydown',e=>{
    const panKey={ArrowLeft:[65,0],ArrowRight:[-65,0],ArrowUp:[0,65],ArrowDown:[0,-65]};
    if(panKey[e.key]){e.preventDefault();pan(...panKey[e.key])}
    if(e.key==='+'||e.key==='='){e.preventDefault();zoomTo(state.zoom+1)}
    if(e.key==='-'){e.preventDefault();zoomTo(state.zoom-1)}
  });
  $('mapReset')?.addEventListener('click',()=>{state={...initial};expanded=null;schedule()});
  $('unlocatedToggle')?.addEventListener('click',()=>showUnlocated($('unlocatedPanel')?.hidden));
  $('unlocatedClose')?.addEventListener('click',()=>{showUnlocated(false);$('unlocatedToggle')?.focus()});
  root.addEventListener('resize',schedule);
  if(root.ResizeObserver)new root.ResizeObserver(schedule).observe(viewport);
  const legacy=$('mapFallback');if(legacy){legacy.remove()}
  const oldPins=$('mapFallbackPins');if(oldPins){oldPins.remove()}
  const msg=$('mapFallbackNotice');if(msg)msg.hidden=true;
  paintGroupList(D.pins(rows));paintUnlocated(D.pins(rows));
  render();
}
function update(next){
  rows=Array.isArray(next)?next:[];
  const all=D.pins(rows);
  paintGroupList(all);paintUnlocated(all);
  const approximate=all.positions.filter(p=>p.approximate).length;
  const noPlace=all.unlocated.filter(o=>type(o)==='apartment').length;
  if($('mapCount'))$('mapCount').textContent=all.positions.length+' Pins · '+noPlace+' ohne Ort';
  if($('mapNote'))$('mapNote').textContent=
    all.positions.length+' Angebote auf der Karte, davon '+approximate+' mit ungefährer Ortslage. '+
    noPlace+' Wohnungen ohne Standort rechts gesammelt. Ortsgruppen zoomen; Cluster fächern alle Einzelpins auf. Keine Ortsmitte ist eine genaue Objektadresse.';
  expanded=null;schedule();
}
root.ImmoRadarMap=Object.freeze({update,init,focus});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})(globalThis);
