/**
 * Takeover — Season Tickets (solo mobile). 🟦 A medida.
 *
 * Secuencia: overlay con el video (poster = primer frame real = la home falsa) → al `ended` se
 * muestra el último frame REAL del video como imagen en la misma caja (corte exacto) → entran los
 * dos CTA. "I don't want" cierra el overlay con fade y destraba el scroll: queda esta misma página.
 * "Buy" navega a data-buy-href (pasarela.html, placeholder; en WP el permalink real). El video se muestra
 * en cada carga salvo data-once="session".
 *
 * Robustez: desktop o sesión ya descartada → el overlay se saca antes de hacer nada; el video se
 * carga SOLO en mobile (src desde data-src); si play() rechaza, el video da error o no arranca en
 * 6 s (ahorro de datos / bajo consumo) → directo a la interfaz; red de seguridad por duración.
 * prefers-reduced-motion → sin video, directo a la interfaz.
 *
 * Sin dependencias, portable a WordPress (tools/build-blocks.py lo empaqueta y llama initTakeover(root)).
 */
const MOBILE = '(max-width: 820px)';
const SESSION_KEY = 'psl-season-tickets-takeover';

function initTakeover(root = document) {
  const ov = root.querySelector('.st-takeover');
  if (!ov) return;
  const video = ov.querySelector('.st-takeover__video');
  const buy = ov.querySelector('.st-takeover__buy');
  const skip = ov.querySelector('.st-takeover__skip');

  // Por defecto el video se muestra en CADA carga (decisión 2026-10-06). Con data-once="session" en la
  // section, se muestra una vez por sesión (sessionStorage).
  const once = ov.dataset.once === 'session';
  let seen = false;
  if (once) { try { seen = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (_) { /* storage bloqueado */ } }
  if (!matchMedia(MOBILE).matches || seen) { ov.remove(); return; }

  if (ov.dataset.buyHref) buy.setAttribute('href', ov.dataset.buyHref);

  // scroll lock (inline: el CSS del bloque va namespaceado en WP y no puede tocar <html>)
  const html = document.documentElement, body = document.body;
  const prev = { h: html.style.overflow, b: body.style.overflow };
  html.style.overflow = 'hidden'; body.style.overflow = 'hidden';
  const unlock = () => { html.style.overflow = prev.h; body.style.overflow = prev.b; };
  const remember = () => { if (!once) return; try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (_) { /* noop */ } };

  let done = false, stall = 0, hard = 0;
  const finish = () => {
    if (done) return;
    done = true; clearTimeout(stall); clearTimeout(hard);
    try { video.pause(); } catch (_) { /* noop */ }
    ov.classList.add('is-final');
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('is-cta')));
  };
  const close = () => {
    remember(); unlock();
    ov.classList.add('is-closing');
    setTimeout(() => ov.remove(), 400);
  };
  skip.addEventListener('click', close);
  buy.addEventListener('click', () => { remember(); unlock(); });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const f = ov.querySelector('.st-takeover__final'); if (f && f.dataset.src) f.src = f.dataset.src;
    finish(); return;
  }

  video.addEventListener('ended', finish, { once: true });
  video.addEventListener('error', finish, { once: true });
  video.addEventListener('loadedmetadata', () => {
    clearTimeout(hard);
    hard = setTimeout(finish, ((video.duration || 13) + 2.5) * 1000);
  }, { once: true });
  stall = setTimeout(() => { if (video.currentTime < 0.5) finish(); }, 6000);
  hard = setTimeout(finish, 20000);

  if (video.dataset.poster) video.poster = video.dataset.poster;   // poster: solo en mobile
  const fin = ov.querySelector('.st-takeover__final');
  if (fin && fin.dataset.src) fin.src = fin.dataset.src;   // imagen final: solo en mobile
  video.src = video.dataset.src;
  const p = video.play();
  if (p && typeof p.catch === 'function') p.catch(finish);
}

export { initTakeover };
