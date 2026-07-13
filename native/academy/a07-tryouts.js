/**
 * Tryouts — captura de solicitud de prueba (Academy).
 * MOCKEADO: no hay backend. Valida en cliente y simula el alta (saveLead) mostrando confirmación.
 * Contrato real sugerido (WordPress): POST /api/academy/tryout-request
 *   { playerFirstName, birthYear, position, email, phone, consent } → { ok: true }
 * Reemplazar el cuerpo de saveLead() por el fetch real cuando exista el endpoint.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mock del alta. Devuelve una promesa que resuelve ok. Acá va el fetch real en handoff. */
function saveLead(payload) {
  // eslint-disable-next-line no-console
  console.log('[tryout-request MOCK]', payload);
  return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 500));
}

function initTryouts(root = document) {
  const form = root.querySelector('form[data-tryout]');
  if (!form) return;
  const msg = form.querySelector('[data-tryout-msg]');
  const submit = form.querySelector('.tform__submit');

  const setMsg = (text, state) => {
    if (!msg) return;
    msg.textContent = text;
    if (state) msg.setAttribute('data-state', state); else msg.removeAttribute('data-state');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.classList.contains('is-done')) return;

    const data = new FormData(form);
    const payload = {
      playerFirstName: (data.get('playerFirstName') || '').toString().trim(),
      birthYear: (data.get('birthYear') || '').toString(),
      position: (data.get('position') || '').toString(),
      email: (data.get('email') || '').toString().trim(),
      phone: (data.get('phone') || '').toString().trim(),
      consent: data.get('consent') === 'on',
    };

    // validación mínima (mensaje humano, no técnico)
    let firstInvalid = null;
    const fail = (sel, text) => { if (!firstInvalid) { firstInvalid = form.querySelector(sel); setMsg(text, 'err'); } };
    if (!payload.playerFirstName) fail('#tf-name', 'Add the player’s first name.');
    else if (!payload.birthYear)  fail('#tf-year', 'Pick a birth year.');
    else if (!payload.position)   fail('#tf-pos', 'Pick a position.');
    else if (!EMAIL_RE.test(payload.email)) fail('#tf-email', 'Enter a valid email so we can reach you.');
    else if (!payload.consent)    fail('input[name="consent"]', 'Please confirm you’re the parent or guardian.');
    if (firstInvalid) { firstInvalid.focus(); return; }

    // envío (mockeado)
    if (submit) submit.setAttribute('disabled', 'true');
    setMsg('Sending…', null);
    try {
      await saveLead(payload);
      form.classList.add('is-done');
      setMsg(`You’re on the list. We’ll email the 2026–27 tryout details to ${payload.email}.`, 'ok');
    } catch {
      if (submit) submit.removeAttribute('disabled');
      setMsg('Something went wrong. Try again in a moment.', 'err');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => initTryouts());

export { initTryouts };
