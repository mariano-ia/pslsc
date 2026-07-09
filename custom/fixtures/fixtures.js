/**
 * <psl-fixtures></psl-fixtures>
 *
 * 🟦 A medida — Matchday (Home). Orden: [First Whistle 2027 FIJO + CTA] → [Próximo partido, fondo
 * turquesa, FIJO] → [strip "next games": próximas fechas, scrolleable con flechas ‹ › + swipe; las
 * que sobran se esconden detrás de una sombra en el borde derecho].
 * Muestra el EQUIPO RESERVA (USL Academy League) camino al debut del primer equipo en 2027.
 *
 * ESTADO ACTUAL: datos demo con `status` explícito (next|upcoming). El countdown del próximo usa el
 * reloj a partir de `kickoff` (ISO). CONTRATO real (WordPress): GET /api/fixtures?team=reserve.
 */
const PSL = { name: 'PSL Reserve', abbr: 'PSL', psl: true };

const MATCHES = [
  { comp: 'USL Academy League', dateEn: 'Sat · Jul 12', time: '7:00 PM',
    venue: 'Treasure Coast Stadium', home: PSL, away: { name: 'Orlando City U23', abbr: 'ORL' },
    status: 'next', kickoff: '2026-07-12' },
  { comp: 'USL Academy League', dateEn: 'Sat · Jul 26', time: '6:30 PM',
    venue: 'Fort Lauderdale, FL', home: { name: 'Fort Lauderdale U23', abbr: 'FTL' }, away: PSL,
    status: 'upcoming' },
  { comp: 'USL Academy League', dateEn: 'Sat · Aug 9', time: '7:00 PM',
    venue: 'Treasure Coast Stadium', home: PSL, away: { name: 'Jacksonville U23', abbr: 'JAX' },
    status: 'upcoming' },
  { comp: 'USL Academy League', dateEn: 'Sat · Aug 23', time: '7:00 PM',
    venue: 'Miami, FL', home: { name: 'Miami United U23', abbr: 'MIA' }, away: PSL,
    status: 'upcoming' },
  { comp: 'USL Academy League', dateEn: 'Sat · Sep 6', time: '6:00 PM',
    venue: 'Treasure Coast Stadium', home: PSL, away: { name: 'Tampa Bay U23', abbr: 'TB' },
    status: 'upcoming' },
  { comp: 'USL Academy League', dateEn: 'Sat · Sep 20', time: '7:00 PM',
    venue: 'Orlando, FL', home: { name: 'Orlando City U23', abbr: 'ORL' }, away: PSL,
    status: 'upcoming' },
];

class PSLFixtures extends HTMLElement {
  connectedCallback() {
    this._render();
  }

  _teamName(t) {
    return t.name;
  }

  _crest(t) {
    if (t.psl) {
      return `<img class="fx__crest fx__crest--psl" src="/assets/brand/crest-black.webp" alt="" width="26" height="28" />`;
    }
    return `<span class="fx__crest fx__crest--ph" aria-hidden="true">${t.abbr}</span>`;
  }

  _teamRow(t) {
    return `
      <div class="fx__row${t.psl ? ' is-psl' : ''}">
        ${this._crest(t)}
        <span class="fx__tname">${this._teamName(t)}</span>
      </div>`;
  }

  // días hasta el kickoff. null si no hay fecha o ya pasó.
  _countdown(m) {
    if (!m.kickoff) return null;
    const days = Math.ceil((new Date(`${m.kickoff}T00:00:00`).getTime() - Date.now()) / 86400000);
    if (days < 0) return null;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }

  // DEBUT 2027 — fijo, primero (el destino: el PRIMER EQUIPO) + CTA
  _debutCard() {
    return `
      <article class="fx__debut" aria-label="First team debut 2027">
        <span class="fx__debut-tag">The first team</span>
        <span class="fx__debut-year tnum">2027</span>
        <span class="fx__debut-title">First whistle</span>
        <span class="fx__debut-note">USL League One debut — the first pro match in the city.</span>
        <a href="sumate.html" class="fx__debut-cta">Become a Founder <span aria-hidden="true">→</span></a>
      </article>`;
  }

  // PRÓXIMO — fijo, segundo, FONDO TURQUESA
  _nextCard(m) {
    const cd = this._countdown(m);
    return `
      <article class="fx__next" aria-label="Next match">
        <div class="fx__next-head">
          <span class="fx__next-tag"><span class="fx__next-dot" aria-hidden="true"></span>Next match</span>
          ${cd ? `<span class="fx__next-cd">${cd}</span>` : ''}
        </div>
        <span class="fx__comp">${m.comp}</span>
        <span class="fx__next-date">${m.dateEn}${m.time ? ` · ${m.time}` : ''}</span>
        <div class="fx__match">
          ${this._teamRow(m.home)}
          <span class="fx__vs" aria-hidden="true">vs</span>
          ${this._teamRow(m.away)}
        </div>
        <div class="fx__foot"><span class="fx__venue">${m.venue}</span></div>
      </article>`;
  }

  // tarjeta del strip "next games" (próxima fecha)
  _card(m) {
    return `
      <article class="fx__card">
        <span class="fx__comp">${m.comp}</span>
        <span class="fx__date">${m.dateEn}</span>
        <div class="fx__match">
          ${this._teamRow(m.home)}
          ${this._teamRow(m.away)}
        </div>
        <div class="fx__foot">
          <span class="fx__venue">${m.venue}</span>
          <span class="fx__time">${m.time}</span>
        </div>
      </article>`;
  }

  _render() {
    const next = MATCHES.find((m) => m.status === 'next');
    // el strip son las PRÓXIMAS fechas (no el "next", que va destacado)
    const upcoming = MATCHES.filter((m) => m.status === 'upcoming');
    this.innerHTML = `
      <div class="fx">
        ${this._debutCard()}
        ${next ? this._nextCard(next) : ''}
        <div class="fx__mid">
          <div class="fx__mid-head">
            <span class="fx__mid-title">Next games</span>
            <div class="fx__controls">
              <button class="fx__arrow" type="button" data-dir="-1" aria-label="Previous">‹</button>
              <button class="fx__arrow" type="button" data-dir="1" aria-label="More games">›</button>
            </div>
          </div>
          <div class="fx__track-wrap">
            <div class="fx__track">
              ${upcoming.map((m) => this._card(m)).join('')}
            </div>
            <!-- línea turquesa recta de 1px donde se esconden las cards -->
            <span class="fx__fade" aria-hidden="true"></span>
          </div>
        </div>
      </div>
    `;
    this._track = this.querySelector('.fx__track');
    this.querySelectorAll('.fx__arrow').forEach((btn) => {
      btn.addEventListener('click', () => this._scroll(Number(btn.dataset.dir)));
    });
  }

  _scroll(dir) {
    const card = this.querySelector('.fx__card');
    const step = card ? card.offsetWidth + 14 : 240;
    this._track.scrollBy({ left: dir * step, behavior: 'smooth' });
  }
}

customElements.define('psl-fixtures', PSLFixtures);

export { PSLFixtures };
