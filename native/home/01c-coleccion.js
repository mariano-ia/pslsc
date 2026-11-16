/**
 * Bloque 01c · Presentación del Head Coach (banner debajo de 02-stats, cuando ya no está el hero de campaña).
 * Lee el mismo estado que 01b y arma la presentación con lo revelado: nombre, foto, línea y Card No. 001. Si el estado
 * no llega, o la carta todavía no está revelada, la sección sigue oculta: el bloque nunca se ve roto ni adelanta nada.
 */
async function initColeccionEntry(root = document) {
  const section = root.querySelector('.hce');
  if (!section) return;
  const src = section.dataset.ccState;
  if (!src || src.startsWith('__')) return;

  let state;
  try {
    const res = await fetch(src, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state = await res.json();
  } catch (err) {
    console.error('[charter] no se pudo leer el estado del coach', err);
    return;
  }
  if (!state?.revealed || !state.card) return;   // antes del reveal no se muestra nada

  await customElements.whenDefined('psl-card');
  const { card } = state;
  const name = [card.first, card.last].filter(Boolean).join(' ');
  section.querySelector('[data-hce-card]').data = card;
  section.querySelector('[data-hce-name]').textContent = name;
  section.querySelector('[data-hce-lead]').textContent =
    state.profile?.summary || 'The first Head Coach in Port St. Lucie SC history.';

  const photo = section.querySelector('[data-hce-photo]');
  if (state.presentation?.src) {
    photo.src = state.presentation.src;
    photo.alt = state.presentation.alt || name;
  } else {
    section.classList.add('hce--nophoto');
  }

  // Un link sin su URL reemplazada no se muestra (en vez de llevar a una página rota)
  [['ccCoach', '[data-hce-coach]'], ['ccTeam', '[data-hce-team]']].forEach(([key, sel]) => {
    const url = section.dataset[key];
    if (!url || url.startsWith('__')) section.querySelector(sel).hidden = true;
  });

  section.hidden = false;
}

export { initColeccionEntry };
