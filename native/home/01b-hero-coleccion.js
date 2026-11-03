/**
 * Bloque 01b · Hero de campaña — Charter Collection. El juego se juega acá, en el hero de la home.
 *
 * Estado que entrega la fuente (data-cc-state), solo con lo liberado a esa hora:
 *   { day: 0..5, revealed, closed, card, shell?, days: [...], presentation?, guessMatch? }
 *   - card: carta para mostrar. De lunes a jueves es la cerrada; desde el viernes, la revelada.
 *   - shell: el viernes, la carta cerrada (de ahí arranca quien todavía no apretó "Reveal").
 *   - days[i]: { full, zone, clueTitle, q, opts, a, fact, clue, unlock }. El juego aplica `unlock`
 *     a la carta cuando la persona contesta esa pregunta. Acertar no suma nada: destraba igual.
 *   - presentation: { src, alt }, foto de presentación. Pasado el reveal el protagonista es la persona:
 *     el hero muestra la foto y la carta queda como accesorio chico.
 *   - closed: del sábado en adelante. Las preguntas se cierran y no hace falta apretar "Reveal".
 * El progreso queda en localStorage: la colección con login es de la etapa siguiente.
 *
 * Mail: un pedido después de la primera pregunta y otro, obligatorio, para fijar la apuesta del
 * jueves. Sin config de ActiveCampaign valida pero NO envía ni finge éxito; ?demo simula el envío.
 * La etiqueta de la colección la pone el form en ActiveCampaign.
 *
 * Collector Card: sin número. El número es solo de la edición Founding Member, y es su número de
 * socio fundador. La foto y el nombre los carga <psl-photo-capture> y quedan solo en memoria.
 * Sin fuente (o si falla) queda la carta genérica de abajo y un aviso: el hero nunca se rompe.
 */
const FALLBACK_CARD = {
  code: 'CC-001',
  set: 'Charter Season 2027',
  parallel: 'base',
  background: { photo: '/assets/proof/stadium-aerial-v2.webp', tone: 'sea', pattern: 'base', big: 'HC' },
  frame: true,
  seed: 11,
  badge: ['1ST', 'Season'],
  flag: null,
  first: 'Card No. 001',
  last: null,
  sub: 'Port St. Lucie SC | Head Coach',
  stamps: [{ locked: true }, { locked: true }, { locked: true }],
  back: {
    name: 'No. 001',
    bio: [['Role', 'Head Coach'], ['Country', null], ['Joined', '2026'], ['Last club', null]],
    table: { locked: true, unlock: 'Unlocks Tuesday' },
    fact: { locked: true, unlock: 'Unlocks Thursday' },
  },
};
const CCG_KEY = 'pslsc-charter-001';
const CCG_FULL_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const CCG_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const CCG_CREST = '/assets/brand/crest-aqua.webp';
const CCG_COLLECTOR_PHOTO = '/assets/cards/terrace.webp';
const CCG_ICONS = {
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg>',
  anchor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 11h8M5 14c0 4 3 7 7 7s7-3 7-7"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
};
const ccgEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function ccgLoad() {
  try {
    return { answers: {}, email: null, skipClaim: false, guess: null, revealed: false, ...JSON.parse(localStorage.getItem(CCG_KEY) || '{}') };
  } catch (err) {
    return { answers: {}, email: null, skipClaim: false, guess: null, revealed: false };
  }
}
function ccgSave(S) {
  try { localStorage.setItem(CCG_KEY, JSON.stringify(S)); } catch (err) { /* sin storage se juega igual */ }
}

/* ActiveCampaign: POST directo a proc.php, como el newsletter (ver acSubmitDirect en ac-forms.js). */
function ccgAcConfig(hero) {
  const d = hero.dataset;
  if (!d.acAccount || d.acAccount.startsWith('__') || !d.acForm || d.acForm.startsWith('__')) return null;
  return { account: d.acAccount, form: d.acForm, consent: d.acConsent, guess: d.acGuess };
}
// Pendiente de servidor: cruzar el mail con la base de founders (la API key de ActiveCampaign no
// puede ir en el navegador). Hasta entonces nadie sale como founder, salvo con ?demo=founder.
async function ccgFounderLookup() {
  return new URLSearchParams(location.search).get('demo') === 'founder' ? { no: 42 } : null;
}
async function ccgSendLead(hero, { email, guess }) {
  if (new URLSearchParams(location.search).has('demo')) return;
  const ac = ccgAcConfig(hero);
  if (!ac) {
    console.error('[charter] Falta configurar ActiveCampaign: el mail NO se envió.');
    throw new Error('Something went wrong on our end. Your email was not saved, please try again later.');
  }
  const body = new FormData();
  Object.entries({ u: ac.form, f: ac.form, s: '', c: '0', m: '0', act: 'sub', v: '2', email }).forEach(([k, v]) => body.append(k, v));
  if (ac.consent && !ac.consent.startsWith('__')) body.append(ac.consent, 'Yes');
  if (guess && ac.guess && !ac.guess.startsWith('__')) body.append(ac.guess, guess);
  const res = await fetch(`https://${ac.account}.activehosted.com/proc.php?jsonp=true`, { method: 'POST', body, headers: { Accept: 'application/json' } });
  const data = await res.json();
  if (data?.action !== 'show_thank_you') throw new Error(data?.data?.message || 'We could not send that, please try again in a moment.');
}

/* Carta de la persona: la cerrada + lo que destrabó contestando */
function ccgComposeCard(state, S, flashZone) {
  if (state.revealed && S.revealed) return state.card;
  const card = JSON.parse(JSON.stringify(state.shell || state.card));
  (state.days || []).forEach((day, i) => {
    if (S.answers[i] === undefined || !day.unlock) return;
    const u = day.unlock;
    const isNew = flashZone === day.zone;
    if (u.flag) card.flag = u.flag;
    if (u.stamp) card.stamps[u.stamp.index] = { word: u.stamp.word, icon: u.stamp.icon, isNew };
    if (u.table) card.back.table = { rows: u.table };
    if (u.fact) card.back.fact = { text: u.fact };
    if (u.bio) card.back.bio = card.back.bio.map(([k, v]) => [k, u.bio[k] ?? v]);
  });
  if (flashZone) card.flash = flashZone;
  return card;
}

const ccgPad = (n) => String(n).padStart(4, '0');

function ccgCollectorCard(S, fan) {
  const f = S.founder;
  const no = f && ccgPad(f.no);
  const bio = [['Joined', 'Week One'], ['Status', f ? 'Founding Member' : 'Inaugural Collector'], ['First card', 'No. 001']];
  if (f) bio.unshift(['Founder no.', no]);
  return {
    code: f ? `FM-${no}` : 'COLLECTOR', set: f ? 'Founding Member' : 'Inaugural Collector',
    parallel: f ? 'gold' : 'aqua', seed: 23, frame: true,
    background: { photo: CCG_COLLECTOR_PHOTO, tone: f ? 'gold' : 'aqua', pattern: f ? 'wallGold' : 'wall' },
    backgroundPhoto: fan.cutout ? null : fan.photo,
    figure: fan.cutout ? { src: fan.cutout, kind: 'fan', alt: '' } : (fan.photo ? null : { src: CCG_CREST, kind: 'crest', alt: '' }),
    badge: f ? ['F', `#${no}`] : null, edition: f ? 'Gold' : '',
    first: f ? `Founding Member #${no}` : 'Inaugural Collector', last: fan.name || 'Your name', sub: 'Port St. Lucie SC | 2027',
    stamps: [{ word: 'Collector', icon: CCG_ICONS.star }, { word: 'Week One', icon: CCG_ICONS.sun }, f ? { word: 'Founder', icon: CCG_ICONS.anchor } : { word: 'Card 001', icon: CCG_ICONS.bolt }],
    back: {
      name: f ? 'Founder' : 'Collector', bio,
      fact: { text: f ? 'A special edition for the Founding Members of Port St. Lucie SC.' : 'Inaugural Collector cards are for the fans who played the first card of the Charter Collection.' },
    },
  };
}

function ccgGuessHit(S, state) {
  return Boolean(S.guess && state.guessMatch && S.guess.toLowerCase().includes(state.guessMatch));
}

function ccgNextStep(S, state, step) {
  if (step) return step;
  if (state.closed) return { t: 'closed' };
  if (state.revealed) return { t: S.revealed ? 'revealed' : 'reveal' };
  const days = state.days || [];
  for (let i = 0; i < days.length; i++) if (S.answers[i] === undefined) return { t: 'q', i };
  if (days.length === 4 && !S.guess) return { t: 'guess' };
  return { t: 'wait' };
}

function ccgEmailFields(id) {
  return `<div class="ccg__field"><label for="${id}-em">Email</label><input type="email" id="${id}-em" name="email" autocomplete="email" placeholder="you@email.com" required></div>
    <label class="ccg__consent"><input type="checkbox" name="consent" required><span>I agree to receive emails from Port St. Lucie SC about the Charter Collection and club news. Unsubscribe anytime.</span></label>`;
}

function ccgPanelHTML(st, S, state) {
  const days = state.days || [];
  const clues = state.revealed && S.revealed ? 4 : Object.keys(S.answers).length;
  switch (st.t) {
    case 'q': {
      const D = days[st.i];
      const head = st.i < state.day
        ? `<span class="ccg__label">Catching up · ${ccgEsc(D.full)}&rsquo;s question</span>`
        : `<span class="ccg__kicker">${ccgEsc(D.full)} · Question ${st.i + 1} of 4</span>`;
      return `${head}<h2 tabindex="-1">${ccgEsc(D.q)}</h2>
        <div class="ccg__opts">${D.opts.map((o, k) => `<button type="button" class="ccg__opt" data-k="${k}"><span>${ccgEsc(o)}</span><i>${'ABCD'[k]}</i></button>`).join('')}</div>
        <p class="ccg__label">Right or wrong, you unlock today&rsquo;s clue: ${ccgEsc(D.clueTitle)}.</p>`;
    }
    case 'result': {
      const D = days[st.i];
      const ok = S.answers[st.i] === D.a;
      return `<span class="ccg__kicker">${ccgEsc(D.full)} · Question ${st.i + 1} of 4</span><h2 tabindex="-1">${ccgEsc(D.q)}</h2>
        <div class="ccg__opts">${D.opts.map((o, k) => `<button type="button" class="ccg__opt ${k === D.a ? 'is-right' : (k === S.answers[st.i] ? 'is-wrong' : '')}" disabled><span>${ccgEsc(o)}</span><i>${k === D.a ? 'Answer' : 'ABCD'[k]}</i></button>`).join('')}</div>
        <div class="ccg__result ${ok ? 'is-ok' : ''}"><b>${ok ? 'That&rsquo;s right.' : 'Not quite.'}</b><p>${ccgEsc(D.fact)}</p></div>
        <div class="ccg__clue"><span>Clue unlocked · ${ccgEsc(D.clueTitle)}</span><p>${ccgEsc(D.clue)}</p></div>
        <div class="ccg__row"><button type="button" class="psl-btn cta-primary" data-act="continue">Continue</button></div>`;
    }
    case 'claim':
      return `<span class="ccg__kicker">Free · takes 10 seconds</span><h2 tabindex="-1">Claim your Collector Card</h2>
        <p class="ccg__panel-lead">Leave your email and get your own card in the Charter Collection.</p>
        <ul class="ccg__gets"><li>Your Collector Card, right now</li><li>An email when the next clue unlocks</li><li>A reminder on reveal day</li></ul>
        <form class="ccg__form" data-form="claim" novalidate>${ccgEmailFields('ccg-claim')}
          <p class="ccg__err" data-err hidden></p>
          <div class="ccg__row"><button class="psl-btn cta-primary" type="submit">Claim my card</button><button type="button" class="ccg__link" data-act="skip">Keep playing without saving</button></div>
        </form>`;
    case 'collector':
      return `<span class="ccg__kicker">${S.founder ? 'Special edition' : 'Card claimed'}</span><h2 tabindex="-1">${S.founder ? `Founding Member No. ${ccgPad(S.founder.no)}` : 'You&rsquo;re an Inaugural Collector'}</h2>
        <div class="ccg__split"><psl-card class="ccg__mini" flippable data-ccg-collector></psl-card>
          <div style="display:grid;gap:14px;min-width:0"><p class="ccg__panel-lead">${S.founder ? 'Your Founding Member number makes this card one of a kind.' : 'This one is yours.'} Add your name and a photo, then share it.</p>
            <div data-ccg-capture-slot></div>
            <div class="ccg__row"><button type="button" class="psl-btn cta-primary" data-act="continue">Back to the game</button><button type="button" class="ccg__ghost" data-act="share">Share</button></div></div></div>`;
    case 'guess':
      return `<span class="ccg__kicker">Thursday · Last step before the reveal</span><h2 tabindex="-1">Lock in your guess</h2>
        <p class="ccg__panel-lead">You have all four clues. Who is card No. 001? We&rsquo;ll tell you Friday at 10:00 AM ET if you got it right.</p>
        <form class="ccg__form" data-form="guess" novalidate>
          <div class="ccg__field"><label for="ccg-guess">Your guess</label><input type="text" id="ccg-guess" name="guess" placeholder="Full name" autocomplete="off" required></div>
          ${S.email ? '' : ccgEmailFields('ccg-guess')}
          <p class="ccg__err" data-err hidden></p>
          <div class="ccg__row"><button class="psl-btn cta-primary" type="submit">Lock it in</button></div>
        </form>`;
    case 'wait': {
      const allDone = clues === 4;
      const next = CCG_FULL_NAMES[state.day + 1] || 'Friday';
      return `<span class="ccg__kicker">${allDone ? 'Guess locked' : 'Done for today'}</span>
        <h2 tabindex="-1">${allDone ? 'See you Friday.' : `Next clue: ${next}, 10:00 AM ET`}</h2>
        <div class="ccg__split"><div class="ccg__count">${clues}/4</div><p class="ccg__panel-lead">${allDone
          ? `Your guess: <b>${ccgEsc(S.guess)}</b>. The full card drops Friday at 10:00 AM ET.`
          : `clues unlocked. ${S.email ? 'We&rsquo;ll email you when the next one is live.' : 'Claim your card to get an email when the next clue is live.'}`}</p></div>
        <div class="ccg__row">${S.email ? '<button type="button" class="ccg__ghost" data-act="mycard">My Collector Card</button>' : '<button type="button" class="psl-btn cta-primary" data-act="claim">Claim my card</button>'}</div>`;
    }
    case 'reveal':
      return `<span class="ccg__kicker">Friday · 10:00 AM ET</span><h2 tabindex="-1">Card No. 001 is ready.</h2>
        <p class="ccg__panel-lead">${clues} of 4 clues unlocked${S.guess ? ` · your guess: <b>${ccgEsc(S.guess)}</b>` : ''}.</p>
        <div class="ccg__row"><button type="button" class="psl-btn cta-primary" data-act="reveal">Reveal card No. 001</button></div>`;
    case 'revealed':
    case 'closed': {
      const hit = ccgGuessHit(S, state);
      const verdict = S.guess && !state.closed ? (hit ? '<b>You called it.</b> ' : 'Not this time. ') : '';
      const mine = S.email
        ? '<button type="button" class="ccg__ghost" data-act="mycard">My Collector Card</button>'
        : (state.closed ? '' : '<button type="button" class="ccg__ghost" data-act="claim">Claim my card</button>');
      return `<p class="ccg__panel-lead">${verdict}The first Head Coach in Port St. Lucie SC history.</p>
        <div class="ccg__row"><a class="psl-btn cta-primary" href="${ccgEsc(state.coachUrl)}"><span>Meet the coach</span> <span aria-hidden="true">→</span></a><a class="psl-btn cta-secondary" href="${ccgEsc(state.teamUrl)}">Meet the team</a>${mine}</div>`;
    }
    default:
      return '';
  }
}

/* Collector Card en 9:16 para Stories: se dibuja en canvas (mismo camino que el pase de founder-id) */
function ccgRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function ccgLoadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
// Duotono en píxeles: el filtro del canvas no anda en todos los Safari.
function ccgDuotone(img, w, h, [dark, light]) {
  const c = document.createElement('canvas');
  c.width = Math.round(w);
  c.height = Math.round(h);
  const ctx = c.getContext('2d');
  const scale = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  ctx.drawImage(img, (c.width - dw) / 2, (c.height - dh) * .4, dw, dh);
  const px = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < px.data.length; i += 4) {
    const l = (px.data[i] * .3 + px.data[i + 1] * .59 + px.data[i + 2] * .11) / 255;
    for (let k = 0; k < 3; k++) px.data[i + k] = dark[k] + (light[k] - dark[k]) * l;
  }
  ctx.putImageData(px, 0, 0);
  return c;
}
async function ccgDrawStory(canvas, S, state, fan) {
  await Promise.all(['900 120px Druk', '800 30px "Druk Text Wide"', '500 30px "Druk Text Wide"'].map((f) => document.fonts.load(f)));
  const crest = await ccgLoadImage(CCG_CREST);
  const club = await ccgLoadImage(CCG_COLLECTOR_PHOTO);
  const cutout = fan.cutout ? await ccgLoadImage(fan.cutout) : null;
  const photo = !cutout && fan.photo ? await ccgLoadImage(fan.photo) : null;
  const f = S.founder;
  const no = f && ccgPad(f.no);
  const ctx = canvas.getContext('2d');
  const W = 1080, H = 1920, AQUA = '#AAF6E6', GOLD = '#D8C27E';

  ctx.fillStyle = '#0C0C0A';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 880, 0, W / 2, 880, 900);
  glow.addColorStop(0, 'rgba(170,246,230,.28)');
  glow.addColorStop(1, 'rgba(170,246,230,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = AQUA;
  ctx.font = '800 28px "Druk Text Wide"';
  ctx.fillText('CHARTER COLLECTION', W / 2, 150);
  ctx.fillStyle = '#F3F0EA';
  ctx.font = '900 132px Druk';
  const hit = ccgGuessHit(S, state);
  const lines = hit ? ['I CALLED IT.', 'CARD NO. 001'] : (f ? ['FOUNDING MEMBER', `NO. ${no}`] : ['I\u2019M AN INAUGURAL', 'COLLECTOR']);
  ctx.fillText(lines[0], W / 2, 300);
  ctx.fillText(lines[1], W / 2, 430);

  // Carta
  const cw = 680, ch = cw * 88 / 63, cx = (W - cw) / 2, cy = 520;
  const u = cw / 100;   // 1 u = 1cqw de la carta
  let border = AQUA;
  if (f) {
    border = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
    [[0, '#F3E2A6'], [.3, '#B8984A'], [.52, '#FFF3C9'], [.74, '#9C8646'], [1, '#E9D38C']].forEach(([at, col]) => border.addColorStop(at, col));
  }
  ctx.fillStyle = border;
  ccgRoundRect(ctx, cx, cy, cw, ch, 3.4 * u);
  ctx.fill();
  ctx.save();
  ccgRoundRect(ctx, cx + 3.6 * u, cy + 3.6 * u, cw - 7.2 * u, ch - 7.2 * u, 1.6 * u);
  ctx.clip();
  const wx = cx + 3.6 * u, wy = cy + 3.6 * u, ww = cw - 7.2 * u, wh = ch - 7.2 * u;
  if (photo) {
    ctx.drawImage(photo, wx, wy, ww, wh);
  } else {
    ctx.drawImage(ccgDuotone(club, ww, wh, f ? [[26, 20, 8], [201, 169, 91]] : [[6, 21, 19], [95, 211, 190]]), wx, wy, ww, wh);
    ctx.fillStyle = f ? 'rgba(216,194,126,.12)' : 'rgba(170,246,230,.1)';
    for (let y = cy + 12; y < cy + ch; y += 30) {
      for (let x = cx + 14; x < cx + cw; x += 84) {
        ctx.beginPath();
        ctx.roundRect(x, y, 62, 16, 4);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  if (cutout) {
    const hCut = 102 * u, wCut = hCut * cutout.naturalWidth / cutout.naturalHeight;
    ctx.drawImage(cutout, W / 2 - wCut / 2, cy + ch - 29.5 * u - hCut, wCut, hCut);
  } else if (!photo) {
    const cwCrest = 54 * u, chCrest = cwCrest * crest.naturalHeight / crest.naturalWidth;
    ctx.drawImage(crest, W / 2 - cwCrest / 2, cy + ch - 46 * u - chCrest, cwCrest, chCrest);
  }

  // Banner con corte de rayo
  const bx = cx + 3.6 * u, bw = cw - 7.2 * u, bh = 31.8 * u, by = cy + ch - 3.6 * u - bh;
  const hl = f ? GOLD : AQUA;
  const line = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  (f ? [[0, '#9C8646'], [.5, '#FFF3C9'], [1, '#9C8646']] : [[0, AQUA], [.5, '#FF0033'], [1, AQUA]]).forEach(([at, col]) => line.addColorStop(at, col));
  ctx.fillStyle = line;
  ctx.fillRect(bx, by + 3.8 * u, bw, 1.6 * u);
  ctx.fillStyle = '#0C0C0A';
  ctx.fillRect(bx, by + 5.4 * u, bw, bh - 5.4 * u);
  // Marco y sellos, como en la carta
  ctx.strokeStyle = hl;
  ctx.lineWidth = .5 * u;
  ctx.strokeRect(cx + 7.6 * u, cy + 20.6 * u, cw - 15.2 * u, ch - 20.6 * u - 34.6 * u);
  const words = ['COLLECTOR', 'WEEK ONE', f ? 'FOUNDER' : 'CARD 001'];
  ctx.textAlign = 'center';
  ctx.font = `800 ${2.4 * u}px "Druk Text Wide"`;
  words.forEach((word, i) => {
    const sw = ctx.measureText(word).width + 4 * u;
    const sx = cx + cw - 5.8 * u - sw;
    const sy = cy + ch - 36.5 * u - (3 - i) * 5.6 * u;
    ctx.fillStyle = 'rgba(12,12,10,.9)';
    ccgRoundRect(ctx, sx, sy, sw, 4.6 * u, .9 * u);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(word, sx + sw / 2, sy + 3.2 * u);
  });

  ctx.textAlign = 'left';
  const tx = bx + 4 * u;
  ctx.fillStyle = hl;
  ctx.font = `800 ${2.5 * u}px "Druk Text Wide"`;
  ctx.fillText(f ? `FOUNDING MEMBER #${no}` : 'INAUGURAL COLLECTOR', tx, by + 16.4 * u);
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${10 * u}px Druk`;
  ctx.fillText((fan.name || 'Your name').toUpperCase(), tx, by + 25.4 * u, bw - 8 * u);
  ctx.fillStyle = 'rgba(255,255,255,.66)';
  ctx.font = `500 ${2.2 * u}px "Druk Text Wide"`;
  ctx.fillText('PORT ST. LUCIE SC | 2027', tx, by + 28.8 * u);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(243,240,234,.66)';
  ctx.font = '500 26px "Druk Text Wide"';
  ctx.fillText('PORTSTLUCIESC.COM', W / 2, 1760);
}

async function ccgShareStory(canvas) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('toBlob returned null');
  const file = new File([blob], 'pslsc-collector-card.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function initHeroColeccion(root = document) {
  const hero = root.querySelector('.hcc');
  if (!hero) return;
  await Promise.all([customElements.whenDefined('psl-card'), customElements.whenDefined('psl-photo-capture')]);
  const $ = (s) => hero.querySelector(s);
  const panel = $('[data-ccg-panel]');
  const cardEl = $('[data-ccg-card]');
  const capture = $('[data-ccg-capture]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let state = null;
  const src = hero.dataset.ccState;
  if (src && !src.startsWith('__')) {
    try {
      const res = await fetch(src, { cache: 'no-store', headers: { Accept: 'application/json' } });   // cambia por fecha: nunca de caché
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state = await res.json();
    } catch (err) {
      console.error('[charter] no se pudo leer el estado del juego', err);
    }
  }
  if (!state) {
    cardEl.data = FALLBACK_CARD;
    panel.innerHTML = '<h2>A new clue every day</h2><p class="ccg__panel-lead">The game could not load. Please try again in a moment.</p>';
    return;
  }
  state.coachUrl = hero.dataset.ccCoach;
  state.teamUrl = hero.dataset.ccTeam;
  const photo = $('[data-cc-photo]');
  if (state.presentation) { photo.src = state.presentation.src; photo.alt = state.presentation.alt || ''; }

  const S = ccgLoad();
  // Una respuesta guardada de un día que la fuente ya no libera (ej. reloj o pruebas) no cuenta.
  Object.keys(S.answers).forEach((k) => { if (!state.days?.[k]) delete S.answers[k]; });
  if (!state.revealed) S.revealed = false;
  if (state.closed) S.revealed = true;

  let step = null;
  let lastCardKey = '';
  let flashZone = null;
  let spinning = false;   // el viernes, la carta gira grande antes de pasar al hero del coach

  function paintCard() {
    const card = ccgComposeCard(state, S, null);
    const key = JSON.stringify(card);
    if (key !== lastCardKey || flashZone) {
      lastCardKey = key;
      const autoFlip = flashZone === 'career' || flashZone === 'fact';
      cardEl.flip(false);
      cardEl.data = ccgComposeCard(state, S, flashZone);
      if (autoFlip) requestAnimationFrame(() => requestAnimationFrame(() => cardEl.flip(true)));
      flashZone = null;
    }
    const clues = state.revealed && S.revealed ? 'Card No. 001' : `${Object.keys(S.answers).length} of 4 clues`;
    $('[data-ccg-count]').textContent = clues;
  }

  function goTo(target) {
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function paint(scrollTarget) {
    paintCard();
    const shown = state.revealed && S.revealed;
    const coach = shown && !spinning && Boolean(state.presentation);
    hero.classList.toggle('hcc--coach', coach);
    $('[data-cc-kicker]').textContent = shown ? 'Our first Head Coach' : 'Charter Collection · No. 001';
    $('[data-cc-title]').textContent = shown ? `${state.card.first} ${state.card.last}` : 'Who is our first Head Coach?';
    $('[data-cc-sub]').hidden = shown;
    $('[data-cc-more]').hidden = shown;
    const st = ccgNextStep(S, state, step);
    hero.classList.toggle('hcc--asking', st.t === 'q');   // mobile: carta chica para que entre la pregunta
    hero.classList.toggle('hcc--step', Boolean(step));    // un paso abierto (mail, Collector) lleva panel
    hero.append(capture);   // el único <psl-photo-capture>: conserva la foto entre pasos
    capture.hidden = true;
    panel.innerHTML = ccgPanelHTML(st, S, state);
    bindPanel(st);
    if (scrollTarget && innerWidth <= 860) goTo(scrollTarget);
  }

  function showError(form, msg) {
    const err = form.querySelector('[data-err]');
    err.textContent = msg;
    err.hidden = false;
  }

  function bindPanel(st) {
    panel.querySelectorAll('.ccg__opt[data-k]').forEach((b) => {
      b.addEventListener('click', () => {
        S.answers[st.i] = Number(b.dataset.k);
        flashZone = state.days[st.i].zone;
        step = { t: 'result', i: st.i };
        ccgSave(S);
        paint($('.ccg__card-col'));
        // Mobile: primero se ve la carta destrabándose; después baja a la respuesta y la pista.
        if (innerWidth <= 860) setTimeout(() => panel.querySelector('.ccg__result')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }), reduce ? 0 : 1300);
      });
    });

    panel.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        const a = b.dataset.act;
        if (a === 'share') { openShare(); return; }
        if (a === 'reveal') {
          S.revealed = true;
          step = null;
          ccgSave(S);
          spinning = !reduce;
          paint();
          cardEl.reveal();
          if (spinning) setTimeout(() => { spinning = false; paint(); }, 1700);
          return;
        }
        if (a === 'continue') step = step?.t === 'result' && !S.email && !S.skipClaim ? { t: 'claim' } : null;
        if (a === 'skip') { S.skipClaim = true; step = null; }
        if (a === 'claim') step = { t: 'claim' };
        if (a === 'mycard') step = { t: 'collector' };
        ccgSave(S);
        paint(panel);
      });
    });

    const collector = panel.querySelector('[data-ccg-collector]');
    if (collector) {
      collector.data = ccgCollectorCard(S, capture.fan);
      capture.stage = collector;
      capture.hidden = false;
      panel.querySelector('[data-ccg-capture-slot]').append(capture);
    }

    panel.querySelectorAll('[data-form]').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isGuess = form.dataset.form === 'guess';
        const guess = isGuess ? form.elements.guess.value.trim() : null;
        if (isGuess && !guess) { showError(form, 'Type a name to lock in your guess.'); return; }
        let email = S.email;
        if (form.elements.email) {
          email = form.elements.email.value.trim();
          if (!CCG_EMAIL.test(email)) { showError(form, 'Enter a valid email, like name@email.com.'); return; }
          if (!form.elements.consent.checked) { showError(form, 'Tick the box to agree to receive emails.'); return; }
        }
        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        try {
          await ccgSendLead(hero, { email, guess });
        } catch (err) {
          submit.disabled = false;
          showError(form, err.message);
          return;
        }
        S.email = email;
        S.founder = await ccgFounderLookup(email);
        if (isGuess) { S.guess = guess; step = null; } else { step = { t: 'collector' }; }
        ccgSave(S);
        paint(panel);
      });
    });
  }

  /* Compartir */
  const dialog = $('[data-ccg-share]');
  const shareMsg = $('[data-ccg-share-msg]');
  const shareGo = $('[data-ccg-share-go]');
  const story = $('[data-ccg-story]');
  async function openShare() {
    shareMsg.hidden = true;
    shareGo.disabled = true;
    dialog.showModal();
    try {
      await ccgDrawStory(story, S, state, capture.fan);
      shareGo.disabled = false;
    } catch (err) {
      console.error('[charter] no se pudo armar la imagen', err);
      shareMsg.textContent = 'We could not create your image. Please try again in a moment.';
      shareMsg.hidden = false;
    }
  }
  $('[data-ccg-share-close]').addEventListener('click', () => dialog.close());
  shareGo.addEventListener('click', async () => {
    try {
      await ccgShareStory(story);
    } catch (err) {
      if (err.name === 'AbortError') return;   // canceló el menú de compartir: no es un fallo
      shareMsg.textContent = 'We could not share your image. Please try again in a moment.';
      shareMsg.hidden = false;
    }
  });
  capture.addEventListener('fanchange', (e) => {
    const collector = panel.querySelector('[data-ccg-collector]');
    if (collector) collector.data = ccgCollectorCard(S, e.detail);
  });
  // Baja a lo que sigue del hero, sea cual sea el bloque siguiente en WordPress.
  $('[data-cc-more]').addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: hero.getBoundingClientRect().bottom + window.scrollY - 64, behavior: reduce ? 'auto' : 'smooth' });
  });
  $('[data-ccg-flip]').addEventListener('click', () => cardEl.flip());

  paint();
}

export { initHeroColeccion };
