import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const batches=[
 ['gmail-scout-b5.js','ImmoRadarGmailScoutBatch5'],
 ['gmail-scout-b4.js','ImmoRadarGmailScoutBatch4'],
 ['gmail-scout-b3.js','ImmoRadarGmailScoutBatch3'],
 ['gmail-scout-b2.js','ImmoRadarGmailScoutBatch2'],
 ['gmail-backfill-scout.js','ImmoRadarGmailScoutListings'],
 ['gmail-klein-b3.js','ImmoRadarGmailKleinBatch3'],
 ['gmail-klein-b2.js','ImmoRadarGmailKleinBatch2'],
 ['gmail-klein-b1.js','ImmoRadarGmailKleinBatch1']
];
const allowed=new Set(['propertyType','portal','title','price','location','url',
 'date','sourceRadiusKm','observationSource','livingArea','landArea','rooms','renovationHints']);
const ctx={window:{}};
vm.createContext(ctx);
const names=new Map(),urls=new Map();
let total=0,scout=0,klein=0;
for(const [path,key] of batches){
 const source=await readFile(new URL('../'+path,import.meta.url),'utf8');
 assert.doesNotMatch(source,/savedSearchId|tokenV2|utm_source|click\.by\.immowelt\.de/,
  'Private alert links and tracking must never reach public files');
 vm.runInContext(source,ctx,{filename:path});
 const rows=ctx.window[key];
 assert.ok(Array.isArray(rows)&&Object.isFrozen(rows)&&rows.length>0,path+' exports listing records');
 for(const o of rows){
   total++;
   assert.match(o.url,/^https:\/\/(?:www\.immobilienscout24\.de\/expose\/\d{5,12}|www\.kleinanzeigen\.de\/s-anzeige\/\d{6,13})$/);
   assert.ok(['apartment','house'].includes(o.propertyType));
   assert.ok(['ImmoScout24','Kleinanzeigen'].includes(o.portal));
   assert.ok(typeof o.title==='string'&&o.title.length>=8&&o.title.length<=180);
   assert.ok(typeof o.location==='string'&&o.location.length>0);
   assert.ok(o.price===null||Number.isFinite(o.price)&&o.price>=0&&o.price<=100_000_000);
   assert.match(o.date,/^2026-\d\d-\d\d$/);
   assert.equal(o.observationSource,'email-alert');
   for(const f of Object.keys(o))assert.ok(allowed.has(f),'Unexpected public field '+f);
   if(o.portal==='ImmoScout24')scout++;else klein++;
   const current=urls.get(o.url);
   if(!current||o.date>=current.date)urls.set(o.url,o);
 }
 names.set(path,rows.length);
}
assert.ok(total>=4000,'Expected a substantial Gmail alert backfill');
assert.ok(urls.size>=3800,'Expected thousands of unique canonical URLs');
assert.ok(scout>3000&&klein>500);
const page=await readFile(new URL('../index.html',import.meta.url),'utf8');
const dash=await readFile(new URL('../dashboard.js',import.meta.url),'utf8');
for(const [path,globalName] of batches){
  assert.ok(page.includes('./'+path+'?v=20261107'),'Missing static script '+path);
  assert.ok(dash.includes('window.'+globalName),'Dashboard merge ignores '+globalName);
}
assert.match(dash,/rows\.slice\(0,visibleLimit\)/,'Pagination bounds DOM generation');
assert.match(dash,/id="moreListings"/,'All rows must remain accessible progressively');
assert.match(dash,/lastMapFilterKey/,'Do not redraw thousands of markers on every load-more click');
const coreSrc=await readFile(new URL('../app-core.js',import.meta.url),'utf8');
const geoSrc=await readFile(new URL('../map-core.js',import.meta.url),'utf8');
vm.runInContext(coreSrc,ctx);
vm.runInContext(geoSrc,ctx);
const C=ctx.ImmoRadarMapCore;
const repeated=Array.from({length:5000},(_,i)=>({lat:48.13743,lon:11.57549,listing:{url:'fake:'+i}}));
const groups=C.clusters(repeated,(lat,lon)=>C.project(lat,lon,9),46);
assert.equal(groups.length,1,'Thousands of shared city-centre coordinates form one cluster');
assert.equal(groups[0].length,5000,'No listing is dropped in a large cluster');
console.log('PASS: '+total+' alert observations, '+urls.size+' unique canonical listings, privacy, pagination and scalable map clusters');
