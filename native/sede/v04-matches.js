/*
  Pestañas de partidos — initMatches().
  Upcoming = todas las filas · Home = solo data-home="true" · Results = vacío (todavía no se jugó nada).
  HANDOFF: cuando haya resultados, sumarlos como filas con data-result y mostrarlas en "Results".
*/
function initMatches(root = document) {
  const sec = root.querySelector('.venue-matches');
  if (!sec || sec.dataset.matchesReady) return;
  sec.dataset.matchesReady = '1';

  const tabs = [...sec.querySelectorAll('.venue-matches__tab')];
  const list = sec.querySelector('.venue-matches__list');
  const rows = [...list.querySelectorAll('.venue-match')];
  const empty = sec.querySelector('.venue-matches__empty');

  const show = (filter) => {
    tabs.forEach((t) => {
      const on = t.dataset.filter === filter;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-pressed', String(on));
    });
    let visible = 0;
    rows.forEach((r) => {
      const keep = filter === 'upcoming' || (filter === 'home' && r.dataset.home === 'true');
      r.hidden = !keep;
      if (keep) visible++;
    });
    list.hidden = !visible;
    empty.hidden = !!visible;
  };

  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.filter)));
}

document.addEventListener('DOMContentLoaded', () => initMatches());

export { initMatches };
