/**
 * Hero — última palabra del titular con efecto SCRAMBLE / decode en SECUENCIA (bilingüe EN/ES).
 *
 * El efecto construye la 1ª palabra a partir de caracteres aleatorios (resuelve de izquierda a
 * derecha), la sostiene un instante, VUELVE A CORRER y construye la siguiente, y termina en la
 * última ("born." / "nacer."), que se queda fija. Reimplementación vanilla del componente
 * TextScramble (React/framer-motion): mismo algoritmo (progress·len > i ⇒ carácter fijo), sin
 * dependencias, portable a WordPress. La palabra está SIEMPRE en aquamarine pleno (sin atenuar).
 * Respeta prefers-reduced-motion (muestra directo la palabra final). Se reinicia al cambiar de idioma.
 *
 * Anti-salto: el "sizer" CSS reserva el ancho de la palabra más larga, así el titular nunca reflowea
 * mientras los caracteres flickerean (van dentro de ese ancho reservado).
 */
// idioma desde el DOM (fuente única que setea i18n.apply()); evita instancias duplicadas del módulo
const getLang = () => (document.documentElement.lang === 'es' ? 'es' : 'en');

function initHeroMorph(root = document) {
  const el = root.querySelector('.hero__morph-word');
  if (!el) return;
  const sizer = root.querySelector('.hero__morph-sizer');
  const label = root.querySelector('.hero__morph');

  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const wordsFor = (lang) => {
    const raw = lang === 'es' ? (el.dataset.wordsEs || el.dataset.words) : el.dataset.words;
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
    const words = wordsFor(getLang());        // p.ej. ['imagined.', 'built.', 'born.']
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
  document.addEventListener('psl:langchange', run);
}

document.addEventListener('DOMContentLoaded', () => initHeroMorph());

export { initHeroMorph };
