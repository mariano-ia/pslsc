/**
 * <psl-departures-board></psl-departures-board>
 *
 * 🟦 A medida — bloque 05 (Founders, Home). Tablero de partidas estilo SPLIT-FLAP (Solari de
 * aeropuerto): "this flight is about to take off". Cada fundador es un pasajero abordando el
 * vuelo PSL 2027. Cada carácter vive en su celda con seam horizontal; cuando el contenido cambia,
 * la celda cicla caracteres al azar con un tick de flip antes de asentarse (como las tablas de
 * aeropuerto). Al entrar un nuevo fundador, las filas se corren y el tablero entero "revolotea".
 *
 * Columnas: NO. (asiento ALEATORIO — no correlativo: no simulamos un contador) · MEMBER ·
 * FROM (código de ciudad estilo aeropuerto) · STATUS. Header: FLIGHT PSL·2027 + reloj (sin total).
 * Fila fantasma al pie: "#____ YOU — BOARDING" → link al claim real (Sumate).
 *
 * Primera aparición: el tablero arranca en blanco y se llena en cascada cuando entra al viewport.
 *
 * FIGURA METAFÓRICA: los ingresos son simulados (sin backend) — el tablero comunica tracción.
 * Contrato real (WordPress): GET /api/founders/recent.
 *
 * reduced-motion: swaps instantáneos, sin ciclos ni parpadeos.
 */
const NAMES = ['SOFIA L.', 'MATEO F.', 'JULIETA V.', 'THIAGO B.', 'EMILIA C.', 'BENJAMIN R.', 'RENATA D.', 'BRUNO M.', 'ANTONELLA P.', 'FACUNDO T.', 'ISABELLA N.', 'SANTIAGO G.'];
const SEED = [
  { name: 'VALENTINA G.', from: 'PSL' },
  { name: 'MARCO R.',     from: 'FPR' },
  { name: 'LUCAS P.',     from: 'PSL' },
  { name: 'CAMILA S.',    from: 'SUA' },
  { name: 'DIEGO M.',     from: 'MIA' },
  { name: 'NICO A.',      from: 'JEN' },
  { name: 'EMILIA C.',    from: 'VRB' },
];
const CODES = ['PSL', 'FPR', 'SUA', 'MIA', 'JEN', 'VRB'];
const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#.,·— ';
const COLS = [
  { key: 'no',     label: 'NO.',    len: 5  },
  { key: 'name',   label: 'MEMBER', len: 13 },
  { key: 'from',   label: 'FROM',   len: 4  },
  { key: 'status', label: 'STATUS', len: 8  },
];
const ROWS = 7;
const JOIN_EVERY = 9000;

const pad = (s, len) => String(s).toUpperCase().slice(0, len).padEnd(len, ' ');
const randFlap = () => FLAP[Math.floor(Math.random() * FLAP.length)];

class PSLDeparturesBoard extends HTMLElement {
  connectedCallback() {
    this._reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._timers = new Set();
    this._entries = SEED.map((e) => ({ num: 0, ...e }));
    this._entries.forEach((e) => { e.num = this._randSeat(); });
    this._filled = false;
    this._renderSkeleton();
    this._startClock();

    // primera aparición: cascada de llenado cuando el tablero entra al viewport
    const boot = () => {
      if (this._filled) return;
      if (this._io) this._io.disconnect();
      this._fill(!this._reduce);
      this._startJoins();
    };
    // la cascada corre EXACTAMENTE cuando el usuario llega scrolleando (sorpresa a la llegada)
    if (!('IntersectionObserver' in window)) {
      boot();
    } else {
      this._io = new IntersectionObserver((ents) => {
        if (ents.some((x) => x.isIntersecting)) boot();
      }, { threshold: 0.15 });
      this._io.observe(this);
      // salvaguarda: SOLO si ya está en viewport y el IO no disparó (entornos raros/headless).
      // Nunca pre-llena un tablero fuera de pantalla — eso mataría la sorpresa de la llegada.
      this._later(() => {
        const r = this.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (!this._filled && r.top < vh && r.bottom > 0) boot();
      }, 2500);
    }
  }

  disconnectedCallback() {
    if (this._io) this._io.disconnect();
    this._timers.forEach(clearTimeout);
    this._timers.clear();
  }

  // asiento aleatorio de 4 dígitos, sin duplicar los visibles (no correlativo: no es un contador)
  _randSeat() {
    let n;
    do { n = 100 + Math.floor(Math.random() * 1900); }
    while (this._entries.some((e) => e.num === n));
    return n;
  }

  _later(fn, ms) {
    const id = setTimeout(() => { this._timers.delete(id); fn(); }, ms);
    this._timers.add(id);
    return id;
  }

  /* ============ estructura ============ */

  _cells(n) {
    return Array.from({ length: n }, () => '<span class="db__cell" data-c=" "></span>').join('');
  }

  _renderSkeleton() {
    const cols = COLS.map((c) => `<span class="db__col" style="--n:${c.len}">${c.label}</span>`).join('');
    const rows = Array.from({ length: ROWS }, () => `
      <div class="db__row">
        ${COLS.map((c) => `<span class="db__group" data-col="${c.key}">${this._cells(c.len)}</span>`).join('')}
      </div>`).join('');

    this.innerHTML = `
      <div class="db" role="table" aria-label="Founding members boarding — live departures board">
        <div class="db__head">
          <span class="db__head-title"><span class="db__dot" aria-hidden="true"></span>Now boarding · Founding class 2027</span>
          <span class="db__head-right">
            <span class="db__flight">Flight PSL·2027</span>
            <span class="db__clock tnum"></span>
          </span>
        </div>
        <div class="db__cols" aria-hidden="true">${cols}</div>
        <div class="db__rows">${rows}</div>
        <a class="db__row db__row--ghost" href="sumate.html#plans">
          <span class="db__group" data-col="no">${this._cells(5)}</span>
          <span class="db__group" data-col="name">${this._cells(13)}</span>
          <span class="db__group" data-col="from">${this._cells(4)}</span>
          <span class="db__group db__group--boarding" data-col="status">${this._cells(8)}</span>
        </a>
        <div class="db__foot">
          <span class="db__foot-text">This flight is about to take off — secure your seat before the <span class="db__foot-accent">first whistle</span></span>
        </div>
      </div>
    `;
    this._rowsEls = [...this.querySelectorAll('.db__rows .db__row')];
    this._ghostEl = this.querySelector('.db__row--ghost');
    this._clockEl = this.querySelector('.db__clock');
  }

  /* ============ split-flap ============ */

  // asienta un carácter en una celda: cicla `steps` caracteres al azar con tick de flip
  _flipCell(cell, target, delay, steps) {
    const settle = () => {
      cell.textContent = target === ' ' ? '' : target;
      cell.dataset.c = target;
    };
    if (this._reduce) { settle(); return; }
    this._later(() => {
      let k = 0;
      const step = () => {
        cell.classList.remove('is-tick');
        void cell.offsetWidth;               // reinicia la animación del tick
        cell.classList.add('is-tick');
        if (k >= steps) { settle(); return; }
        cell.textContent = randFlap().trim();
        k += 1;
        this._later(step, 55 + Math.random() * 25);
      };
      step();
    }, delay);
  }

  // escribe un string en un grupo de celdas (solo flippea las que cambian)
  _setGroup(groupEl, str, animate, baseDelay = 0) {
    const cells = groupEl.children;
    for (let i = 0; i < cells.length; i++) {
      const target = str[i] || ' ';
      if (cells[i].dataset.c === target) continue;
      if (!animate || this._reduce) {
        cells[i].textContent = target === ' ' ? '' : target;
        cells[i].dataset.c = target;
      } else {
        this._flipCell(cells[i], target, baseDelay + i * 26, 2 + Math.floor(Math.random() * 3));
      }
    }
  }

  _setRow(rowEl, entry, animate, rowIdx) {
    const strs = {
      no: pad(`#${String(entry.num).padStart(4, '0')}`, 5),
      name: pad(entry.name, 13),
      from: pad(entry.from, 4),
      status: pad(entry.status, 8),
    };
    const base = rowIdx * 46;
    let offset = 0;
    COLS.forEach((c) => {
      this._setGroup(rowEl.querySelector(`[data-col="${c.key}"]`), strs[c.key], animate, base + offset);
      offset += 110;
    });
  }

  /* ============ contenido ============ */

  _fill(animate) {
    this._filled = true;
    this._entries.forEach((e, i) => { e.status = i === 0 ? 'JUST NOW' : 'ON BOARD'; });
    this._rowsEls.forEach((rowEl, i) => this._setRow(rowEl, this._entries[i], animate, i));
    // fila fantasma: tu asiento
    this._setGroup(this._ghostEl.querySelector('[data-col="no"]'), pad('#____', 5), animate, 340);
    this._setGroup(this._ghostEl.querySelector('[data-col="name"]'), pad('YOU', 13), animate, 380);
    this._setGroup(this._ghostEl.querySelector('[data-col="from"]'), pad('—', 4), animate, 460);
    this._setGroup(this._ghostEl.querySelector('[data-col="status"]'), pad('BOARDING', 8), animate, 500);
  }

  _startJoins() {
    const join = () => {
      this._entries.unshift({
        num: this._randSeat(),
        name: NAMES[Math.floor(Math.random() * NAMES.length)],
        from: CODES[Math.floor(Math.random() * CODES.length)],
      });
      this._entries.length = Math.min(this._entries.length, ROWS);
      this._entries.forEach((e, i) => { e.status = i === 0 ? 'JUST NOW' : 'ON BOARD'; });
      // el tablero entero se corre una fila → cascada de flips (como un Solari real)
      this._rowsEls.forEach((rowEl, i) => this._setRow(rowEl, this._entries[i], true, i));
      this._later(join, JOIN_EVERY);
    };
    this._later(join, this._reduce ? JOIN_EVERY : 3000);
  }

  _startClock() {
    const tick = () => {
      const d = new Date();
      this._clockEl.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      this._later(tick, 20000);
    };
    tick();
  }
}

customElements.define('psl-departures-board', PSLDeparturesBoard);

export { PSLDeparturesBoard };
