/**
 * Bloque t01 · Ficha del Head Coach. Lee el mismo estado que el hero y solo pinta si ya está `profile`; antes del
 * reveal la página no está disponible y vuelve a Front Office. Al pie, la Card No. 001 y el form para recibirla por mail.
 */
import { CHARTER_EMAIL, charterLoad, charterSendLead } from '../../custom/card/charter.js';

const tcoEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function tcoProfileHTML(p, teamUrl) {
  return `<div class="tco__profile"><div><span class="tco__kicker">${tcoEsc(p.kicker)}</span>
      <h1 class="tco__name">${p.nameLines.map(tcoEsc).join('<br>')}</h1>
      <div class="tco__bio">${p.bio.map((b) => `<p>${tcoEsc(b)}</p>`).join('')}</div>
      ${p.quote ? `<p class="tco__quote">&ldquo;${tcoEsc(p.quote)}&rdquo;${p.quoteDraft ? '<span class="tco__draft">Draft quote</span>' : ''}</p>` : ''}
      <div class="tco__row"><a class="psl-btn cta-primary" href="/joinus/"><span>Get Priority Access</span> <span aria-hidden="true">→</span></a><a class="psl-btn cta-secondary" href="${tcoEsc(teamUrl)}">Meet the staff</a></div>
    </div>
    <div><h2 class="tco__label">Career path</h2>
      <ul class="tco__timeline">${p.career.map((c) => `<li class="${c[2] ? 'is-now' : ''}"><small>${tcoEsc(c[0])}</small>${tcoEsc(c[1])}</li>`).join('')}</ul>
    </div></div>
    <section class="tco__cc" aria-labelledby="tco-cc-title">
      <psl-card class="tco__card" flippable data-tco-card></psl-card>
      <div class="tco__cc-copy"><span class="tco__kicker">Charter Collection</span>
        <h2 class="tco__cc-title" id="tco-cc-title">Card No. 001</h2>
        <p class="tco__cc-lead">The first card in club history. Flip it to see the clues from reveal week.</p>
        <div class="tco__get" data-tco-get></div>
      </div>
    </section>`;
}

// Card No. 001 por mail. Quién la pidió desde este dispositivo queda guardado acá (solo el mail, para no volver a
// pedírsela); la Collector y Mi colección no se tocan: la carta se va a sumar a la colección cuando esté disponible.
const TCO_SENT = 'pslsc-card-001-mail';
const tcoGet = (k) => { try { return localStorage.getItem(k); } catch (err) { return null; } };
const tcoSet = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (err) { /* sin storage */ } };

function tcoFormHTML() {
  const known = charterLoad().email || '';   // si reclamó la Collector en el juego, ya tenemos su mail
  return `<p class="tco__get-lead">Want it? Leave your email and we&rsquo;ll send Card No. 001 to your inbox.</p>
    <form class="tco__form" data-tco-form novalidate>
      <div class="tco__field"><label for="tco-em">Email</label><input type="email" id="tco-em" name="email" autocomplete="email" placeholder="you@email.com" value="${tcoEsc(known)}" required></div>
      <label class="tco__consent"><input type="checkbox" name="consent" required><span>I agree to receive emails from Port St. Lucie SC about the Charter Collection and club news. Unsubscribe anytime.</span></label>
      <p class="tco__err" data-err role="alert" hidden></p>
      <div><button class="psl-btn cta-primary" type="submit">Send me the card</button></div>
    </form>`;
}

function tcoSentHTML(email) {
  return `<p class="tco__chip is-in"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>On its way</p>
    <p class="tco__get-lead" tabindex="-1">We sent Card No. 001 to <b>${tcoEsc(email)}</b>. It joins your collection when the collection opens.</p>
    <button type="button" class="tco__link" data-tco-again>Send it to another email</button>`;
}

function tcoBindGet(el, box) {
  const sent = tcoGet(TCO_SENT);
  box.innerHTML = sent ? tcoSentHTML(sent) : tcoFormHTML();
  box.querySelector('[data-tco-again]')?.addEventListener('click', () => {
    tcoSet(TCO_SENT, null);
    tcoBindGet(el, box);
    box.querySelector('input[type="email"]').focus();
  });
  const form = box.querySelector('[data-tco-form]');
  if (!form) return;
  const err = form.querySelector('[data-err]');
  const submit = form.querySelector('[type="submit"]');
  const fail = (msg) => { err.textContent = msg; err.hidden = false; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.dataset.busy) return;   // doble envío
    const email = form.elements.email.value.trim();
    if (!CHARTER_EMAIL.test(email)) { fail('Enter a valid email, like name@email.com.'); return; }
    if (!form.elements.consent.checked) { fail('Tick the box to agree to receive emails.'); return; }
    form.dataset.busy = '1'; err.hidden = true; submit.disabled = true; submit.textContent = 'Sending…';
    try {
      await charterSendLead(el, email);
    } catch (x) {
      delete form.dataset.busy; submit.disabled = false; submit.textContent = 'Send me the card';
      fail(x.message);
      return;
    }
    tcoSet(TCO_SENT, email);
    tcoBindGet(el, box);
    box.querySelector('[tabindex="-1"]')?.focus();
  });
}

async function initCoach(root = document) {
  const el = root.querySelector('.tco');
  if (!el) return;
  const src = el.dataset.ccState;
  if (!src || src.startsWith('__')) return;
  try {
    const res = await fetch(src, { cache: 'no-store', headers: { Accept: 'application/json' } });   // cambia por fecha: nunca de caché
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const state = await res.json();
    if (!state.revealed || !state.profile) {   // antes del reveal la ficha no está disponible
      const front = el.dataset.ccFront;
      if (front && !front.startsWith('__')) location.replace(front);
      return;
    }
    await customElements.whenDefined('psl-card');
    el.querySelector('[data-tco-profile]').innerHTML = tcoProfileHTML(state.profile, el.dataset.ccTeam);
    el.querySelector('[data-tco-card]').data = state.card;
    tcoBindGet(el, el.querySelector('[data-tco-get]'));
  } catch (err) {
    console.error('[coach] no se pudo leer la ficha', err);
  }
}

export { initCoach };
