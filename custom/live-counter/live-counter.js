import { LIVE_COUNTER_CONFIG } from './live-counter.config.js?v=6';

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
  }

  disconnectedCallback() {
    clearInterval(this._pollHandle);
    if (this._wideMql && this._applyRelGrid) this._wideMql.removeEventListener('change', this._applyRelGrid);
  }

  // ---- DEMO DATA — reemplazar por fetch(this.config.endpoint) cuando exista el endpoint real ----
  _demoData() {
    return {
      founders: 1248,
      deposits2027: 312,
      founderWindow: 'Closes 2027',
      lastJoinedSecondsAgo: 720,
      monthlyReach: 18400,
      depositsCaptured: 46800,
      founderGrowthPercent: 23,
      firstWhistle: '2027',
      // días hasta el primer silbato (2027-03-01) — cuenta viva; el count-up anima 0 -> valor
      daysToWhistle: Math.max(0, Math.ceil((new Date('2027-03-01T00:00:00') - new Date()) / 86400000)),
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

  _poll() {
    this._pollHandle = setInterval(() => {
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
        ? '<span class="live-counter__rise" aria-label="on the rise"><svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M8 2 L13.5 8.5 H10 V14 H6 V8.5 H2.5 Z"/></svg></span>'
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
  _observeReveal() {
    const maybe = () => {
      if (this._countUpDone) return;
      const r = this.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.85 && r.bottom > 0) {
        this._countUpDone = true;
        window.removeEventListener('scroll', maybe);
        this._runCountUps();
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
    this.config.metrics.filter((m) => this._isCountUp(m)).forEach((m) => {
      const cell = this._metricsEl.querySelector(`[data-key="${m.key}"] .live-counter__value`);
      const target = Number(this._data[m.key]) || 0;
      if (reduce) { cell.textContent = this._fmtInt(target); return; }
      const DURATION = 1200;
      const t0 = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const t = Math.min((now - t0) / DURATION, 1);
        cell.textContent = this._fmtInt(target * easeOut(t));
        if (t < 1) requestAnimationFrame(tick);
        else cell.textContent = this._fmtInt(target);
      };
      requestAnimationFrame(tick);
    });
  }

  // Update en vivo (polling): refleja incrementos.
  _update() {
    this.config.metrics.forEach((m) => {
      const cell = this._metricsEl.querySelector(`[data-key="${m.key}"] .live-counter__value`);
      // durante/antes del count-up inicial no pisar el valor animado de las métricas enteras
      if (this._isCountUp(m) && !this._countUpDone) return;
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
