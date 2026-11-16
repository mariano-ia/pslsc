/*
  Plano por zonas — initZones().
  Los botones de zona y las fichas (data-zone-info) van en el mismo orden en el HTML:
  el botón N muestra la ficha N.
*/
function initZones(root = document) {
  const sec = root.querySelector('.venue-tickets');
  if (!sec || sec.dataset.zonesReady) return;
  sec.dataset.zonesReady = '1';

  const zones = [...sec.querySelectorAll('.venue-tickets__zone')];
  const infos = [...sec.querySelectorAll('[data-zone-info]')];

  zones.forEach((z, i) => z.addEventListener('click', () => {
    zones.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-pressed', String(j === i)); });
    infos.forEach((el, j) => { el.hidden = j !== i; });
  }));
}

document.addEventListener('DOMContentLoaded', () => initZones());

export { initZones };
