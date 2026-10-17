#!/usr/bin/env node
/**
 * Approved-source JSON ingestion for ImmoRadar.
 * No crawling, no website scraping, no search engine harvesting.
 * Every feed requires explicit permission + redistribution confirmation.
 * Works with Node.js 22+; output is a static public file for GitHub Pages.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {isIP} from 'node:net';

const CONFIG=new URL('../config/feeds.json',import.meta.url);
const OUTPUT=new URL('../data/listings.json',import.meta.url);
const MAX_BYTES=2_000_000;
const MAX_OBJECTS=5000;
const MAX_STR=4000;
const str=(v,n=MAX_STR)=>String(v??'').trim().slice(0,n);
const num=(v)=>{const n=Number(v);return Number.isFinite(n)&&n>=0?n:0};
const coord=(v,min,max)=>v==null||v===''?null:(Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max?Number(v):null);
function validUrl(raw,host){
 const u=new URL(raw);
 if(u.protocol!=='https:'||u.username||u.password||u.port||isIP(u.hostname)||u.hostname!==host||u.hostname==='localhost'||u.hostname.endsWith('.local'))throw Error('only approved, exact HTTPS hosts without credentials/ports are allowed');
 return u.href;
}
function pathValue(row,key){return String(key||'').split('.').filter(Boolean).reduce((value,k)=>value&&typeof value==='object'?value[k]:undefined,row)}
function field(row,feed,name){
 const key=feed.fields?.[name]||name;
 return pathValue(row,key);
}
function normalize(row,feed){
 if(!row||typeof row!=='object'||Array.isArray(row))return null;
 const title=str(field(row,feed,'title'),180),urlRaw=str(field(row,feed,'url'),1500),price=num(field(row,feed,'price'));
 let url;
 try{const u=new URL(urlRaw);if(u.protocol!=='https:'||!u.hostname||u.username||u.password)return null;url=u.href}catch{return null}
 if(!title||!price)return null;
 const kind=str(field(row,feed,'kind')||'Sonstige',50);
 const area=num(field(row,feed,'area'));
 return {title,url,source:str(feed.name,80),kind,location:str(field(row,feed,'location'),150),price,area,
   description:str(field(row,feed,'description'),3000),
   lat:coord(field(row,feed,'lat'),-90,90),lon:coord(field(row,feed,'lon'),-180,180)};
}
function validatedFeeds(document){
 if(!document||!Array.isArray(document.feeds))throw Error('config/feeds.json must contain feeds: []');
 return document.feeds.filter(f=>{
  if(!f.enabled)return false;
  if(f.termsApproved!==true||f.redistributionApproved!==true||f.analysisApproved!==true||f.retentionApproved!==true)
   throw Error('Enabled feed '+str(f.name)+' needs documented permissions for access, publication, analysis and retention');
  if(f.auth!==undefined&&f.auth!=='none'&&f.auth!=='bearer-env')throw Error('Unknown feed authentication type; only none or bearer-env supported');
  if(f.format!=='json')throw Error('Only JSON feeds supported; '+str(f.name));
  const url=new URL(f.url);
  const host=str(f.allowedHost).toLowerCase();
  if(!host||!(/^[a-z0-9.-]+$/.test(host)))throw Error('Invalid allowedHost for '+str(f.name));
  validUrl(url.href,host);
  if(!f.name)throw Error('Feed name required');
  return true;
 });
}
async function fetchFeed(f){
 const host=str(f.allowedHost).toLowerCase(),url=validUrl(f.url,host);
 const headers={Accept:'application/json','User-Agent':'ImmoRadar-approved-feed-import/1.1 (+https://github.com/zeyhermutter/immo_portal)'};
 if(f.auth==='bearer-env'){
  const token=process.env.IMMO_FEED_TOKEN;
  if(!token||/[\r\n]/.test(token))throw Error('Authorized feed token missing or invalid: configure the IMMO_FEED_TOKEN GitHub Actions secret');
  headers.Authorization='Bearer '+token;
 }
 const resp=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(18000),headers});
 if(!resp.ok)throw Error(str(f.name)+': HTTP '+resp.status);
 const length=Number(resp.headers.get('content-length')||0);
 if(length>MAX_BYTES)throw Error(str(f.name)+': feed too large');
 const text=await resp.text();
 if(Buffer.byteLength(text,'utf8')>MAX_BYTES)throw Error(str(f.name)+': response exceeds size limit');
 let raw;
 try{raw=JSON.parse(text)}catch{throw Error(str(f.name)+': response is not JSON')}
 const rows=Array.isArray(raw)?raw:Array.isArray(raw?.items)?raw.items:Array.isArray(raw?.results)?raw.results:null;
 if(!rows)throw Error(str(f.name)+': expected array or {items:[]} or {results:[]}');
 if(rows.length>MAX_OBJECTS)throw Error(str(f.name)+': too many listings');
 return rows.map(r=>normalize(r,f)).filter(Boolean);
}
async function main(){
 const config=JSON.parse(await readFile(CONFIG,'utf8'));
 const feeds=validatedFeeds(config);
 if(process.argv.includes('--check')){console.log('Configuration valid. Enabled feeds: '+feeds.length);return}
 if(!feeds.length){console.log('No enabled, explicitly approved feeds. Existing dataset retained.');return}
 const all=[];
 for(const feed of feeds){
  const entries=await fetchFeed(feed);
  console.log(feed.name+': '+entries.length+' valid entries');
  all.push(...entries);
 }
 const seen=new Map();
 for(const entry of all){seen.set(entry.url,entry)}
 const result={updatedAt:new Date().toISOString(),listings:[...seen.values()]};
 await writeFile(OUTPUT,JSON.stringify(result,null,2)+'\n','utf8');
 console.log('Saved '+result.listings.length+' licensed listings to data/listings.json');
}
main().catch(error=>{console.error('Import aborted (previous public dataset left unchanged): '+error.message);process.exitCode=1});
