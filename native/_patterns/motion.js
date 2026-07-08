/**
 * PSL SC — Sistema de motion compartido. 🟩 Núcleo.
 *
 * Dirigido por data-atributos, sin dependencias, portable a WordPress (encolar global con type=module).
 * Cada bloque se "declara" con atributos en su HTML; este módulo los activa. En el preview, el
 * ensamblador llama initMotion() después de inyectar los bloques; en WP corre solo en DOMContentLoaded.
 *
 * API de data-atributos:
 *   [data-reveal]                 → aparece (fade+rise) al entrar en viewport. Variantes:
 *                                   data-reveal="left|right|scale|mask". data-reveal-delay="120" (ms).
 *   [data-reveal-group="90"]      → aplica stagger (90ms) a sus hijos directos [data-reveal]
 *                                   (o a los [data-reveal-item] descendientes si existen).
 *   [data-parallax="0.15"]        → parallax vertical sutil ligado al scroll.
 *   [data-tilt="6"]               → inclinación 3D siguiendo el puntero (grados máx).
 *   [data-spotlight]              → halo aqua que sigue el cursor (usa ::after en motion.css).
 *   [data-magnetic="0.3"]         → el elemento se "imanta" hacia el cursor.
 *   [data-countdown="2027-03-01"] → escribe los días restantes en [data-countdown-num] (o en sí mismo).
 *
 * Piezas globales (una sola vez): nav reactiva (progreso + sección activa),
 * grano, cursor-glow, costuras ink↔paper. Todo respeta prefers-reduced-motion y pointer coarse.
 */
const html = document.documentElement;
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const rafThrottle = (fn) => {
  let scheduled = 0;
  return () => { if (!scheduled) scheduled = requestAnimationFrame(() => { scheduled = 0; fn(); }); };
};

/* ---------- Reveal (IntersectionObserver) ---------- */
let revealObserver = null;
function ensureRevealObserver() {
  if (revealObserver) return revealObserver;
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('is-revealed');
      revealObserver.unobserve(el);
      // Al terminar la aparición liberamos el elemento: quitamos [data-reveal] para que su estado
      // "revelado" (transform:none) deje de pisar los :hover con transform (lift/zoom de las cards).
      const delay = parseFloat(getComputedStyle(el).getPropertyValue('--reveal-delay')) || 0;
      setTimeout(() => {
        el.removeAttribute('data-reveal');
        el.classList.remove('is-revealed');
        el.style.removeProperty('--reveal-delay');
      }, delay + 900);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  return revealObserver;
}
function initReveal(root) {
  if (reduce()) {
    // sin motion: liberamos el atributo (nada oculto, y los :hover con transform quedan libres)
    root.querySelectorAll('[data-reveal]').forEach((el) => el.removeAttribute('data-reveal'));
    return;
  }
  const obs = ensureRevealObserver();
  // grupos: reparten el delay incremental entre sus items (los items ya llevan [data-reveal] en el HTML)
  root.querySelectorAll('[data-reveal-group]').forEach((g) => {
    if (g.dataset.revGroupBound) return;
    g.dataset.revGroupBound = '1';
    const step = parseInt(g.dataset.revealGroup, 10) || 80;
    const explicit = g.querySelectorAll('[data-reveal-item]');
    const items = explicit.length ? explicit : g.querySelectorAll(':scope > [data-reveal]');
    items.forEach((it, i) => it.style.setProperty('--reveal-delay', `${i * step}ms`));
  });
  root.querySelectorAll('[data-reveal]').forEach((el) => {
    if (el.dataset.revBound) return;
    el.dataset.revBound = '1';
    if (el.dataset.revealDelay) el.style.setProperty('--reveal-delay', `${el.dataset.revealDelay}ms`);
    obs.observe(el);
  });
}

/* ---------- Parallax vertical ---------- */
const parallaxEls = [];
let parallaxWired = false;
function initParallax(root) {
  if (reduce()) return;
  root.querySelectorAll('[data-parallax]').forEach((el) => {
    if (el.dataset.pxBound) return;
    el.dataset.pxBound = '1';
    parallaxEls.push({ el, k: parseFloat(el.dataset.parallax) || 0.15 });
  });
  if (!parallaxEls.length || parallaxWired) return;
  parallaxWired = true;
  const update = () => {
    const vh = window.innerHeight;
    parallaxEls.forEach(({ el, k }) => {
      const r = el.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const off = (center - vh / 2) * -k;
      el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    });
  };
  const onScroll = rafThrottle(update);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ---------- Tilt 3D ---------- */
function initTilt(root) {
  if (reduce() || !finePointer()) return;
  root.querySelectorAll('[data-tilt]').forEach((el) => {
    if (el.dataset.tiltBound) return;
    el.dataset.tiltBound = '1';
    const max = parseFloat(el.dataset.tilt) || 6;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(820px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------- Spotlight (cursor-follow) ---------- */
function initSpotlight(root) {
  if (!finePointer()) return;
  root.querySelectorAll('[data-spotlight]').forEach((el) => {
    if (el.dataset.spotBound) return;
    el.dataset.spotBound = '1';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    });
  });
}

/* ---------- Magnético ---------- */
function initMagnetic(root) {
  if (reduce() || !finePointer()) return;
  root.querySelectorAll('[data-magnetic]').forEach((el) => {
    if (el.dataset.magBound) return;
    el.dataset.magBound = '1';
    const s = parseFloat(el.dataset.magnetic) || 0.3;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${(mx * s).toFixed(1)}px, ${(my * s).toFixed(1)}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------- Countdown (días para el primer silbato) ---------- */
function initCountdown(root) {
  root.querySelectorAll('[data-countdown]').forEach((el) => {
    if (el.dataset.cdBound) return;
    el.dataset.cdBound = '1';
    const target = new Date(`${el.dataset.countdown}T00:00:00`);
    const numEl = el.querySelector('[data-countdown-num]') || el;
    const days = Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000));
    numEl.textContent = days.toLocaleString('en-US');
  });
}

/* ---------- Nav reactiva (condensa + barra de progreso + sección activa) ---------- */
function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav || nav.dataset.scrollBound) return;
  nav.dataset.scrollBound = '1';
  let bar = nav.querySelector('.nav__progress');
  if (!bar) {
    bar = document.createElement('span');
    bar.className = 'nav__progress';
    bar.setAttribute('aria-hidden', 'true');
    nav.appendChild(bar);
  }
  const update = () => {
    const st = window.scrollY;
    nav.classList.toggle('is-scrolled', st > 8);
    const max = html.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${(max > 0 ? st / max : 0).toFixed(4)})`;
  };
  window.addEventListener('scroll', rafThrottle(update), { passive: true });
  update();

  // sección activa en la nav
  const links = [...nav.querySelectorAll('.nav__links a')];
  const map = new Map();
  links.forEach((a) => {
    const m = (a.getAttribute('href') || '').match(/#([\w-]+)/);
    if (m) { const sec = document.getElementById(m[1]); if (sec) map.set(sec, a); }
  });
  if (!map.size) return;
  const so = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.remove('is-active'));
      const a = map.get(e.target);
      if (a) a.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  map.forEach((_a, sec) => so.observe(sec));
}

/* ---------- Grano (textura sutil, global) ---------- */
function initGrain() {
  if (reduce() || document.querySelector('.psl-grain')) return;
  const g = document.createElement('div');
  g.className = 'psl-grain';
  g.setAttribute('aria-hidden', 'true');
  document.body.appendChild(g);
}

/* ---------- Cursor glow (halo aqua que sigue el puntero, solo desktop) ---------- */
function initCursor() {
  if (reduce() || !finePointer() || document.querySelector('.psl-cursor-glow')) return;
  const c = document.createElement('div');
  c.className = 'psl-cursor-glow';
  c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  let tx = 0; let ty = 0; let cx = 0; let cy = 0; let raf = 0; let shown = false;
  const loop = () => {
    cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
    c.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
    if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) raf = requestAnimationFrame(loop);
    else raf = 0;
  };
  window.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; cx = tx; cy = ty; c.classList.add('is-on'); }
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
}

/* ---------- Costuras ink↔paper (suaviza el corte entre superficies) ---------- */
function initSeams() {
  const secs = [...document.querySelectorAll('.surface-ink, .surface-paper')];
  secs.forEach((s, i) => {
    if (s.dataset.seamBound || i === 0) { s.dataset.seamBound = '1'; return; }
    s.dataset.seamBound = '1';
    const cur = s.classList.contains('surface-paper') ? 'paper' : 'ink';
    const prev = secs[i - 1].classList.contains('surface-paper') ? 'paper' : 'ink';
    if (cur !== prev) s.classList.add(`psl-seam--from-${prev}`);
  });
}

/* ---------- Init ---------- */
function initMotion(root = document) {
  html.classList.add('psl-motion');
  initReveal(root);
  initParallax(root);
  initTilt(root);
  initSpotlight(root);
  initMagnetic(root);
  initCountdown(root);
  if (root === document) {
    initSeams();
    initNavScroll();
    initGrain();
    initCursor();
  }
}

document.addEventListener('DOMContentLoaded', () => initMotion());

export { initMotion };
