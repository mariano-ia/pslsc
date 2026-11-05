/**
 * Bloque c01 · Mi colección. Pantallas (data-cco-view):
 *   collection  la Collector (o Founding Member) + las cartas numeradas y las que faltan como siluetas
 *   empty       sin cartas en este dispositivo: manda a jugar (y, con servidor, ofrece el link)
 *   request     pedir el link (mail)
 *   sent        link enviado (con reenvío a los 30 s)
 *   invalid     el link venció o ya se usó: pedir otro
 *   loading / error  mientras se verifica el link, o si no se pudo verificar por red
 *
 * Identidad = el mail, verificado con un link personal. Contrato en docs/charter-collection-server.md:
 *   POST {api}/link   { email }  -> 202 siempre (no revela si el mail existe)
 *   POST {api}/verify { token }  -> 200 { email, founder, cards, device } | 401/410 link inválido o vencido
 *   GET  {api}/me     (Authorization: Bearer device) -> 200 { email, founder, cards } | 401
 * Sin servidor (__COLLECTION_API__ sin reemplazar) todo sale del dispositivo (custom/card/charter.js) y no se
 * ofrece el link. La foto y el nombre de la carta nunca van al servidor: se cargan acá, en memoria.
 */
import { charterLoad, charterSave, charterPad, charterCollectorCard } from '../../custom/card/charter.js';

const CCO_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const CCO_SLOTS = 4;      // cartas numeradas a la vista: las que tenés + siluetas hasta completar
const CCO_RESEND = 30;    // segundos antes de poder pedir el link de nuevo
const ccoEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const ccoUrl = (u) => (u && !u.startsWith('__') ? u : null);

class CcoHttpError extends Error {
  constructor(status) { super(`HTTP ${status}`); this.status = status; }
}
async function ccoFetch(url, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  let res;
  try {
    res = await fetch(url, { method, headers, body: body && JSON.stringify(body), cache: 'no-store', signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new CcoHttpError(res.status);
  return res.status === 204 ? null : res.json().catch(() => null);
}

function ccoOwned(S) {
  if (!S.email) return [];
  return Array.isArray(S.cards) && S.cards.length ? S.cards : ['collector', '001'];
}

function ccoEmailField(id, value = '') {
  return `<div class="cco__field"><label for="${id}">Email</label>
    <input type="email" id="${id}" name="email" autocomplete="email" placeholder="you@email.com" value="${ccoEsc(value)}" required></div>`;
}
function ccoRequestForm(id, value, primary = true) {
  return `<form class="cco__form" data-cco-form novalidate>${ccoEmailField(id, value)}
    <p class="cco__err" data-err role="alert" hidden></p>
    <button class="psl-btn ${primary ? 'cta-primary' : 'cta-secondary'}" type="submit">Send me my link</button></form>`;
}
const ccoGhost = (label) => `<div class="cco__ghost" aria-hidden="true"><span>${label}</span></div>`;

function ccoCollectionHTML(S, state, ctx) {
  const f = S.founder;
  const nums = ccoOwned(S).filter((c) => /^\d+$/.test(c)).sort();
  const slots = [];
  nums.forEach((no) => {
    const live = no === '001' && state?.card;
    const when = no === '001' && state && !state.revealed ? 'Reveals Friday' : 'In your collection';
    slots.push(`<li class="cco__slot is-owned">${live ? `<psl-card flippable data-cco-card="${no}" aria-label="Card No. ${no}, tap to flip"></psl-card>` : ccoGhost(no)}
      <p class="cco__cap"><b>Card No. ${no}</b><span>${when}</span></p></li>`);
  });
  let next = nums.length ? Number(nums[nums.length - 1]) + 1 : 1;
  while (slots.length < CCO_SLOTS) {
    const no = String(next++).padStart(3, '0');
    slots.push(`<li class="cco__slot is-missing">${ccoGhost(no)}<p class="cco__cap"><b>Card No. ${no}</b><span>Coming soon</span></p></li>`);
  }
  const count = nums.length + 1;   // + la Collector
  return `${ctx.flash ? `<p class="cco__flash" role="status">${ctx.flash}</p>` : ''}
    <div class="cco__me">
      <div class="cco__me-card"><psl-card flippable data-cco-collector aria-label="Your ${f ? 'Founding Member' : 'Collector'} Card, tap to flip"></psl-card></div>
      <div class="cco__me-copy">
        <p class="cco__label${f ? ' is-gold' : ''}">${f ? 'Special edition' : 'Inaugural Collector'}</p>
        <h2 class="cco__h2" tabindex="-1">${f ? `Founding Member No. ${charterPad(f.no)}` : 'Your Collector Card'}</h2>
        <p class="cco__lead">${count} ${count === 1 ? 'card' : 'cards'} collected since Week One. Add your photo and name to your card: they stay on this device.</p>
        <div class="cco__capture" data-cco-capture-slot></div>
      </div>
    </div>
    <div class="cco__set">
      <div class="cco__set-head">
        <h2 class="cco__h3">Charter Season 2027</h2>
        <p class="cco__note">New cards drop as the 2027 squad comes together. We&rsquo;ll email you when the next one is out.</p>
      </div>
      <ul class="cco__grid">${slots.join('')}</ul>
    </div>
    ${ctx.api ? `<div class="cco__box cco__box--row">
      <div><h2 class="cco__h3">On another device?</h2>
        <p class="cco__lead">We&rsquo;ll email a link to <b>${ccoEsc(S.email)}</b>. Open it on your phone or laptop and your collection is there too.</p></div>
      <button class="psl-btn cta-secondary" type="button" data-act="send-mine">Email me my link</button>
      <p class="cco__err" data-err role="alert" hidden></p>
    </div>` : ''}`;
}

function ccoEmptyHTML(S, state, ctx) {
  const answered = Object.keys(S.answers || {}).length;
  let lead;
  let cta;
  if (state?.claimOpen === false) {
    lead = 'The first week of the Charter Collection is over. New cards drop as the 2027 squad comes together: play the next one and your collection starts there.';
    cta = ctx.coach ? `<a class="psl-btn cta-primary" href="${ccoEsc(ctx.coach)}"><span>Meet Card No. 001</span> <span aria-hidden="true">&rarr;</span></a>` : '';
  } else if (state?.revealed) {
    lead = 'Card No. 001 is out. Claim your free Collector Card on the home page and Card No. 001 starts your collection.';
    cta = `<a class="psl-btn cta-primary" href="${ccoEsc(ctx.home.replace(/#hero$/, '#claim'))}"><span>Claim your card</span> <span aria-hidden="true">&rarr;</span></a>`;
  } else if (answered) {
    lead = `You&rsquo;ve answered ${answered} of 4. Claim your free Collector Card on the home page and Card No. 001 starts your collection.`;
    cta = `<a class="psl-btn cta-primary" href="${ccoEsc(ctx.home)}"><span>Keep playing</span> <span aria-hidden="true">&rarr;</span></a>`;
  } else {
    lead = 'One question a day, four clues, one card. Play on the home page, claim your free Collector Card and Card No. 001 starts your collection.';
    cta = `<a class="psl-btn cta-primary" href="${ccoEsc(ctx.home)}"><span>Play this week&rsquo;s card</span> <span aria-hidden="true">&rarr;</span></a>`;
  }
  return `<div class="cco__empty">
      <ul class="cco__grid cco__grid--ghosts" aria-hidden="true">
        <li class="cco__slot">${ccoGhost('&#9733;')}</li><li class="cco__slot">${ccoGhost('001')}</li><li class="cco__slot">${ccoGhost('002')}</li>
      </ul>
      <div class="cco__empty-copy">
        <h2 class="cco__h2" tabindex="-1">Your collection is empty</h2>
        <p class="cco__lead">${lead}</p>
        ${cta ? `<div class="cco__row">${cta}</div>` : ''}
      </div>
    </div>
    ${ctx.api ? `<div class="cco__box">
      <h2 class="cco__h3">Already collecting on another device?</h2>
      <p class="cco__lead">Enter the email you used to claim your card and we&rsquo;ll send you a link that opens your collection here.</p>
      ${ccoRequestForm('cco-em-empty', '', false)}
    </div>` : ''}`;
}

function ccoBoxHTML(view, S, ctx) {
  const back = S.email ? '<button class="cco__link" type="button" data-act="back">Back to my collection</button>' : '';
  switch (view) {
    case 'request':
      return `<div class="cco__box cco__box--focus">
        <p class="cco__label">Send me my link</p>
        <h2 class="cco__h2" tabindex="-1">Open your collection here</h2>
        <p class="cco__lead">Enter the email you used to claim your card. We&rsquo;ll send you a link that opens your collection on this device.</p>
        ${ccoRequestForm('cco-em', ctx.email)}${back}
      </div>`;
    case 'sent':
      return `<div class="cco__box cco__box--focus">
        <p class="cco__label">Link sent</p>
        <h2 class="cco__h2" tabindex="-1">Check your inbox</h2>
        <p class="cco__lead">If <b>${ccoEsc(ctx.email)}</b> has a Charter Collection, a link is on its way. Open it on the device where you want your collection. It works once and expires in 24 hours.</p>
        <p class="cco__note">Not there in a few minutes? Check your spam or promotions folder.</p>
        <div class="cco__row">
          <button class="psl-btn cta-secondary" type="button" data-act="resend" disabled>Send it again</button>
          <button class="cco__link" type="button" data-act="change">Use a different email</button>
        </div>
        <p class="cco__err" data-err role="alert" hidden></p>${back}
      </div>`;
    case 'invalid':
      return `<div class="cco__box cco__box--focus">
        <p class="cco__label is-warn">Link expired</p>
        <h2 class="cco__h2" tabindex="-1">This link doesn&rsquo;t work anymore</h2>
        <p class="cco__lead">Links work once and expire after 24 hours. Enter your email and we&rsquo;ll send you a new one.</p>
        ${ccoRequestForm('cco-em-inv')}${back}
      </div>`;
    case 'error':
      return `<div class="cco__box cco__box--focus">
        <p class="cco__label is-warn">Something went wrong</p>
        <h2 class="cco__h2" tabindex="-1">We could not open your collection</h2>
        <p class="cco__lead">Check your connection and try again. Your link still works if you haven&rsquo;t used it.</p>
        <div class="cco__row"><button class="psl-btn cta-primary" type="button" data-act="retry">Try again</button></div>${back}
      </div>`;
    default:   // loading
      return '<div class="cco__box cco__box--focus" aria-busy="true"><p class="cco__lead">Opening your collection&hellip;</p></div>';
  }
}

async function initCollection(root = document) {
  const el = root.querySelector('.cco');
  if (!el || el.dataset.ccoReady) return;
  el.dataset.ccoReady = '1';
  const d = el.dataset;
  const ctx = { api: ccoUrl(d.ccApi), home: d.ccHome, coach: ccoUrl(d.ccCoach), email: '', flash: '' };
  const viewEl = el.querySelector('[data-cco-view]');
  const statusEl = el.querySelector('[data-cco-status]');
  const capture = el.querySelector('[data-cco-capture]');
  let S = charterLoad();
  let state = null;
  let view = null;
  let timer = null;

  const say = (msg) => { statusEl.textContent = ''; setTimeout(() => { statusEl.textContent = msg; }, 60); };
  const showError = (box, msg) => {
    const err = box.querySelector('[data-err]');
    if (!err) return;
    err.textContent = msg;
    err.hidden = false;
  };
  const errorFor = (err) => {
    if (err.status === 429) return 'Too many requests. Wait a few minutes and try again.';
    if (err.status === 400) return 'Enter a valid email, like name@email.com.';
    if (err.status) return 'Something went wrong on our end. Please try again in a moment.';
    return 'We could not reach our server. Check your connection and try again.';
  };

  function cooldown(btn) {
    clearInterval(timer);
    let left = CCO_RESEND;
    const tick = () => {
      if (left <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = 'Send it again'; return; }
      btn.textContent = `Send it again in ${left--} s`;
    };
    btn.disabled = true;
    tick();
    timer = setInterval(tick, 1000);
  }

  async function sendLink(email, box, btn) {
    if (!CCO_EMAIL.test(email)) { showError(box, 'Enter a valid email, like name@email.com.'); return false; }
    if (btn.dataset.busy) return false;
    btn.dataset.busy = '1';
    const label = btn.innerHTML;
    btn.textContent = 'Sending…';
    btn.disabled = true;
    try {
      await ccoFetch(`${ctx.api}/link`, { method: 'POST', body: { email } });
      ctx.email = email;
      return true;
    } catch (err) {
      console.error('[collection] no se pudo pedir el link', err);
      showError(box, errorFor(err));
      btn.innerHTML = label;
      btn.disabled = false;
      return false;
    } finally {
      delete btn.dataset.busy;
    }
  }

  function paint(next, focus = false) {
    view = next;
    clearInterval(timer);
    if (view === 'collection') viewEl.innerHTML = ccoCollectionHTML(S, state, ctx);
    else if (view === 'empty') viewEl.innerHTML = ccoEmptyHTML(S, state, ctx);
    else viewEl.innerHTML = ccoBoxHTML(view, S, ctx);
    viewEl.dataset.ccoView = view;
    ctx.flash = '';

    const collector = viewEl.querySelector('[data-cco-collector]');
    if (collector) {
      collector.data = charterCollectorCard(S, capture.fan);
      capture.stage = collector;
      capture.hidden = false;
      viewEl.querySelector('[data-cco-capture-slot]').append(capture);
    } else {
      el.querySelector('.cco__wrap').append(capture);   // el único <psl-photo-capture>: conserva la foto entre pantallas
      capture.hidden = true;
    }
    viewEl.querySelectorAll('[data-cco-card]').forEach((c) => { c.data = state.card; });

    viewEl.querySelectorAll('[data-cco-form]').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        form.querySelector('[data-err]').hidden = true;
        const ok = await sendLink(form.elements.email.value.trim(), form, form.querySelector('[type="submit"]'));
        if (ok) { paint('sent', true); say(`Link sent. Check ${ctx.email}.`); }
      });
    });
    viewEl.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const a = btn.dataset.act;
        const box = btn.closest('.cco__box') || viewEl;
        const err = box.querySelector('[data-err]');
        if (err) err.hidden = true;
        if (a === 'back') paint('collection', true);
        if (a === 'change') paint('request', true);
        if (a === 'retry') verify(ctx.token);
        if (a === 'send-mine' && await sendLink(S.email, box, btn)) { paint('sent', true); say(`Link sent. Check ${ctx.email}.`); }
        if (a === 'resend' && await sendLink(ctx.email, box, btn)) { cooldown(btn); say('Link sent again.'); }
      });
    });
    const resend = viewEl.querySelector('[data-act="resend"]');
    if (resend) cooldown(resend);

    if (focus) {
      el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      viewEl.querySelector('h2')?.focus({ preventScroll: true });
    }
  }
  const home = () => (S.email ? 'collection' : 'empty');

  function adopt(data) {
    S = { ...charterLoad(), email: data.email, founder: data.founder || null, cards: data.cards };
    if (data.device) S.device = data.device;
    charterSave(S);
  }

  async function verify(token) {
    paint('loading');
    try {
      adopt(await ccoFetch(`${ctx.api}/verify`, { method: 'POST', body: { token } }));
      ctx.flash = 'Your collection is on this device now.';
      paint('collection', true);
      say('Your collection is on this device now.');
    } catch (err) {
      console.error('[collection] no se pudo verificar el link', err);
      paint(err.status && err.status < 500 && err.status !== 429 ? 'invalid' : 'error', true);
    }
  }

  // El token sale de la barra de direcciones enseguida: no queda en el historial ni se comparte copiando la URL.
  const params = new URLSearchParams(location.search);
  ctx.token = params.get('t');
  if (ctx.token) {
    params.delete('t');
    const rest = params.toString();
    history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`);
  }

  await Promise.all([customElements.whenDefined('psl-card'), customElements.whenDefined('psl-photo-capture')]);
  capture.addEventListener('fanchange', (e) => {
    const collector = viewEl.querySelector('[data-cco-collector]');
    if (collector) collector.data = charterCollectorCard(S, e.detail);
  });

  const src = ccoUrl(d.ccState);
  if (src) {
    try {
      const res = await fetch(src, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state = await res.json();
    } catch (err) {
      console.error('[collection] no se pudo leer el estado de la colección', err);   // las cartas numeradas quedan como siluetas
    }
  }

  if (ctx.token && ctx.api) { verify(ctx.token); return; }
  paint(home());

  // Con servidor: al volver, se actualiza la colección (cartas nuevas, founder) sin hacer nada.
  if (ctx.api && S.device) {
    try {
      const me = await ccoFetch(`${ctx.api}/me`, { token: S.device });
      adopt({ ...me, device: S.device });
      if (view === 'collection' || view === 'empty') paint(home());
    } catch (err) {
      if (err.status === 401) { delete S.device; charterSave(S); }   // el dispositivo ya no vale: queda lo local
    }
  }
}

export { initCollection };
