import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../email-parser.js',import.meta.url),'utf8');
const sandbox={TextDecoder,TextEncoder,URL,atob};
vm.runInNewContext(source,sandbox,{timeout:1000,filename:'email-parser.js'});
const parser=sandbox.ImmoEmailParser;
assert.ok(parser,'ImmoEmailParser must be exposed');

const qp=[
'From: alerts@example.net',
'Subject: Feldkirchen Suchauftrag',
'Content-Type: text/plain; charset=UTF-8',
'Content-Transfer-Encoding: quoted-printable',
'',
'Expos=C3=A9 ansehen: https://www.immobilienscout24.de/expose/123456789?utm_source=3Dmail'
].join('\r\n');
assert.deepEqual([...parser.parseEml(qp).links],['https://www.immobilienscout24.de/expose/123456789']);

const multi=[
'MIME-Version: 1.0',
'Content-Type: multipart/alternative; boundary="x-boundary"',
'',
'--x-boundary',
'Content-Type: text/plain; charset=utf-8',
'',
'https://www.immobilienscout24.de/expose/987654321?utm_campaign=alert',
'--x-boundary',
'Content-Type: text/html; charset=utf-8',
'',
'<a href="https://www.immobilienscout24.de/expose/987654321?utm_source=alert&amp;PID=private">Immobilie</a>',
'--x-boundary--'
].join('\r\n');
assert.deepEqual([...parser.parseEml(multi).links],['https://www.immobilienscout24.de/expose/987654321']);

const html='<a href="https://www.immobilienscout24.de/expose/555555555?utm_source=email">Angebot</a>';
const b64=[
'Content-Type: text/html; charset=utf-8',
'Content-Transfer-Encoding: base64',
'',
Buffer.from(html).toString('base64')
].join('\r\n');
assert.deepEqual([...parser.parseEml(b64).links],['https://www.immobilienscout24.de/expose/555555555']);

const hostile=[
'Content-Type: text/plain',
'',
'https://attacker.immobilienscout24.de/expose/123456789',
'https://www.immobilienscout24.de/Suche/radius/haus-kaufen?savedSearchId=123',
'https://www.immobilienscout24.de/expose/11111?email=private@example.test'
].join('\r\n');
assert.deepEqual([...parser.parseEml(hostile).links],['https://www.immobilienscout24.de/expose/11111']);
assert.throws(()=>parser.parseEml('x'.repeat(2_000_001)),/zu große/);

console.log('PASS: .eml quoted-printable, multipart, base64, de-duplication, tracking removal, host allowlist, file limit');
