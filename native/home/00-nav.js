/**
 * Nav — interacción de la Soccer School y menú mobile.
 * - Hamburguesa (< 1000px): abre/cierra .nav__menu, bloquea el scroll de atrás, cierra con Esc o al elegir un link.
 * - Banderín en touch (desktop sin hover): el primer toque abre el panel, el segundo navega.
 * El hover del panel en desktop es solo CSS (00-nav.css); esto no hace falta para verlo con mouse.
 */
function initNav(root = document) {
  const nav = root.querySelector('.nav');
  if (!nav || nav.dataset.navBound) return;
  nav.dataset.navBound = '1';

  // Variantes para mostrar a marketing: ?nav=b = sin banderín (.nav--school-quiet). Se borra al elegir una.
  if (new URLSearchParams(location.search).get('nav') === 'b') nav.classList.add('nav--school-quiet');

  const burger = nav.querySelector('.nav__burger');
  const menu = nav.querySelector('.nav__menu');
  const setMenu = (open) => {
    if (!burger || !menu) return;
    menu.hidden = !open;
    nav.classList.toggle('is-menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.classList.toggle('nav-menu-open', open);
  };
  burger?.addEventListener('click', () => setMenu(menu.hidden));
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  // si se agranda la ventana con el menú abierto (rotar la tablet), se cierra
  matchMedia('(min-width: 1001px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  const school = nav.querySelector('.nav__school');
  const noHover = matchMedia('(hover: none)');
  const wide = matchMedia('(min-width: 1001px)');
  school?.addEventListener('click', (e) => {
    if (!noHover.matches || !wide.matches || nav.classList.contains('is-school-open')) return;
    e.preventDefault();
    nav.classList.add('is-school-open');
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-school-open') && !e.target.closest('.nav__school, .nav__panel')) {
      nav.classList.remove('is-school-open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!menu?.hidden) { setMenu(false); burger.focus(); }
    nav.classList.remove('is-school-open');
  });
}

export { initNav };
