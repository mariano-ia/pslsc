/**
 * Bloque 03 · The project — timeline horizontal SCROLL-SCRUBBED.
 * El eje se dibuja de izquierda a derecha siguiendo tu scroll (--p), y cada pieza aparece cuando el
 * trazo pasa su umbral (--f). No-JS = todo visible (el estado oculto solo se aplica con .ptl--scrub,
 * que agrega este script). Respeta prefers-reduced-motion (deja todo visible, sin scrub).
 */
function initProjectTimeline(root = document) {
  const ptl = root.querySelector('.ptl');
  if (!ptl) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const head = ptl.querySelector('.ptl__head');
  const items = [...ptl.querySelectorAll('.ptl__item')].map((el) => ({
    el,
    f: parseFloat(el.dataset.f) || 0,
  }));

  ptl.classList.add('ptl--scrub');

  const apply = (p) => {
    ptl.style.setProperty('--p', p.toFixed(4));
    if (head) head.style.opacity = (p > 0.02 && p < 0.98) ? '1' : '0';
    items.forEach((i) => i.el.classList.toggle('is-on', p >= i.f));
  };

  let raf = 0;
  const update = () => {
    raf = 0;
    const r = ptl.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const start = vh * 0.80;
    const end = vh * 0.42;
    const p = Math.min(Math.max((start - r.top) / (start - end), 0), 1);
    apply(p);
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

document.addEventListener('DOMContentLoaded', () => initProjectTimeline());

export { initProjectTimeline };
