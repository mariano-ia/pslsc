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

/* ---------- Intro ---------- */

// El video del club hasta "Your journey starts here" (cuadros 0–233, ver README) como pantalla de carga, con un
// "Loading" que avanza con el video. Poco antes del final la landing sube fundiéndose con él.
const INTRO_STALL_MS = 5000;
const INTRO_FADE_MS = 900; // = la transición de .intro y de la landing en school.css
const INTRO_FADE_LEAD = 0.6; // s antes del final: la landing sube mientras el video todavía se mueve

function initIntro() {
  const root = document.documentElement;
  const intro = document.querySelector('[data-intro]');
  if (!intro || !root.classList.contains('intro-on')) return;
  window.ssIntro = true; // apaga la red de seguridad del <head>

  const video = intro.querySelector('[data-intro-video]');
  const pct = intro.querySelector('[data-intro-pct]');
  const page = [...document.body.children].filter((el) => el !== intro);
  page.forEach((el) => { el.inert = true; });

  // 1080p solo si el video se dibuja con más de 1400 px reales y no es un teléfono (ver --stage-w en school.css).
  const portrait = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
  const stageWidth = portrait ? innerWidth * 2.1 : Math.max(innerWidth, innerHeight * 16 / 9);
  const isPhone = Math.min(innerWidth, innerHeight) < 600;
  const quality = !isPhone && stageWidth * (window.devicePixelRatio || 1) > 1400 ? '1080' : '720';
  video.src = `/school/assets/intro/intro-${quality}.mp4`;

  let done = false;
  let shown = -1;
  // Si el video no arranca (red lenta), la landing no espera.
  const stall = setTimeout(finish, INTRO_STALL_MS);

  function setProgress(ratio) {
    const progress = Math.min(Math.max(ratio, 0), 1);
    intro.style.setProperty('--p', progress.toFixed(4)); // la línea crece continua; el número, de a 1%
    const value = Math.round(progress * 100);
    if (value === shown) return;
    shown = value;
    pct.textContent = value;
    intro.setAttribute('aria-valuenow', value);
  }

  function finish() {
    if (done) return;
    done = true;
    clearTimeout(stall);
    setProgress(1);
    page.forEach((el) => { el.inert = false; });
    intro.classList.add('is-leaving');
    root.classList.remove('intro-on');
    document.dispatchEvent(new Event('ss:intro-end')); // initMotion arranca el hero
    setTimeout(() => {
      intro.classList.remove('is-leaving');
      intro.hidden = true;
      video.pause();
      video.removeAttribute('src');
      video.load();
    }, INTRO_FADE_MS);
  }

  function tick() {
    if (done) return;
    const end = video.duration - INTRO_FADE_LEAD;
    if (end > 0) {
      setProgress(video.currentTime / end);
      if (video.currentTime >= end) { finish(); return; }
    }
    requestAnimationFrame(tick);
  }

  video.addEventListener('playing', () => clearTimeout(stall), { once: true });
  video.addEventListener('ended', finish);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') finish(); });
  // Sin autoplay (p. ej. modo ahorro de batería en iOS) no hay intro.
  video.play().then(() => requestAnimationFrame(tick), finish);
}

/* ---------- Movimiento ---------- */

// Titulares palabra por palabra e ítems escalonados; la coreografía está en school.css ("Movimiento"). Acá solo se
// parten los titulares [data-words] en <span class="w">, se marca cada sección cuando entra en pantalla (is-in) y
// el hero cuando el intro ya se va (page-in). Sin JS o con reduced motion no se parte nada y se ve todo quieto.
function initMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  const root = document.documentElement;
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.style.setProperty('--i', i);
      span.textContent = word;
      el.append(span, ' ');
    });
  });
  root.classList.add('reveal-on');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  // Con el intro encima no se observa nada todavía: las secciones que ya están en pantalla entrarían a escondidas.
  const start = () => {
    root.classList.add('page-in');
    document.querySelectorAll('[data-reveal]').forEach((section) => io.observe(section));
  };
  if (root.classList.contains('intro-on')) document.addEventListener('ss:intro-end', start, { once: true });
  else start();
}

/* ---------- FAQ ---------- */

// Abre y cierra con animación de alto (<details> no lo anima solo). Con reduced motion queda el corte nativo.
function initFaq() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('animate' in Element.prototype)) return;
  document.querySelectorAll('.faq details').forEach((details) => {
    const summary = details.querySelector('summary');
    let anim = null;
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (anim) anim.cancel();
      const opening = !details.open;
      const from = details.offsetHeight;
      if (opening) details.open = true;
      const border = details.offsetHeight - details.clientHeight;
      const to = opening ? details.offsetHeight : summary.offsetHeight + border;
      details.classList.toggle('is-closing', !opening);
      details.style.overflow = 'hidden';
      anim = details.animate({ height: [`${from}px`, `${to}px`] }, { duration: 280, easing: 'ease' });
      anim.onfinish = () => {
        details.open = opening;
        details.classList.remove('is-closing');
        details.style.overflow = '';
        anim = null;
      };
    });
  });
}

initIntro();
initForm();
initAnalytics(CONFIG.analytics);
initMotion();
initFaq();
