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
 * Mobile (≤780): la linterna TAMBIÉN se puede arrastrar, pero desplazada: el hueco va por encima
 * del dedo (como la lupa de selección de iOS), porque si quedara debajo el propio dedo taparia lo
 * que se está mirando. Y la capa no es negra plena sino un velo: el que no toca nada igual ve el
 * render, y el bloque nunca parece roto. Arrastrar explora; un tap revela todo.
 */
function setupTouchPeek(peek) {
  const img = peek.querySelector('.proof__peek-img');
  // loading="lazy" no siempre dispara acá (el navegador no evalúa imágenes diferidas con la
  // pestaña en segundo plano, y en el medio de una página tan alta la foto puede no pedirse
  // nunca -> caja negra). Acá la foto ES el contenido, así que la pedimos de una.
  const forceLoad = () => { if (img && img.loading === 'lazy') img.loading = 'eager'; };
  forceLoad();

  const label = peek.querySelector('.proof__peek-label');
  const R0 = 70;        // hueco más chico que en desktop: la foto mide ~195px de alto en mobile
  const OFFSET = 92;    // cuánto sube el hueco por encima del dedo (mayor que R0: el dedo queda fuera)
  let revealed = false;
  let movido = false;

  peek.classList.add('peek--active', 'peek--touch');
  peek.style.setProperty('--peek-r0', R0 + 'px');
  peek.style.setProperty('--r', R0 + 'px');
  peek.setAttribute('aria-label', 'Sneak peek - drag to explore, tap to reveal the full stadium complex');
  if (label) label.textContent = PEEK_COPY.peek;

  const center = () => {
    const r = peek.getBoundingClientRect();
    peek.style.setProperty('--mx', (r.width / 2) + 'px');
    peek.style.setProperty('--my', (r.height / 2) + 'px');
    peek.style.setProperty('--lx', (r.width / 2) + 'px');
  };
  center();
  window.addEventListener('resize', center, { passive: true });

  const mover = (e) => {
    if (revealed) return;
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    const r = peek.getBoundingClientRect();
    const mx = Math.min(Math.max(t.clientX - r.left, 0), r.width);
    // el hueco NO va debajo del dedo: el dedo taparía justo lo que se está mirando. Va por
    // encima, y si no entra arriba (dedo cerca del borde superior) se espeja hacia abajo.
    let my = t.clientY - r.top - OFFSET;
    if (my < R0 * 0.5) my = t.clientY - r.top + OFFSET;
    my = Math.min(Math.max(my, 0), r.height);
    peek.classList.add('peek--touched');   // deja de latir apenas lo movés
    peek.style.setProperty('--mx', mx + 'px');
    peek.style.setProperty('--my', my + 'px');
    peek.style.setProperty('--lx', Math.min(Math.max(mx, 76), r.width - 76) + 'px');
    peek.classList.toggle('peek--label-above', (r.height - my) < (R0 + 56));
    if (label && !peek.classList.contains('peek--ready')) {
      peek.classList.add('peek--ready');
      scrambleLabel(label, PEEK_COPY.ctaTouch);
    }
  };

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    peek.classList.add('is-revealed');
    const r = peek.getBoundingClientRect();
    const target = Math.hypot(r.width, r.height) * 1.12;
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const tick = (now) => {
      const t = Math.min((now - t0) / 900, 1);
      peek.style.setProperty('--r', (R0 + (target - R0) * ease(t)) + 'px');
      if (t < 1) { requestAnimationFrame(tick); return; }
      setTimeout(() => peek.classList.add('lights-on'), 200);
    };
    requestAnimationFrame(tick);
  };

  let x0 = 0, y0 = 0;
  // el PRIMER toque solo coloca la linterna: si revelara de una, el visitante nunca llega a ver
  // que se puede explorar. A partir del segundo tap (o tras arrastrar y soltar) sí revela.
  let armado = false;
  let huboTouch = false;   // si el navegador manda touch, el click sintetico que viene despues sobra
  peek.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    x0 = t.clientX; y0 = t.clientY; movido = false; huboTouch = true;
    mover(e);
  }, { passive: true });
  peek.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (Math.hypot(t.clientX - x0, t.clientY - y0) > 10) movido = true;
    mover(e);
  }, { passive: true });
  // tap = revelar. Si arrastró, no revela: estaba explorando.
  peek.addEventListener('touchend', () => {
    if (movido) { armado = true; return; }   // arrastró: exploró, no revela
    if (!armado) { armado = true; return; }  // primer tap: solo coloca la linterna
    reveal();
  }, { passive: true });
  // solo para un navegador angosto SIN touch (desktop achicado): en touch manda el touchend,
  // y el click sintetico que el navegador dispara despues del tap se ignora.
  peek.addEventListener('click', (e) => { if (!huboTouch && e.detail !== 0) reveal(); });
  peek.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); }
  });
}

/**
 * Peek del render (DESKTOP): capa negra plena sobre el render con una "linterna" (hueco radial) que
 * sigue el mouse y una etiqueta que la acompaña. La etiqueta invita a espiar ("espiá el estadio") y,
 * cuando el usuario ya recorrió un par de barridos (o pasó un tiempo), MUTA con scramble al CTA
 * ("hacé click y miralo entero"). Click/tap/Enter hace crecer el hueco hasta revelar todo.
 * No-JS y prefers-reduced-motion = render visible sin capa. En touch (tablet ≥781) la linterna queda
 * centrada y la etiqueta sube al CTA tras un momento. En mobile (≤780) → setupTouchPeek.
 */
function setupPeek(root) {
  const peek = root.querySelector('.proof__peek');
  if (!peek) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const overlay = window.matchMedia('(min-width: 781px)').matches;   // timeline como overlay (desktop)
  if (!overlay) { setupTouchPeek(peek); return; }   // mobile: linterna arrastrable con el dedo

  const R0 = 120;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const label = peek.querySelector('.proof__peek-label');
  let revealed = false;
  let phase = 'peek';   // 'peek' → 'cta'
  let labelW = 200;
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
