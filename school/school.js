/**
 * PSLSC Soccer School — landing v1 (/school). Cablea el formulario de preinscripción, la carga
 * opcional de analytics y el fade de las secciones. Lógica pura en form.js; config en config.js.
 *
 * Envío: proxy al form oculto de ActiveCampaign (mismo patrón que native/academy/a07-tryouts.js).
 * Cargamos el "embed simple" de AC adentro de #ac-proxy (oculto), copiamos los valores a sus campos
 * y disparamos su `._submit`. AC confirma cambiando el style.display de `._form-thank-you`; un
 * `._form_error` es error. Seleccionamos SIEMPRE por clase (`form._form_N`), nunca por id: el embed
 * simple genera ids aleatorios en cada carga.
 */
import { CONFIG } from './config.js';
import { readUtms, validate, isConfigured, buildProxyPlan } from './form.js';

const AC_SUBMIT_TIMEOUT = 15000;

/* ---------- ActiveCampaign ---------- */

function injectAcEmbed(ac) {
  const host = document.getElementById('ac-proxy');
  if (!host) return;
  const slot = document.createElement('div');
  slot.className = `_form_${ac.formId}`;
  const script = document.createElement('script');
  script.src = `https://${ac.account}.activehosted.com/f/embed.php?id=${encodeURIComponent(ac.formId)}`;
  script.charset = 'utf-8';
  host.append(slot, script);
}

function fire(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function applyPlan(acForm, plan) {
  for (const [name, value] of plan.text) {
    const input = acForm.querySelector(`[name="${name}"]`);
    if (input) { input.value = value; fire(input); }
  }
  for (const [name, values] of plan.checkGroups) {
    acForm.querySelectorAll(`input[type="checkbox"][name="${name}"]`).forEach((box) => {
      box.checked = values.includes(box.value);
      fire(box);
    });
  }
  for (const name of plan.checks) {
    // AC pone un input oculto con el mismo name antes del checkbox real: apuntamos al checkbox.
    const box = acForm.querySelector(`input[type="checkbox"][name="${name}"]`);
    if (box) { box.checked = true; fire(box); }
  }
}

function submitViaAc(ac, plan) {
  return new Promise((resolve, reject) => {
    const acForm = document.querySelector(`form._form_${ac.formId}`);
    const acSubmit = acForm && acForm.querySelector('._submit');
    if (!acForm || !acSubmit) {
      reject(new Error('El form oculto de ActiveCampaign no está en la página'));
      return;
    }
    const thankYou = acForm.querySelector('._form-thank-you');
    let settled = false;
    let timer = 0;
    const observer = new MutationObserver(() => {
      if (thankYou && thankYou.style.display && thankYou.style.display !== 'none') finish();
      else if (acForm.querySelector('._form_error')) finish(new Error('ActiveCampaign devolvió un error'));
    });
    function finish(error) {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      if (error) reject(error); else resolve();
    }
    observer.observe(acForm, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true });
    // Si AC no contesta (red caída, script bloqueado) no dejamos el botón en "Sending..." para siempre.
    timer = setTimeout(() => finish(new Error('ActiveCampaign no respondió a tiempo')), AC_SUBMIT_TIMEOUT);
    try {
      applyPlan(acForm, plan);
      acSubmit.click();
    } catch (error) {
      finish(error);
    }
  });
}

/* ---------- Analytics (opcional: solo si hay IDs en config.js) ---------- */

function loadScript(src) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.append(script);
}

function initAnalytics({ metaPixelId, ga4Id }) {
  if (metaPixelId && !window.fbq) {
    const fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments); else fbq.queue.push(arguments);
    };
    Object.assign(fbq, { push: fbq, loaded: true, version: '2.0', queue: [] });
    window.fbq = window._fbq = fbq;
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', metaPixelId);
    window.fbq('track', 'PageView');
  }
  if (ga4Id && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`);
    window.gtag('js', new Date());
    window.gtag('config', ga4Id);
  }
}

function trackLead() {
  if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
  if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead');
}

/* ---------- Formulario ---------- */

function initForm() {
  const form = document.querySelector('[data-ss-form]');
  const success = document.querySelector('[data-ss-success]');
  if (!form || !success) return;
  const msg = form.querySelector('[data-ss-msg]');
  const button = form.querySelector('button[type="submit"]');
  const ages = form.querySelector('[data-ss-ages]');
  const utms = readUtms(window.location.search);
  const ac = CONFIG.activeCampaign;
  const ready = isConfigured(ac);

  if (ready) injectAcEmbed(ac);
  else console.warn('[soccer-school] ActiveCampaign sin configurar (school/config.js): el formulario no envía.');

  const setMsg = (text, state) => {
    msg.textContent = text;
    if (state) msg.dataset.state = state; else delete msg.dataset.state;
  };
  const clearInvalid = () => {
    form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
  };
  const showInvalid = (field) => {
    clearInvalid();
    if (field === 'kidsAges') {
      ages.setAttribute('aria-invalid', 'true');
      form.querySelector('input[name="kidsAges"]').focus();
      return;
    }
    const input = form.elements[field];
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  };
  const showSuccess = (email) => {
    success.querySelector('[data-ss-email]').textContent = email;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  };

  form.addEventListener('input', () => {
    if (msg.dataset.state === 'err') { clearInvalid(); setMsg(''); }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.dataset.sending) return;
    const data = new FormData(form);
    const values = {
      parentName: String(data.get('parentName') || ''),
      email: String(data.get('email') || '').trim(),
      kidsAges: data.getAll('kidsAges').map(String),
      consent: data.get('consent') === 'on',
    };

    // Honeypot: un humano nunca ve ni completa "company". Se descarta sin avisarle al bot.
    if (String(data.get('company') || '')) { showSuccess(values.email); return; }

    const error = validate(values);
    if (error) { setMsg(error.message, 'err'); showInvalid(error.field); return; }

    if (!ready) {
      setMsg('Something went wrong on our end. Please try again later.', 'err');
      console.error('[soccer-school] Falta configurar ActiveCampaign en school/config.js: el lead NO se envió.');
      return;
    }

    form.dataset.sending = '1';
    button.disabled = true;
    setMsg('Sending...');
    try {
      await submitViaAc(ac, buildProxyPlan(values, utms, ac.fields));
      showSuccess(values.email);
      trackLead();
    } catch (err) {
      console.error('[soccer-school] El envío a ActiveCampaign falló', err);
      setMsg('Something went wrong. Please try again in a moment.', 'err');
    } finally {
      delete form.dataset.sending;
      button.disabled = false;
    }
  });
}

/* ---------- Fade de secciones ---------- */

function initReveal() {
  const sections = document.querySelectorAll('[data-reveal]');
  if (!sections.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // La clase se pone recién acá: sin JS (o si el módulo falla) las secciones se ven igual.
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  sections.forEach((section) => io.observe(section));
}

initForm();
initAnalytics(CONFIG.analytics);
initReveal();
