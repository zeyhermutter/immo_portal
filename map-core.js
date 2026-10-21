/* Exact listing coordinates are distinct from curated, approximate locality centres.
 * GeoNames reference coordinates: https://www.geonames.org/ (CC BY 4.0).
 * THESE LOCATIONS ARE NOT PROPERTY ADDRESSES.
 */
(function(root){'use strict';
const searchCenter=Object.freeze({lat:48.14786,lon:11.72973});
const radiusKm=100;
const C=root.ImmoRadarCore;
/* Keys are unambiguous towns or Munich districts; do not map unknown or ambiguous names. */
const centers=Object.freeze({
  'München':[48.13743,11.57549],
  'Am Luitpoldpark':[48.17041,11.57019],
  'Josephsplatz':[48.15538,11.56534],
  'Trudering':[48.116667,11.683333],
  'Alt-Moosach':[48.179519,11.512963],
  'Milbertshofen':[48.184,11.573],
  'Laim':[48.134705,11.501999],
  'Garching':[48.248962,11.651006],
  'Haar':[48.108807,11.726532],
  'Gräfelfing':[48.11850,11.44450],
  'Grünwald':[48.039471,11.523199],
  'Ottobrunn':[48.064888,11.663275],
  'Kirchheim b. München':[48.176561,11.755629],
  'Ismaning':[48.233333,11.683333],
  'Oberschleißheim':[48.25,11.566667],
  'Rosenheim':[47.856366,12.122469],
  'Dachau':[48.26,11.434021],
  'Starnberg':[48.00193,11.34416],
  'Pfaffenhofen':[48.53053,11.505],
  'Kranzberg':[48.40613,11.612463],
  'Allershausen':[48.433333,11.6],
  'Inning am Ammersee':[48.076359,11.152325],
  'Garmisch-Partenkirchen':[47.5,11.1]
});
const aliases=Object.freeze({
  'Maxvorstadt':'München', /* broader city center, NOT the Maxvorstadt listing position */
  'München-Laim':'Laim',
  'Gartenstadt Trudering':'Trudering',
  'Waldtrudering':'Trudering',
  'Trudering-Riem':'Trudering',
  'Pang':'Rosenheim',
  'Untermenzing':'München',
  'Altaubing':'München',
  'Am Hart':'München',
  'Olympiapark':'München',
  'Obermenzing':'München',
  'Sankt Ulrich':'München',
  'Altperlach':'München',
  'Herzogpark':'München',
  'Sendling-Westpark':'München',
  'Obergiesing':'München',
  'Am Schlachthof':'München',
  'Solln':'München',
  'Graggenau':'München',
  'Lerchenau-Ost':'München',
  'Balanstraße-West':'München',
  'Giesing':'München',
  'Thalkirchen':'München'
});
function point(listing){
  if(!C||!listing)return null;
  const coords=C.coords(listing);
  if(!coords)return null;
  const distanceKm=C.distanceKm(searchCenter,listing);
  if(!Number.isFinite(distanceKm)||distanceKm>radiusKm)return null;
  return {lat:coords.lat,lon:coords.lon,distanceKm,listing,kind:'exact'};
}
function located(rows){return Array.isArray(rows)?rows.map(point).filter(Boolean):[]}
function placeKey(location){
  const s=String(location||'').trim();
  if(!s||/^(?:Ort in E-Mail nicht ausgewiesen|Ort unbekannt)$/i.test(s))return null;
  let first=s.split(',')[0].trim().replace(/\s+\(Anbieterangabe\)$/i,'');
  if(Object.hasOwn(centers,first))return first;
  if(Object.hasOwn(aliases,first))return aliases[first];
  // Only accept Munich as city for explicitly Munich-named districts, never a Landkreis "München (Kreis)".
  if(/,\s*München\s*$/i.test(s))return 'München';
  return null;
}
function locality(listing){
  if(!listing||!C||point(listing))return null;
  const key=placeKey(listing.location);
  if(!key)return null;
  const [lat,lon]=centers[key];
  const distanceKm=C.distanceKm(searchCenter,{lat,lon});
  if(distanceKm===null||distanceKm>radiusKm)return null;
  return {key,lat,lon,distanceKm,listing,kind:'locality'};
}
function grouping(rows){
  const exact=[],groups=new Map();let withoutLocation=0;
  for(const listing of Array.isArray(rows)?rows:[]){
    const p=point(listing);
    if(p){exact.push(p);continue}
    const v=locality(listing);
    if(!v){withoutLocation++;continue}
    if(!groups.has(v.key))groups.set(v.key,{key:v.key,lat:v.lat,lon:v.lon,listings:[],kind:'locality'});
    groups.get(v.key).listings.push(listing);
  }
  return {exact,localities:[...groups.values()],withoutLocation};
}
root.ImmoRadarMapCore=Object.freeze({searchCenter,radiusKm,point,located,placeKey,locality,grouping});
})(globalThis);
