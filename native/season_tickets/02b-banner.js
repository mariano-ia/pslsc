/**
 * Banner Season Tickets — "sticky" portable a WordPress.
 *
 * position: sticky solo pega dentro del bloque padre, y en WP cada bloque es una caja del alto del
 * banner. Por eso: el hueco original (.st-banner-slot) se queda en el flujo con su alto, y cuando su
 * borde superior pasa por debajo de la nav, el banner pasa a position: fixed con el mismo left/width
 * del hueco y top = alto de la nav. Al volver a subir, vuelve al flujo. Scroll y resize con rAF.
 *
 * data-stick-under: selector del elemento bajo el que se pega (default ".nav"; en WP, la nav del
 * template). data-stick-top: px fijos si no hay selector (default 0).
 */
function initBanner(root = document) {
  const block = root.querySelector('.st-banner-block');
  if (!block) return;
  const slot = block.querySelector('.st-banner-slot');
  const bar = block.querySelector('.st-banner');
  if (!slot || !bar) return;
  if (block.dataset.buyHref) bar.setAttribute('href', block.dataset.buyHref);   // TODO: URL real de compra

  const stickTop = () => {
    const sel = block.dataset.stickUnder;
    const el = sel ? document.querySelector(sel) : null;
    // borde INFERIOR real de la nav (no su alto): la nav se compacta / se desplaza al scrollear
    const h = el ? Math.max(0, el.getBoundingClientRect().bottom) : 0;
    return h || parseFloat(block.dataset.stickTop || '0') || 0;
  };

  let stuck = false;
  const update = () => {
    const top = stickTop();
    const r = slot.getBoundingClientRect();
    const should = r.top <= top;
    if (should !== stuck) {
      stuck = should;
      bar.classList.toggle('is-stuck', stuck);
      if (!stuck) { bar.style.top = ''; bar.style.left = ''; bar.style.width = ''; }
    }
    if (stuck) {
      bar.style.top = `${top}px`;
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
  const navEl = block.dataset.stickUnder ? document.querySelector(block.dataset.stickUnder) : null;
  if (navEl && 'ResizeObserver' in window) new ResizeObserver(schedule).observe(navEl);
  update();
}

export { initBanner };
