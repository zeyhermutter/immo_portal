import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const box={};
for(const file of ['app-core.js','map-core.js']){
  const source=await readFile(new URL('../'+file,import.meta.url),'utf8');
  vm.runInNewContext(source,box,{filename:file});
}
const C=box.ImmoRadarCore,M=box.ImmoRadarMapCore;
assert.ok(M);
assert.equal(M.radiusKm,100);
assert.equal(M.searchCenter.lat,48.14786);
assert.equal(M.searchCenter.lon,11.72973);

const nearby={propertyType:'house',lat:48.15,lon:11.73,price:450000,title:'Belegter Standort',url:'https://example.org/1'};
const noCoords={propertyType:'house',price:250000,title:'Koordinaten fehlen',url:'https://example.org/2'};
const emptyCoords={propertyType:'house',lat:null,lon:null,price:320000,url:'https://example.org/3'};
const invalidCoords={propertyType:'house',lat:120,lon:11.73,price:250000,url:'https://example.org/4'};
const outside={propertyType:'house',lat:49.9,lon:11.73,price:250000,url:'https://example.org/5'};

assert.equal(M.point(noCoords),null,'No estimated point for missing coordinates');
assert.equal(M.point(emptyCoords),null,'No estimated point for null coordinates');
assert.equal(M.point(invalidCoords),null,'Reject invalid coordinates');
assert.equal(M.point(outside),null,'Do not plot locations outside the 100 km search radius');
assert.ok(M.point(nearby));
assert.equal(M.located([nearby,noCoords,emptyCoords,invalidCoords,outside]).length,1);
assert.equal(M.located([]).length,0);
assert.equal(M.located(null).length,0);
assert.equal(M.located(C.filter([nearby,noCoords],{maxPrice:300000})).length,0,'Map respects listing filters');

const page=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(page,/<details class="filters" id="filterPanel">/);
assert.match(page,/<form id="filters" class="filter-body"/);
assert.match(page,/id="propertyMap"/);
assert.match(page,/src="\.\/map-view\.js"/);
console.log('PASS: map radius, coordinate safety, filtered markers and collapsible filters');
