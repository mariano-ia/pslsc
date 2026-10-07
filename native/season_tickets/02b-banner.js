/**
 * Banner Season Tickets — "sticky" portable a WordPress.
 *
 * position: sticky solo pega dentro del bloque padre, y en WP cada bloque es una caja del alto del
 * banner. Por eso: el hueco original (.st-banner-slot) se queda en el flujo con su alto, y cuando su
 * borde superior pasa por debajo de la nav, el banner pasa a position: fixed con el mismo left/width
 * del hueco y top = alto de la nav. Al volver a subir, vuelve al flujo. Scroll y resize con rAF.
 *
 * data-stick-under: selector del elemento bajo el que se pega (default ".nav"). Si no existe (WordPress),
 * se detecta sola la barra superior fija/sticky del template; si tampoco, data-stick-top en px (default 0).
 * data-stick-gap: aire en px entre la nav y el banner pegado (default 16).
 */
function initBanner(root = document) {
  const block = root.querySelector('.st-banner-block');
  if (!block) return;
  const slot = block.querySelector('.st-banner-slot');
  const bar = block.querySelector('.st-banner');
  if (!slot || !bar) return;
  if (block.dataset.buyHref) bar.setAttribute('href', block.dataset.buyHref);
  const gap = parseFloat(block.dataset.stickGap || '16') || 0;   // aire entre la nav y el banner pegado

  // Barra superior bajo la que se pega. 1) data-stick-under (selector); 2) si no existe (en WordPress la nav
  // es del template y no se llama .nav), se busca sola: el primer <header>/<nav>/[class*=header|nav] con
  // position fixed o sticky pegado arriba; 3) data-stick-top en px (default 0).
  const findTopBar = () => {
    const sel = block.dataset.stickUnder;
    const el = sel ? document.querySelector(sel) : null;
    if (el) return el;
    for (const c of document.querySelectorAll('header, nav, [class*="header"], [class*="navbar"], [class*="site-nav"], [class*="masthead"]')) {
      const cs = getComputedStyle(c);
      if ((cs.position === 'fixed' || cs.position === 'sticky') && c.getBoundingClientRect().top <= 1 && c.getBoundingClientRect().height < 220) return c;
    }
    return null;
  };
  const navEl = findTopBar();
  const stickTop = () => {
    // borde INFERIOR real de la nav (no su alto): la nav se compacta / se desplaza al scrollear
    const h = navEl ? Math.max(0, navEl.getBoundingClientRect().bottom) : 0;
    return h || parseFloat(block.dataset.stickTop || '0') || 0;
  };

  let stuck = false;
  const update = () => {
    const top = stickTop();
    const r = slot.getBoundingClientRect();
    const should = r.top <= top + gap;
    if (should !== stuck) {
      stuck = should;
      bar.classList.toggle('is-stuck', stuck);
      if (!stuck) { bar.style.top = ''; bar.style.left = ''; bar.style.width = ''; }
    }
    if (stuck) {
      bar.style.top = `${top + gap}px`;
      bar.style.left = `${r.left}px`;
      bar.style.width = `${r.width}px`;
    }
  };
  // Tras cada scroll/resize se sigue midiendo durante ~450 ms: la nav se compacta con una transición
  // DESPUÉS de que el scroll termina, y sin este "asentamiento" el banner quedaría a la altura vieja.
  let until = 0, running = false;
  const loop = () => {
    update();
    if (performance.now() < until) requestAnimationFrame(loop); else running = false;
  };
  const schedule = () => {
    until = performance.now() + 450;
    if (!running) { running = true; requestAnimationFrame(loop); }
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  if (navEl && 'ResizeObserver' in window) new ResizeObserver(schedule).observe(navEl);
  update();
}

export { initBanner };
