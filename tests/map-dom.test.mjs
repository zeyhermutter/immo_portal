import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

class ElementStub{
  constructor(tag){
    this.tagName=tag;this.children=[];this.style={};this.dataset={};this.events={};
    this.attributes={};this.hidden=false;this.textContent='';this.className='';
    this.clientWidth=1100;this.clientHeight=390;
    this.classList={add:(v)=>{this.className+=(this.className?' ':'')+v}};
  }
  append(...children){this.children.push(...children)}
  appendChild(node){this.children.push(node);return node}
  prepend(node){this.children.unshift(node)}
  replaceChildren(...children){this.children=[...children]}
  addEventListener(name,fn){(this.events[name]??=[]).push(fn)}
  setAttribute(name,val){this.attributes[name]=String(val)}
  removeAttribute(name){delete this.attributes[name]}
  remove(){this.removed=true}
  scrollIntoView(){}
  setPointerCapture(){}
  getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight}}
}
const ids=['propertyMap','mapInteractive','mapTileNotice','mapAreaGroups','unlocatedToggle',
  'unlocatedPanel','unlocatedCount','unlocatedList','unlocatedClose','mapCount','mapNote','mapReset'];
const elements=Object.fromEntries(ids.map(id=>[id,new ElementStub('div')]));
elements.mapInteractive.clientWidth=1100;
elements.mapInteractive.clientHeight=390;
const doc={
  readyState:'complete',getElementById:id=>elements[id]||null,
  createElement:tag=>new ElementStub(tag),
  createElementNS:(_ns,tag)=>new ElementStub(tag)
};
const context={document:doc,addEventListener:()=>{},requestAnimationFrame:fn=>fn()};
vm.createContext(context);
for(const file of ['app-core.js','map-core.js','map-view.js']){
  const source=await readFile(new URL('../'+file,import.meta.url),'utf8');
  vm.runInContext(source,context,{filename:file});
}
const M=context.ImmoRadarMap;
assert.ok(M,'Map initializes without Leaflet, a CDN or external JS');
const listing={url:'https://example.org/moosach',propertyType:'apartment',
  location:'Alt-Moosach, München',title:'Wohnung in Moosach',price:390000};
M.update([listing]);
let pins=elements.mapInteractive.children.find(n=>n.className==='map-native-pins');
let tiles=elements.mapInteractive.children.find(n=>n.className==='map-native-tiles');
assert.ok(pins,'Pin layer exists inside same map viewport');
assert.ok(tiles,'Tiles exist inside same map viewport');
assert.ok(tiles.children.length>0,'Tile positions are calculated without network success');
assert.equal(pins.children.length,1,'Single apartment marker is rendered even when tiles never load');
assert.equal(pins.children[0].textContent,'W');
const beforeX=parseFloat(pins.children[0].style.left);
const beforeY=parseFloat(pins.children[0].style.top);
assert.ok(Number.isFinite(beforeX)&&Number.isFinite(beforeY));
const viewport=elements.mapInteractive;
const down=viewport.events.pointerdown?.[0],move=viewport.events.pointermove?.[0],up=viewport.events.pointerup?.[0];
assert.ok(down&&move&&up,'Native pointer panning works without Leaflet');
down({button:0,pointerId:1,clientX:200,clientY:200,target:{closest:()=>false}});
move({pointerId:1,clientX:300,clientY:245});
up({pointerId:1});
pins=elements.mapInteractive.children.find(n=>n.className==='map-native-pins');
assert.ok(Math.abs(parseFloat(pins.children[0].style.left)-beforeX-100)<.05,
  'Geographic marker remains anchored when map pans 100px horizontally');
assert.ok(Math.abs(parseFloat(pins.children[0].style.top)-beforeY-45)<.05,
  'Geographic marker remains anchored when map pans 45px vertically');
const plus=elements.mapInteractive.children.find(n=>n.className==='map-native-zoom').children[0];
plus.events.click[0]({stopPropagation(){}});
assert.ok(tiles.children.length>0,'Georeferenced tiles redraw after zoom');
const second={url:'https://example.org/moosach-2',propertyType:'apartment',
  location:'Alt-Moosach, München',title:'Zweite Wohnung'};
M.update([listing,second]);
pins=elements.mapInteractive.children.find(n=>n.className==='map-native-pins');
assert.equal(pins.children.length,1,'Nearby listings aggregate into one cluster');
assert.equal(pins.children[0].textContent,'2');
pins.children[0].events.click[0]({stopPropagation(){}});
pins=elements.mapInteractive.children.find(n=>n.className==='map-native-pins');
const expanded=pins.children.filter(p=>p.textContent==='W');
assert.equal(expanded.length,2,'Both apartment pins are available after spiderfy');
const lines=elements.mapInteractive.children.find(n=>n.className==='map-native-legs');
assert.equal(lines.children.length,2,'Spider legs match individual listings');
const unknown={url:'https://example.org/unknown',propertyType:'apartment',location:'Ort in E-Mail nicht ausgewiesen'};
M.update([listing,unknown]);
assert.equal(elements.unlocatedCount.textContent,1,'Unknown-location drawer is preserved');
assert.equal(elements.unlocatedList.children.length,1);
console.log('PASS: DOM map markers visible, pan and zoom stay aligned, spider cluster and unknown drawer');
