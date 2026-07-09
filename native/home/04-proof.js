/**
 * Proof — línea de tiempo scroll-scrubbed.
 * En vez de auto-avanzar por tiempo, la línea se "construye" con el scroll: se calcula un progreso
 * p (0..1) según cuánto de la sección atravesó el viewport y, con él, se rellena un eje continuo
 * 2024 → 2027 y se encienden los hitos de forma ACUMULATIVA (paso i activo cuando p >= i/steps),
 * de modo que los ya pasados quedan encendidos (sensación de obra que avanza).
 * Respeta prefers-reduced-motion mostrando el estado final (todo encendido/relleno) sin scrubbing.
 */
/** Copys de la etiqueta que acompaña a la linterna (el CSS los pone en mayúscula). */
const PEEK_COPY = {
  peek: 'peek at the stadium',
  ctaFine: 'click to reveal it all',
  ctaTouch: 'tap to reveal it all',
};

/**
 * Scramble tipo hero: construye `word` desde caracteres aleatorios resolviendo de izquierda a
 * derecha (progress·len > i ⇒ carácter fijo). Los espacios quedan fijos.
 */
function scrambleLabel(el, word, done) {
  const HOLD = 160, DURATION = 620, STEP = 40, CHARS = 'abcdefghijklmnopqrstuvwxyz';
  const rand = () => CHARS[Math.floor(Math.random() * CHARS.length)];
  const t0 = performance.now();
  const tick = () => {
    const progress = Math.min(Math.max((performance.now() - t0 - HOLD) / DURATION, 0), 1);
    let out = '';
    for (let i = 0; i < word.length; i++) {
      out += word[i] === ' ' ? ' ' : (progress * word.length > i ? word[i] : rand());
    }
    el.textContent = out;
    if (progress >= 1) { el.textContent = word; if (done) done(); return; }
    setTimeout(tick, STEP);
  };
  tick();
}

/**
 * Peek del render: capa negra plena sobre el render con una "linterna" (hueco radial) que sigue el
 * mouse y una etiqueta que la acompaña. La etiqueta invita a espiar ("espiá el estadio") y, cuando el
 * usuario ya recorrió un par de barridos (o pasó un tiempo), MUTA con scramble al CTA
 * ("hacé click y miralo entero"). Click/tap/Enter hace crecer el hueco hasta revelar todo.
 * No-JS y prefers-reduced-motion = render visible sin capa. En touch la linterna queda centrada y la
 * etiqueta sube al CTA tras un momento.
 */
function setupPeek(root) {
  const peek = root.querySelector('.proof__peek');
  if (!peek) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const R0 = 120;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const label = peek.querySelector('.proof__peek-label');
  let revealed = false;
  let phase = 'peek';   // 'peek' → 'cta'
  let labelW = 200;
  const overlay = window.matchMedia('(min-width: 781px)').matches;   // timeline como overlay (desktop)
  let timelineShown = false;

  // dibuja la línea de tiempo SOBRE el render: fade-in + eje 2024→2027 que se traza + hitos en secuencia
  const showTimeline = () => {
    if (timelineShown) return;
    timelineShown = true;
    const stage = peek.closest('.proof__stage');
    const timeline = stage && stage.querySelector('.proof__timeline');
    if (!stage || !timeline) return;
    stage.classList.add('timeline-in');
    const steps = [...timeline.querySelectorAll('.proof__step')];
    const n = steps.length;
    const t0 = performance.now();
    const dur = 1500;
    const draw = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      timeline.style.setProperty('--proof-p', p.toFixed(4));
      let active = 0;
      for (let i = 0; i < n; i++) if (p >= i / n) active = i + 1;
      steps.forEach((s, i) => s.classList.toggle('is-active', i < active));
      if (p < 1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  };

  peek.style.setProperty('--peek-r0', `${R0}px`);
  peek.style.setProperty('--r', `${R0}px`);

  const ctaKey = () => (fine ? 'ctaFine' : 'ctaTouch');
  const measure = () => { if (label) labelW = label.offsetWidth || labelW; };
  const applyLabel = () => {
    if (!label) return;
    label.textContent = PEEK_COPY[phase === 'cta' ? ctaKey() : 'peek'];
    measure();
  };
  const upgrade = () => {
    if (phase !== 'peek' || revealed) return;
    phase = 'cta';
    peek.classList.add('peek--ready');
    if (label) scrambleLabel(label, PEEK_COPY[ctaKey()], measure);
  };

  const center = () => {
    const r = peek.getBoundingClientRect();
    peek.style.setProperty('--mx', `${r.width / 2}px`);
    peek.style.setProperty('--my', `${r.height / 2}px`);
    peek.style.setProperty('--lx', `${r.width / 2}px`);
  };
  center();
  applyLabel();
  peek.classList.add('peek--active');

  if (fine) {
    let lastX = null, lastY = null, travel = 0, fbTimer = null;
    const TRAVEL = 500;   // px de recorrido acumulado del cursor antes de mutar al CTA
    peek.addEventListener('pointermove', (e) => {
      if (revealed) return;
      peek.classList.add('peek--touched');   // el usuario empezó a mover la linterna → deja de latir
      const r = peek.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      peek.style.setProperty('--mx', `${mx}px`);
      peek.style.setProperty('--my', `${my}px`);
      // la etiqueta sigue al cursor: clamp horizontal (no cortar) + flip cerca del borde inferior
      const lx = Math.min(Math.max(mx, labelW / 2 + 12), r.width - labelW / 2 - 12);
      peek.style.setProperty('--lx', `${lx}px`);
      peek.classList.toggle('peek--label-above', (r.height - my) < (R0 + 74));
      // fallback por tiempo (explorador lento) + trigger por recorrido acumulado
      if (fbTimer === null) fbTimer = setTimeout(upgrade, 4000);
      if (lastX !== null && phase === 'peek') {
        travel += Math.hypot(mx - lastX, my - lastY);
        if (travel > TRAVEL) upgrade();
      }
      lastX = mx; lastY = my;
    });
  } else {
    window.addEventListener('resize', center, { passive: true });
    setTimeout(upgrade, 2600);   // touch: no puede mover la linterna → CTA tras un momento
  }

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    phase = 'done';
    peek.classList.add('is-revealed');
    const r = peek.getBoundingClientRect();
    const target = Math.hypot(r.width, r.height) * 1.12;   // cubre toda la diagonal
    const t0 = performance.now();
    const dur = 900;
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const tick = (now) => {
      const t = Math.min((now - t0) / dur, 1);
      peek.style.setProperty('--r', `${R0 + (target - R0) * ease(t)}px`);
      if (t < 1) { requestAnimationFrame(tick); return; }
      // el círculo terminó de abrirse: se encienden las luces; APENAS terminan de encenderse
      // (animationend del flicker) aparecen los hitos sobre el render (solo overlay/desktop)
      setTimeout(() => {
        peek.classList.add('lights-on');
        if (!overlay) return;
        const img = peek.querySelector('.proof__peek-img');
        const start = () => setTimeout(showTimeline, 100);   // unas pocas ms tras encenderse
        if (img) img.addEventListener('animationend', start, { once: true });
        setTimeout(start, 1700);   // fallback si no llega animationend
      }, 200);
    };
    requestAnimationFrame(tick);
  };
  peek.addEventListener('click', reveal);
  peek.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); }
  });
}

function initProofTimeline(root = document) {
  setupPeek(root);
  const stage = root.querySelector('.proof__stage');
  const timeline = root.querySelector('.proof__timeline');
  if (!stage || !timeline) return;
  const steps = [...timeline.querySelectorAll('.proof__step')];

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = window.matchMedia('(min-width: 781px)').matches;
  // reduced-motion (sin juego de linterna) o mobile (timeline debajo, estática): mostrarla llena de una.
  // En desktop no-reduced la dispara el reveal del peek (setupPeek → showTimeline).
  if (reduce || !overlay) {
    stage.classList.add('timeline-in');
    timeline.style.setProperty('--proof-p', '1');
    steps.forEach((s) => s.classList.add('is-active'));
  }
}

document.addEventListener('DOMContentLoaded', () => initProofTimeline());

export { initProofTimeline };
