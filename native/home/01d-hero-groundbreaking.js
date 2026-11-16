/* Bloque 01d · Hero Groundbreaking — cuenta regresiva al 12/12 (10 AM ET, fecha en data-gb-countdown) y la intro del
   micrositio de fondo (la misma del banner 01e, que importa este archivo).
   Cuenta regresiva: escribe días/horas/minutos/segundos y muestra la tira (sin JS queda oculta). En cero se queda en
   00 y la tira pasa a .is-zero (para ese día el bloque ya se habrá sacado de la Home).
   Video ([data-gb-video], dentro de su <section>): nace sin src. Se precarga cuando la sección está cerca (300 px),
   arranca cuando se ve la mitad, se pausa si sale de pantalla y, al terminar, se funde a la foto fija (la foto ES el
   cuadro final de la intro: no hay salto). No vuelve a arrancar. data-gb-video-hd (opcional): versión 1080 para
   pantallas de 1100 px o más. Con reduced motion ni se baja; si el autoplay está bloqueado, prueba en el primer toque
   y, si no, queda la foto. Nunca pantalla negra. */
function initGbCountdown(root = document) {
  root.querySelectorAll('[data-gb-countdown]').forEach((el) => {
    if (el.dataset.gbBound) return;
    el.dataset.gbBound = '1';
    const target = new Date(el.dataset.gbCountdown).getTime();
    if (Number.isNaN(target)) return;
    const out = {};
    el.querySelectorAll('[data-u]').forEach((n) => { out[n.dataset.u] = n; });
    const pad = (n) => String(n).padStart(2, '0');
    let timer = 0;
    const tick = () => {
      const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      if (out.d) out.d.textContent = pad(Math.floor(s / 86400));
      if (out.h) out.h.textContent = pad(Math.floor(s / 3600) % 24);
      if (out.m) out.m.textContent = pad(Math.floor(s / 60) % 60);
      if (out.s) out.s.textContent = pad(s % 60);
      if (s === 0) { el.classList.add('is-zero'); clearInterval(timer); }
    };
    tick();
    el.hidden = false;
    timer = setInterval(tick, 1000);
  });
}

function initGbVideo(root = document) {
  root.querySelectorAll('[data-gb-video]').forEach((vid) => {
    if (vid.dataset.gbBound) return;
    vid.dataset.gbBound = '1';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = vid.closest('section') || vid.parentElement;

    let loaded = false;
    let done = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      const hd = vid.dataset.gbVideoHd && window.matchMedia('(min-width: 1100px)').matches;
      vid.preload = 'auto';
      vid.src = hd ? vid.dataset.gbVideoHd : vid.dataset.gbVideo;
    };
    const play = () => {
      if (done) return;
      load();
      vid.muted = true;
      const p = vid.play();
      // Bloqueado por el navegador (no una pausa nuestra): prueba en el primer toque.
      if (p && typeof p.catch === 'function') {
        p.catch((err) => { if (err && err.name === 'NotAllowedError') window.addEventListener('pointerdown', play, { once: true }); });
      }
    };
    // La clase sale del evento y no de la promesa de play(): si una pausa interrumpe esa promesa, el video
    // igual arranca después y tiene que verse.
    vid.addEventListener('playing', () => vid.classList.add('is-playing'));
    vid.addEventListener('ended', () => { done = true; vid.classList.add('is-done'); });

    if (!('IntersectionObserver' in window)) { play(); return; }
    new IntersectionObserver((en) => { if (en[0].isIntersecting) load(); }, { rootMargin: '300px 0px' }).observe(box);
    new IntersectionObserver((en) => {
      if (en[0].isIntersecting) play();
      else if (loaded && !done) vid.pause();
    }, { threshold: 0.5 }).observe(box);
  });
}

export { initGbCountdown, initGbVideo };
