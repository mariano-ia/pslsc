/* Bloque 01d · Hero Groundbreaking — cuenta regresiva al 12/12 (10 AM ET, fecha en data-gb-countdown).
   Escribe días/horas/minutos/segundos y muestra la tira (sin JS queda oculta). En cero se queda en 00
   y la tira pasa a .is-zero (para ese día el bloque ya se habrá sacado de la Home). */
function initGbCountdown(root = document) {
  root.querySelectorAll('[data-gb-countdown]').forEach((el) => {
    if (el.dataset.gbBound) return;
    el.dataset.gbBound = '1';
    const target = new Date(el.dataset.gbCountdown).getTime();
    if (Number.isNaN(target)) return;
    const out = {};
    el.querySelectorAll('[data-u]').forEach((n) => { out[n.dataset.u] = n; });
    const pad = (n) => String(n).padStart(2, '0');
    let timer = 0;
    const tick = () => {
      const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      if (out.d) out.d.textContent = pad(Math.floor(s / 86400));
      if (out.h) out.h.textContent = pad(Math.floor(s / 3600) % 24);
      if (out.m) out.m.textContent = pad(Math.floor(s / 60) % 60);
      if (out.s) out.s.textContent = pad(s % 60);
      if (s === 0) { el.classList.add('is-zero'); clearInterval(timer); }
    };
    tick();
    el.hidden = false;
    timer = setInterval(tick, 1000);
  });
}

export { initGbCountdown };
