/*
  Hero video diferido — initHeroVideo().

  Antes: <video autoplay preload="metadata"> con poster. Para el navegador el elemento
  mas grande de la pantalla (el LCP) era el video, asi que la metrica no cerraba hasta
  tener el primer frame decodificado: ~1,4 MB y ~7 s en mobile (PageSpeed 22-09-2026).

  Ahora: el poster es un <img> de verdad (ese pinta el LCP, ~37 KB) y el <video> nace
  sin src. Recien despues del load de la pagina le pasamos el src, arranca en silencio
  y, cuando puede reproducirse, hace fade sobre la imagen. Visualmente identico —
  el poster ES un frame del video, no hay salto.

  Sin JS, con reduced-motion, o si el video falla: queda la imagen. Nunca pantalla negra.
*/
function initHeroVideo(root = document) {
  const video = root.querySelector('[data-hero-video]');
  if (!video) return;
  const src = video.dataset.heroVideo;
  if (!src || video.dataset.heroStarted) return;

  // reduced-motion: el CSS ya esconde el video; ni lo bajamos.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const poster = root.querySelector('[data-hero-poster]');
  const reveal = () => {
    video.classList.add('is-ready');
    if (poster) poster.classList.add('is-hidden');
  };

  const start = () => {
    if (video.dataset.heroStarted) return;
    video.dataset.heroStarted = '1';
    video.addEventListener('canplay', reveal, { once: true });
    video.src = src;
    video.load();
    const played = video.play();
    // si la politica de autoplay lo bloquea, no rompemos nada: se queda el poster.
    if (played && typeof played.catch === 'function') played.catch(() => {});
  };

  // el timeout corre despues del load para que el video no compita por ancho de banda
  // con nada de la carga inicial (que en este sitio ya son ~4 s de terceros).
  const kick = () => setTimeout(start, 200);
  if (document.readyState === 'complete') kick();
  else window.addEventListener('load', kick, { once: true });
}

document.addEventListener('DOMContentLoaded', () => initHeroVideo());

export { initHeroVideo };
