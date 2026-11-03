/**
 * Bloque t03 · Roster. Pinta los jugadores anunciados por posición; una posición vacía queda en TBA.
 */
const troEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const TRO_GROUPS = [['gk', 'Goalkeepers'], ['df', 'Defenders'], ['mf', 'Midfielders'], ['fw', 'Forwards']];
const TRO_POSITION = { gk: 'Goalkeeper', df: 'Defender', mf: 'Midfielder', fw: 'Forward' };

function troPlayerHTML(p) {
  return `<article class="tro__p">
      <div class="tro__img">
        <img class="tro__photo" src="${troEsc(p.photo)}" alt="${troEsc(`${p.first} ${p.last}`)}" loading="lazy" decoding="async">
        <span class="tro__num">${troEsc(p.number)}</span>
        <img class="tro__crest" src="/assets/brand/crest-aqua.webp" alt="">
      </div>
      <div><div class="tro__pos">${troEsc(TRO_POSITION[p.position])}</div><h3 class="tro__name"><small>${troEsc(p.first)}</small>${troEsc(p.last)}</h3></div>
      <div class="tro__row">
        <span class="tro__nat">${p.flag ? `<span class="tro__flag" style="background:${troEsc(p.flag)}"></span>` : ''}${troEsc(p.country)}</span>
        ${p.card ? `<span class="tro__chip">Card ${troEsc(p.card)}</span>` : ''}
      </div>
    </article>`;
}

async function initRoster(root = document) {
  const el = root.querySelector('.tro');
  if (!el) return;
  const src = el.dataset.roster;
  if (!src || src.startsWith('__')) return;
  let data;
  try {
    const res = await fetch(src, { cache: 'no-store', headers: { Accept: 'application/json' } });   // cambia con cada anuncio
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('[roster] no se pudo leer el plantel', err);
    return;
  }
  const players = data.players || [];
  el.querySelector('[data-tro-groups]').innerHTML = TRO_GROUPS.map(([key, label]) => {
    const list = players.filter((p) => p.position === key);
    const body = list.length
      ? `<div class="tro__grid">${list.map(troPlayerHTML).join('')}</div>`
      : '<p class="tro__bar"><b>TBA</b>Announcements begin January 2027</p>';
    return `<section class="tro__group"><div class="tro__gh"><h2>${label}</h2><span>${list.length} announced</span></div>${body}</section>`;
  }).join('');
}

export { initRoster };
