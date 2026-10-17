#!/usr/bin/env node
/**
 * Repeatable real-source reference checks. Source facts checked 2026-10-17.
 * No third-party page is fetched, copied, or automatically harvested.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const base=new URL('../',import.meta.url);
const [references,approvedFeeds,publicData]=await Promise.all([
  readFile(new URL('data/research-links.json',base),'utf8').then(JSON.parse),
  readFile(new URL('config/feeds.json',base),'utf8').then(JSON.parse),
  readFile(new URL('data/listings.json',base),'utf8').then(JSON.parse)
]);
assert.equal(references.checkedAt,'2026-10-17');
assert.equal(references.properties.length,3,'Three hand-checked official primary-source links are expected');
assert.ok(Array.isArray(approvedFeeds.feeds));
assert.ok(Array.isArray(publicData.listings));
const urls=new Set();
for(const item of references.properties){
  const url=new URL(item.url);
  assert.equal(url.protocol,'https:');
  assert.ok(['www.immobilien.bayern.de','immobilien.bayern.de'].includes(url.hostname));
  assert.equal(item.location,'80997 München');
  assert.ok(item.price>0&&item.area>0);
  assert.ok(!('marketValue' in item),'Source links must not imply an independently verified market value');
  assert.ok(!('lat' in item),'Source links must not invent coordinates');
  assert.match(item.priceLabel,/Preisvorstellung/);
  assert.equal(item.deadline,'2026-11-22');
  assert.ok(!urls.has(item.url),'Duplicate original offer');
  urls.add(item.url);
}
for(const feed of approvedFeeds.feeds.filter(f=>f.enabled)){assert.equal(feed.termsApproved,true);assert.equal(feed.redistributionApproved,true)}
for(const item of publicData.listings){assert.ok(item.title&&item.url&&Number(item.price)>0,'Public feed item must be attributable and priced')}

const lechel=references.properties.find(p=>p.id==='bayern-lechel-2026');
assert.equal(lechel.price,990000);
const costRate=.10;
const hypotheticalRenovation=140000; // scenario, not a source fact
const hypotheticalMarketValue=1400000; // scenario, not a source fact
const completeCosts=lechel.price*(1+costRate)+hypotheticalRenovation;
const difference=hypotheticalMarketValue-completeCosts;
const discount=100*difference/hypotheticalMarketValue;
assert.equal(completeCosts,1229000);
assert.equal(difference,171000);
assert.ok(Math.abs(discount-12.214285714285714)<1e-8);
console.log('PASS: 3 real original-source links checked, no fabricated valuation/coordinates, no unlicensed feeds');
console.log('PASS: Hypothetical scenario (NOT a market-value estimate): '+JSON.stringify({offerPrice:lechel.price,completeCosts,difference,discountPct:discount.toFixed(2)}));
