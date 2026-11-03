/**
 * Bloque t00 · Soccer Staff. Lee el mismo estado que el hero y, si ya está la ficha, pinta al Head Coach.
 * Antes del viernes el bloque no se publica; si igual se abre, queda en TBA y sin nada de él.
 */
const tmhEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function initSoccerStaff(root = document) {
  const el = root.querySelector('.tmh');
  if (!el) return;
  const src = el.dataset.ccState;
  if (!src || src.startsWith('__')) return;
  let state;
  try {
    const res = await fetch(src, { cache: 'no-store', headers: { Accept: 'application/json' } });   // cambia por fecha: nunca de caché
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state = await res.json();
  } catch (err) {
    console.error('[soccer-staff] no se pudo leer el estado', err);
    return;
  }
  const { profile, card, presentation } = state;
  if (!profile || !presentation) return;

  await customElements.whenDefined('psl-card');
  const country = card.back?.bio?.find(([k]) => k === 'Country')?.[1];
  el.querySelector('[data-tmh-count]').textContent = '1 announced';
  el.querySelector('[data-tmh-coach]').innerHTML = `<article class="tmh__coach">
      <div class="tmh__photo">
        <img class="tmh__person" src="${tmhEsc(presentation.src)}" alt="${tmhEsc(presentation.alt)}" decoding="async">
        <img class="tmh__crest" src="/assets/brand/crest-aqua.webp" alt="">
      </div>
      <div class="tmh__info">
        <p class="tmh__role">Head Coach</p>
        <p class="tmh__first">${tmhEsc(card.first)}</p>
        <h3 class="tmh__last">${tmhEsc(card.last)}</h3>
        ${country ? `<p class="tmh__nat"><span class="tmh__flag" style="background:${tmhEsc(card.flag?.background)}"></span>${tmhEsc(country)}</p>` : ''}
        <p class="tmh__summary">${tmhEsc(profile.summary)}</p>
        <a class="psl-btn cta-primary" href="${tmhEsc(el.dataset.ccCoach)}"><span>Meet the coach</span> <span aria-hidden="true">→</span></a>
      </div>
      <div class="tmh__cardwrap"><psl-card flippable data-tmh-card></psl-card><small>Card ${tmhEsc(card.code)}</small></div>
    </article>`;
  el.querySelector('[data-tmh-card]').data = card;
}

export { initSoccerStaff };
