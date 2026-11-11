/**
 * Bloque 01c · Entrada a la Charter Collection (después de la campaña).
 * Lee el mismo estado que el hero de campaña y muestra la Card No. 001 revelada. Si el estado no llega, o la carta
 * todavía no está revelada, la sección sigue oculta: el bloque nunca se ve roto ni adelanta nada.
 */
const hceEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

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
    console.error('[charter] no se pudo leer el estado de la colección', err);
    return;
  }
  if (!state?.revealed || !state.card) return;   // antes del reveal no se muestra nada

  await customElements.whenDefined('psl-card');
  const { card } = state;
  section.querySelector('[data-hce-card]').data = card;
  section.querySelector('[data-hce-lead]').innerHTML =
    `Our first Head Coach, <b>${hceEsc(`${card.first} ${card.last}`)}</b>, opens the Charter Collection. ` +
    'New cards drop as the 2027 squad comes together.';

  const coach = section.dataset.ccCoach;
  const coachLink = section.querySelector('[data-hce-coach]');
  if (!coach || coach.startsWith('__')) coachLink.hidden = true;
  const collection = section.dataset.ccCollection;
  // Mi colección (etapa 6): el botón aparece solo cuando la página existe y su URL está reemplazada.
  if (collection && !collection.startsWith('__')) section.querySelector('[data-hce-collection]').hidden = false;

  section.hidden = false;
}

export { initColeccionEntry };
