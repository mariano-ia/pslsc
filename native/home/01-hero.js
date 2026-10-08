/**
 * Hero — última palabra del titular con efecto SCRAMBLE / decode en SECUENCIA.
 *
 * El efecto construye la 1ª palabra a partir de caracteres aleatorios (resuelve de izquierda a
 * derecha), la sostiene un instante, VUELVE A CORRER y construye la siguiente, y termina en la
 * última ("born."), que se queda fija. Reimplementación vanilla del componente
 * TextScramble (React/framer-motion): mismo algoritmo (progress·len > i ⇒ carácter fijo), sin
 * dependencias, portable a WordPress. La palabra está SIEMPRE en aquamarine pleno (sin atenuar).
 * Respeta prefers-reduced-motion (muestra directo la palabra final).
 *
 * Anti-salto: el "sizer" CSS reserva el ancho de la palabra más larga, así el titular nunca reflowea
 * mientras los caracteres flickerean (van dentro de ese ancho reservado).
 */
function initHeroMorph(root = document) {
  const el = root.querySelector('.hero__morph-word');
  if (!el) return;
  const sizer = root.querySelector('.hero__morph-sizer');
  const label = root.querySelector('.hero__morph');

  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const wordsFor = () => {
    const raw = el.dataset.words;
    return (raw || 'born').split(',').map((w) => `${w.trim()}.`);
  };

  // tiempos del scramble
  const START_DELAY = 300;   // arranca cuando el titular ya está entrando
  const HOLD = 240;          // "gibberish" inicial antes de resolver cada palabra
  const DURATION = 700;      // resolución izquierda → derecha de cada palabra
  const READ_HOLD = 640;     // la palabra resuelta queda legible antes de la próxima
  const STEP = 45;           // ms entre frames de flicker
  const CHARS = 'abcdefghijklmnopqrstuvwxyz';
  const randChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

  // Construye una palabra desde caracteres aleatorios, resolviendo de izquierda a derecha.
  const scrambleTo = (word, done) => {
    const t0 = performance.now();
    const tick = () => {
      const elapsed = performance.now() - t0;
      const progress = Math.min(Math.max((elapsed - HOLD) / DURATION, 0), 1);
      let out = '';
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        if (!/[a-z]/i.test(ch)) { out += ch; continue; }   // espacios y "." quedan fijos
        out += (progress * word.length > i) ? ch : randChar();
      }
      el.textContent = out;
      if (progress >= 1) { el.textContent = word; if (done) done(); return; }
      timers.push(setTimeout(tick, STEP));
    };
    tick();
  };

  const run = () => {
    clearTimers();
    const words = wordsFor();        // p.ej. ['imagined.', 'built.', 'born.']
    const finalWord = words[words.length - 1];

    // el sizer reserva el ancho de la palabra más larga (absorbe el jitter, sin reflow)
    if (sizer) sizer.textContent = words.reduce((a, b) => (b.length > a.length ? b : a), '');
    if (label) label.setAttribute('aria-label', finalWord);   // el lector de pantalla lee la final

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = finalWord;
      return;
    }

    // encadena: construye cada palabra, la sostiene y arranca la próxima; la última se queda.
    let idx = 0;
    const nextWord = () => {
      const isLast = idx === words.length - 1;
      scrambleTo(words[idx], () => {
        if (isLast) return;
        idx += 1;
        timers.push(setTimeout(nextWord, READ_HOLD));
      });
    };
    timers.push(setTimeout(nextWord, START_DELAY));
  };

  run();
}


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

document.addEventListener('DOMContentLoaded', () => [initHeroMorph, initHeroVideo].forEach((fn) => fn()));

export { initHeroMorph, initHeroVideo };
