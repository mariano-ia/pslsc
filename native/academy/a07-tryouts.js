/**
 * Tryouts — captura de solicitud de prueba (Academy, bloque A07). Valida en cliente y envía por
 * proxy a un form de ActiveCampaign (id 10) pegado en la misma página vía embed simple
 * (`<div class="_form_10"></div>` + `<script src=".../embed.php?id=10">`): llenamos sus campos
 * ocultos y disparamos su submit real en vez de un POST propio.
 *
 * Reemplaza al proxy de WPForms (id 14349) que usaba este mismo bloque — el cliente migró este form
 * a ActiveCampaign. Mismo patrón que el newsletter del footer (ver native/home/09-cierre-footer.js):
 *  1. AC no confirma con una clase nueva en el DOM sino cambiando el `style.display` inline de
 *     `._form-thank-you` de "none" a "block" — el observer mira `attributes:['style']`.
 *  2. El form oculto tiene que pegarse en WP como el "embed simple" de AC (script externo, sin JS
 *     inline) para no arriesgar el bug de mangling de WordPress con `<script>` inline (ver CLAUDE.md).
 *  3. El embed simple de AC genera un `id` de form ALEATORIO en cada carga de página — NO el id fijo
 *     que aparece en el export "full embed". Lo único fijo y confiable es la CLASE: el form inyectado
 *     siempre trae class="_form_10" y su botón de submit siempre trae class="_submit". Por eso acá
 *     seleccionamos SIEMPRE por clase, nunca por id.
 *
 * OJO con el checkbox de consentimiento: el form de AC trae DOS elementos con
 * name="field[41][]" — un input oculto con el valor por defecto ("~|") y el checkbox real. Hay que
 * apuntar específicamente al `input[type="checkbox"]`, no al primero que matchee el name (si no,
 * el consentimiento nunca queda marcado en AC aunque el usuario sí lo haya tildado acá).
 *
 * Mapeo de campos (nuestro name → name real en el form de AC, confirmado contra el export del
 * form armado en AC — pslsc-main/version anterior/academyTryouts.html):
 *   playerFirstName → field[38]
 *   birthYear       → field[39]
 *   position        → field[40]
 *   email           → email
 *   phone           → phone
 *   consent         → field[41][]  (checkbox)
 *
 * La validación en cliente de abajo es la misma que tenía el proxy de WPForms — no cambia con la
 * migración, solo cambia a qué form oculto le pegamos.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AC_FORM_CLASS = '_form_10';
const AC_WAIT_TIMEOUT = 10000;
const AC_SUBMIT_TIMEOUT = 15000;
const AC_FIELD_MAP = {
  playerFirstName: 'field[38]',
  birthYear: 'field[39]',
  position: 'field[40]',
  email: 'email',
  phone: 'phone',
};
const AC_CONSENT_FIELD = 'field[41][]';

function findAcForm() {
  return document.querySelector(`form.${AC_FORM_CLASS}`);
}

function hideAcProxy() {
  const hide = (formEl) => {
    const wrapper = formEl.parentElement || formEl;
    wrapper.style.display = 'none';
  };
  const existing = findAcForm();
  if (existing) { hide(existing); return; }
  const observer = new MutationObserver(() => {
    const form = findAcForm();
    if (form) { hide(form); observer.disconnect(); }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), AC_WAIT_TIMEOUT);
}

function setProxyFieldValue(acForm, acName, value) {
  const target = acForm.querySelector(`[name="${acName}"]`);
  if (!target) return;
  target.value = value;
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));
}

function setProxyConsent(acForm, checked) {
  const target = acForm.querySelector(`input[type="checkbox"][name="${AC_CONSENT_FIELD}"]`);
  if (!target) return;
  target.checked = checked;
  target.dispatchEvent(new Event('change', { bubbles: true }));
}

function initTryouts(root = document) {
  const form = root.querySelector('form[data-tryout]');
  if (!form) return;
  const msg = form.querySelector('[data-tryout-msg]');
  const submit = form.querySelector('.tform__submit');
  hideAcProxy();

  const setMsg = (text, state) => {
    if (!msg) return;
    msg.textContent = text;
    if (state) msg.setAttribute('data-state', state); else msg.removeAttribute('data-state');
  };

  form.addEventListener('submit', (e) => {
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

    // validación mínima (mensaje humano, no técnico) — igual que el proxy de WPForms anterior
    let firstInvalid = null;
    const fail = (sel, text) => { if (!firstInvalid) { firstInvalid = form.querySelector(sel); setMsg(text, 'err'); } };
    if (!payload.playerFirstName) fail('#tf-name', 'Add the player’s first name.');
    else if (!payload.birthYear)  fail('#tf-year', 'Pick a birth year.');
    else if (!payload.position)   fail('#tf-pos', 'Pick a position.');
    else if (!EMAIL_RE.test(payload.email)) fail('#tf-email', 'Enter a valid email so we can reach you.');
    else if (!payload.consent)    fail('input[name="consent"]', 'Please confirm you’re the parent or guardian.');
    if (firstInvalid) { firstInvalid.focus(); return; }

    const acForm = findAcForm();
    const submitButton = acForm?.querySelector('._submit');
    if (!acForm || !submitButton) {
      setMsg('Something went wrong on our end. Try again in a moment.', 'err');
      console.error(`[tryout-request] no se encontró el form oculto de ActiveCampaign (form.${AC_FORM_CLASS}) en la página`);
      return;
    }

    if (submit) submit.setAttribute('disabled', 'true');
    setMsg('Sending…', null);

    const thankYou = acForm.querySelector('._form-thank-you');
    let settled = false;
    const finish = (ok, text, state) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(fallback);
      if (ok) {
        form.classList.add('is-done');
      } else if (submit) {
        submit.removeAttribute('disabled');
      }
      setMsg(text, state);
    };

    const observer = new MutationObserver(() => {
      const success = thankYou && thankYou.style.display !== 'none' && thankYou.style.display !== '';
      if (success) {
        finish(true, `You’re on the list. We’ll email the 2026–27 tryout details to ${payload.email}.`, 'ok');
        return;
      }
      const error = acForm.querySelector('._form_error, ._error-inner._form_error');
      if (error) finish(false, 'Something went wrong. Try again in a moment.', 'err');
    });
    observer.observe(acForm, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true });
    // fallback: si AC no contesta (red caída, script no cargó a tiempo) no queremos dejar el botón
    // deshabilitado con "Sending…" para siempre.
    const fallback = setTimeout(
      () => finish(false, 'Something went wrong. Try again in a moment.', 'err'),
      AC_SUBMIT_TIMEOUT
    );

    try {
      Object.entries(AC_FIELD_MAP).forEach(([name, acName]) => {
        setProxyFieldValue(acForm, acName, payload[name]);
      });
      setProxyConsent(acForm, payload.consent);
      submitButton.click();
    } catch (err) {
      finish(false, 'Something went wrong. Try again in a moment.', 'err');
      console.error('[tryout-request] ActiveCampaign proxy submit falló', err);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => initTryouts());

export { initTryouts };
