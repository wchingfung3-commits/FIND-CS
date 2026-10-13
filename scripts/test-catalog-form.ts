import assert from 'node:assert/strict';
import { catalogPayload, CATALOG } from '../src/admin/catalogForm';
const route = { ...CATALOG.routes.sample, id: 'acme-phone', company_id: 'acme', steps: [' Call ', '', ' Press 1 '], published: true, revision: 99, verification_status: 'verified' };
const draft = catalogPayload('routes', route, false);
assert.equal(draft.published, false); assert.deepEqual(draft.steps, ['Call', 'Press 1']);
assert.equal(draft.issue_id, null); assert.equal(draft.action_url, null);
assert.equal(draft.is_human_support, true); assert.ok(!('revision' in draft)); assert.ok(!('verification_status' in draft));
const editing = catalogPayload('routes', { ...route, category: 'other' }, true);
assert.equal(editing.published, true); assert.equal(editing.is_human_support, false); assert.ok(!('id' in editing));
for (const patch of [{ id: 'Wrong ID' }, { company_id: '' }, { channel_type: '__proto__' }, { category: 'invalid' }, { steps: [123] }, { action_url: 'javascript:alert(1)' }, { action_url: 'https://example.com/\nattack' }]) {
  assert.throws(() => catalogPayload('routes', { ...route, ...patch }, false));
}
assert.equal(catalogPayload('routes', { ...route, action_url: 'tel:+85212345678' }, false).action_url, 'tel:+85212345678');
assert.throws(() => catalogPayload('companies', { id: 'acme', name: 'Acme', industry: '' }, false));
assert.throws(() => catalogPayload('companies', { id: 'acme', name: 'Acme', industry: 'retail', official_url: 'javascript:alert(1)' }, false));
assert.throws(() => catalogPayload('issues', { id: 'refund', name: '退款', company_id: '' }, false));
assert.throws(() => catalogPayload('industries', { id: 'retail', name: ' ', icon: 'Shop' }, false));
assert.equal(catalogPayload('companies', { id: 'acme', name: ' Acme ', industry: 'retail', description: '  ', official_url: 'https://example.com' }, false).description, null);
console.log('PASS guided catalog drafts, immutable fields, unsafe links and required parent checks');
