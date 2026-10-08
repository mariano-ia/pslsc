import { LIVE_COUNTER_CONFIG } from './live-counter.config.js?v=8';

// Founders / Ticket Deposits en vivo (bloque 02-stats, Home) — 2026-09-01.
// Fuente real: Vivenu (evento "Founding Crew", ticket type "Founding Crew Deposits", $35 --
// hoy founders y deposits2027 son el MISMO producto, ver nota en el propio Sheet) leido por un
// Google Apps Script (corre cada 1h, guarda la key de Vivenu en sus Script Properties, nunca
// expuesta aca) que escribe el total en una pestaña "Resumen" de un Google Sheet, publicada a
// la web en CSV. Esta URL es publica pero de solo lectura y sin datos personales (2 numeros
// nada mas) -- ver docs/ o memoria del proyecto para el detalle de la Fase 1/Fase 2.
const LIVE_STATS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vREtGNg5ISHgY2GaYO2H8ln0kud89zDYgyQtsr-EIfWQsWdfcACZzJs6ruSesTCAGFmiqVdfr0SxSlY/pub?gid=424190757&single=true&output=csv';
// El Sheet se actualiza solo 1 vez por hora (trigger del Apps Script) -- no tiene sentido pedirlo
// mas seguido que eso; se throttlea el fetch real a este intervalo minimo, aunque el poll visual
// del componente (config.updateFrequencyMs) siga corriendo mas rapido para otras variantes.
const LIVE_STATS_MIN_INTERVAL_MS = 2 * 60 * 1000;

// Pide el CSV publicado y lo parsea a { founders: N, deposits2027: N, ... }. Formato esperado,
// una fila por metrica, sin encabezado: "label,value,updatedAt" (ej. "founders,853,9/1/2026").
// Devuelve null ante cualquier falla (red, CORS, Sheet despublicado) -- el caller debe degradar
// con gracia a los datos demo, nunca romper el render del bloque.
async function fetchLiveStats() {
  try {
    const res = await fetch(LIVE_STATS_CSV_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const text = await res.text();
    const out = {};
    text.trim().split('\n').forEach((line) => {
      const [label, value] = line.split(',');
      if (!label) return;
      const n = Number(value);
      if (!Number.isNaN(n)) out[label.trim()] = n;
    });
    return out;
  } catch (e) {
    console.warn('psl-live-counter: no se pudo leer el Sheet de stats en vivo', e);
    return null;
  }
}

/**
 * <psl-live-counter variant="stats|fan|reservation|sponsor"></psl-live-counter>
 *
 * 🟦 A medida — se usa en la Home (bloque 02, variant="stats") y en Partners (P04, variant="sponsor").
 * Un solo componente reutilizado con distinta config (ver live-counter.config.js), no piezas separadas.
 *
 * Criterios de diseño:
 * - tabular-nums (token global .tnum, ver tokens.css) para que los números no salten
 * - máx 4 métricas; "last joined" como prueba de actividad honesta
 * - números exactos, nunca redondeados con "+"
 * - highlight+fade en los updates para que se note que está vivo
 * - mismo dato, distinto framing por variante (fan vs sponsor)
 *
 * HANDOFF (WP): sin backend todavía — usa datos demo + polling simulado. El contrato de API real
 * está en live-counter.config.js. Reemplazar _demoData() por fetch(this.config.endpoint).
 */
class PSLLiveCounter extends HTMLElement {
  connectedCallback() {
    this.variant = this.getAttribute('variant') || 'stats';
    this.config = LIVE_COUNTER_CONFIG[this.variant];
    if (!this.config) {
      console.warn(`psl-live-counter: variante desconocida "${this.variant}"`);
      return;
    }
    this._data = this._demoData();
    this._render();
    this._poll();
    // Primer fetch real apenas conecta el componente -- no hace falta esperar al primer tick
    // del poll (8s stats / 30s sponsor). "founders" tiene fuente real (Sheet/Vivenu) en las
    // variantes stats (Home) y sponsor (Partners) -- ahi se mergea sobre el resto de metricas
    // demo (deposits2027/monthlyReach/monthlyImpressions/depositsCaptured siguen en demo hasta
    // tener su propia fuente -- depositsCaptured etc. bloqueados por Marce, ver pendiente 9).
    // fan/reservation quedan 100% demo, no se tocan.
    // Se guarda la promesa: el count-up inicial la espera (con tope) para contar directo hasta el
    // numero real del Sheet y no hasta el de respaldo de _demoData() -- ver _observeReveal().
    if (this.variant === 'stats' || this.variant === 'sponsor') this._liveReady = this._refreshLiveStats();
  }

  disconnectedCallback() {
    clearInterval(this._pollHandle);
    if (this._wideMql && this._applyRelGrid) this._wideMql.removeEventListener('change', this._applyRelGrid);
  }

  // ---- DEMO DATA — reemplazar por fetch(this.config.endpoint) cuando exista el endpoint real ----
  _demoData() {
    return {
      // Respaldo: SOLO se ve si el Sheet no responde. Ultimo valor real conocido (Sheet, 2026-09-28).
      founders: 974,
      deposits2027: 312,
      founderWindow: 'Closes 2027',
      lastJoinedSecondsAgo: 720,
      monthlyReach: 240000,
      monthlyImpressions: 1100000,
      depositsCaptured: 46800,
      firstWhistle: '2027',
      // días hasta el primer silbato (2027-03-01) — cuenta viva; el count-up anima 0 -> valor
      daysToWhistle: Math.max(0, Math.ceil((new Date('2027-03-01T00:00:00') - new Date()) / 86400000)),
      // días desde el arranque del proyecto (2025-11-04) — cuenta viva, mismo patrón que daysToWhistle.
      // Fecha confirmada por el cliente el 2026-09-04 (antes placeholder fijo en 100).
      // OJO: la home muestra "Est. 2025" en el bloque 01 (03-project.html) — esa fecha refiere
      // a la fundación/historia del club, no al arranque de este proyecto/sitio; no son la misma cosa.
      daysInTheMaking: Math.max(0, Math.floor((new Date() - new Date('2025-11-04T00:00:00')) / 86400000)),
      league: 'USL',
      updatedAt: new Date().toISOString(),
    };
  }

  _simulateIncrement() {
    // Solo para demo en ausencia de backend — simula que se suma 1 fundador esporádicamente.
    // Devuelve true cuando efectivamente se sumó un fundador (lo usa el toast "+1" de la variante stats).
    if (Math.random() < 0.5) {
      this._data.founders += 1;
      this._data.lastJoinedSecondsAgo = 0;
      this._data.updatedAt = new Date().toISOString();
      return true;
    }
    this._data.lastJoinedSecondsAgo += this.config.updateFrequencyMs / 1000;
    return false;
  }

  // Trae founders/deposits2027 reales del Sheet publicado y los mergea en this._data --
  // nunca pisa las demas metricas (monthlyReach, depositsCaptured, etc.), esas siguen en demo
  // hasta que tengan su propia fuente. Throttleado a LIVE_STATS_MIN_INTERVAL_MS: llamarlo mas
  // seguido que eso es un no-op silencioso.
  async _refreshLiveStats() {
    const nowMs = Date.now();
    if (this._lastLiveFetchAt && (nowMs - this._lastLiveFetchAt) < LIVE_STATS_MIN_INTERVAL_MS) return;
    this._lastLiveFetchAt = nowMs;

    const live = await fetchLiveStats();
    if (!live) return;
    // El primer dato real reemplaza al de respaldo: eso no es "se sumo un fundador", no va toast.
    const firstLive = !this._hadLive;
    this._hadLive = true;

    const prevFounders = Number(this._data.founders) || 0;
    let changed = false;
    ['founders', 'deposits2027'].forEach((key) => {
      if (typeof live[key] === 'number' && live[key] !== this._data[key]) {
        this._data[key] = live[key];
        changed = true;
      }
    });
    this._data.updatedAt = new Date().toISOString();
    if (!changed) return;
    // Si el count-up inicial todavia no corrio, alcanza con haber actualizado this._data --
    // _runCountUps() va a leer el valor real cuando el bloque entre en viewport.
    if (!this._countUpDone) return;
    this._update();
    if (!firstLive && this.variant === 'stats' && Number(this._data.founders) > prevFounders) this._showFounderToast();
  }

  _poll() {
    this._pollHandle = setInterval(() => {
      if (this.variant === 'stats' || this.variant === 'sponsor') {
        // Variantes conectadas al Sheet/Vivenu de verdad (founders): nada de incremento
        // simulado ahi, solo re-consultar el Sheet (throttleado adentro de _refreshLiveStats
        // -- este tick puede ser un no-op).
        this._refreshLiveStats();
        return;
      }
      const founderAdded = this._simulateIncrement();
      this._update();
      // Toast "+1" efímero — SOLO variante stats y una vez que el count-up inicial terminó.
      if (founderAdded && this.variant === 'stats' && this._countUpDone) this._showFounderToast();
    }, this.config.updateFrequencyMs);
  }

  // Toast efímero sobre la métrica de fundadores: sube y se desvanece. Solo variante stats.
  // En reduced-motion no se muestra (regla 3). Se autolimpia al terminar la animación.
  _showFounderToast() {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const cell = this._metricsEl.querySelector('[data-key="founders"]');
    if (!cell) return;
    const toast = document.createElement('span');
    toast.className = 'live-counter__toast';
    toast.setAttribute('aria-hidden', 'true');
    toast.textContent = '+1 Founding member';
    cell.appendChild(toast);
    const cleanup = () => toast.remove();
    toast.addEventListener('animationend', cleanup);
    setTimeout(cleanup, 2200); // fallback si no dispara animationend
  }

  _render() {
    // La línea "Updated in real time" es opt-in por variante (`showUpdated` en la config).
    // stats (Home) y sponsor (Partners) la tienen apagada por pedido del cliente.
    const updated = !this.config.showUpdated ? '' : `
        <p class="live-counter__updated">
          <span class="live-counter__updated-text">Updated in real time</span>
        </p>`;
    this.innerHTML = `
      <div class="live-counter live-counter--${this.variant}">
        <div class="live-counter__metrics"></div>${updated}
      </div>
    `;
    this._metricsEl = this.querySelector('.live-counter__metrics');
    this.config.metrics.forEach((m) => {
      const cell = document.createElement('div');
      cell.className = 'live-counter__metric';
      cell.dataset.key = m.key;
      // Flecha "en alza" (aqua, apunta arriba) junto al número — SOLO métricas con `rising: true`
      // (fundadores/depósitos en la variante stats). Reemplaza al viejo sparkline de barritas.
      const rise = this.variant === 'stats' && m.rising === true;
      const riseArrow = rise
        ? '<span class="live-counter__rise" role="img" aria-label="on the rise"><svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M8 2 L13.5 8.5 H10 V14 H6 V8.5 H2.5 Z"/></svg></span>'
        : '';
      cell.innerHTML = `
        <div class="live-counter__valrow">
          <div class="live-counter__value tnum${m.accent ? ' live-counter__value--accent' : ''}" data-format="${m.format}"></div>
          ${riseArrow}
        </div>
        <div class="live-counter__label">${m.label}</div>
      `;
      this._metricsEl.appendChild(cell);
    });
    // Si la última métrica es de texto relativo (ej. "12 min ago"), su columna deja de ser 1fr
    // fijo y pasa a "al menos el ancho de su contenido" — así el valor mantiene el mismo tamaño
    // de fuente que sus hermanos sin partirse en dos líneas ni desbordar.
    // En DESKTOP (grid de N columnas) la columna del relative-time toma el ancho de su contenido.
    // En tablet/mobile las media queries colapsan a 2/1 col → NO pisar con inline (ganaría y rompería
    // el responsive, desbordando "12 min ago"). Re-evaluar al cruzar el breakpoint.
    const lastMetric = this.config.metrics[this.config.metrics.length - 1];
    if (lastMetric && lastMetric.format === 'relative-time') {
      const n = this.config.metrics.length;
      this._wideMql = window.matchMedia('(min-width: 781px)');
      this._applyRelGrid = () => {
        this._metricsEl.style.gridTemplateColumns = this._wideMql.matches
          ? `repeat(${n - 1}, 1fr) minmax(max-content, 1fr)` : '';
      };
      this._applyRelGrid();
      this._wideMql.addEventListener('change', this._applyRelGrid);
    }
    if (this.config.note) {
      const note = document.createElement('p');
      note.className = 'live-counter__note';
      note.textContent = this.config.note;
      this.querySelector('.live-counter').appendChild(note);
    }

    // Render inicial: las métricas enteras arrancan en 0 y hacen count-up al entrar en viewport;
    // el resto se muestra directo.
    this._reveal(true);
    this._observeReveal();
  }

  // separación de mils sin decimales (los enteros nunca llevan decimales)
  _fmtInt(n) { return Math.round(n).toLocaleString('en-US'); }

  _isCountUp(m) { return m.format === 'integer'; }

  _reveal(initial = false) {
    this.config.metrics.forEach((m) => {
      const cell = this._metricsEl.querySelector(`[data-key="${m.key}"] .live-counter__value`);
      if (initial && this._isCountUp(m)) {
        cell.textContent = '0';   // parte de 0; el count-up lo lleva al valor
        return;
      }
      const formatted = this._format(m);
      if (initial || cell.textContent === '') {
        cell.textContent = formatted;
        return;
      }
      if (cell.textContent !== formatted) this._animateChange(cell, formatted);
    });
  }

  // Dispara el count-up cuando el componente entra en viewport (una sola vez).
  // Basado en getBoundingClientRect + scroll/load, sin depender de IntersectionObserver.
  //
  // Bug 2026-09-28 (Home mostraba 848 y recien ~2 min despues el 974 del Sheet): en la Home el bloque
  // ya esta en pantalla al cargar, asi que el count-up arrancaba ANTES de que volviera el Sheet y
  // contaba hasta el valor de respaldo. Cuando el Sheet llegaba en el medio de la animacion, el
  // ultimo cuadro volvia a escribir el valor viejo encima, y el proximo fetch recien salia a los
  // 2 min (LIVE_STATS_MIN_INTERVAL_MS). En Partners no pasaba porque el bloque esta mas abajo y
  // cuando se llega scrolleando el Sheet ya respondio. Arreglo: (1) el count-up espera el primer
  // fetch, con tope de LIVE_WAIT_MS para no quedar en blanco si Google tarda o esta caido;
  // (2) _runCountUps() lee el objetivo en cada cuadro, asi que si el dato llega igual en el medio,
  // termina en el valor nuevo.
  _observeReveal() {
    const LIVE_WAIT_MS = 1500;
    const maybe = () => {
      if (this._revealStarted) return;
      const r = this.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.85 && r.bottom > 0) {
        this._revealStarted = true;
        window.removeEventListener('scroll', maybe);
        const wait = this._liveReady
          ? Promise.race([this._liveReady, new Promise((res) => setTimeout(res, LIVE_WAIT_MS))])
          : Promise.resolve();
        wait.catch(() => {}).then(() => {
          this._countUpDone = true;
          this._runCountUps();
        });
      }
    };
    this._maybeReveal = maybe;
    window.addEventListener('scroll', maybe, { passive: true });
    requestAnimationFrame(maybe);   // chequeo inicial por si ya está en viewport
  }

  // Anima 0 -> valor para cada métrica entera. Rápido, easeOut. tabular-nums + alineado a la
  // izquierda evitan cualquier salto de layout mientras crece la cantidad de dígitos.
  _runCountUps() {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const metrics = this.config.metrics.filter((m) => this._isCountUp(m));
    let pending = metrics.length;
    const done = () => { pending -= 1; if (pending <= 0) this._countingUp = false; };
    this._countingUp = pending > 0;
    metrics.forEach((m) => {
      const cell = this._metricsEl.querySelector(`[data-key="${m.key}"] .live-counter__value`);
      // el objetivo se relee en cada cuadro: si el Sheet responde en el medio, termina en ese valor
      const target = () => Number(this._data[m.key]) || 0;
      if (reduce) { cell.textContent = this._fmtInt(target()); done(); return; }
      const DURATION = 1200;
      const t0 = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const t = Math.min((now - t0) / DURATION, 1);
        cell.textContent = this._fmtInt(target() * easeOut(t));
        if (t < 1) requestAnimationFrame(tick);
        else { cell.textContent = this._fmtInt(target()); done(); }
      };
      requestAnimationFrame(tick);
    });
  }

  // Update en vivo (polling): refleja incrementos.
  _update() {
    this.config.metrics.forEach((m) => {
      const cell = this._metricsEl.querySelector(`[data-key="${m.key}"] .live-counter__value`);
      // durante/antes del count-up inicial no pisar el valor animado de las métricas enteras
      if (this._isCountUp(m) && (!this._countUpDone || this._countingUp)) return;
      const formatted = this._format(m);
      if (cell.textContent === formatted) return;
      // Métricas con count-up: actualizar el número en silencio (que cambie ES la prueba de "vivo";
      // el flash teal se percibía como glitch al cargar). El resto sí usa highlight+fade.
      if (this._isCountUp(m)) cell.textContent = formatted;
      else this._animateChange(cell, formatted);
    });
  }

  _animateChange(cell, newValue) {
    // Updates espaciados (>=30s en este config) -> highlight+fade, no odometer continuo.
    // (odometer reservado para updates por WebSocket cada segundo-minuto, fuera del alcance demo).
    cell.textContent = newValue;
    cell.classList.remove('live-counter__value--highlight');
    void cell.offsetWidth; // reflow para reiniciar la animación
    cell.classList.add('live-counter__value--highlight');
    setTimeout(() => cell.classList.remove('live-counter__value--highlight'), 1500);
  }

  // Cada métrica formatea su propio valor leyendo data[m.key] (o un derivado), nunca un campo fijo.
  _format(m) {
    const data = this._data;
    switch (m.format) {
      case 'integer':
        return Number(data[m.key]).toLocaleString('en-US');
      case 'currency':
        return `$${Number(data[m.key]).toLocaleString('en-US')}`;
      case 'growth-percent':
        return `+${data[m.key]}%`;
      case 'relative-time':
        return this._relativeTime(data.lastJoinedSecondsAgo);
      case 'static':
      case 'text':
      default:
        return data[m.key];
    }
  }

  _relativeTime(seconds) {
    if (seconds < 60) return 'Just now';
    const min = Math.floor(seconds / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    return `${hr}h ago`;
  }
}

customElements.define('psl-live-counter', PSLLiveCounter);

export { PSLLiveCounter };
