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

const page=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(page,/<details class="filters" id="filterPanel">/);
assert.match(page,/<form id="filters" class="filter-body"/);
assert.match(page,/id="propertyMap"/);
assert.match(page,/id="mapFallback"/,'Fallback iframe must be present without JavaScript');
assert.match(page,/openstreetmap\.org\/export\/embed\.html/,'Embedded map is always available');
assert.match(page,/id="mapInteractive"/,'Leaflet must not replace the embedded fallback');
assert.match(page,/id="mapAreaGroups"/,'Locality list is the no-map alternative');
assert.match(page,/id="unlocatedZone"/,'Unknown locations have a separate non-geographic map overlay');
assert.match(page,/id="unlocatedToggle"/,'Unknown-location cluster can be opened');
assert.match(page,/id="unlocatedList"/,'Unknown-location cluster displays all members');
assert.match(page,/src="\.\/map-view\.js"/);
const view=await readFile(new URL('../map-view.js',import.meta.url),'utf8');
assert.match(view,/tiles\.on\('tileload'/,'Interactive map may replace fallback only on successful tile');
assert.match(view,/if\(frame\)frame\.hidden=true/,'Fallback hidden only once Leaflet is usable');
assert.match(view,/drawGroups\(pins\)/,'Accessible listings must update with filters');
assert.match(view,/drawSpider\(group,latLng,key\)/,'Cluster click spiders all members');
assert.match(view,/root\.L\.polyline\(\[latLng,tip\]/,'Spider legs rendered as lines');
assert.match(view,/tiles\.on\('tileload'/,'Fallback hides only after successful OSM tile');
assert.match(page,/id="mapFallbackPins"/,'Always-visible fallback pins exist above the embed');
assert.match(view,/details\.addEventListener\('toggle'/,'Opening a locality group activates map focus');
assert.match(view,/map\.flyTo\(\[c\.lat,c\.lon\],zoom/,'Locality group selection zooms interactive map');
assert.match(view,/focusFallback\(c\.lat,c\.lon\)/,'Locality selection also zooms fallback map');
assert.match(view,/el\.style\.visibility='visible'/,'Leaflet pins become visible without waiting for tiles');
assert.match(view,/drawFallback\(\)/,'Non-Leaflet fallback displays geographic listing pins');
assert.match(view,/root\.L\.polyline\(\[latLng,tip\]/,'Spider legs still connect individual listing pins');
const stylesheet=await readFile(new URL('../dashboard.css',import.meta.url),'utf8');
assert.match(stylesheet,/\.map-interactive\.leaflet-container\{background:transparent!important\}/,
  'Interactive overlay must be transparent over iframe until tiles load');
assert.match(stylesheet,/\.map-fallback-pin\{/,'Fallback pins should have a visible style');
console.log('PASS: map radius, coordinate safety, filtered markers and collapsible filters');
