/* Run with: node tests/email-parser.test.js */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(require('path').join(__dirname,'..','email-parser.js'),'utf8');
const ctx={URL,TextDecoder,TextEncoder,atob:s=>Buffer.from(s,'base64').toString('binary')};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);const P=ctx.ImmoEmailParser;
let passed=0;function test(name,fn){try{fn();passed++;console.log('✓',name)}catch(e){console.error('✗',name);throw e}}
const eml=(subject,body,from='ImmoScout24 <myscout@immobilienscout24.de>',date='Sat, 17 Oct 2026 21:09:35 +0000')=>`From: ${from}\r\nSubject: ${subject}\r\nDate: ${date}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`;
test('direct ImmoScout URL is canonical',()=>assert.equal(P.canonicalUrl('https://www.immobilienscout24.de/expose/171143290?utm_source=x'),'https://www.immobilienscout24.de/expose/171143290'));
test('push tracking URL becomes canonical without following redirect',()=>assert.equal(P.canonicalUrl('https://push.search.is24.de/email/expose/171143290?foo=secret'),'https://www.immobilienscout24.de/expose/171143290'));
test('tracking parameters are removed',()=>assert(!P.canonicalUrl('https://www.immobilienscout24.de/expose/171143290?utm=x').includes('?')));
test('opaque Immowelt click link is not guessed or followed',()=>assert.equal(P.canonicalUrl('https://click.by.immowelt.de/?qs=opaque'),null));
test('actual observed Immowelt confirmation structure is recognized safely',()=>{const r=P.parseEml(eml('Neue Suche gespeichert: Haus oder Wohnung zum Kauf in Feldkirchen','immowelt\nDu hast deine Suche erfolgreich gespeichert\nHaus oder Wohnung zum Kauf in Feldkirchen\nhttps://click.by.immowelt.de/?qs=opaque','immowelt <suche@info.immowelt.de>'));assert.equal(r.portal,'Immowelt');assert.equal(r.listings.length,0)});
test('multiple ImmoScout listings are extracted',()=>{const r=P.parseEml(eml('2 Angebote: Haus zum Kauf, im Umkreis von 50 km von München (Kreis)','https://push.search.is24.de/email/expose/171143290\nVilla Grünwald\n4.290.000 € · 291 m² · 650 m² · 10 Zi.\nGrünwald, Bayern\nhttps://push.search.is24.de/email/expose/171848372\nBungalow Grünwald\n2.250.000 € · 235 m² · 924 m² · 7 Zi.\nGrünwald, Bayern'));assert.equal(r.listings.length,2);assert.equal(r.sourceRadiusKm,50)});
test('duplicate expose links collapse',()=>{const r=P.parseEml(eml('Angebot','https://www.immobilienscout24.de/expose/171143290\nObjekt A 1.000.000 €\nhttps://push.search.is24.de/email/expose/171143290\nObjekt A 1.000.000 €'));assert.equal(r.listings.length,1)});
test('notification date is preserved',()=>assert(P.parseEml(eml('Angebot','https://www.immobilienscout24.de/expose/171143290\nObjekt A')).date.includes('17 Oct 2026')));
test('missing price stays null',()=>assert.equal(P.parseEml(eml('Angebot','https://www.immobilienscout24.de/expose/171143290\nObjekt ohne Preis')).listings[0].price,null));
test('missing area stays null',()=>assert.equal(P.parseEml(eml('Angebot','https://www.immobilienscout24.de/expose/171143290\nObjekt 999.000 €')).listings[0].livingArea,null));
test('renovation keywords are detected',()=>{const x=P.parseEml(eml('Angebot','https://www.immobilienscout24.de/expose/171143290\nRenovierungsbedürftiges Haus\n999.000 € · 120 m²\nHandwerkerobjekt provisionsfrei')).listings[0];assert(x.renovationHints.includes('handwerkerobjekt'));assert(x.renovationHints.includes('provisionsfrei'))});
test('unknown data is not invented',()=>{const x=P.parseEml(eml('Angebot','https://www.immobilienscout24.de/expose/171143290\nHaus')).listings[0];assert.equal(x.price,null);assert.equal(x.landArea,null);assert.equal(x.rooms,null)});
console.log(`\n${passed} parser tests passed.`);
