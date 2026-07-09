/**
 * <psl-founder-wall></psl-founder-wall>
 *
 * 🟦 A medida — lista de fundadores en vivo. Card blanca con header (contador vivo) + filas
 * (#num, nombre, ciudad) + footer "last joined". Hoy se usa en Sumate (S04), con búsqueda por número.
 *
 * Cómo funciona:
 * - Cada nuevo ingreso entra arriba con slide/rise (psl-rise) + highlight teal, luego se integra.
 * - El contador global sube con el ingreso.
 * - "Last joined Xmin ago" como prueba de actividad reciente.
 * - Muro público: nombre + número + ciudad. Sin email ni datos sensibles.
 *
 * HANDOFF (WP): datos demo + simulación de ingresos (sin backend). Para buscar un número fuera de
 * la ventana cargada: GET /api/founders?number=… . Contrato general: ver live-counter.config.js.
 */
const NAME_POOL = ['Sofía L.', 'Mateo F.', 'Julieta V.', 'Thiago B.', 'Emilia C.', 'Benjamín R.', 'Renata D.', 'Bruno M.', 'Antonella P.', 'Facundo T.', 'Isabella N.', 'Santiago G.'];
const CITY_POOL = ['Port St. Lucie, FL', 'Fort Pierce, FL', 'Stuart, FL', 'Miami, FL', 'Jensen Beach, FL', 'Vero Beach, FL'];

class PSLFounderWall extends HTMLElement {
  connectedCallback() {
    this._maxVisible = Number(this.getAttribute('max-visible') || 6);
    this._searchable = this.hasAttribute('searchable');  // muro completo (Sumate S04): buscar por número
    // Fila fantasma "vos" + ping de ubicación: features de Home, GATEADAS por el atributo ghost-number.
    // Sumate reusa el muro con "searchable" y SIN ghost-number → estas features no se activan allí.
    this._ghostNumber = this.getAttribute('ghost-number');
    this._total = 1249;
    this._secsAgo = 42;
    this._entries = this._seed();
    this._render();
    this._start();
  }

  disconnectedCallback() {
    clearInterval(this._joinHandle);
    clearInterval(this._tickHandle);
  }

  _seed() {
    // primeras filas nombradas (reconocibles) + relleno hasta max-visible con el pool
    const named = [
      { num: 1249, name: 'Valentina G.', city: 'Port St. Lucie, FL' },
      { num: 1248, name: 'Marco R.', city: 'Fort Pierce, FL' },
      { num: 1247, name: 'Lucas P.', city: 'Port St. Lucie, FL' },
      { num: 1246, name: 'Camila S.', city: 'Stuart, FL' },
      { num: 1245, name: 'Diego M.', city: 'Miami, FL' },
      { num: 1244, name: 'Nico A.', city: 'Jensen Beach, FL' },
    ];
    const out = [...named];
    let n = named[named.length - 1].num - 1;
    while (out.length < this._maxVisible) {
      out.push({
        num: n,
        name: NAME_POOL[n % NAME_POOL.length],
        city: CITY_POOL[n % CITY_POOL.length],
      });
      n -= 1;
    }
    return out; // orden descendente (más nuevo primero)
  }

  _render() {
    this.innerHTML = `
      <div class="fwall${this._searchable ? ' fwall--full' : ''}">
        <div class="fwall__head">
          <div class="fwall__head-title">
            <span class="fwall__pulse" aria-hidden="true"></span>
            <span>Founders joining right now</span>
          </div>
          <span class="fwall__count tnum"></span>
        </div>
        ${this._searchable ? `
          <div class="fwall__search">
            <input class="fwall__search-input" type="search" inputmode="numeric"
              placeholder="Find your founder number…" aria-label="Search by founder number" />
          </div>` : ''}
        <ul class="fwall__list"></ul>
        <p class="fwall__empty" hidden>No founder with that number is loaded here yet.</p>
        ${this._ghostNumber ? `
        <div class="fwall__ghost" data-founder-ghost>
          <span class="fwall__row-left">
            <span class="fwall__num tnum">#${this._ghostNumber}</span>
            <span class="fwall__ghost-name">You're next</span>
          </span>
          <span class="fwall__ghost-cue">Join</span>
        </div>` : ''}
        <div class="fwall__foot"><span class="fwall__foot-label">LAST JOINED</span> <span class="fwall__ago"></span></div>
      </div>
    `;
    this._countEl = this.querySelector('.fwall__count');
    this._listEl = this.querySelector('.fwall__list');
    this._agoEl = this.querySelector('.fwall__ago');
    this._countEl.textContent = this._total.toLocaleString('en-US');
    // _appendRow prepend-ea; iteramos en reversa para que el número más alto quede arriba
    [...this._entries].reverse().forEach((e) => this._appendRow(e, false));
    this._agoEl.textContent = this._fmtAgo(this._secsAgo);

    if (this._searchable) {
      this._emptyEl = this.querySelector('.fwall__empty');
      this.querySelector('.fwall__search-input').addEventListener('input', (e) => this._filter(e.target.value));
    }
  }

  // Filtra las filas cargadas por número. NOTA: en producción, buscar un número que NO esté en la
  // ventana visible debe consultar la API (GET /api/founders?number=…) — acá solo filtra lo cargado.
  _filter(query) {
    const q = query.trim().replace(/[^0-9]/g, '');
    const rows = [...this._listEl.querySelectorAll('.fwall__row')];
    let anyVisible = false;
    rows.forEach((row) => {
      const num = row.querySelector('.fwall__num').textContent.replace('#', '');
      const match = q === '' || num.includes(q);
      row.hidden = !match;
      if (match) anyVisible = true;
    });
    if (this._emptyEl) this._emptyEl.hidden = anyVisible || q === '';
  }

  _appendRow(entry, animate) {
    const li = document.createElement('li');
    li.className = 'fwall__row';
    if (animate) li.classList.add('fwall__row--enter');
    li.innerHTML = `
      <span class="fwall__row-left">
        <span class="fwall__num tnum">#${entry.num}</span>
        <span class="fwall__name">${entry.name}</span>
      </span>
      <span class="fwall__city">${entry.city}</span>
    `;
    this._listEl.prepend(li);
    while (this._listEl.children.length > this._maxVisible) {
      this._listEl.lastElementChild.remove();
    }
    if (animate) {
      li.classList.add('fwall__row--highlight');
      setTimeout(() => li.classList.remove('fwall__row--highlight'), 2500);
      // Ping de ubicación (aqua) junto a la ciudad del ingreso — solo Home (gateado por ghost-number).
      if (this._ghostNumber) {
        const cityEl = li.querySelector('.fwall__city');
        const pin = document.createElement('span');
        pin.className = 'fwall__pin';
        pin.setAttribute('aria-hidden', 'true');
        cityEl.prepend(pin);
        setTimeout(() => pin.remove(), 2500);
      }
    }
  }

  _start() {
    this._tickHandle = setInterval(() => {
      this._secsAgo += 5;
      this._agoEl.textContent = this._fmtAgo(this._secsAgo);
    }, 5000);
    this._joinHandle = setInterval(() => {
      this._total += 1;
      const entry = {
        num: this._total,
        name: NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)],
        city: CITY_POOL[Math.floor(Math.random() * CITY_POOL.length)],
      };
      this._appendRow(entry, true);
      this._secsAgo = 0;
      this._agoEl.textContent = this._fmtAgo(0);
      this._countEl.textContent = this._total.toLocaleString('en-US');
      this._countEl.classList.remove('fwall__count--bump');
      void this._countEl.offsetWidth;
      this._countEl.classList.add('fwall__count--bump');
    }, 8000);
  }

  _fmtAgo(s) {
    if (s < 60) return 'just now';
    return `${Math.floor(s / 60)} min ago`;
  }
}

customElements.define('psl-founder-wall', PSLFounderWall);

export { PSLFounderWall };
