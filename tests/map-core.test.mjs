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


const district={propertyType:'apartment',location:'Am Luitpoldpark, München',price:350000,url:'https://example.org/6'};
const district2={propertyType:'apartment',location:'Am Luitpoldpark, München',price:420000,url:'https://example.org/7'};
const city={propertyType:'apartment',location:'Obermenzing, München',price:520000,url:'https://example.org/8'};
const rural={propertyType:'house',location:'Gräfelfing, München (Kreis)',price:850000,url:'https://example.org/9'};
const ambiguous={propertyType:'house',location:'Unbekannter Ort, München (Kreis)',url:'https://example.org/10'};
const missing={propertyType:'house',location:'Ort in E-Mail nicht ausgewiesen',url:'https://example.org/11'};
assert.equal(M.point(district),null,'Approximate locality is not an exact object marker');
assert.equal(M.placeKey('Am Luitpoldpark, München'),'Am Luitpoldpark');
assert.equal(M.placeKey('Obermenzing, München'),'München');
assert.equal(M.placeKey('Gräfelfing, München (Kreis)'),'Gräfelfing');
assert.equal(M.placeKey('Unbekannter Ort, München (Kreis)'),null,'Do not map Landkreis München listings to city centre');
assert.equal(M.placeKey('Ort in E-Mail nicht ausgewiesen'),null);
assert.equal(M.placeKey('Bad Abbach'),null,'Unknown localities stay unplotted');
assert.equal(M.locality(nearby),null,'Listings with coordinates must not get fallback markers');
const aggregated=M.grouping([nearby,district,district2,city,rural,ambiguous,missing]);
assert.equal(aggregated.exact.length,1);
assert.equal(aggregated.localities.length,3);
assert.equal(aggregated.localities.find(g=>g.key==='Am Luitpoldpark').listings.length,2);
assert.equal(aggregated.withoutLocation,2);
assert.equal(M.grouping(C.filter([district,district2],{maxPrice:400000})).localities[0].listings.length,1);


const solo={propertyType:'apartment',location:'Rosenheim',price:220000,url:'https://example.org/apartment-1'};
const sameTown={propertyType:'apartment',location:'Rosenheim',price:275000,url:'https://example.org/apartment-2'};
const otherTown={propertyType:'apartment',location:'Haar',price:400000,url:'https://example.org/apartment-3'};
const unsituated={propertyType:'apartment',location:'Ort in E-Mail nicht ausgewiesen',price:150000,url:'https://example.org/apartment-4'};
const unknownTown={propertyType:'apartment',location:'Unbekannter Ort',price:260000,url:'https://example.org/apartment-5'};
const sample=[solo,sameTown,otherTown,unsituated,unknownTown,nearby];
const pins=M.pins(sample);
assert.equal(pins.positions.length,4,'Every geographic property retains an individual pin');
assert.equal(pins.unlocated.length,2,'Unknown apartment locations have no invented coordinates');
assert.equal(pins.unlocated[0].url,unsituated.url);
assert.equal(pins.positions.filter(p=>p.listing.propertyType==='apartment').length,3);
assert.equal(pins.positions.filter(p=>p.approximate).length,3);
assert.equal(pins.positions.find(p=>p.listing===nearby).approximate,false);
assert.equal(M.pins(C.filter(sample,{maxPrice:230000})).positions.length,1,'Map membership follows price filter');
assert.equal(M.pins(C.filter(sample,{maxPrice:230000})).unlocated.length,1,'Unlocated group follows filters');

const graphic=M.clusters(pins.positions,(lat,lon)=>({x:lon*1000,y:lat*1000}),46);
assert.equal(graphic.flat().length,pins.positions.length,'No individual listing is lost when clustering');
assert.equal(graphic.find(g=>g.length===2)?.every(p=>p.key==='Rosenheim'),true,'Two same-town listings cluster');
assert.equal(M.clusters([],()=>({x:0,y:0})).length,0);
assert.equal(M.clusters(pins.positions,()=>({x:0,y:0})).length,1,'Nearby objects always form a cluster');
assert.equal(M.clusters(pins.positions,(_,lon)=>({x:lon*100000,y:0}),3).length>=2,true,'Zooming in separates distant locations');
for(const n of [1,2,7,8,9,16,50]){
  const offsets=M.spiderOffsets(n);
  assert.equal(offsets.length,n,'Every member gets one spider leg');
  assert.equal(new Set(offsets.map(v=>v.x+','+v.y)).size,n,'Spider tips are distinct');
}
assert.equal(M.spiderOffsets(0).length,0);


// Web Mercator: the same projected world pixel must be used for every tile and pin.
const moosach=M.locality({location:'Alt-Moosach, München'});
const milbertshofen=M.locality({location:'Milbertshofen, München'});
assert.ok(moosach&&milbertshofen,'Two known Munich districts must resolve');
assert.equal(moosach.key,'Alt-Moosach');
assert.equal(milbertshofen.key,'Milbertshofen');
assert.ok(moosach.lon>11.49&&moosach.lon<11.54,'Moosach is not Fürstenfeldbruck');
assert.ok(milbertshofen.lon>11.55&&milbertshofen.lon<11.60);
assert.ok(C.distanceKm(moosach,milbertshofen)<7,'Moosach and Milbertshofen should be neighbors');
for(const z of [6,9,12,13,16]){
  for(const p of [moosach,milbertshofen,M.searchCenter]){
    const xy=M.project(p.lat,p.lon,z);
    const result=M.unproject(xy.x,xy.y,z);
    assert.ok(Math.abs(result.lat-p.lat)<1e-7,'Latitude round trip at zoom '+z);
    assert.ok(Math.abs(result.lon-p.lon)<1e-7,'Longitude round trip at zoom '+z);
    const tileX=Math.floor(xy.x/256),offsetX=xy.x-tileX*256;
    const tileY=Math.floor(xy.y/256),offsetY=xy.y-tileY*256;
    assert.ok(Math.abs((tileX*256+offsetX)-xy.x)<1e-9,'Tile X and marker X share a coordinate');
    assert.ok(Math.abs((tileY*256+offsetY)-xy.y)<1e-9,'Tile Y and marker Y share a coordinate');
  }
  const a=M.project(moosach.lat,moosach.lon,z);
  const b=M.project(milbertshofen.lat,milbertshofen.lon,z);
  assert.ok(a.x<b.x,'Moosach must remain west of Milbertshofen at zoom '+z);
  assert.ok(Math.abs(b.x-a.x)<256*2**z/100,'Districts cannot appear dozens of km apart');
}
const page=await readFile(new URL('../index.html',import.meta.url),'utf8');
const view=await readFile(new URL('../map-view.js',import.meta.url),'utf8');
const styles=await readFile(new URL('../dashboard.css',import.meta.url),'utf8');
assert.match(page,/<details class="filters" id="filterPanel">/);
assert.match(page,/<form id="filters" class="filter-body"/);
assert.match(page,/id="mapInteractive"/);
assert.match(page,/id="unlocatedZone"/);
assert.match(page,/id="unlocatedToggle"/);
assert.match(page,/id="unlocatedList"/);
assert.match(page,/src="\.\/map-view\.js\?v=20261021-mapnative"/);
assert.doesNotMatch(page,/id="mapFallback"/,'Never show a separate OSM iframe map');
assert.doesNotMatch(page,/leaflet@1\.9\.4/,'No dependency on external mapping JS CDN');
assert.match(view,/D\.project\(lat,lon,state\.zoom\)/,'Map pins use the native tile projection');
assert.match(view,/function paintTiles\(\)/,'Native tile renderer exists');
assert.match(view,/function paintPins\(\)/,'Individual property pins exist independently of tile success');
assert.match(view,/D\.clusters\(all\.positions,project,46\)/,'Clusters follow pixel geography');
assert.match(view,/D\.spiderOffsets\(group\.length\)/,'Spiders include every grouped listing');
assert.match(view,/function focus\(positions\)/,'Locality group zoom must work');
assert.match(view,/paintUnlocated\(all\)/,'Unlocated apartments remain available');
assert.match(view,/tiles\.appendChild\(image\)/,'Tiles are part of the same map container');
assert.match(view,/root\.requestAnimationFrame\(render\)/,'Pan and zoom share one map frame');
assert.doesNotMatch(view,/function fallbackPoint\(/,'No incorrectly aligned external iframe pins');
assert.match(styles,/\.map-native-tile\{/,'Native tile layout');
assert.match(styles,/\.map-native-pin\{/,'Visible map markers without library dependencies');
assert.match(styles,/\.map-unlocated\{/,'Right-edge unlocated apartment cluster');
console.log('PASS: shared tile/pin Web Mercator, zoom, clusters, locality selection, no-map fallback');
