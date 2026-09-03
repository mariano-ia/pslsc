/**
 * News — bloque 08. Trae las últimas noticias reales publicadas en WordPress (custom post type
 * "sec_news", del plugin de SportsEngine/USL — el mismo contenido que alimenta al carrusel nativo
 * "News Hero Slider Aggregator") vía la REST API pública de WP, y las renderiza en NUESTRAS cards
 * ya diseñadas (mismo <article class="ncard">, mismo aspect-ratio, misma tipografía).
 *
 * Por qué esto y no el bloque nativo de WordPress: se probó reestilar por CSS el carrusel nativo
 * (news-aggregator-reskin.html, ver historial) y no alcanzó — el layout interno (imagen gigante,
 * alturas fijas, scroll roto, fondo blanco fijo que no combina con el diseño del sitio) lo resuelve
 * el HTML/JS del propio plugin, no solo el CSS, y no tenemos acceso a ese código para arreglarlo de
 * raíz. Acá en cambio consumimos los datos crudos (JSON) por fetch — mismo dominio, sin CORS — y
 * armamos el HTML nosotros: control total del diseño, cero dependencia del layout del plugin.
 *
 * Fallback: si el fetch falla (red, el custom post type se renombra algún día, etc.) se dejan las
 * 3 cards mockeadas que ya están en el HTML tal cual — nunca se ve un bloque vacío ni roto.
 *
 * Confirmado en vivo (2026-08-29) contra portstluciesc.com:
 *   GET /wp-json/wp/v2/sec_news?per_page=3&_embed=1  → 200, público, sin auth.
 *   Trae title.rendered, excerpt.rendered, date (ISO), link, y _embedded['wp:featuredmedia'][0]
 *   con varios tamaños de imagen (usamos medium_large, cae a source_url si no está ese tamaño).
 */
const NEWS_ENDPOINT = '/wp-json/wp/v2/sec_news?per_page=3&_embed=1';
const EXCERPT_MAX = 110;

function decodeEntities(html) {
  const el = document.createElement('textarea');
  el.innerHTML = html;
  return el.value;
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pickImage(post) {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media) return '';
  return (
    media.media_details?.sizes?.medium_large?.source_url ||
    media.media_details?.sizes?.large?.source_url ||
    media.source_url ||
    ''
  );
}

function buildCard(post) {
  const title = decodeEntities(post.title?.rendered || '').trim();
  const excerpt = truncate(stripTags(post.excerpt?.rendered || ''), EXCERPT_MAX);
  const dateIso = (post.date || '').slice(0, 10);
  const dateLabel = formatDate(post.date);
  const img = pickImage(post);
  const link = post.link || '#';

  const card = document.createElement('a');
  card.className = 'ncard';
  card.href = link;
  card.setAttribute('data-reveal', '');

  const media = document.createElement('div');
  media.className = 'ncard__media';
  media.setAttribute('aria-hidden', 'true');
  if (img) {
    media.classList.add('ncard__media--photo');
    media.style.backgroundImage = `url("${img}")`;
  }
  card.appendChild(media);

  const body = document.createElement('div');
  body.className = 'ncard__body';

  if (dateLabel) {
    const time = document.createElement('time');
    time.className = 'ncard__date';
    if (dateIso) time.setAttribute('datetime', dateIso);
    time.textContent = dateLabel;
    body.appendChild(time);
  }

  const h3 = document.createElement('h3');
  h3.className = 'ncard__title';
  h3.textContent = title;
  body.appendChild(h3);

  if (excerpt) {
    const revealWrap = document.createElement('div');
    revealWrap.className = 'ncard__reveal';
    const p = document.createElement('p');
    p.className = 'ncard__excerpt';
    p.textContent = excerpt;
    revealWrap.appendChild(p);
    body.appendChild(revealWrap);
  }

  card.appendChild(body);
  return card;
}

async function initNews(root = document) {
  const section = root.querySelector('.news') || (root.matches?.('.news') ? root : null);
  const grid = root.querySelector('.news__grid');
  if (!grid) return;

  let posts;
  try {
    const res = await fetch(NEWS_ENDPOINT, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) throw new Error('sin noticias publicadas');
  } catch (err) {
    console.warn('[news] no se pudieron traer noticias reales, se dejan las de ejemplo', err);
    return;
  }

  const cards = posts.map(buildCard);
  grid.innerHTML = '';
  cards.forEach((card) => grid.appendChild(card));

  // Reengancha las cards nuevas (llevan [data-reveal]) al observer compartido de motion.js —
  // initReveal() es idempotente (dataset.revBound), así que llamarlo de nuevo es seguro. Solo el
  // scope de esta sección, no document, para no re-disparar las piezas de página (nav/grano/cursor).
  if (typeof window.initMotion === 'function') {
    window.initMotion(section || grid.closest('section') || document);
  }
}

document.addEventListener('DOMContentLoaded', () => initNews());

export { initNews };
