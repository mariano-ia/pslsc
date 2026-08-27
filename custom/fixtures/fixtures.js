/**
 * <psl-fixtures></psl-fixtures>
 *
 * 🟦 A medida — Matchday (Home). Orden: [First Whistle 2027 FIJO + CTA] → [Próximo partido, fondo
 * turquesa, FIJO] → [strip "next games": próximas fechas, scrolleable con flechas ‹ › + swipe; las
 * que sobran se esconden detrás de una sombra en el borde derecho].
 * Muestra el EQUIPO RESERVA (USL Academy League) camino al debut del primer equipo en 2027.
 *
 * ESTADO ACTUAL: fixture REAL (consultado el 2026-08-27). Fuente: calendario del club
 * (portstluciesc.com/events → categoría "Academy Games"), verificado contra el scheduler de la liga
 * (modular11.com/league-schedule/usl-academy → Port St. Lucie SC, U20, división South Florida).
 * La temporada 2026 son 10 fechas y CIERRA el 3 de octubre: las dos que quedan por delante son las
 * de acá abajo, las dos de visitante. No falta cargar nada — después del 3-oct no hay más hasta la
 * temporada que viene, y por eso el strip avisa fin de temporada en vez de prometer fechas nuevas.
 * El "próximo" y el strip se derivan de la fecha (no vienen hardcodeados), así el bloque no muestra
 * un partido ya jugado cuando pase.
 * CONTRATO real (WordPress): GET /api/fixtures?team=reserve.
 */
const SEASON = '2026';
const PSL = { name: 'PSL Reserve', abbr: 'PSL', psl: true };

/* Escudos de los rivales en el repo (`/assets/crests/`, WebP con alpha) — NO se linkean desde el
   sitio del rival: el build los reescribe a ASSET_BASE junto con el resto de los assets. */
const MATCHES = [
  { comp: 'USL Academy League', dateEn: 'Sat · Sep 5', time: '6:00 PM', kickoff: '2026-09-05',
    venue: 'Miami Gardens, FL', venueFull: 'Msgr. Edward Pace HS · Miami Gardens, FL',
    home: { name: 'FC Miami City', abbr: 'MIA', crest: '/assets/crests/fc-miami-city.webp' },
    away: PSL },
  { comp: 'USL Academy League', dateEn: 'Sat · Oct 3', time: '3:00 PM', kickoff: '2026-10-03',
    venue: 'Hollywood, FL', venueFull: 'Dowdy Field · Hollywood, FL',
    home: { name: 'Hollywood FC', abbr: 'HFC', crest: '/assets/crests/hollywood-fc.webp' },
    away: PSL },
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
    if (t.crest) {
      return `<img class="fx__crest fx__crest--club" src="${t.crest}" alt="" width="26" height="28" loading="lazy" />`;
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
        <div class="fx__foot"><span class="fx__venue">${m.venueFull || m.venue}</span></div>
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

  // Última fecha del calendario cargado ("Sat · Oct 3" → "Oct 3"), para el aviso de fin de temporada.
  _lastDate() {
    const last = MATCHES[MATCHES.length - 1];
    return last ? last.dateEn.split(' · ').pop() : '';
  }

  // El "próximo" es la primera fecha que todavía no se jugó; las demás van al strip. Se deriva del
  // reloj para que el bloque no siga anunciando un partido viejo cuando la fecha ya pasó.
  _split() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ahead = MATCHES.filter((m) => new Date(`${m.kickoff}T00:00:00`) >= today);
    return { next: ahead[0] || null, upcoming: ahead.slice(1) };
  }

  _render() {
    const { next, upcoming } = this._split();
    // las flechas sólo tienen sentido si hay más de una card para correr
    const arrows = upcoming.length > 1 ? `
            <div class="fx__controls">
              <button class="fx__arrow" type="button" data-dir="-1" aria-label="Previous">‹</button>
              <button class="fx__arrow" type="button" data-dir="1" aria-label="More games">›</button>
            </div>` : '';
    const track = upcoming.length
      ? `<div class="fx__track">${upcoming.map((m) => this._card(m)).join('')}</div>`
      : `<p class="fx__empty">The ${SEASON} Academy League season closes on ${this._lastDate()}. Next season's fixtures land here.</p>`;
    this.innerHTML = `
      <div class="fx">
        ${this._debutCard()}
        ${next ? this._nextCard(next) : ''}
        <div class="fx__mid">
          <div class="fx__mid-head">
            <span class="fx__mid-title">Next games</span>${arrows}
          </div>
          <div class="fx__track-wrap">
            ${track}
            <!-- línea turquesa recta de 1px donde se esconden las cards -->
            ${upcoming.length > 1 ? '<span class="fx__fade" aria-hidden="true"></span>' : ''}
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
    if (!this._track) return;
    const card = this.querySelector('.fx__card');
    const step = card ? card.offsetWidth + 14 : 240;
    this._track.scrollBy({ left: dir * step, behavior: 'smooth' });
  }
}

customElements.define('psl-fixtures', PSLFixtures);

export { PSLFixtures };
