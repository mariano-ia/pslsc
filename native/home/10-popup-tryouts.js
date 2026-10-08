/**
 * HOME 10 · Popup de captación (tryouts / academia).
 *
 * Mismo patrón de envío que los otros cuatro formularios del sitio (ver
 * custom/ac-forms/ac-forms.js y claude/formularios-activecampaign.md):
 *   - El form de AC se pega aparte en la página como "embed simple"
 *     (<div class="_form_NN"></div> + <script src=".../embed.php?id=NN">).
 *   - El embed le pone id ALEATORIO al form en cada carga: lo único fijo es la CLASE ._form_NN.
 *   - Nosotros llenamos sus campos y posteamos con acSubmitDirect(), NO apretando su botón:
 *     su submit inyecta un <script> a activehosted.com y en iPhone con bloqueo de contenido ese
 *     <script> nunca entra (bug del 24-09, confirmado con HAR).
 *
 * Mapeo de campos: name -> fullname, email -> email. Los dos son campos estándar de AC, así que
 * este bloque NO depende de ningún field[NN] custom — si mañana se rehace el form en AC, lo único
 * que hay que cambiar acá es el número de AC_FORM_CLASS.
 *
 * Reglas propias del popup:
 *   - TRYOUT_UNTIL: fecha de corte. Pasada esa hora el popup no se muestra más aunque el bloque
 *     siga pegado en WordPress. Es la campaña de 48hs; no depende de que alguien se acuerde de
 *     despegarlo.
 *   - Una sola vez por visitante: si lo cerró o si ya dejó los datos, no vuelve a aparecer.
 *   - Arranca a los 1200ms, no en el instante 0: antes de eso la página todavía está pintando y
 *     aparecer encima castiga el LCP además de leerse como publicidad.
 */
const AC_FORM_CLASS = '_form_16';   // <-- ID del form nuevo de ActiveCampaign. CAMBIAR.
const AC_WAIT_TIMEOUT = 10000;
const AC_SUBMIT_TIMEOUT = 15000;
const AC_FIELD_MAP = {
  name: 'fullname',
  email: 'email',
};

const TRYOUT_UNTIL = '2026-09-28T23:59:00-04:00';   // <-- corte de la campaña. CAMBIAR.
const TRYOUT_DELAY = 1200;
const TRYOUT_KEY = 'psl-tryout-popup';
const TRYOUT_FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea';

function tryoutSeen() {
  try {
    return !!window.localStorage.getItem(TRYOUT_KEY);
  } catch (err) {
    return false;   // modo privado / storage bloqueado: mejor mostrarlo que romperlo
  }
}

function tryoutRemember(estado) {
  try {
    window.localStorage.setItem(TRYOUT_KEY, estado);
  } catch (err) {
    /* sin storage no podemos recordarlo — no es motivo para romper el envío */
  }
}

function tryoutVigente() {
  const hasta = Date.parse(TRYOUT_UNTIL);
  return !Number.isNaN(hasta) && Date.now() < hasta;
}

function tryoutFindAcForm() {
  return document.querySelector(`form.${AC_FORM_CLASS}`);
}

function tryoutHideAcProxy() {
  const hide = (formEl) => {
    const wrapper = formEl.parentElement || formEl;
    wrapper.style.display = 'none';
  };
  const existing = tryoutFindAcForm();
  if (existing) { hide(existing); return; }
  const observer = new MutationObserver(() => {
    const form = tryoutFindAcForm();
    if (form) { hide(form); observer.disconnect(); }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), AC_WAIT_TIMEOUT);
}

function initTryoutPopup(root = document) {
  const popup = root.querySelector('[data-tryout-popup]');
  if (!popup) return;
  if (!tryoutVigente() || tryoutSeen()) { popup.remove(); return; }

  acInstallResultHooks();

  // position:fixed se rompe si algún ancestro tiene transform/filter/perspective, y el content
  // column del tema no es nuestro. Lo colgamos del <body> dentro de un host .pslsc para no perder
  // .psl-btn / .cta-primary / .psl-field-invalid, que en el CSS adicional viven bajo .pslsc.
  const host = document.createElement('div');
  host.className = 'pslsc psltp-host';
  host.appendChild(popup);
  document.body.appendChild(host);

  const card = popup.querySelector('.psltp__card');
  const form = popup.querySelector('[data-tryout-form]');
  const done = popup.querySelector('[data-tryout-done]');
  const msg = popup.querySelector('[data-tryout-msg]');
  const submitBtn = popup.querySelector('.psltp__submit');
  let abridor = null;
  let abierto = false;

  const onKey = (e) => {
    if (e.key === 'Escape') { cerrar(); return; }
    if (e.key !== 'Tab') return;
    const focusables = [...card.querySelectorAll(TRYOUT_FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    const primero = focusables[0];
    const ultimo = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  };

  function abrir() {
    if (abierto || tryoutSeen()) return;
    abierto = true;
    abridor = document.activeElement;
    popup.hidden = false;
    popup.classList.add('is-open');
    document.documentElement.classList.add('psltp-lock');
    document.body.classList.add('psltp-lock');
    document.addEventListener('keydown', onKey);
    const primerCampo = form.querySelector('.psltp__input');
    if (primerCampo) primerCampo.focus({ preventScroll: true });
  }

  function cerrar(estado = 'closed') {
    if (!abierto) return;
    abierto = false;
    popup.classList.remove('is-open');
    popup.hidden = true;
    document.documentElement.classList.remove('psltp-lock');
    document.body.classList.remove('psltp-lock');
    document.removeEventListener('keydown', onKey);
    tryoutRemember(estado);
    if (abridor && typeof abridor.focus === 'function') abridor.focus({ preventScroll: true });
  }

  popup.querySelectorAll('[data-tryout-close]').forEach((el) => {
    el.addEventListener('click', () => cerrar());
  });

  tryoutHideAcProxy();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const acForm = tryoutFindAcForm();
    const submitButton = acForm && acForm.querySelector('._submit');
    if (!acForm || !submitButton) {
      msg.classList.add('psltp__msg--error');
      msg.textContent = "Something's off on our end — try the form on the Academy page.";
      console.error(`[tryout-popup] no se encontró el form oculto de ActiveCampaign (form.${AC_FORM_CLASS}) en la página`);
      return;
    }

    submitBtn.disabled = true;
    msg.classList.remove('psltp__msg--error');
    msg.textContent = 'Sending…';

    const thankYou = acForm.querySelector('._form-thank-you');
    let settled = false;
    const finish = (ok, text) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(fallback);
      document.removeEventListener(AC_RESULT_EVENT, onAcResult);
      submitBtn.disabled = false;
      if (ok) {
        tryoutRemember('sent');
        form.hidden = true;
        done.hidden = false;
        const cerrarBtn = done.querySelector('[data-tryout-close]');
        if (cerrarBtn) cerrarBtn.focus({ preventScroll: true });
        return;
      }
      msg.classList.add('psltp__msg--error');
      msg.textContent = text;
    };

    const onAcResult = (ev) => {
      if (settled) return;
      const args = ev.detail && Array.isArray(ev.detail.args) ? ev.detail.args : [];
      if (ev.detail && ev.detail.ok) return;   // el éxito lo resuelve el observer
      finish(false, acApplyError(form, args[1], 'tryout-popup'));
    };
    document.addEventListener(AC_RESULT_EVENT, onAcResult);

    const observer = new MutationObserver(() => {
      const success = thankYou && thankYou.style.display !== 'none' && thankYou.style.display !== '';
      if (success) { finish(true, ''); return; }
      const error = acForm.querySelector('._form_error, ._error-inner._form_error');
      if (error) finish(false, acApplyError(form, acDomErrorText(acForm), 'tryout-popup'));
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
      acSubmitDirect(acForm).then((r) => {
        if (r.ok) { finish(true, ''); return; }
        finish(false, acApplyError(form, r.message, 'tryout-popup'));
      }).catch((err) => {
        console.warn('[psl-form] tryout-popup — el POST directo falló, reintento con el submit de AC', err);
        try { submitButton.click(); } catch (err2) { finish(false, 'We could not send that — please try again in a moment.'); }
      });
    } catch (err) {
      finish(false, 'We could not send that — please try again in a moment.');
      console.error('[tryout-popup] ActiveCampaign proxy submit falló', err);
    }
  });

  setTimeout(abrir, TRYOUT_DELAY);
}

document.addEventListener('DOMContentLoaded', () => initTryoutPopup());

export { initTryoutPopup };
