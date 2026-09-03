/**
 * Partners — form de contacto (P05). Envía por proxy a un form de ActiveCampaign (id 12) pegado en
 * la misma página vía embed simple (`<div class="_form_12"></div>` + `<script src=".../embed.php?id=12">`):
 * llenamos sus campos ocultos y disparamos su submit real en vez de un POST propio.
 *
 * Reemplaza al proxy de WPForms (id 14336) que usaba este mismo bloque — el cliente migró este form
 * a ActiveCampaign. Mismo patrón que el newsletter del footer (ver native/home/09-cierre-footer.js):
 *  1. AC no confirma con una clase nueva en el DOM sino cambiando el `style.display` inline de
 *     `._form-thank-you` de "none" a "block" — el observer mira `attributes:['style']`.
 *  2. El form oculto tiene que pegarse en WP como el "embed simple" de AC (script externo, sin JS
 *     inline) para no arriesgar el bug de mangling de WordPress con `<script>` inline (ver CLAUDE.md).
 *  3. El embed simple de AC genera un `id` de form ALEATORIO en cada carga de página — NO el id fijo
 *     que aparece en el export "full embed". Lo único fijo y confiable es la CLASE: el form inyectado
 *     siempre trae class="_form_12" y su botón de submit siempre trae class="_submit". Por eso acá
 *     seleccionamos SIEMPRE por clase, nunca por id.
 *
 * Mapeo de campos (nuestro name → name real en el form de AC, confirmado contra el export del
 * form armado en AC — pslsc-main/version anterior/partnetsContact.html):
 *   name    → fullname
 *   company → field[42]
 *   email   → email
 *   message → field[43]
 */
const AC_FORM_CLASS = '_form_12';
const AC_WAIT_TIMEOUT = 10000;
const AC_SUBMIT_TIMEOUT = 15000;
const AC_FIELD_MAP = {
  name: 'fullname',
  company: 'field[42]',
  email: 'email',
  message: 'field[43]',
};

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

function initPartnerContact(root = document) {
  const form = root.querySelector('[data-partner-contact]');
  if (!form) return;
  const msg = form.querySelector('[data-partner-msg]');
  const submitBtn = form.querySelector('.pcontact__submit');
  hideAcProxy();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const acForm = findAcForm();
    const submitButton = acForm?.querySelector('._submit');
    if (!acForm || !submitButton) {
      msg.classList.add('pcontact__msg--error');
      msg.textContent = "Something's off on our end — email us directly for now.";
      console.error(`[partner-contact] no se encontró el form oculto de ActiveCampaign (form.${AC_FORM_CLASS}) en la página`);
      return;
    }

    submitBtn.disabled = true;
    msg.classList.remove('pcontact__msg--error');
    msg.textContent = 'Sending…';

    const thankYou = acForm.querySelector('._form-thank-you');
    let settled = false;
    const finish = (ok, text) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(fallback);
      submitBtn.disabled = false;
      if (!ok) msg.classList.add('pcontact__msg--error');
      msg.textContent = text;
      if (ok) form.reset();
    };

    const observer = new MutationObserver(() => {
      const success = thankYou && thankYou.style.display !== 'none' && thankYou.style.display !== '';
      if (success) { finish(true, '✓ Got it. A real person will get back to you soon.'); return; }
      const error = acForm.querySelector('._form_error, ._error-inner._form_error');
      if (error) finish(false, 'Something went wrong sending that — try again in a moment.');
    });
    observer.observe(acForm, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true });
    const fallback = setTimeout(
      () => finish(false, 'Something went wrong sending that — try again in a moment.'),
      AC_SUBMIT_TIMEOUT
    );

    try {
      Object.entries(AC_FIELD_MAP).forEach(([name, acName]) => {
        const source = form.elements[name];
        const target = acForm.querySelector(`[name="${acName}"]`);
        if (!source || !target) return;
        target.value = source.value;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
      });
      submitButton.click();
    } catch (err) {
      finish(false, 'Something went wrong sending that — try again in a moment.');
      console.error('[partner-contact] ActiveCampaign proxy submit falló', err);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => initPartnerContact());

export { initPartnerContact };
