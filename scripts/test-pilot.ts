import assert from 'node:assert/strict';
import { pilotCompanies } from '../src/research/pilot';
import { validatePilot, researchAction } from '../src/research/validatePilot';
validatePilot(pilotCompanies);
assert.deepEqual(pilotCompanies.map(company => company.id), ['csl','hangseng','ird','dhl','hktvmall']);
const copy = () => JSON.parse(JSON.stringify(pilotCompanies));
for (const mutate of [
  (data: typeof pilotCompanies) => { data[0].menuComplete = true as false; },
  (data: typeof pilotCompanies) => { data[0].routes[0].sourceIds = ['hs-contact']; },
  (data: typeof pilotCompanies) => { data[0].routes[0].actionUrl = 'javascript:alert(1)'; },
  (data: typeof pilotCompanies) => { Object.assign(data[0].routes[0], { verificationStatus: 'verified' }); },
  (data: typeof pilotCompanies) => { data[3].routes.at(-1)!.actionUrl = 'https://wa.me/123'; },
]) { const data = copy(); mutate(data); assert.throws(() => validatePilot(data)); }
assert.equal(researchAction({ ...pilotCompanies[3].routes.at(-1)!, actionUrl: 'https://wa.me/123' }), undefined);
assert.ok(pilotCompanies.every(company => company.routes.some(route => route.issue === '其他問題／不確定分類')));
console.log(`PASS ${pilotCompanies.length} research companies, ${pilotCompanies.reduce((sum, company) => sum + company.routes.length, 0)} source-linked candidates, no verification/speed claims, conflict suppression`);
