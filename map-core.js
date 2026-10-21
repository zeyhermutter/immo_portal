/* Real coordinates only: this map never geocodes an address or invents a listing position. */
(function(root){'use strict';
const searchCenter=Object.freeze({lat:48.14786,lon:11.72973});
const radiusKm=100;
function point(listing){
  const C=root.ImmoRadarCore;
  if(!C||!listing)return null;
  const coords=C.coords(listing);
  if(!coords)return null;
  const distanceKm=C.distanceKm(searchCenter,listing);
  if(!Number.isFinite(distanceKm)||distanceKm>radiusKm)return null;
  return {lat:coords.lat,lon:coords.lon,distanceKm,listing};
}
function located(rows){return Array.isArray(rows)?rows.map(point).filter(Boolean):[]}
root.ImmoRadarMapCore=Object.freeze({searchCenter,radiusKm,point,located});
})(globalThis);
