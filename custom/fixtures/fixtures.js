/**
 * <psl-fixtures></psl-fixtures>
 *
 * 🟦 A medida — resumen de calendario/fixture (Home, después del bloque Proof).
 * Strip horizontal de partidos: resultados a la izquierda, próximos a la derecha, el próximo
 * partido destacado. Flechas ‹ › (+ swipe en mobile) para recorrer la línea de tiempo.
 * Muestra el EQUIPO RESERVA (que ya compite en la USL Academy League) + una tarjeta final
 * "First whistle 2027" para el debut del primer equipo — coherente con "la prueba vence al adjetivo".
 *
 * Bilingüe: lee document.documentElement.lang; re-render en 'psl:langchange'.
 *
 * ESTADO ACTUAL: datos demo con `status` explícito (final|next|upcoming) para no depender del reloj
 * del navegador. CONTRATO real (a implementar en WordPress):
 *   GET /api/fixtures?team=reserve -> [
 *     { id, competition, kickoff: ISO8601, venue,
 *       home: { name, abbr, crest }, away: { name, abbr, crest },
 *       status: "final"|"scheduled"|"live", score: [h, a] | null }
 *   ]
 *   El "próximo" se calcula por kickoff vs ahora; los escudos de rivales vienen del feed
 *   (SportsEngine/USL) o se suben como assets. Acá los rivales usan un placeholder con iniciales.
 */
const L = (en, es) => (document.documentElement.lang === 'es' ? es : en);

const PSL = { name: 'PSL Reserve', nameEs: 'PSL Reserva', abbr: 'PSL', psl: true };

const MATCHES = [
  { comp: 'USL Academy League', dateEn: 'Sat · Jun 14', dateEs: 'Sáb · 14 jun', time: '',
    venue: 'Treasure Coast Stadium', home: PSL, away: { name: 'Tampa Bay U23', abbr: 'TB' },
    status: 'final', score: [2, 1] },
  { comp: 'USL Academy League', dateEn: 'Sun · Jun 28', dateEs: 'Dom · 28 jun', time: '',
    venue: 'Miami, FL', home: { name: 'Miami United U23', abbr: 'MIA' }, away: PSL,
    status: 'final', score: [1, 1] },
  { comp: 'USL Academy League', dateEn: 'Sat · Jul 12', dateEs: 'Sáb · 12 jul', time: '7:00 PM',
    venue: 'Treasure Coast Stadium', home: PSL, away: { name: 'Orlando City U23', abbr: 'ORL' },
    status: 'next' },
  { comp: 'USL Academy League', dateEn: 'Sat · Jul 26', dateEs: 'Sáb · 26 jul', time: '6:30 PM',
    venue: 'Fort Lauderdale, FL', home: { name: 'Fort Lauderdale U23', abbr: 'FTL' }, away: PSL,
    status: 'upcoming' },
  { comp: 'USL Academy League', dateEn: 'Sat · Aug 9', dateEs: 'Sáb · 9 ago', time: '7:00 PM',
    venue: 'Treasure Coast Stadium', home: PSL, away: { name: 'Jacksonville U23', abbr: 'JAX' },
    status: 'upcoming' },
];

class PSLFixtures extends HTMLElement {
  connectedCallback() {
    this._render();
    this._onLang = () => this._render();
    document.addEventListener('psl:langchange', this._onLang);
  }

  disconnectedCallback() {
    document.removeEventListener('psl:langchange', this._onLang);
  }

  _teamName(t) {
    return t.psl ? L(t.name, t.nameEs) : t.name;
  }

  // W/L/D del PSL en un partido finalizado
  _pslResult(m) {
    const pslHome = !!m.home.psl;
    const [h, a] = m.score;
    const pf = pslHome ? h : a;
    const pa = pslHome ? a : h;
    if (pf > pa) return { k: 'w', label: L('W', 'G') };
    if (pf < pa) return { k: 'l', label: L('L', 'P') };
    return { k: 'd', label: L('D', 'E') };
  }

  _crest(t) {
    if (t.psl) {
      return `<img class="fx__crest fx__crest--psl" src="/assets/brand/crest-black.png" alt="" width="26" height="28" />`;
    }
    return `<span class="fx__crest fx__crest--ph" aria-hidden="true">${t.abbr}</span>`;
  }

  _teamRow(t, score) {
    return `
      <div class="fx__row${t.psl ? ' is-psl' : ''}">
        ${this._crest(t)}
        <span class="fx__tname">${this._teamName(t)}</span>
        ${score != null ? `<span class="fx__score">${score}</span>` : ''}
      </div>`;
  }

  _card(m) {
    const isFinal = m.status === 'final';
    const isNext = m.status === 'next';
    const status = isFinal
      ? `<span class="fx__ft">${L('Full time', 'Finalizado')}</span>`
      : `<span class="fx__time">${m.time}</span>`;
    const result = isFinal ? this._pslResult(m) : null;
    return `
      <article class="fx__card${isNext ? ' fx__card--next' : ''}${isFinal ? ' fx__card--final' : ''}">
        <div class="fx__top">
          <span class="fx__comp">${m.comp}</span>
          ${isNext ? `<span class="fx__badge">${L('Next', 'Próximo')}</span>` : ''}
          ${result ? `<span class="fx__result fx__result--${result.k}">${result.label}</span>` : ''}
        </div>
        <span class="fx__date">${L(m.dateEn, m.dateEs)}</span>
        <div class="fx__match">
          ${this._teamRow(m.home, isFinal ? m.score[0] : null)}
          ${this._teamRow(m.away, isFinal ? m.score[1] : null)}
        </div>
        <div class="fx__foot">
          <span class="fx__venue">${m.venue}</span>
          ${status}
        </div>
      </article>`;
  }

  _debutCard() {
    return `
      <article class="fx__card fx__card--debut" aria-label="First team debut 2027">
        <span class="fx__comp fx__comp--teal">USL League One</span>
        <span class="fx__debut-year">2027</span>
        <span class="fx__debut-title">${L('First whistle', 'Primer silbato')}</span>
        <span class="fx__debut-note">${L('First team debut — the first pro match in the city.', 'Debut del primer equipo — el primer partido profesional de la ciudad.')}</span>
      </article>`;
  }

  _render() {
    this.innerHTML = `
      <div class="fx">
        <div class="fx__controls">
          <button class="fx__arrow" type="button" data-dir="-1" aria-label="${L('Previous matches', 'Partidos anteriores')}">‹</button>
          <button class="fx__arrow" type="button" data-dir="1" aria-label="${L('Next matches', 'Partidos siguientes')}">›</button>
        </div>
        <div class="fx__track">
          ${MATCHES.map((m) => this._card(m)).join('')}
          ${this._debutCard()}
        </div>
      </div>
    `;
    this._track = this.querySelector('.fx__track');
    this.querySelectorAll('.fx__arrow').forEach((btn) => {
      btn.addEventListener('click', () => this._scroll(Number(btn.dataset.dir)));
    });
    // arranca mostrando el próximo partido
    requestAnimationFrame(() => {
      const next = this.querySelector('.fx__card--next');
      if (next) this._track.scrollLeft = next.offsetLeft - this._track.offsetLeft - 8;
    });
  }

  _scroll(dir) {
    const card = this.querySelector('.fx__card');
    const step = card ? card.offsetWidth + 14 : 280;
    this._track.scrollBy({ left: dir * step, behavior: 'smooth' });
  }
}

customElements.define('psl-fixtures', PSLFixtures);

export { PSLFixtures };
