/**
 * Partners — form de contacto (P05). Nativo, sin backend: valida y muestra confirmación.
 * HANDOFF (WP): reemplazar el handler por un POST /api/partner-contact { name, company, email, message }.
 */
function initPartnerContact(root = document) {
  const form = root.querySelector('[data-partner-contact]');
  if (!form) return;
  const msg = form.querySelector('[data-partner-msg]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // HANDOFF (WP): POST { name, company, email, message } a /api/partner-contact
    msg.textContent = '✓ Got it. A real person will get back to you soon.';
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => initPartnerContact());

export { initPartnerContact };
