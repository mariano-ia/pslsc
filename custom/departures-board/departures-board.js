/**
 * <psl-departures-board></psl-departures-board>
 *
 * 🟦 A medida — bloque 06-founders (Home). Tablero de partidas estilo SPLIT-FLAP (Solari de
 * aeropuerto): "this flight is about to take off". Cada fundador es un pasajero abordando el
 * vuelo PSL 2027. Cada carácter vive en su celda con seam horizontal; cuando el contenido cambia,
 * la celda cicla caracteres al azar con un tick de flip antes de asentarse (como las tablas de
 * aeropuerto). Al entrar un nuevo fundador, las filas se corren y el tablero entero "revolotea".
 *
 * Columnas: NO. (número de socio REAL, orden de compra en Vivenu — ver DATOS REALES abajo) ·
 * MEMBER · FROM (código de ciudad estilo aeropuerto) · STATUS. Header: FLIGHT PSL·2027 + reloj
 * (sin total).
 * Fila fantasma al pie: "#____ YOU — BOARDING" → link al claim real (Sumate).
 *
 * Primera aparición: el tablero arranca en blanco y se llena en cascada cuando entra al viewport.
 *
 * DATOS REALES (2026-09-01): el roster ya NO es inventado. Se lee de un CSV publicado desde el
 * mismo Google Sheet/Apps Script que alimenta el bloque 02-stats (ver
 * custom/live-counter/live-counter.js y tools/vivenu-stats-sync.js) — pestaña "FoundersPreview",
 * armada por previewFoundersRoster() en Apps Script: un founder por TRANSACCIÓN real de Vivenu
 * (no por ticket — una compra de varios tickets junto cuenta una sola vez), numerado por orden
 * real de compra (founderNumber 1 = primer depósito). displayName = nombre + inicial de
 * apellido (nunca apellido completo/email/teléfono/dirección). city = la que cargó el
 * comprador — se muestra como código de aeropuerto si hay match conocido, o como sigla
 * genérica de la ciudad si no matchea; si no vino cargada (pasa en la mayoría de los tickets
 * "Free"), se muestra "USA" en vez de inventar una ciudad puntual. Los founders CON ciudad real
 * van primero en el tablero (initial fill + ciclo); los "USA" (sin dato) quedan al final del
 * ciclo — pedido explícito del cliente (2026-09-01): priorizar los datos completos. DENTRO de
 * cada grupo (con-ciudad / sin-ciudad) el orden es ALEATORIO, no por fecha de compra — pedido
 * explícito del cliente (29no ajuste, 2026-09-02): que el tablero se vea "surtido", no siempre
 * los mismos primeros/últimos. Se re-mezcla en cada carga del bloque (cada fetchFoundersRoster).
 *
 * Si el fetch del CSV falla (red caída, CSV movido) o todavía no llegó la respuesta, el tablero
 * arranca y sigue funcionando con datos DEMO (SEED/NAMES/CODES de abajo) — nunca se rompe ni
 * queda vacío. En cuanto el fetch resuelve, si el tablero ya se había llenado con demo, se
 * re-renderiza con los datos reales.
 *
 * reduced-motion: swaps instantáneos, sin ciclos ni parpadeos.
 */

// URL del CSV publicado (Sheet > pestaña "FoundersPreview" > Archivo > Compartir > Publicar en
// la web > formato CSV > Publicar). Vacío = todavía no publicado, el tablero sigue en modo demo.
const FOUNDERS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vREtGNg5ISHgY2GaYO2H8ln0kud89zDYgyQtsr-EIfWQsWdfcACZzJs6ruSesTCAGFmiqVdfr0SxSlY/pub?gid=767607528&single=true&output=csv';

// Demo/fallback — solo se usa si el CSV real no está disponible (ver DATOS REALES arriba).
const NAMES = ['SOFIA L.', 'MATEO F.', 'JULIETA V.', 'THIAGO B.', 'EMILIA C.', 'BENJAMIN R.', 'RENATA D.', 'BRUNO M.', 'ANTONELLA P.', 'FACUNDO T.', 'ISABELLA N.', 'SANTIAGO G.'];
const SEED = [
  { name: 'MARTINA S.',   from: 'PSL' },
  { name: 'MARCO R.',     from: 'FPR' },
  { name: 'LUCAS P.',     from: 'PSL' },
  { name: 'CAMILA S.',    from: 'SUA' },
  { name: 'DIEGO M.',     from: 'MIA' },
  { name: 'NICO A.',      from: 'JEN' },
  { name: 'EMILIA C.',    from: 'VRB' },
];
const CODES = ['PSL', 'FPR', 'SUA', 'MIA', 'JEN', 'VRB'];

// Ciudades reconocidas → código estilo aeropuerto de 3 letras (mismos códigos que ya usaba el
// demo para las ciudades más comunes de la zona). Si la ciudad real no matchea nada acá, se usa
// un fallback genérico (primeras letras del nombre) — no pretende ser un código IATA real.
const CITY_CODES = {
  'PORT ST LUCIE': 'PSL', 'PORT SAINT LUCIE': 'PSL', 'PSL': 'PSL',
  'FORT PIERCE': 'FPR', 'FT PIERCE': 'FPR',
  'STUART': 'SUA',
  'MIAMI': 'MIA', 'MIAMI BEACH': 'MIA', 'MIAMI FL': 'MIA',
  'JENSEN BEACH': 'JEN',
  'VERO BEACH': 'VRB',
  'WEST PALM BEACH': 'PBI', 'PALM BEACH': 'PBI', 'PALM BEACH GARDENS': 'PBI',
  'FORT LAUDERDALE': 'FLL', 'FT LAUDERDALE': 'FLL',
  'BOCA RATON': 'BCT',
  'ORLANDO': 'ORL',
  'TAMPA': 'TPA',
  'JACKSONVILLE': 'JAX',
};

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

/* ============ datos reales: CSV → roster ============ */

// Parser CSV mínimo (soporta campos entre comillas con comas adentro, ej. "Miami, FL") — el
// CSV publicado por Google Sheets sí puede traer eso en la columna city.
function _parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || r[0] !== '');
}

// FALLBACK_FROM: cuando el ticket no trae ciudad cargada (~688 de 784 hoy), en vez de dejar
// la columna en blanco se muestra esto — genérico, no inventa una ciudad puntual.
const FALLBACK_FROM = 'USA';

function _cityCode(city) {
  const clean = (city || '').trim().toUpperCase().replace(/[^A-Z ]/g, '').trim();
  if (!clean) return FALLBACK_FROM;
  if (CITY_CODES[clean]) return CITY_CODES[clean];
  return clean.replace(/\s+/g, '').slice(0, 3);
}

// Fisher-Yates in-place — usado para que el roster real se vea "surtido" en vez de siempre en
// el mismo orden de compra (ver PRIORIDAD arriba). No muta el array recibido.
function _shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Trae y parsea el roster real (founderNumber, displayName, city) del CSV publicado. Devuelve
// null ante cualquier problema (sin URL configurada, red caída, CSV vacío/movido) — nunca
// rompe el bloque, el llamador se queda con el demo en ese caso.
//
// PRIORIDAD (pedido del cliente, 2026-09-01): los founders con ciudad real cargada van
// PRIMERO en el roster (initial fill + cycle), los que caen en FALLBACK_FROM ("USA", sin dato)
// quedan al final — solo se ven si alguien se queda mirando el tablero un buen rato y el ciclo
// llega hasta ahí. Dentro de cada grupo, el orden es ALEATORIO (shuffle) — pedido del cliente
// (29no ajuste, 2026-09-02): que se vea surtido, no siempre los mismos primeros/últimos por
// fecha de compra. Se re-mezcla cada vez que corre fetchFoundersRoster (cada carga del bloque).
async function fetchFoundersRoster() {
  if (!FOUNDERS_CSV_URL) return null;
  try {
    const res = await fetch(FOUNDERS_CSV_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const text = await res.text();
    const rows = _parseCSV(text);
    if (rows.length < 2) return null;
    const header = rows[0].map((h) => h.trim());
    const idx = {
      num: header.indexOf('founderNumber'),
      name: header.indexOf('displayName'),
      city: header.indexOf('city'),
    };
    if (idx.num === -1 || idx.name === -1) return null;
    const entries = rows.slice(1)
      .map((r) => {
        const rawCity = (idx.city > -1 ? r[idx.city] : '').trim();
        return {
          num: parseInt(r[idx.num], 10),
          name: (r[idx.name] || '').trim(),
          from: _cityCode(rawCity),
          hasCity: !!rawCity,
        };
      })
      .filter((e) => e.name && !Number.isNaN(e.num));
    if (!entries.length) return null;
    const withCity = _shuffle(entries.filter((e) => e.hasCity));
    const withoutCity = _shuffle(entries.filter((e) => !e.hasCity));
    return withCity.concat(withoutCity);
  } catch (err) {
    return null;
  }
}

class PSLDeparturesBoard extends HTMLElement {
  connectedCallback() {
    this._reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._timers = new Set();
    this._roster = null;
    this._rosterCursor = 0;
    // estado inicial demo — se pisa apenas resuelve el fetch del roster real (abajo). OJO: el
    // seat aleatorio se asigna en un segundo paso (forEach), no dentro del propio .map() — _randSeat()
    // lee this._entries para no repetir número, así que this._entries ya tiene que existir como
    // array antes de llamarlo (si no, "Cannot read properties of undefined (reading 'some')").
    this._entries = SEED.map((e) => ({ num: 0, ...e }));
    this._entries.forEach((e) => { e.num = this._randSeat(); });
    this._filled = false;
    this._renderSkeleton();
    this._startClock();

    fetchFoundersRoster().then((roster) => {
      if (!roster || !roster.length) return;
      this._roster = roster;
      this._entries = roster.slice(0, ROWS).map((e) => ({ ...e }));
      this._rosterCursor = Math.min(ROWS, roster.length);
      if (this._filled) {
        // el board ya se había llenado con demo (el fetch tardó más que el arranque) —
        // se re-renderiza con los datos reales apenas llegan.
        this._entries.forEach((e, i) => { e.status = i === 0 ? 'JUST NOW' : 'ON BOARD'; });
        this._rowsEls.forEach((rowEl, i) => this._setRow(rowEl, this._entries[i], true, i));
      }
    });

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

  // asiento aleatorio de 4 dígitos, sin duplicar los visibles — SOLO para el estado demo (sin
  // datos reales todavía). Con roster real, el número es el founderNumber real, nunca random.
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
      <div class="db" role="group" aria-label="Founding members boarding — live departures board">
        <div class="db__head">
          <span class="db__head-title"><span class="db__dot" aria-hidden="true"></span>Now boarding · Founding class 2027</span>
          <span class="db__head-right">
            <span class="db__flight">Flight PSL·2027</span>
            <span class="db__clock tnum"></span>
          </span>
        </div>
        <div class="db__cols" aria-hidden="true">${cols}</div>
        <div class="db__rows">${rows}</div>
        <a class="db__row db__row--ghost" href="/joinus/#plans" aria-label="Claim your founding number">
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

  // próximo pasajero a ingresar al tablero: del roster real (cicla infinito, sin repetir el
  // orden — cuando llega al final vuelve a arrancar) si hay datos reales cargados, o demo
  // random como fallback si todavía no llegaron / no hay CSV configurado.
  _nextFounder() {
    if (this._roster && this._roster.length) {
      const e = this._roster[this._rosterCursor % this._roster.length];
      this._rosterCursor += 1;
      return { num: e.num, name: e.name, from: e.from };
    }
    return {
      num: this._randSeat(),
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      from: CODES[Math.floor(Math.random() * CODES.length)],
    };
  }

  _startJoins() {
    const join = () => {
      this._entries.unshift(this._nextFounder());
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
