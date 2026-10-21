/* Load Leaflet from an independent CDN only if the primary source failed.
 * After it loads, upgrade the read-only fallback to a single, synchronized map.
 */
(function(root){'use strict';
function backup(){
  if(root.L?.map||document.getElementById('mapLeafletBackup'))return;
  const script=document.createElement('script');
  script.id='mapLeafletBackup';
  script.async=true;
  script.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
  script.onload=()=>{
    if(root.L?.map)root.ImmoRadarMap?.init();
  };
  script.onerror=()=>{
    const note=document.getElementById('mapFallbackNotice');
    if(note)note.hidden=false;
  };
  document.head.appendChild(script);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',backup);
else backup();
})(globalThis);
