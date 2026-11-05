/**
 * Bloque t00 · Soccer Staff. Lee el mismo estado que el hero y, revelado el Head Coach, lo pinta como una tarjeta más
 * del staff (como Front Office) que lleva a su ficha. Sin estado o antes del reveal queda en "To be announced".
 * También muestra el acceso a Mi colección, si la página existe.
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

  const name = [card.first, card.last].filter(Boolean).join(' ');
  const coach = document.createElement('a');
  coach.className = 'scard scard--link';
  coach.href = el.dataset.ccCoach;
  coach.innerHTML = `<div class="scard__media tmh__media"><img src="${tmhEsc(presentation.src)}" alt="${tmhEsc(presentation.alt || name)}" decoding="async"></div>
    <div class="scard__bar"><div class="scard__id"><p class="scard__name">${tmhEsc(name)}</p><p class="scard__role">Head Coach</p></div>
      <span class="scard__go" aria-hidden="true">&rarr;</span></div>
    <p class="tmh__summary">${tmhEsc(profile.summary)} <span class="tmh__more">Meet the coach</span></p>`;
  el.querySelector('[data-tmh-coach]').replaceWith(coach);

  const collection = el.dataset.ccCollection;
  if (collection && !collection.startsWith('__')) el.querySelector('[data-tmh-cc]').hidden = false;
}

export { initSoccerStaff };
