/* Bloque 01e · Banner Groundbreaking — cuenta regresiva (la misma de 01d) + video de fondo que corre una vez.

   Video: nace sin src. Se precarga cuando el banner está cerca (300 px), arranca cuando se ve la mitad, se pausa si
   sale de pantalla y, al terminar, se funde a la foto fija (el poster ES el cuadro final de la intro: no hay salto).
   No vuelve a arrancar. Con reduced motion ni se baja; si el autoplay está bloqueado, prueba en el primer toque y,
   si no, queda la foto. Nunca pantalla negra. */
import { initGbCountdown } from './01d-hero-groundbreaking.js';

function initGbBanner(root = document) {
  root.querySelectorAll('[data-gb-banner]').forEach((box) => {
    const vid = box.querySelector('[data-gb-video]');
    if (!vid || vid.dataset.gbBound) return;
    vid.dataset.gbBound = '1';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let loaded = false;
    let done = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      vid.preload = 'auto';
      vid.src = vid.dataset.gbVideo;
    };
    const play = () => {
      if (done) return;
      load();
      vid.muted = true;
      const p = vid.play();
      if (p && typeof p.then === 'function') {
        p.then(() => vid.classList.add('is-playing'))
          .catch(() => window.addEventListener('pointerdown', play, { once: true }));
      }
    };
    vid.addEventListener('ended', () => { done = true; vid.classList.add('is-done'); });

    if (!('IntersectionObserver' in window)) { play(); return; }
    new IntersectionObserver((en) => { if (en[0].isIntersecting) load(); }, { rootMargin: '300px 0px' }).observe(box);
    new IntersectionObserver((en) => {
      if (en[0].isIntersecting) play();
      else if (loaded && !done) vid.pause();
    }, { threshold: 0.5 }).observe(box);
  });
}

export { initGbCountdown, initGbBanner };
