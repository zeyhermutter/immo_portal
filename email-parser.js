/* Parse a user-selected .eml message locally. No network access and no message storage. */
(function(root){
'use strict';
const URL_PATTERN=/https?:\/\/[^\s<>"'`]+/gi;
function headersAndBody(raw){
 const sep=/\r?\n\r?\n/.exec(raw),p=sep?sep.index:-1;
 const headerBlock=p<0?'':raw.slice(0,p),body=p<0?raw:raw.slice(p+sep[0].length);
 const headers={},lines=headerBlock.replace(/\r\n/g,'\n').split('\n');
 let last='';
 for(const line of lines){
  if(/^\s/.test(line)&&last){headers[last]+=' '+line.trim();continue}
  const pos=line.indexOf(':');if(pos<1)continue;
  last=line.slice(0,pos).toLowerCase().trim();
  if(!/^[a-z0-9-]+$/.test(last))continue;
  headers[last]=line.slice(pos+1).trim();
 }
 return {headers,body};
}
function textDecoder(bytes,charset){
 try{return new TextDecoder(charset||'utf-8',{fatal:false}).decode(bytes)}
 catch{return new TextDecoder('utf-8').decode(bytes)}
}
function decodeQuotedPrintable(input,charset){
 const s=input.replace(/=\r?\n/g,''),bytes=[],enc=new TextEncoder();
 for(let i=0;i<s.length;i++){
  if(s[i]==='='&&/^[0-9a-f]{2}$/i.test(s.slice(i+1,i+3))){
   bytes.push(parseInt(s.slice(i+1,i+3),16));i+=2;continue
  }
  const cp=s.codePointAt(i),str=String.fromCodePoint(cp);
  for(const b of enc.encode(str))bytes.push(b);
  if(cp>0xffff)i++;
 }
 return textDecoder(new Uint8Array(bytes),charset);
}
function decodeBase64(s,charset){
 const clean=s.replace(/\s/g,'');
 if(!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)||clean.length%4!==0)throw Error('Ungültige Base64-Kodierung');
 const bin=atob(clean),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
 return textDecoder(bytes,charset);
}
function decodePart(body,headers){
 const charset=/charset\s*=\s*"?([^"\s;]+)/i.exec(headers['content-type']||'')?.[1]||'utf-8';
 const encoding=(headers['content-transfer-encoding']||'').toLowerCase();
 if(encoding==='quoted-printable')return decodeQuotedPrintable(body,charset);
 if(encoding==='base64')return decodeBase64(body,charset);
 return body;
}
function scanParts(raw,depth=0){
 if(depth>6)return [];
 const {headers,body}=headersAndBody(raw);
 const contentType=(headers['content-type']||'text/plain').toLowerCase();
 const disposition=(headers['content-disposition']||'').toLowerCase();
 if(disposition.startsWith('attachment'))return [];
 const boundary=/boundary\s*=\s*(?:"([^"]+)"|([^;\s]+))/i.exec(headers['content-type']||'');
 if(contentType.startsWith('multipart/')&&boundary){
  const value=boundary[1]||boundary[2];
  if(value.length>120)return [];
  const chunks=body.replace(/\r\n/g,'\n').split('--'+value);
  return chunks.slice(1).filter(x=>!x.trimStart().startsWith('--')).flatMap(x=>scanParts(x.replace(/^\n/,'').replace(/\n$/,''),depth+1));
 }
 if(!contentType.startsWith('text/plain')&&!contentType.startsWith('text/html'))return [];
 return [decodePart(body,headers)];
}
function entityDecode(s){
 return s.replace(/&(?:amp|quot|apos|lt|gt|#(?:x[0-9a-f]+|\d+));/gi,m=>{
  const k=m.slice(1,-1).toLowerCase();
  const basic={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'};
  if(basic[k])return basic[k];
  if(k[0]==='#'){const n=k[1]==='x'?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):m}
  return m
 });
}
function extractExposes(text){
 const output=new Set(),decoded=entityDecode(text.replace(/\\\//g,'/').replace(/=\r?\n/g,''));
 // Only original listing URLs: no click-tracking host, redirect following, or retained query parameters.
 for(const match of decoded.matchAll(URL_PATTERN)){
  const raw=match[0].replace(/[.,;)]+$/g,'');
  try{
   const u=new URL(raw);
   if(u.protocol!=='https:'||!['www.immobilienscout24.de','immobilienscout24.de'].includes(u.hostname.toLowerCase()))continue;
   const id=/^\/expose\/(\d{5,12})(?:\/|$)/i.exec(u.pathname);
   if(!id)continue;
   output.add('https://www.immobilienscout24.de/expose/'+id[1]);
  }catch{}
 }
 return [...output];
}
function parseEml(raw){
 if(typeof raw!=='string'||raw.length>2_000_000)throw Error('Ungültige oder zu große E-Mail (maximal 2 MB).');
 const {headers}=headersAndBody(raw);
 const parts=scanParts(raw);
 const links=[...new Set(parts.flatMap(extractExposes))];
 return {links,parsedParts:parts.length,subject:headers.subject||'',date:headers.date||''};
}
root.ImmoEmailParser=Object.freeze({parseEml,extractExposes});
})(globalThis);
