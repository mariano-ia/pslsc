/*
  Recorrido por capítulos — initTour().

  Los botones de capítulo y las fichas (data-tour-info) van en el mismo orden en el HTML: el botón N
  muestra la ficha N, actualiza la placa y la barra de progreso. El video no se baja hasta que
  alguien aprieta play (preload="none" + src diferido): son 1,4 MB que la mayoría no va a mirar.
  Con el video andando, elegir un capítulo salta a su segundo (data-start del botón).
*/
function initTour(root = document) {
  const tour = root.querySelector('.venue-tour');
  if (!tour || tour.dataset.tourReady) return;
  tour.dataset.tourReady = '1';

  const chaps = [...tour.querySelectorAll('.venue-tour__chap')];
  const infos = [...tour.querySelectorAll('[data-tour-info]')];
  const screen = tour.querySelector('.venue-tour__screen');
  const video = tour.querySelector('[data-tour-video]');
  const num = tour.querySelector('[data-tour-num]');
  const plate = tour.querySelector('[data-tour-plate]');
  const prog = tour.querySelector('[data-tour-prog]');
  let current = 0;

  const label = (btn) => btn.lastChild.textContent.trim();

  const seek = () => {
    const t = parseFloat(chaps[current].dataset.start) || 0;
    if (video.readyState > 0) video.currentTime = t;
    else video.addEventListener('loadedmetadata', () => { video.currentTime = t; }, { once: true });
  };

  const play = (from) => {
    if (!video.src) { video.src = video.dataset.tourVideo; video.load(); }
    if (from === 0) video.currentTime = 0; else seek();
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    screen.classList.add('is-playing');
  };

  const select = (i) => {
    current = i;
    chaps.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-pressed', String(j === i)); });
    infos.forEach((el, j) => { el.hidden = j !== i; });
    num.textContent = String(i + 1).padStart(2, '0');
    plate.textContent = label(chaps[i]);
    prog.style.width = Math.round((i + 1) / chaps.length * 100) + '%';
    if (screen.classList.contains('is-playing')) seek();
  };

  chaps.forEach((b, i) => b.addEventListener('click', () => select(i)));
  tour.querySelector('[data-tour-play]').addEventListener('click', () => play());
  tour.querySelector('[data-tour-full]').addEventListener('click', () => {
    play(0);
    screen.scrollIntoView({ block: 'center' });
  });
  // click sobre el video andando = pausa (y vuelve el botón de play)
  video.addEventListener('click', () => { video.pause(); screen.classList.remove('is-playing'); });
}

document.addEventListener('DOMContentLoaded', () => initTour());

export { initTour };
