/**
 * Proof — línea de tiempo scroll-scrubbed.
 * En vez de auto-avanzar por tiempo, la línea se "construye" con el scroll: se calcula un progreso
 * p (0..1) según cuánto de la sección atravesó el viewport y, con él, se rellena un eje continuo
 * 2024 → 2027 y se encienden los hitos de forma ACUMULATIVA (paso i activo cuando p >= i/steps),
 * de modo que los ya pasados quedan encendidos (sensación de obra que avanza).
 * Respeta prefers-reduced-motion mostrando el estado final (todo encendido/relleno) sin scrubbing.
 */
function initProofTimeline(root = document) {
  const section = root.querySelector('.proof');
  const timeline = root.querySelector('.proof__timeline');
  if (!section || !timeline) return;
  const steps = [...timeline.querySelectorAll('.proof__step')];
  if (steps.length === 0) return;

  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const setProgress = (p, activeCount) => {
    timeline.style.setProperty('--proof-p', p.toFixed(4));
    steps.forEach((s, i) => s.classList.toggle('is-active', i < activeCount));
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    // estado final: eje completo y todos los hitos encendidos, sin scrubbing
    setProgress(1, steps.length);
    return;
  }

  const n = steps.length;
  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // arranca cuando el top de la sección entra al ~80% del viewport,
    // completa cuando ese top llega cerca del 30%
    const startY = vh * 0.8;
    const endY = vh * 0.3;
    const denom = startY - endY || 1;
    const p = clamp((startY - rect.top) / denom, 0, 1);
    // acumulativo: paso i encendido cuando p >= i/n
    let activeCount = 0;
    for (let i = 0; i < n; i++) { if (p >= i / n) activeCount = i + 1; }
    setProgress(p, activeCount);
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

document.addEventListener('DOMContentLoaded', () => initProofTimeline());

export { initProofTimeline };
