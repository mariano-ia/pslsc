// Tests de la lógica pura del form de la landing del Soccer School.  Run: node --test "tools/tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readUtms, validate, isConfigured, buildProxyPlan } from '../../school/form.js';

const valid = { parentName: 'Ana Pérez', email: 'ana@example.com', kidsAges: ['6', '9'], consent: true };

test('readUtms: solo claves utm_*, recortadas y sin vacías', () => {
  assert.deepEqual(
    readUtms('?utm_source=instagram&utm_medium=%20paid%20&utm_campaign=&gclid=123'),
    { utm_source: 'instagram', utm_medium: 'paid' },
  );
  assert.deepEqual(readUtms(''), {});
});

test('readUtms: corta valores largos a 200 caracteres', () => {
  assert.equal(readUtms(`?utm_term=${'x'.repeat(300)}`).utm_term.length, 200);
});

test('validate: devuelve el primer error en el orden visual del form', () => {
  assert.equal(validate({ ...valid, parentName: '  ' }).field, 'parentName');
  assert.equal(validate({ ...valid, email: 'ana@' }).field, 'email');
  assert.equal(validate({ ...valid, kidsAges: [] }).field, 'kidsAges');
  assert.equal(validate({ ...valid, consent: false }).field, 'consent');
  assert.equal(validate({ parentName: '', email: '', kidsAges: [], consent: false }).field, 'parentName');
});

test('validate: null con datos completos', () => {
  assert.equal(validate(valid), null);
});

test('isConfigured: exige cuenta, form y los cuatro campos obligatorios', () => {
  const full = {
    account: 'pslsc',
    formId: '14',
    fields: { parentName: 'fullname', email: 'email', kidsAges: 'field[50][]', consent: 'field[51][]' },
  };
  assert.equal(isConfigured(full), true);
  assert.equal(isConfigured({ ...full, formId: '' }), false);
  assert.equal(isConfigured({ ...full, fields: { ...full.fields, kidsAges: '' } }), false);
  assert.equal(isConfigured(undefined), false);
});

test('buildProxyPlan: mapea campos, edades, consentimiento y solo los UTM configurados', () => {
  const fields = {
    parentName: 'fullname', email: 'email', kidsAges: 'field[50][]', consent: 'field[51][]',
    utm_source: 'field[52]', utm_medium: '',
  };
  const plan = buildProxyPlan({ ...valid, parentName: ' Ana Pérez ' }, { utm_source: 'instagram', utm_medium: 'paid' }, fields);
  assert.deepEqual(plan.text, [['fullname', 'Ana Pérez'], ['email', 'ana@example.com'], ['field[52]', 'instagram']]);
  assert.deepEqual(plan.checkGroups, [['field[50][]', ['6', '9']]]);
  assert.deepEqual(plan.checks, ['field[51][]']);
});
