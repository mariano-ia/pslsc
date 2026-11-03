/**
 * <psl-card flippable></psl-card>
 *
 * 🟦 A medida — carta de la Charter Collection (estética de trading card). Se alimenta con
 * el.data = { ... } y dibuja SOLO lo que viene en ese objeto. El repo es público: nombre, foto,
 * pistas e íconos de los sellos llegan por datos desde el servidor, según la fecha. Acá no va
 * ningún contenido de una carta puntual.
 *
 * Datos:
 *   code, set, parallel ('base' | 'aqua' | 'gold' | 'holo'),
 *   background ('base' | 'wall' | 'wallGold' | 'diamond' | 'shatter' | 'target' | 'bolt'), o la
 *   estructura de la colección: { photo, tone ('sea' | 'aqua' | 'gold' | 'ink'), pattern (idem
 *   kinds), big }: foto del club en duotono + miscelánea encima. backgroundPhoto (url) a color, seed,
 *   frame (true: marco interior que la figura rompe),
 *   edition, figure ({ src, kind: 'silhouette' | 'crest' | 'player' | 'luca' | 'fan', alt }),
 *   photo ({ src, alt }), revealed,
 *   flag ({ code, background } o null = bloqueada),
 *   first, last (o null = barras rayadas), nameBars ([56, 26]), sub,
 *   stamps ([{ word, icon } o { locked: true }]),
 *   back ({ name, bio: [[label, valor o null]], table: { rows } o { locked, unlock },
 *           fact: { text } o { locked, unlock } }),
 *   flash ('nation' | 'stamp' | 'career' | 'fact', zona recién destrabada).
 *
 * Métodos: flip(bool), reveal() (giro y silueta que pasa a foto).
 * Respeta prefers-reduced-motion (sin tilt; CSS corta los giros).
 */
const CREST_SRC = '/assets/brand/crest-aqua.webp';
const LOCK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Generador con semilla: el fondo de cada carta sale igual en cada render.
function rng(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let uid = 0;
function backgroundSVG(kind, seed, big, overlay = false) {
  const id = `tc${++uid}`;
  const r = rng(seed || 7);
  const svg = (body) => `<svg class="tc__bg${overlay ? ' tc__bg--overlay' : ''}" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;
  const base = (fill) => (overlay ? '' : `<rect width="100" height="140" fill="${fill}"/>`);

  if (kind === 'wall' || kind === 'wallGold') {
    const gold = kind === 'wallGold';
    const c = gold ? '#D8C27E' : '#AAF6E6';
    let tiles = '';
    for (let y = 4; y < 136; y += 4.6) {
      for (let x = 3; x < 97; x += 12.4) {
        const lit = r() < 0.08;
        tiles += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(7 + r() * 3.6).toFixed(1)}" height="2.4" rx=".6" fill="${lit ? '#fff' : c}" fill-opacity="${lit ? 0.75 : (0.06 + r() * 0.18).toFixed(2)}"/>`;
      }
    }
    return svg(`<defs><radialGradient id="${id}g" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="${gold ? '#4A3D1B' : '#1B5A50'}"/><stop offset="1" stop-color="#0B0B09"/></radialGradient></defs>
      ${base(`url(#${id}g)`)}${tiles}
      <path d="M-5 92 L105 70 L105 84 L-5 106Z" fill="${c}" fill-opacity=".9"/><path d="M-5 92 L105 70" stroke="#0C0C0A" stroke-width=".6" stroke-dasharray="2 1.2"/>`);
  }

  if (kind === 'diamond') {
    let rings = '';
    for (let d = 8; d < 120; d += 7) rings += `<polygon points="50,${62 - d} ${50 + d},62 50,${62 + d} ${50 - d},62" fill="none" stroke="#D8C27E" stroke-opacity="${(0.85 - d / 160).toFixed(2)}" stroke-width="${d % 14 ? 0.5 : 1.1}"/>`;
    let mesh = '';
    for (let i = -140; i < 240; i += 4) mesh += `<path d="M${i} 0 L${i + 140} 140M${i} 140 L${i + 140} 0" stroke="#D8C27E" stroke-opacity=".07" stroke-width=".3"/>`;
    return svg(`<defs><radialGradient id="${id}g" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#3A3016"/><stop offset="1" stop-color="#0B0B09"/></radialGradient></defs>
      ${base(`url(#${id}g)`)}${mesh}${rings}
      <polygon points="50,26 86,62 50,98 14,62" fill="#0B0B09" fill-opacity=".55" stroke="#F3E2A6" stroke-width="1.6"/>`);
  }

  if (kind === 'shatter') {
    const colors = ['#AAF6E6', '#8EC5FF', '#C3A6FF', '#FF3B63', '#ffffff', '#2B6CB0'];
    let shards = '';
    let a = 0;
    while (a < Math.PI * 2) {
      const step = 0.18 + r() * 0.4, r1 = 6 + r() * 20, r2 = 90 + r() * 40;
      const pts = [[r1, a], [r2, a], [r2, a + step], [r1 + 8, a + step * 0.6]].map(([rad, ang]) => `${(50 + Math.cos(ang) * rad).toFixed(1)},${(58 + Math.sin(ang) * rad).toFixed(1)}`);
      shards += `<polygon points="${pts.join(' ')}" fill="${colors[Math.floor(r() * colors.length)]}" fill-opacity="${(0.12 + r() * 0.45).toFixed(2)}" stroke="#fff" stroke-opacity=".45" stroke-width=".35"/>`;
      a += step;
    }
    return svg(`<defs><radialGradient id="${id}g" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#3A7DD8"/><stop offset=".5" stop-color="#14254A"/><stop offset="1" stop-color="#090B16"/></radialGradient>
      <radialGradient id="${id}c" cx=".5" cy=".42" r=".25"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      ${base(`url(#${id}g)`)}${shards}<rect width="100" height="140" fill="url(#${id}c)"/>`);
  }

  if (kind === 'target') {
    const cols = ['#0C0C0A', '#AAF6E6', '#0C0C0A', '#F3F0EA'];
    let rings = '';
    let k = 0;
    for (let rad = 160; rad > 4; rad -= 9) { rings += `<circle cx="62" cy="56" r="${rad}" fill="${rad < 40 && k % 4 === 1 ? '#FF0033' : cols[k % 4]}"/>`; k++; }
    let slices = '';
    for (let i = 0; i < 24; i += 2) {
      const a1 = i / 24 * Math.PI * 2, a2 = (i + 1) / 24 * Math.PI * 2;
      slices += `<polygon points="62,56 ${62 + Math.cos(a1) * 200},${56 + Math.sin(a1) * 200} ${62 + Math.cos(a2) * 200},${56 + Math.sin(a2) * 200}" fill="#0C0C0A" fill-opacity=".35"/>`;
    }
    return svg(`${base('#0C0C0A')}${rings}${slices}`);
  }

  if (kind === 'bolt') {
    let bolts = '';
    [[14, 18, 1], [82, 30, -1], [20, 74, -1], [86, 82, 1]].forEach(([x, y, f]) => { bolts += `<path transform="translate(${x} ${y}) scale(${f * 1.4} 1.4)" d="M2 -8 L-5 2 L0 2 L-2 9 L6 -2 L1 -2 Z" fill="#0C0C0A" stroke="#fff" stroke-width=".6"/>`; });
    let rays = '';
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; rays += `<polygon points="50,52 ${50 + Math.cos(a) * 120},${52 + Math.sin(a) * 120} ${50 + Math.cos(a + 0.18) * 120},${52 + Math.sin(a + 0.18) * 120}"/>`; }
    const num = big ? `<text x="50" y="92" text-anchor="middle" font-family="Druk,Impact,sans-serif" font-weight="900" font-size="78" fill="none" stroke="#0C0C0A" stroke-opacity=".28" stroke-width=".6">${esc(big)}</text>` : '';
    return svg(`<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#AAF6E6"/><stop offset=".6" stop-color="#3FB8A3"/><stop offset="1" stop-color="#0E5C50"/></linearGradient></defs>
      ${base(`url(#${id}g)`)}<g fill="#fff" fill-opacity=".22">${rays}</g>${bolts}${num}`);
  }

  let stripes = '';
  for (let i = 0; i < 9; i++) {
    const x = -60 + i * 22 + r() * 8;
    const w = 3 + r() * 9;
    stripes += `<polygon points="${x},140 ${x + w},140 ${x + w + 90},0 ${x + 90},0" fill="#AAF6E6" fill-opacity="${(0.05 + r() * 0.14).toFixed(2)}"/>`;
  }
  const bigText = big ? `<text x="50" y="92" text-anchor="middle" font-family="Druk,Impact,sans-serif" font-weight="900" font-size="78" fill="none" stroke="#AAF6E6" stroke-opacity=".28" stroke-width=".6" letter-spacing="1">${esc(big)}</text>` : '';
  return svg(`<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B5A50"/><stop offset=".6" stop-color="#0D2622"/><stop offset="1" stop-color="#090F0E"/></linearGradient>
      <pattern id="${id}d" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".75" fill="#AAF6E6"/></pattern>
      <radialGradient id="${id}m" cx=".85" cy=".1" r=".6"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
      <mask id="${id}k"><rect width="100" height="140" fill="url(#${id}m)"/></mask></defs>
      ${base(`url(#${id}g)`)}${stripes}
      <rect width="100" height="140" fill="url(#${id}d)" mask="url(#${id}k)" opacity=".5"/>${bigText}
      ${overlay ? '' : '<rect width="100" height="140" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>'}`);
}

// Duotono de la foto del club, por familia: sombras y luces de cada tono.
const TONES = {
  sea:  ['#071A17', '#2E9A86'],
  aqua: ['#061513', '#5FD3BE'],
  gold: ['#1A1408', '#C9A95B'],
  ink:  ['#09090A', '#6E7A78'],
};
function duotoneFilter(id, tone) {
  const [dark, light] = TONES[tone] || TONES.sea;
  const ch = (i) => `${parseInt(dark.slice(i, i + 2), 16) / 255} ${parseInt(light.slice(i, i + 2), 16) / 255}`;
  return `<svg class="tc__defs" width="0" height="0" aria-hidden="true"><filter id="${id}" color-interpolation-filters="sRGB">
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncR type="table" tableValues="${ch(1)}"/><feFuncG type="table" tableValues="${ch(3)}"/><feFuncB type="table" tableValues="${ch(5)}"/></feComponentTransfer>
  </filter></svg>`;
}

// Estructura de la colección: foto del club en duotono + miscelánea + viñeta para que lea el texto.
function structuredBackground(bg, seed) {
  const id = `tcd${++uid}`;
  return `${duotoneFilter(id, bg.tone)}
    <img class="tc__bg tc__bg-photo" src="${esc(bg.photo)}" alt="" style="filter:url(#${id}) contrast(1.12)" decoding="async">
    ${backgroundSVG(bg.pattern || 'base', seed, bg.big, true)}
    <span class="tc__bg-vignette"></span>`;
}

const lockedBars = (lines, text) => `<div class="tc__lkb">${Array.from({ length: lines }, (_, i) => `<i style="width:${94 - i * 16}%"></i>`).join('')}<small>${esc(text)}</small></div>`;

function stampsHTML(d) {
  return (d.stamps || []).map((s) => {
    const flash = !s.locked && d.flash === 'stamp' && s.isNew ? ' tc-flash' : '';
    return s.locked
      ? `<span class="tc__stamp is-locked">${LOCK_ICON}Locked</span>`
      : `<span class="tc__stamp${flash}">${s.icon || ''}${esc(s.word)}</span>`;   // icon: SVG de nuestro servidor
  }).join('');
}

function figureHTML(d) {
  const f = d.figure;
  let html = '';
  if (f?.src) {
    html += `<img class="tc__fig is-${esc(f.kind || 'player')}" src="${esc(f.src)}" alt="${esc(f.alt || '')}" decoding="async">`;
  }
  if (d.photo?.src) {
    html += `<img class="tc__fig is-photo" src="${esc(d.photo.src)}" alt="${esc(d.photo.alt || '')}" decoding="async">`;
  }
  return html;
}

function flagHTML(d) {
  if (d.flag === undefined) return '';
  if (d.flag === null) return `<span class="tc__flag is-locked">${LOCK_ICON}???</span>`;
  return `<span class="tc__flag${d.flash === 'nation' ? ' tc-flash' : ''}"><span class="tc__flag-img" style="background:${esc(d.flag.background)}"></span>${esc(d.flag.code)}</span>`;
}

function nameHTML(d) {
  if (d.last) return esc(d.last);
  return (d.nameBars || [56, 26]).map((w) => `<span class="tc__bar" style="width:${Number(w)}%"></span>`).join('');
}

function backHTML(d) {
  const b = d.back || {};
  const bio = (b.bio || []).map(([k, v]) => `<div><span>${esc(k)}</span><b>${v == null ? '<em>Locked</em>' : esc(v)}</b></div>`).join('');
  let table = '';
  if (b.table) {
    const flash = d.flash === 'career' ? ' tc-flash' : '';
    table = b.table.locked
      ? `<div class="${flash}">${lockedBars(4, b.table.unlock)}</div>`
      : `<table class="tc__table${flash}"><thead><tr><th>Year</th><th>Club</th><th>Role</th></tr></thead><tbody>${b.table.rows.map((r) => `<tr class="${r[3] ? 'is-hl' : ''}"><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table>`;
  }
  let fact = '';
  if (b.fact) {
    fact = `<div class="tc__fact${d.flash === 'fact' ? ' tc-flash' : ''}"><span>Did you know?</span>${b.fact.locked ? lockedBars(2, b.fact.unlock) : esc(b.fact.text)}</div>`;
  }
  return `<div class="tc__bk">
    <div class="tc__bk-head"><span class="tc__bk-code">${esc(d.code)}</span><div><div class="tc__bk-name">${esc(b.name || d.last || '')}</div><div class="tc__bk-sub">${esc(d.sub)}</div></div></div>
    ${bio ? `<div class="tc__bk-bio">${bio}</div>` : ''}${table}${fact}
    <div class="tc__bk-foot">© 2026 Port St. Lucie SC · Charter Collection · ${esc(d.set)}</div>
  </div>`;
}

class PSLCard extends HTMLElement {
  connectedCallback() {
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.hasAttribute('flippable')) {
      this.setAttribute('role', 'button');
      this.setAttribute('tabindex', '0');
      this.addEventListener('click', () => this.flip());
      this.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.flip(); }
      });
    }
    if (!this.reduce) {
      this.addEventListener('pointermove', (e) => this.tilt(e));
      this.addEventListener('pointerleave', () => this.querySelector('.tc__tilt')?.removeAttribute('style'));
    }
    if (this._data) this.render();
  }

  get data() { return this._data; }
  set data(value) {
    this._data = value;
    if (this.isConnected) this.render();
  }

  render() {
    const d = this._data;
    this.dataset.parallel = d.parallel || 'base';
    this.classList.toggle('is-revealed', Boolean(d.revealed));
    if (this.hasAttribute('flippable')) {
      this.setAttribute('aria-label', d.revealed ? `Flip card ${d.code}: ${d.first} ${d.last}` : `Flip card ${d.code}`);
    }
    this.innerHTML = `<div class="tc__tilt"><div class="tc__inner">
      <div class="tc__face tc__front">
        <div class="tc__win">${d.backgroundPhoto ? `<img class="tc__bg" src="${esc(d.backgroundPhoto)}" alt="">` : (d.background && typeof d.background === 'object' ? structuredBackground(d.background, d.seed) : backgroundSVG(d.background, d.seed, d.big))}${d.frame ? '<span class="tc__frame"></span>' : ''}<span class="tc__vert">${esc(d.set)}</span></div>
        ${figureHTML(d)}
        <div class="tc__tl">${flagHTML(d)}${d.badge ? `<span class="tc__shield"><b>${esc(d.badge[0])}</b><i>${esc(d.badge[1])}</i></span>` : ''}</div>
        <div class="tc__tr"><span class="tc__brand">Charter<br>Collection</span><span class="tc__code">${esc(d.code)}</span>${d.edition ? `<span class="tc__edition">${esc(d.edition)}</span>` : ''}</div>
        <div class="tc__stamps">${stampsHTML(d)}</div>
        <div class="tc__bolt"></div>
        <div class="tc__banner"><span class="tc__logo"><img src="${CREST_SRC}" alt=""></span>
          <div class="tc__nm"><div class="tc__first">${esc(d.first) || '&nbsp;'}</div><div class="tc__last">${nameHTML(d)}</div><div class="tc__sub">${esc(d.sub)}</div></div></div>
      </div>
      <div class="tc__face tc__back">${backHTML(d)}</div>
    </div></div>`;
  }

  flip(force) {
    this.classList.toggle('is-flipped', force);
  }

  reveal() {
    if (this.reduce) return;
    this.classList.remove('is-revealing');
    void this.offsetWidth;   // reinicia la animación si se llama dos veces
    this.classList.add('is-revealing');
  }

  tilt(e) {
    if (e.pointerType === 'touch') return;
    const t = this.querySelector('.tc__tilt');
    if (!t) return;
    const r = this.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    t.style.transform = `rotateY(${(x - 0.5) * 14}deg) rotateX(${(0.5 - y) * 14}deg)`;
    this.style.setProperty('--mx', `${x * 100}%`);
    this.style.setProperty('--my', `${y * 100}%`);
  }
}

customElements.define('psl-card', PSLCard);
