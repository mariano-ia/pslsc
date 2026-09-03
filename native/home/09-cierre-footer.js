/**
 * Newsletter — bloque 09. Envía por proxy a un form de ActiveCampaign (id 8) pegado en la misma
 * página vía embed simple (`<div class="_form_8"></div>` + `<script src=".../embed.php?id=8">`):
 * llenamos su input oculto y disparamos su submit real en vez de un POST propio.
 *
 * Reemplaza al proxy de WPForms (id 14346) que usaba este mismo bloque — el cliente migró el
 * newsletter del footer a ActiveCampaign. Mismo patrón (form visible propio -> proxy oculto de
 * terceros), pero OJO con tres diferencias reales de AC vs WPForms:
 *  1. AC no confirma con una clase (`.wpforms-confirmation-container-full`) sino cambiando el
 *     `style.display` inline de `._form-thank-you` de "none" a "block" — por eso el observer acá
 *     mira `attributes:['style']`, no `childList` de una clase nueva.
 *  2. Usar el "full embed" de AC (con su <script> de validación pegado inline en el HTML) arriesga
 *     el mismo bug de mangling de WordPress que ya nos mordió con nuestros propios bloques (ver
 *     CLAUDE.md — WP le pega a `&&` adentro de <script> como texto plano). Por eso el form oculto
 *     tiene que pegarse en WP como el "embed simple" de AC (script externo, sin JS inline) — el
 *     proxy de acá no depende de que ese HTML sea el full embed, solo de los selectores de abajo.
 *  3. El embed simple de AC genera un `id` de form ALEATORIO en cada carga de página (ej.
 *     `_form_6A91DC5008FB5_`), NO el id fijo `_form_8_` que aparece en el export "full embed" de
 *     AC (confirmado en vivo con el sitio real). Lo único fijo y confiable es la CLASE: el form
 *     inyectado siempre trae class="_form_8" y su botón de submit siempre trae class="_submit".
 *     Por eso acá seleccionamos SIEMPRE por clase, nunca por id.
 */
const AC_FORM_CLASS = '_form_8';
const AC_WAIT_TIMEOUT = 10000;
const AC_SUBMIT_TIMEOUT = 15000;

function findAcForm() {
  return document.querySelector(`form.${AC_FORM_CLASS}`);
}

function hideAcProxy() {
  const hide = (formEl) => {
    // AC inyecta el <form class="_form_8"> adentro de un wrapper propio (div style="text-align:center"
    // en el full embed, algo equivalente en el embed simple) — ocultamos ese wrapper, no el <form>
    // solo, para no dejar un hueco vacío con su padding/margin puesto por el CSS de AC.
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

function initNewsletter(root = document) {
  const form = root.querySelector('[data-newsletter]');
  if (!form) return;
  const msg = form.parentElement.querySelector('[data-newsletter-msg]');
  const submitBtn = form.querySelector('.newsletter__btn');
  hideAcProxy();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const acForm = findAcForm();
    const emailInput = acForm?.querySelector('input[name="email"]');
    const submitButton = acForm?.querySelector('._submit');
    if (!acForm || !emailInput || !submitButton) {
      msg.classList.add('newsletter__msg--error');
      msg.textContent = "Something's off on our end — try again in a moment.";
      console.error(`[newsletter] no se encontró el form oculto de ActiveCampaign (form.${AC_FORM_CLASS}) en la página`);
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    msg.classList.remove('newsletter__msg--error');
    msg.textContent = 'Sending…';

    const thankYou = acForm.querySelector('._form-thank-you');
    let settled = false;
    const finish = (ok, text) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(fallback);
      if (submitBtn) submitBtn.disabled = false;
      if (!ok) msg.classList.add('newsletter__msg--error');
      msg.textContent = text;
      if (ok) form.reset();
    };

    const observer = new MutationObserver(() => {
      const success = thankYou && thankYou.style.display !== 'none' && thankYou.style.display !== '';
      if (success) { finish(true, "✓ You're on the list. Welcome to the build."); return; }
      const error = acForm.querySelector('._form_error, ._error-inner._form_error');
      if (error) finish(false, 'Something went wrong — try again in a moment.');
    });
    observer.observe(acForm, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true });
    // fallback: si AC no contesta (red caída, script no cargó a tiempo) no queremos dejar el botón
    // deshabilitado con "Sending…" para siempre — WPForms nunca tuvo este problema porque su submit
    // es sincrónico contra el mismo dominio; el de AC es un JSONP a activehosted.com.
    const fallback = setTimeout(
      () => finish(false, 'Something went wrong — try again in a moment.'),
      AC_SUBMIT_TIMEOUT
    );

    try {
      emailInput.value = form.elements.email.value;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      submitButton.click();
    } catch (err) {
      finish(false, 'Something went wrong — try again in a moment.');
      console.error('[newsletter] ActiveCampaign proxy submit falló', err);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => initNewsletter());

export { initNewsletter };
