/**
 * Bloque t01 · Ficha del Head Coach. Lee el mismo estado que el hero y solo pinta si ya está `profile`.
 */
const tcoEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function tcoProfileHTML(p, teamUrl) {
  return `<div class="tco__profile"><div><span class="tco__kicker">${tcoEsc(p.kicker)}</span>
      <h1 class="tco__name">${p.nameLines.map(tcoEsc).join('<br>')}</h1>
      <div class="tco__bio">${p.bio.map((b) => `<p>${tcoEsc(b)}</p>`).join('')}</div>
      ${p.quote ? `<p class="tco__quote">&ldquo;${tcoEsc(p.quote)}&rdquo;${p.quoteDraft ? '<span class="tco__draft">Draft quote</span>' : ''}</p>` : ''}
      <div class="tco__row"><a class="psl-btn cta-primary" href="/joinus/"><span>Get Priority Access</span> <span aria-hidden="true">→</span></a><a class="psl-btn cta-secondary" href="${tcoEsc(teamUrl)}">Meet the staff</a></div>
    </div>
    <div><h2 class="tco__label">Career path</h2>
      <ul class="tco__timeline">${p.career.map((c) => `<li class="${c[2] ? 'is-now' : ''}"><small>${tcoEsc(c[0])}</small>${tcoEsc(c[1])}</li>`).join('')}</ul>
    </div></div>
    <section class="tco__cc" aria-labelledby="tco-cc-title">
      <psl-card class="tco__card" flippable data-tco-card></psl-card>
      <div class="tco__cc-copy"><span class="tco__kicker">Charter Collection</span>
        <h2 class="tco__cc-title" id="tco-cc-title">Card No. 001</h2>
        <p class="tco__cc-lead">The first card in club history. Flip it to see the clues from reveal week.</p>
        <div class="tco__own" data-tco-own></div>
      </div>
    </section>`;
}

// Estado de la carta en la colección de la persona. Hoy vive en este dispositivo (la misma clave que el hero);
// con la etapa 6 lo responde el servidor.
function tcoOwnHTML(el, state) {
  let S = {};
  try { S = JSON.parse(localStorage.getItem('pslsc-charter-001') || '{}'); } catch (err) { /* sin storage */ }
  const collection = el.dataset.ccCollection;
  const hasCollection = collection && !collection.startsWith('__');
  if (S.email) {
    return `<p class="tco__chip is-in"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>In your collection</p>
      ${hasCollection ? `<a class="tco__link" href="${tcoEsc(collection)}">See my collection <span aria-hidden="true">→</span></a>` : ''}`;
  }
  if (state.claimOpen === false) {   // terminó la campaña: el reclamo de la Collector está cerrado
    return '<p class="tco__chip">Not in your collection</p>';
  }
  return `<p class="tco__own-lead">Claim your free Collector Card and Card No. 001 joins your collection.</p>
    <a class="psl-btn cta-secondary" href="${tcoEsc(el.dataset.ccHome)}">Claim your Collector Card</a>`;
}

async function initCoach(root = document) {
  const el = root.querySelector('.tco');
  if (!el) return;
  const src = el.dataset.ccState;
  if (!src || src.startsWith('__')) return;
  try {
    const res = await fetch(src, { cache: 'no-store', headers: { Accept: 'application/json' } });   // cambia por fecha: nunca de caché
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const state = await res.json();
    if (!state.profile) return;
    await customElements.whenDefined('psl-card');
    el.querySelector('[data-tco-profile]').innerHTML = tcoProfileHTML(state.profile, el.dataset.ccTeam);
    el.querySelector('[data-tco-card]').data = state.card;
    el.querySelector('[data-tco-own]').innerHTML = tcoOwnHTML(el, state);
  } catch (err) {
    console.error('[coach] no se pudo leer la ficha', err);
  }
}

export { initCoach };
