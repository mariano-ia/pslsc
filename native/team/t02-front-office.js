/**
 * Bloque t02 · Front Office. Lo único que hace: mostrar la navegación del Club (Front Office · Soccer Staff) una vez
 * revelado el Head Coach. Antes del reveal Soccer Staff no se publica, así que la navegación queda oculta.
 */
async function initFrontOffice(root = document) {
  const head = root.querySelector('.staff--head[data-cc-state]');
  const nav = head?.querySelector('[data-clubnav]');
  const src = head?.dataset.ccState;
  if (!nav || !src || src.startsWith('__')) return;
  try {
    const res = await fetch(src, { cache: 'no-store', headers: { Accept: 'application/json' } });   // cambia por fecha: nunca de caché
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const state = await res.json();
    if (state.revealed && state.profile) nav.hidden = false;
  } catch (err) {
    console.error('[front-office] no se pudo leer el estado', err);   // sin estado, la navegación queda oculta
  }
}

export { initFrontOffice };
