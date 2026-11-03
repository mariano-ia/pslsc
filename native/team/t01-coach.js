/**
 * Bloque t01 · Ficha del Head Coach. Lee el mismo estado que el hero y solo pinta si ya está `profile`.
 */
const tcoEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function tcoProfileHTML(p, teamUrl) {
  return `<div class="tco__profile"><div><span class="tco__kicker">${tcoEsc(p.kicker)}</span>
      <h1 class="tco__name">${p.nameLines.map(tcoEsc).join('<br>')}</h1>
      <div class="tco__bio">${p.bio.map((b) => `<p>${tcoEsc(b)}</p>`).join('')}</div>
      ${p.quote ? `<p class="tco__quote">&ldquo;${tcoEsc(p.quote)}&rdquo;${p.quoteDraft ? '<span class="tco__draft">Draft quote</span>' : ''}</p>` : ''}
      <div class="tco__row"><a class="psl-btn cta-primary" href="/joinus/"><span>Get Priority Access</span> <span aria-hidden="true">→</span></a><a class="psl-btn cta-secondary" href="${tcoEsc(teamUrl)}">Meet the team</a></div>
    </div>
    <div><div class="tco__label">His card</div>
      <psl-card class="tco__card" flippable data-tco-card></psl-card>
      <div class="tco__label tco__card-label">Career path</div>
      <ul class="tco__timeline">${p.career.map((c) => `<li class="${c[2] ? 'is-now' : ''}"><small>${tcoEsc(c[0])}</small>${tcoEsc(c[1])}</li>`).join('')}</ul>
      <div class="tco__label tco__card-label">Stamps</div>
      <div class="tco__stamps">${p.stamps.map((s) => `<div class="tco__stamp"><span class="tco__stamp-icon">${s.icon}</span><div><b>${tcoEsc(s.word)}</b><p>${tcoEsc(s.text)}</p></div></div>`).join('')}</div>
    </div></div>`;
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
  } catch (err) {
    console.error('[coach] no se pudo leer la ficha', err);
  }
}

export { initCoach };
