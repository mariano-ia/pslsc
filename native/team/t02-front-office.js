/**
 * Bloque t02 · Front Office. Da vuelta las tarjetas (bio atrás) y muestra la navegación del Club (Front Office · Soccer Staff) una vez
 * revelado el Head Coach. Antes del reveal Soccer Staff no se publica, así que la navegación queda oculta.
 */
/* Flip de las tarjetas: el "+" (o un click en la foto) muestra la bio atrás; la "x" o Esc vuelven a la foto.
   El lado que no se ve queda inert (ni foco ni lector de pantalla). */
function fofBindFlip(root) {
  root.querySelectorAll('.scard--flip').forEach((card) => {
    if (card.dataset.flipBound) return;
    card.dataset.flipBound = '1';
    const front = card.querySelector('.scard__front');
    const back = card.querySelector('.scard__back');
    const [openBtn, closeBtn] = card.querySelectorAll('[data-scard-flip]');
    const set = (on) => {
      card.classList.toggle('is-flipped', on);
      front.inert = on;
      back.inert = !on;
      openBtn.setAttribute('aria-expanded', String(on));
      if (on) back.querySelector('.scard__bio').scrollTop = 0;
      (on ? closeBtn : openBtn).focus({ preventScroll: true });
    };
    front.addEventListener('click', () => set(true));
    closeBtn.addEventListener('click', () => set(false));
    card.addEventListener('keydown', (e) => { if (e.key === 'Escape' && card.classList.contains('is-flipped')) set(false); });
  });
}

async function initFrontOffice(root = document) {
  fofBindFlip(root);
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
