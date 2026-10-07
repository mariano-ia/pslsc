/**
 * Lógica pura del formulario de preinscripción (sin DOM): lectura de UTM, validación y armado del
 * plan de campos para el form oculto de ActiveCampaign. Tests: node --test "tools/tests/*.test.mjs"
 */

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_FIELDS = ['parentName', 'email', 'kidsAges', 'consent'];

/** UTM presentes en la query string (recortados a 200 caracteres; los vacíos se omiten). */
export function readUtms(search) {
  const params = new URLSearchParams(search);
  const utms = {};
  for (const key of UTM_KEYS) {
    const value = (params.get(key) || '').trim();
    if (value) utms[key] = value.slice(0, 200);
  }
  return utms;
}

/** Primer error en el orden visual del form, o null si todo está bien. */
export function validate({ parentName, email, kidsAges, consent }) {
  if (!parentName || !parentName.trim()) return { field: 'parentName', message: 'Please add your name.' };
  if (!EMAIL_RE.test((email || '').trim())) return { field: 'email', message: 'Enter a valid email so we can reach you.' };
  if (!kidsAges || kidsAges.length === 0) return { field: 'kidsAges', message: 'Pick at least one age.' };
  if (!consent) return { field: 'consent', message: 'Please confirm you’re the parent or guardian.' };
  return null;
}

/** true si la config de AC alcanza para enviar: cuenta, form y los cuatro campos obligatorios. */
export function isConfigured(ac) {
  if (!ac || !ac.account || !ac.formId || !ac.fields) return false;
  return REQUIRED_FIELDS.every((key) => Boolean(ac.fields[key]));
}

/**
 * Qué hay que escribir en el form de AC:
 *   text:        [name, value] para inputs de texto u ocultos (nombre, email, UTM configurados)
 *   checkGroups: [name, values[]] para checkboxes múltiples (edades)
 *   checks:      [name] para checkboxes simples que van tildados (consentimiento)
 */
export function buildProxyPlan(values, utms, fields) {
  const text = [
    [fields.parentName, values.parentName.trim()],
    [fields.email, values.email.trim()],
  ];
  for (const key of UTM_KEYS) {
    if (fields[key] && utms[key]) text.push([fields[key], utms[key]]);
  }
  return {
    text,
    checkGroups: [[fields.kidsAges, values.kidsAges.map(String)]],
    checks: values.consent ? [fields.consent] : [],
  };
}
