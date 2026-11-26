/**
 * Bloque 01b · Hero de campaña — Charter Collection. El juego se juega acá, en el hero de la home.
 *
 * Estado que entrega la fuente (data-cc-state), solo con lo liberado a esa hora:
 *   { day: 0..5, revealed, closed, card, shell?, days: [...], presentation?, profile? }
 *   - card: carta para mostrar. De lunes a jueves es la cerrada; desde el viernes, la revelada.
 *   - shell: el viernes, la carta cerrada (de ahí arranca quien todavía no apretó "Reveal").
 *   - days[i]: { full, zone, clueTitle, q?, opts?, a?, fact?, clue, unlock }. El juego aplica `unlock`
 *     a la carta cuando la persona contesta esa pregunta. Un día sin `q` (el lunes) es una pista libre: se destraba
 *     sola al publicarse. `a` y `fact` delatan la respuesta: la fuente los manda recién al cierre del challenge.
 *   - presentation: { src, alt }, foto de presentación. Pasado el reveal el protagonista es la persona:
 *     el hero muestra la foto y la carta queda como accesorio chico.
 *   - closed: del sábado en adelante. Las preguntas se cierran y no hace falta apretar "Reveal".
 * El progreso queda en localStorage: la colección con login es de la etapa siguiente.
 *
 * Coach Reveal Challenge (bases oficiales en el <dialog> del HTML): tres preguntas oficiales, viernes a domingo.
 * Para competir por los premios la persona se inscribe antes de la primera (mail, 18+ y Florida, acepta las bases);
 * cada respuesta se manda a __CHALLENGE_API__ con ese mail y la registra el servidor con su hora: los ganadores los
 * calcula el servidor (docs/charter-collection-challenge.md). Quien no se inscribe juega igual, solo por las pistas.
 * Hasta el cierre (lunes 12:00 PM ET) no se muestra si la respuesta es correcta: solo cuenta la primera.
 *
 * Mail de la Collector: un solo pedido, para reclamarla, en el mismo panel del hero (WordPress no deja editar pop-ups):
 * el panel pasa solo al reclamo después de la primera respuesta (si la persona no lo cierra con "Not now") y queda a
 * mano con "Claim my Collector Card". Se reclama como Inaugural Collector; Founding Member se ajusta después. No hay apuesta: después de la cuarta
 * pregunta se espera el reveal del viernes. Sin config de ActiveCampaign valida pero NO envía ni finge éxito;
 * ?demo simula el envío. La etiqueta y el mail con la carta los pone ActiveCampaign.
 *
 * Collector Card y progreso en el dispositivo: custom/card/charter.js (compartido con Mi colección).
 * Sin fuente (o si falla) queda la carta genérica de abajo y un aviso: el hero nunca se rompe.
 */
import { CHARTER_CREST, CHARTER_COLLECTOR_PHOTO, CHARTER_EMAIL, charterLoad, charterSave, charterPad, charterCollectorCard, charterSendLead } from '../../custom/card/charter.js';

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
    table: { locked: true, unlock: 'Unlocks Saturday' },
    fact: { locked: true, unlock: 'Unlocks Monday' },
  },
};
// Calendario de la campaña (viernes 27 a lunes 30/11/2026): una pregunta por día de viernes a lunes a las 10:00 AM ET y el reveal el
// lunes a la 1:00 PM ET. Índices 0–3 = días del quiz, 4 = día del reveal. Se usa en todo el copy del hero y del panel.
const CCG_FULL_NAMES = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Monday'];
const CCG_SHORT_NAMES = ['Fri', 'Sat', 'Sun', 'Mon', 'Mon'];
const CCG_TIME = '10:00 AM ET';
const CCG_REVEAL_DAY = CCG_FULL_NAMES[4];
const CCG_REVEAL_TIME = '1:00 PM ET';
const CCG_REVEAL = `${CCG_REVEAL_DAY} at ${CCG_REVEAL_TIME}`;
const CCG_KICKER = 'First in club history';
// Coach Reveal Challenge. El cierre de las bases: lunes 30/11/2026 a las 12:00 PM ET. El servidor es el que manda
// (rechaza lo que llega tarde); esto solo evita ofrecer la inscripción cuando ya no corre.
const CCG_DEADLINE = Date.parse('2026-11-30T12:00:00-05:00');
const CCG_DEADLINE_TEXT = 'Monday at 12:00 PM ET';
const CCG_RESULTS_BY = 'Thursday, December 3';
const CCG_PRIZES = [
  ['1st', 'Two general admission tickets to our first home match of the 2027 season'],
  ['2nd', 'A jersey signed by the Head Coach'],
  ['3rd', 'A PSLSC umbrella and scarf set'],
];
const ccgEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const ccgIsQ = (D) => Boolean(D && D.q);
// Número oficial de la pregunta (1, 2, 3): las bases las numeran sin contar el día de pista libre.
const ccgQNum = (state, i) => (state.days || []).slice(0, i + 1).filter(ccgIsQ).length;
const ccgQTotal = 3;
// Pistas destrabadas: las preguntas contestadas más los días de pista libre ya publicados.
const ccgClues = (S, state) => (state.days || []).filter((D, i) => !ccgIsQ(D) || S.answers[i] !== undefined).length;
const ccgOpen = (state) => !state.revealed && !state.closed && !state.challengeClosed && Date.now() < CCG_DEADLINE;
// Al cierre la fuente suma `a` a cada pregunta: recién ahí se puede decir cuántas acertó.
const ccgResultsReady = (state) => (state.days || []).some((D) => ccgIsQ(D) && D.a !== undefined);

/* Registro del challenge: una llamada por respuesta, con el mail de la inscripción. El servidor guarda la hora en que
   la recibe y si es la primera de ese mail para esa pregunta. ?demo simula el envío. */
async function ccgSubmitAnswer(hero, body) {
  if (new URLSearchParams(location.search).has('demo')) return { ok: true, first: true };
  const api = hero.dataset.challengeApi;
  if (!api || api.startsWith('__')) {
    console.error('[charter] Falta __CHALLENGE_API__: la respuesta NO se registró.');
    throw new Error('Entries are not open right now. Please try again later.');
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  let res;
  let data = null;
  try {
    res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), signal: ctl.signal, cache: 'no-store' });
    data = await res.json().catch(() => null);
  } catch (err) {
    console.error('[charter] el registro del challenge no respondió', err);
    throw new Error('We could not reach our server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'We could not save your answer. Please try again in a moment.');
  return data;
}

// Founding Member: el hero no lo asigna. Hoy no hay forma de saber quién es founder; la carta se reclama como
// Inaugural Collector y se ajusta a Founding Member más adelante, cuando el servidor de Mi colección lo responda
// (S.founder llega de /verify o /me). Si ya llegó, el hero muestra la versión gold.

/* Carta de la persona: la cerrada + lo que destrabó contestando */
function ccgComposeCard(state, S, flashZone) {
  if (state.revealed && S.revealed) return state.card;
  const card = JSON.parse(JSON.stringify(state.shell || state.card));
  (state.days || []).forEach((day, i) => {
    if ((ccgIsQ(day) && S.answers[i] === undefined) || !day.unlock) return;
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

function ccgNextStep(S, state, step) {
  if (step) return step;
  if (state.closed) return { t: 'closed' };
  if (state.revealed) return { t: S.revealed ? 'revealed' : 'reveal' };
  const days = state.days || [];
  for (let i = 0; i < days.length; i++) {
    if (!ccgIsQ(days[i]) || S.answers[i] !== undefined) continue;
    // Antes de la primera respuesta, la inscripción al challenge (una vez: inscripto o "solo por las pistas")
    if (!S.entry && !S.skipEntry && ccgOpen(state)) return { t: 'enter' };
    return { t: 'q', i };
  }
  return { t: 'wait' };
}

/* Copy del hero según dónde está la persona. El título (h1) no cambia hasta el reveal: no hay salto de layout
   y es lo que se comparte. Cambian el kicker y la bajada. Nunca revela nada de la carta. */
function ccgHeroCopy(S, state) {
  const st = ccgNextStep(S, state, null);
  const kicker = CCG_KICKER;
  switch (st.t) {
    case 'enter':
      return { kicker, sub: `Three questions about the club, ${CCG_FULL_NAMES[0]} to ${CCG_FULL_NAMES[2]}. Every answer unlocks a clue to Card No. 001, and the first three fans to get all three right win prizes. Full reveal ${CCG_REVEAL}.` };
    case 'q': {
      const n = ccgQNum(state, st.i);
      const today = (state.days || []).slice(0, state.day + 1).filter(ccgIsQ).length;
      if (state.day >= 3) {   // lunes: ya no hay pregunta nueva, solo la pista libre
        const left = ccgQTotal - n + 1;
        return { kicker, sub: `Joining on ${CCG_FULL_NAMES[3]}? Catch up first: ${left} question${left > 1 ? 's' : ''} to go, then today’s free clue.` };
      }
      if (n < today) {
        const left = today - n + 1;
        return { kicker, sub: `Joining on ${CCG_FULL_NAMES[state.day]}? Catch up first: ${left} question${left > 1 ? 's' : ''} to go.` };
      }
      if (n === ccgQTotal) return { kicker, sub: `Last question. The final clue drops ${CCG_FULL_NAMES[3]} at ${CCG_TIME}, the full card at ${CCG_REVEAL_TIME}.` };
      return { kicker, sub: `Question ${n} of ${ccgQTotal}. Today’s answer unlocks a new clue. Full reveal ${CCG_REVEAL}.` };
    }
    case 'wait': {
      const clues = ccgClues(S, state);
      if (clues === 4) return { kicker, sub: `All four clues are in. Card No. 001 drops ${CCG_REVEAL}.` };
      if (state.day >= 2) return { kicker, sub: `All three answers are in. The final clue drops ${CCG_FULL_NAMES[3]} at ${CCG_TIME}, the full card at ${CCG_REVEAL_TIME}.` };
      return { kicker, sub: `Today’s clue is yours. A new question drops tomorrow at ${CCG_TIME}. Full reveal ${CCG_REVEAL}.` };
    }
    case 'reveal':
      return { kicker: 'Reveal day', sub: 'Three questions, four clues, one card. Time to meet the first Head Coach in club history.' };
    default:
      return { kicker, sub: '' };
  }
}

/* Los días del quiz, a la vista: qué días ya jugaste, cuál es hoy, cuál viene mañana y el reveal */
function ccgTrackHTML(S, state, current) {
  const short = CCG_SHORT_NAMES;
  const items = [0, 1, 2, 3].map((i) => {
    let cls; let txt;
    const D = (state.days || [])[i];
    if (D && !ccgIsQ(D)) { cls = 'is-done'; txt = 'Clue'; }   // pista libre ya publicada
    else if (S.answers[i] !== undefined) { cls = 'is-done'; txt = 'Done'; }
    else if (i === current) { cls = 'is-now'; txt = i < state.day ? 'Catch up' : 'Today'; }
    else if (i <= state.day) { cls = 'is-open'; txt = i === state.day ? 'Today' : 'Open'; }
    else { cls = 'is-locked'; txt = i === state.day + 1 ? 'Tomorrow' : (i === 3 ? 'Last clue' : 'Locked'); }
    return `<li class="${cls}"><span>${short[i]}</span><b>${txt}</b></li>`;
  });
  items.push(`<li class="is-reveal"><span>${short[4]}</span><b>Reveal</b></li>`);
  return `<ol class="ccg__track" aria-label="Coach Reveal Challenge days">${items.join('')}</ol>`;
}

function ccgEmailFields(id, value = '', consent = true) {
  const email = `<div class="ccg__field"><label for="${id}-em">Email</label><input type="email" id="${id}-em" name="email" autocomplete="email" placeholder="you@email.com" value="${ccgEsc(value)}" required></div>`;
  return consent ? `${email}
    <label class="ccg__consent"><input type="checkbox" name="consent" required><span>I agree to receive emails from Port St. Lucie SC about the Charter Collection and club news. Unsubscribe anytime.</span></label>` : email;
}

const CCG_ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CCG_ICON_MISS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>';
const CCG_MINE_STEPS = ['claim', 'collector', 'share'];   // pasos en los que la carta grande es la tuya
const ccgBtn = (act, label, primary) => `<button type="button" class="psl-btn ${primary ? 'cta-primary' : 'cta-secondary'}" data-act="${act}">${label}</button>`;

// La respuesta, en chico, y la pista que destrabó. Reemplaza a la pregunta y sus opciones. Hasta el cierre del
// challenge no dice si es correcta (ni el dato, que la delata): solo que quedó registrada.
function ccgResultHTML(D, S, i, state) {
  const clue = `<div class="ccg__clue"><span>Clue unlocked · ${ccgEsc(D.clueTitle)}</span><p>${ccgEsc(D.clue)}</p></div>`;
  if (!ccgIsQ(D)) return `<span class="ccg__kicker">${ccgEsc(D.full)} · Free clue</span>${clue}`;
  const pick = D.opts?.[S.answers[i]];
  if (D.a !== undefined) {
    const ok = S.answers[i] === D.a;
    return `<div class="ccg__res ${ok ? 'is-ok' : 'is-miss'}"><span class="ccg__mark" aria-hidden="true">${ok ? CCG_ICON_OK : CCG_ICON_MISS}</span>
        <div><h2 tabindex="-1">${ok ? 'That&rsquo;s right.' : 'Not quite.'}</h2><p>${ccgEsc(D.fact)}</p></div></div>${clue}`;
  }
  const sent = S.sent?.[i];
  const lead = sent
    ? `Your answer is in: <b>${ccgEsc(pick)}</b>. Only your first answer counts. Results after the challenge closes, ${CCG_DEADLINE_TEXT}.`
    : `You picked <b>${ccgEsc(pick)}</b>. Playing for the clues, not entered in the challenge.`;
  return `<div class="ccg__res is-in"><span class="ccg__mark" aria-hidden="true">${CCG_ICON_OK}</span>
      <div><h2 tabindex="-1">${sent ? 'Answer received.' : 'Answer saved.'}</h2><p>${lead}</p></div></div>${clue}`;
}

// Resumen del challenge para quien se inscribió, cuando la fuente ya trae las respuestas correctas (después del cierre)
function ccgChallengeSummary(S, state) {
  if (!S.entry || !ccgResultsReady(state)) return '';
  const qs = (state.days || []).map((D, i) => [D, i]).filter(([D]) => ccgIsQ(D));
  const sent = qs.filter(([, i]) => S.sent?.[i]);
  if (!sent.length) return '';
  const right = sent.filter(([D, i]) => S.answers[i] === D.a).length;
  const all = right === ccgQTotal;
  return `<p class="ccg__summary"><b>Coach Reveal Challenge · ${right} of ${ccgQTotal} right.</b> ${all
    ? `You completed the set. If you were among the first three, we&rsquo;ll email you by ${CCG_RESULTS_BY}.`
    : `Thanks for playing. Winners are notified by email by ${CCG_RESULTS_BY}.`}</p>`;
}

// Premios del challenge (también en el diálogo de las bases)
const ccgPrizesHTML = () => `<ol class="ccg__prizes">${CCG_PRIZES.map(([place, prize]) => `<li><b>${place}</b><span>${prize}</span></li>`).join('')}</ol>`;
const ccgRulesLink = (label = 'Official Rules') => `<a href="#official-rules" class="ccg__link" data-rules>${label}</a>`;

function ccgPanelHTML(st, S, state, ctx = {}) {
  const days = state.days || [];
  const clues = state.revealed && S.revealed ? 4 : ccgClues(S, state);
  switch (st.t) {
    case 'q': {
      const D = days[st.i];
      const n = ccgQNum(state, st.i);
      const head = st.i < state.day
        ? `<span class="ccg__kicker">Question ${n} of ${ccgQTotal} · Catching up · ${ccgEsc(D.full)}</span>`
        : `<span class="ccg__kicker">Coach Reveal Challenge · Question ${n} of ${ccgQTotal}</span>`;
      const entered = S.entry && ccgOpen(state);
      let note;
      if (entered) note = `<p class="ccg__label">Only your first answer counts. Either way, it unlocks a clue: ${ccgEsc(D.clueTitle)}.</p>`;
      else if (ccgOpen(state)) note = `<p class="ccg__label">Playing for the clues. Every answer unlocks one: ${ccgEsc(D.clueTitle)}.</p><div class="ccg__row">${ccgBtn('enter', 'Enter the challenge for prizes')}</div>`;
      else note = `<p class="ccg__label">${S.entry ? `The challenge closed ${CCG_DEADLINE_TEXT}. ` : ''}Every answer still unlocks a clue: ${ccgEsc(D.clueTitle)}.</p>`;
      return `${ccgTrackHTML(S, state, st.i)}${head}<h2 class="ccg__q" tabindex="-1">${ccgEsc(D.q)}</h2>
        <div class="ccg__opts">${D.opts.map((o, k) => `<button type="button" class="ccg__opt" data-k="${k}"><span>${ccgEsc(o)}</span><i aria-hidden="true">${'ABCD'[k]}</i></button>`).join('')}</div>
        <p class="ccg__err" data-err role="alert" hidden></p>${note}`;
    }
    // Inscripción al Coach Reveal Challenge, antes de la primera pregunta
    case 'enter':
      return `<span class="ccg__kicker">Coach Reveal Challenge</span><h2 tabindex="-1">Three questions. Three prizes.</h2>
        <p class="ccg__panel-lead">Get all three right by ${CCG_DEADLINE_TEXT}. The first three fans to complete the set win.</p>
        ${ccgPrizesHTML()}
        <form class="ccg__form" data-form="enter" novalidate>${ccgEmailFields('ccg-enter', S.email || '', false)}
          <label class="ccg__consent"><input type="checkbox" name="eligible" required><span>I&rsquo;m 18 or older and a Florida resident.</span></label>
          <label class="ccg__consent"><input type="checkbox" name="rules" required><span>I agree to the ${ccgRulesLink()}.</span></label>
          <label class="ccg__consent"><input type="checkbox" name="consent"><span>Also send me Charter Collection and club news by email. Optional, unsubscribe anytime.</span></label>
          <p class="ccg__err" data-err role="alert" hidden></p>
          <div class="ccg__row"><button class="psl-btn cta-primary" type="submit">Enter and play</button>${ccgBtn('skip', 'Just play for the clues')}</div>
          <p class="ccg__fine">No purchase or ticket deposit necessary. Use this same email for every answer.</p>
        </form>`;
    // Recién contestada (answered) o volviendo más tarde el mismo día (wait): la respuesta y la pista, y abajo lo que sigue.
    case 'answered':
    case 'wait': {
      // La última pista destrabada: la respuesta recién dada o, al volver, el último día publicado que ya tenés
      const got = days.map((D, k) => k).filter((k) => !ccgIsQ(days[k]) || S.answers[k] !== undefined);
      const i = st.t === 'answered' ? st.i : Math.max(...got);
      const D = days[i];
      if (!D) return '';
      const next = ccgNextStep(S, state, null);
      let foot;
      if (next.t === 'q') foot = `<div class="ccg__row">${ccgBtn('next', 'Next question <span aria-hidden="true">&rarr;</span>', true)}</div>`;
      else {
        // Con las cuatro pistas, lo que sigue es el reveal
        const last = clues === 4 || state.day >= 2;
        const when = last ? `${CCG_REVEAL_DAY}, ${CCG_REVEAL_TIME}` : `${CCG_FULL_NAMES[state.day + 1] || CCG_REVEAL_DAY}, ${CCG_TIME}`;
        foot = `<div class="ccg__next"><p><span class="ccg__label">${last ? 'Full reveal' : 'Next question'}</span><b>${when}</b></p><span class="ccg__tally">${clues} of 4 clues</span></div>
          <div class="ccg__row">${S.email ? ccgBtn('mycard', 'My Collector Card') : ccgBtn('claim', 'Claim my Collector Card', true)}${!S.entry && ccgOpen(state) ? ccgBtn('enter', 'Enter the challenge') : ''}</div>`;
      }
      return ccgTrackHTML(S, state, -1) + ccgResultHTML(D, S, i, state) + foot + ccgChallengeSummary(S, state);
    }
    case 'reveal':
      return `<span class="ccg__kicker">${CCG_REVEAL_DAY} · ${CCG_REVEAL_TIME}</span><h2 tabindex="-1">Card No. 001 is ready.</h2>
        <p class="ccg__panel-lead">${clues
          ? `${clues} of 4 clues unlocked. Time to see who it is.`
          : 'Missed the clues? No problem: the card is ready for everyone.'}</p>
        <div class="ccg__row">${ccgBtn('reveal', 'Reveal card No. 001', true)}</div>${ccgChallengeSummary(S, state)}`;
    case 'revealed':
    case 'closed': {
      // Presentado el coach, el hero es de él: conocerlo a él y al staff. La Collector se reclama solo durante el
      // juego; la Card No. 001 se pide por mail en la ficha del DT.
      const line = state.profile?.summary || 'The first Head Coach in Port St. Lucie SC history.';
      return `<p class="ccg__panel-lead">${ccgEsc(line)}</p>
        <div class="ccg__row"><a class="psl-btn cta-primary" href="${ccgEsc(state.coachUrl)}"><span>Meet the coach</span> <span aria-hidden="true">&rarr;</span></a><a class="psl-btn cta-secondary" href="${ccgEsc(state.teamUrl)}">Meet the staff</a></div>${ccgChallengeSummary(S, state)}`;
    }
    // Reclamar la Collector, la carta reclamada y compartir: pasos del mismo panel (en WordPress no se edita un pop-up)
    case 'claim': {
      const D = st.from !== undefined ? days[st.from] : null;
      const gets = state.revealed
        ? ['Your Collector Card, now and in your inbox', 'Your name and photo on it (they stay on your device)', 'First to know when the next card drops']
        : ['Your Collector Card, now and in your inbox', ccgClues(S, state) < 4 && 'An email when each new clue unlocks', 'A reminder on reveal day'].filter(Boolean);
      return `${D ? `<p class="ccg__clue-mini"><b>Clue unlocked · ${ccgEsc(D.clueTitle)}</b> ${ccgEsc(D.clue)}</p>` : ''}
        <div class="ccg__m-copy"><span class="ccg__kicker">Free · takes 10 seconds</span><h2 tabindex="-1">Claim your Collector Card</h2>
          <p class="ccg__panel-lead">Your own card in the Charter Collection. We&rsquo;ll email it to you, too.</p>
          <ul class="ccg__gets">${gets.map((g) => `<li>${g}</li>`).join('')}</ul></div>
        <form class="ccg__form" data-form="claim" novalidate>${ccgEmailFields('ccg-claim', S.entry?.email || '')}
          <p class="ccg__err" data-err role="alert" hidden></p>
          <div class="ccg__row"><button class="psl-btn cta-primary" type="submit">Claim my card</button>${ccgBtn('close', 'Not now')}</div>
        </form>`;
    }
    case 'collector':
      return `<div class="ccg__m-copy"><span class="ccg__kicker">${S.founder ? 'Special edition' : 'Card claimed'}</span>
          <h2 tabindex="-1">${S.founder ? `Founding Member No. ${charterPad(S.founder.no)}` : 'You&rsquo;re an Inaugural Collector'}</h2>
          <p class="ccg__panel-lead">${S.founder ? 'Your Founding Member number makes this card one of a kind.' : 'This one is yours.'} Add your name and a photo, then share it.</p>
          ${ctx.justClaimed ? `<p class="ccg__mail">Your card is on its way to <b>${ccgEsc(S.email)}</b>.</p>` : ''}</div>
        <div data-ccg-capture-slot></div>
        <div class="ccg__row">${ccgBtn('share', 'Share my card', true)}${ccgBtn('close', 'Done')}</div>`;
    case 'share':
      return `<div class="ccg__m-grid"><div class="ccg__m-card ccg__m-shot"><canvas data-ccg-shot width="1080" height="1920"></canvas></div>
        <div class="ccg__m-copy"><span class="ccg__kicker">Share</span><h2 tabindex="-1">Share your card</h2>
          <div class="ccg__seg" role="group" aria-label="Format">
            <button type="button" data-fmt="story" aria-pressed="${ctx.fmt === 'story'}">Story · 9:16</button>
            <button type="button" data-fmt="card" aria-pressed="${ctx.fmt === 'card'}">Card only</button>
          </div>
          <p class="ccg__panel-lead" data-ccg-fmt-hint>${ctx.fmt === 'story' ? 'Full screen, for Instagram and TikTok stories.' : 'Just your card, with a transparent background. Works anywhere.'}</p>
          <p class="ccg__err" data-ccg-share-msg role="alert" hidden></p>
          <div class="ccg__row">${ccgBtn('share-go', 'Share', true)}${ccgBtn('back', 'Back')}</div></div></div>`;
    default:
      return '';
  }
}

/* Imágenes para compartir: la Collector en 9:16 (Stories) o sola, con fondo transparente. Canvas, como el pase de founder-id. */
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
async function ccgShareAssets(fan) {
  await Promise.all(['900 120px Druk', '800 30px "Druk Text Wide"', '500 30px "Druk Text Wide"'].map((f) => document.fonts.load(f)));
  const [crest, club] = await Promise.all([ccgLoadImage(CHARTER_CREST), ccgLoadImage(CHARTER_COLLECTOR_PHOTO)]);
  const cutout = fan.cutout ? await ccgLoadImage(fan.cutout) : null;
  const photo = !cutout && fan.photo ? await ccgLoadImage(fan.photo) : null;
  return { crest, club, cutout, photo };
}
// La carta, con su esquina superior izquierda en (cx, cy) y ancho cw. 1 u = 1cqw de <psl-card>.
function ccgDrawCard(ctx, A, S, fan, cx, cy, cw) {
  const f = S.founder;
  const no = f && charterPad(f.no);
  const AQUA = '#AAF6E6', GOLD = '#D8C27E';
  const ch = cw * 88 / 63, u = cw / 100, mid = cx + cw / 2;
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
  if (A.photo) {
    ctx.drawImage(A.photo, wx, wy, ww, wh);
  } else {
    ctx.drawImage(ccgDuotone(A.club, ww, wh, f ? [[26, 20, 8], [201, 169, 91]] : [[6, 21, 19], [95, 211, 190]]), wx, wy, ww, wh);
    ctx.fillStyle = f ? 'rgba(216,194,126,.12)' : 'rgba(170,246,230,.1)';
    for (let y = cy + 1.8 * u; y < cy + ch; y += 4.4 * u) {
      for (let x = cx + 2 * u; x < cx + cw; x += 12.4 * u) {
        ctx.beginPath();
        ctx.roundRect(x, y, 9.1 * u, 2.4 * u, .6 * u);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  if (A.cutout) {
    const hCut = 102 * u, wCut = hCut * A.cutout.naturalWidth / A.cutout.naturalHeight;
    ctx.drawImage(A.cutout, mid - wCut / 2, cy + ch - 29.5 * u - hCut, wCut, hCut);
  } else if (!A.photo) {
    const cwCrest = 54 * u, chCrest = cwCrest * A.crest.naturalHeight / A.crest.naturalWidth;
    ctx.drawImage(A.crest, mid - cwCrest / 2, cy + ch - 46 * u - chCrest, cwCrest, chCrest);
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
  // Sin nombre no hay placeholder en la imagen: va lo que es la carta (como el dorso).
  ctx.fillText((fan.name || (f ? 'Founder' : 'Collector')).toUpperCase(), tx, by + 25.4 * u, bw - 8 * u);
  ctx.fillStyle = 'rgba(255,255,255,.66)';
  ctx.font = `500 ${2.2 * u}px "Druk Text Wide"`;
  ctx.fillText('PORT ST. LUCIE SC | 2027', tx, by + 28.8 * u);
}
async function ccgDrawShare(canvas, fmt, S, state, fan) {
  const A = await ccgShareAssets(fan);
  const ctx = canvas.getContext('2d');
  if (fmt === 'card') {
    canvas.width = 1080;
    canvas.height = Math.round(1080 * 88 / 63);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ccgDrawCard(ctx, A, S, fan, 0, 0, 1080);
    return;
  }
  const W = 1080, H = 1920;
  canvas.width = W;
  canvas.height = H;
  ctx.fillStyle = '#0C0C0A';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 880, 0, W / 2, 880, 900);
  glow.addColorStop(0, 'rgba(170,246,230,.28)');
  glow.addColorStop(1, 'rgba(170,246,230,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#AAF6E6';
  ctx.font = '800 28px "Druk Text Wide"';
  ctx.fillText('CHARTER COLLECTION', W / 2, 150);
  ctx.fillStyle = '#F3F0EA';
  ctx.font = '900 132px Druk';
  const f = S.founder;
  const lines = f ? ['FOUNDING MEMBER', `NO. ${charterPad(f.no)}`] : ['I’M AN INAUGURAL', 'COLLECTOR'];
  ctx.fillText(lines[0], W / 2, 300);
  ctx.fillText(lines[1], W / 2, 430);

  ccgDrawCard(ctx, A, S, fan, (W - 680) / 2, 520, 680);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(243,240,234,.66)';
  ctx.font = '500 26px "Druk Text Wide"';
  ctx.fillText('PORTSTLUCIESC.COM', W / 2, 1760);
}

async function ccgShareImage(canvas, fmt) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('toBlob returned null');
  const file = new File([blob], fmt === 'card' ? 'pslsc-collector-card.png' : 'pslsc-collector-story.png', { type: 'image/png' });
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
  const titleEl = $('[data-cc-title]');
  const nameEl = $('[data-cc-name]');
  // El copy del título vive en el HTML: el de antes del reveal es el texto del h1; el de después, data-after.
  const titleBefore = titleEl.textContent.trim();
  const titleAfter = titleEl.dataset.after || titleBefore;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth <= 860;

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
    hero.classList.add('is-ready');
    panel.innerHTML = '<h2 tabindex="-1">A new clue every day</h2><p class="ccg__panel-lead">The game could not load. Please try again in a moment.</p><div class="ccg__row"><button type="button" class="psl-btn cta-secondary" data-ccg-retry>Try again</button></div>';
    panel.querySelector('[data-ccg-retry]').addEventListener('click', () => location.reload());
    return;
  }
  state.coachUrl = hero.dataset.ccCoach;
  state.teamUrl = hero.dataset.ccTeam;
  const photo = $('[data-cc-photo]');
  if (state.presentation) { photo.src = state.presentation.src; photo.alt = state.presentation.alt || ''; }

  const S = charterLoad();
  // Una respuesta guardada de un día que la fuente ya no libera (ej. reloj o pruebas) no cuenta.
  Object.keys(S.answers).forEach((k) => { if (!state.days?.[k]) delete S.answers[k]; });
  if (!state.revealed) S.revealed = false;
  if (state.closed) S.revealed = true;
  S.sent = S.sent || {};

  let step = null;
  let lastCardKey = '';
  let flashZone = null;
  let spinning = false;   // el viernes, la carta gira grande antes de pasar al hero del coach
  let claimTimer = 0;
  const pctx = { justClaimed: false, fmt: 'story' };

  // La carta grande del hero es la No. 001. Mientras reclamás, ves tu carta y compartís (pasos claim, collector y
  // share), ese lugar lo ocupa tu Collector: más grande para encuadrar la foto. Al salir, vuelve la No. 001.
  let mineShown = false;
  let swapToken = 0;
  let swapData = null;   // mientras dura el cambio, lo último que tiene que quedar en la carta (nombre o foto nuevos)
  const setCard = (data) => { if (swapData) swapData = data; else cardEl.data = data; };
  function swapCard(data) {
    const token = ++swapToken;
    cardEl.flip(false);
    if (reduce || !hero.classList.contains('is-ready')) { swapData = null; cardEl.data = data; return; }
    swapData = data;
    cardEl.getAnimations().forEach((a) => a.cancel());
    const out = cardEl.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.94)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
    // El cambio de datos va por timer, no por el fin de la animación: si el navegador no pinta (pestaña de fondo),
    // la carta igual queda bien.
    setTimeout(() => {
      if (token !== swapToken) return;
      cardEl.data = swapData;
      swapData = null;
      out.cancel();   // en el mismo cuadro que arranca la entrada: no queda tapada ni parpadea
      cardEl.animate([{ opacity: 0, transform: 'translateY(-10px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }, 180);
  }
  const mineCard = (st) => (st.t === 'claim' ? charterCollectorCard({ ...S, founder: null }, {}) : charterCollectorCard(S, capture.fan));

  function paintCard(st) {
    const mine = Boolean(st) && CCG_MINE_STEPS.includes(st.t);
    if (mine) {
      if (mineShown) setCard(mineCard(st)); else swapCard(mineCard(st));
      mineShown = true;
      lastCardKey = '';
      $('[data-ccg-count]').textContent = 'Your Collector Card';
      return;
    }
    const card = ccgComposeCard(state, S, null);
    const key = JSON.stringify(card);
    if (mineShown) {
      mineShown = false;
      lastCardKey = key;
      flashZone = null;
      swapCard(card);
    } else if (key !== lastCardKey || flashZone) {
      lastCardKey = key;
      const autoFlip = flashZone === 'career' || flashZone === 'fact';
      cardEl.flip(false);
      cardEl.data = ccgComposeCard(state, S, flashZone);
      if (autoFlip) requestAnimationFrame(() => requestAnimationFrame(() => cardEl.flip(true)));
      flashZone = null;
    }
    const clues = state.revealed && S.revealed ? 'Card No. 001' : `${ccgClues(S, state)} of 4 clues`;
    $('[data-ccg-count]').textContent = clues;
  }

  function goTo(target, block = 'start') {
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block });
  }

  const status = $('[data-ccg-status]');
  const say = (msg) => { status.textContent = ''; setTimeout(() => { status.textContent = msg; }, 60); };   // vaciar antes: se anuncia aunque se repita

  // El panel cambia de alto sin saltos: se anima del alto viejo al nuevo y el contenido entra en cascada.
  function morphPanel(html) {
    const from = panel.offsetHeight;
    panel.innerHTML = html;
    if (reduce) return;
    const to = panel.offsetHeight;
    panel.style.overflow = 'hidden';
    panel.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' })
      .finished.then(() => { panel.style.overflow = ''; }, () => {});
    [...panel.children].forEach((el, i) => el.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 380, delay: 140 + i * 70, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' },
    ));
  }

  // focus: true cuando el cambio lo provocó la persona (no al cargar): el foco pasa al título del panel.
  function paint(scrollTarget, focus, morph) {
    const st = ccgNextStep(S, state, step);
    paintCard(st);
    const shown = state.revealed && S.revealed;
    hero.classList.toggle('hcc--coach', shown && Boolean(state.presentation));
    const copy = ccgHeroCopy(S, state);
    $('[data-cc-kicker]').textContent = shown ? CCG_KICKER : copy.kicker;
    titleEl.textContent = shown ? titleAfter : titleBefore;
    nameEl.textContent = shown ? [state.card.first, state.card.last].filter(Boolean).join(' ') : '';
    nameEl.hidden = !shown;
    $('[data-cc-sub]').textContent = copy.sub;
    $('[data-cc-sub]').hidden = shown || !copy.sub;
    $('[data-cc-more]').hidden = shown;
    hero.classList.toggle('hcc--asking', st.t === 'q' || st.t === 'enter');   // mobile: carta chica para que entre la pregunta
    hero.classList.toggle('hcc--step', Boolean(step));
    hero.classList.toggle('hcc--claiming', CCG_MINE_STEPS.includes(st.t));   // tu carta en el lugar grande; con el coach, el reclamo lleva caja
    hero.classList.toggle('hcc--sharing', st.t === 'share');
    hero.append(capture);   // el único <psl-photo-capture> conserva la foto entre pasos: fuera del panel, oculto
    capture.hidden = true;
    const html = ccgPanelHTML(st, S, state, pctx);
    if (morph) morphPanel(html); else panel.innerHTML = html;
    bindPanel(st);
    hero.classList.add('is-ready');
    if (focus) panel.querySelector('h2')?.focus({ preventScroll: true });
    if (scrollTarget && mobile()) goTo(scrollTarget);
  }

  function showError(form, msg) {
    const err = form.querySelector('[data-err]');
    err.textContent = msg;
    err.hidden = false;
  }

  function busy(form, on, label) {
    const submit = form.querySelector('[type="submit"]');
    if (on) { form.dataset.busy = '1'; form.dataset.label = submit.textContent; submit.textContent = label; form.querySelector('[data-err]').hidden = true; } else { delete form.dataset.busy; submit.textContent = form.dataset.label; }
    submit.disabled = on;
  }

  async function answer(st, btn) {
    if (panel.dataset.judging) return;
    const D = state.days[st.i];
    const k = Number(btn.dataset.k);
    const opts = [...panel.querySelectorAll('.ccg__opt')];
    const err = panel.querySelector('[data-err]');
    panel.dataset.judging = '1';
    opts.forEach((o) => { o.disabled = true; });
    btn.classList.add('is-picked');
    err.hidden = true;
    // Inscripto y con el challenge abierto: la respuesta va al registro antes de darla por contestada. Si falla, se
    // puede volver a elegir (no llegó, así que no es la primera).
    let first = true;
    if (S.entry && ccgOpen(state)) {
      const lbl = btn.querySelector('i');
      const was = lbl.innerHTML;
      lbl.textContent = 'Sending';
      try {
        const res = await ccgSubmitAnswer(hero, {
          email: S.entry.email, question: ccgQNum(state, st.i), day: st.i, option: k, answer: D.opts[k],
          eligible: { adult: true, floridaResident: true, rulesAccepted: true }, marketing: Boolean(S.entry.marketing),
          clientTime: new Date().toISOString(),
        });
        first = res.first !== false;
        S.sent[st.i] = true;
      } catch (e) {
        delete panel.dataset.judging;
        opts.forEach((o) => { o.disabled = false; });
        btn.classList.remove('is-picked');
        lbl.innerHTML = was;
        err.textContent = e.message;
        err.hidden = false;
        return;
      }
      lbl.innerHTML = was;
    }
    S.answers[st.i] = k;
    charterSave(S);
    // 1) La elegida queda marcada; el resto se apaga. No se dice si es correcta hasta el cierre.
    panel.classList.add('is-judged');
    btn.querySelector('i').innerHTML = CCG_ICON_OK;
    say(`${S.sent[st.i] ? 'Answer received.' : 'Answer saved.'} Clue unlocked, ${D.clueTitle}: ${D.clue}`);
    if (!first) console.info('[charter] ya había una respuesta de este mail para esta pregunta: cuenta la primera.');
    // 2) Se van la pregunta y las opciones, queda la respuesta en chico con la pista, y la carta la destraba
    setTimeout(() => {
      delete panel.dataset.judging;
      panel.classList.remove('is-judged');
      flashZone = D.zone;
      step = { t: 'answered', i: st.i };
      paint(mobile() ? $('.ccg__card-col') : null, true, true);
      if (mobile()) setTimeout(() => goTo(panel, 'center'), reduce ? 0 : 1300);
      // 3) Sin mail todavía (ni inscripción): el panel pasa al reclamo de la Collector, una vez que se vio la pista
      if (!S.email && !S.entry && !S.skipClaim) {
        clearTimeout(claimTimer);
        const answered = step;
        claimTimer = setTimeout(() => {
          if (step !== answered) return;   // la persona ya siguió por su cuenta
          openStep({ t: 'claim', from: st.i, back: answered });
        }, reduce ? 1200 : (mobile() ? 3600 : 2800));
      }
    }, reduce ? 400 : 900);
  }

  // Inscripción tardía: las respuestas que la persona ya dio solo por las pistas se mandan ahora, en orden.
  async function sendPending() {
    const pending = (state.days || []).map((D, i) => [D, i]).filter(([D, i]) => ccgIsQ(D) && S.answers[i] !== undefined && !S.sent[i]);
    for (const [D, i] of pending) {
      await ccgSubmitAnswer(hero, {
        email: S.entry.email, question: ccgQNum(state, i), day: i, option: S.answers[i], answer: D.opts[S.answers[i]],
        eligible: { adult: true, floridaResident: true, rulesAccepted: true }, marketing: Boolean(S.entry.marketing),
        clientTime: new Date().toISOString(),
      });
      S.sent[i] = true;
      charterSave(S);
    }
  }

  // Abre un paso del panel (reclamo, carta, compartir) con la misma transición, y lo trae a la vista en mobile
  function openStep(next) {
    clearTimeout(claimTimer);
    step = next;
    paint(null, true, true);
    if (!mobile()) return;
    goTo(next && ['claim', 'collector'].includes(next.t) ? cardEl.parentElement : panel);
  }
  // "Not now" y "Done": vuelve a lo que había antes (la respuesta del día o el estado del hero)
  function closeStep() {
    if (step?.t === 'claim' && !S.email) { S.skipClaim = true; charterSave(S); }   // no vuelve a aparecer solo
    pctx.justClaimed = false;
    openStep(step?.back || null);
  }

  function bindPanel(st) {
    panel.querySelectorAll('.ccg__opt[data-k]').forEach((b) => b.addEventListener('click', () => answer(st, b)));

    panel.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        const a = b.dataset.act;
        const back = st.t === 'claim' || st.t === 'collector' || st.t === 'share' ? st.back : (step || null);
        if (a === 'claim') openStep({ t: 'claim', back });
        if (a === 'enter') { S.skipEntry = false; charterSave(S); openStep({ t: 'enter', back: step }); }
        if (a === 'skip') { S.skipEntry = true; charterSave(S); clearTimeout(claimTimer); step = null; paint(panel, true, true); }
        if (a === 'mycard') openStep({ t: 'collector', back });
        if (a === 'next') { clearTimeout(claimTimer); step = null; paint(panel, true, true); }
        if (a === 'reveal') reveal(b);
        if (a === 'close') closeStep();
        if (a === 'share') openStep({ t: 'share', back });
        if (a === 'back') openStep({ t: 'collector', back });
        if (a === 'share-go') shareNow();
      });
    });

    if (st.t === 'claim') {
      const form = panel.querySelector('[data-form="claim"]');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (form.dataset.busy) return;   // doble envío (doble click, Enter repetido)
        const email = form.elements.email.value.trim();
        if (!CHARTER_EMAIL.test(email)) { showError(form, 'Enter a valid email, like name@email.com.'); return; }
        if (!form.elements.consent.checked) { showError(form, 'Tick the box to agree to receive emails.'); return; }
        busy(form, true, 'Sending…');
        try {
          await charterSendLead(hero, email);
        } catch (err) {
          busy(form, false);
          showError(form, err.message);
          return;
        }
        if (email !== S.email) S.founder = null;   // founder lo ajusta después el servidor de Mi colección
        S.email = email;
        charterSave(S);
        pctx.justClaimed = true;
        openStep({ t: 'collector', back: st.back });
        say('Card claimed. We’re emailing it to you.');
      });
    }

    if (st.t === 'enter') {
      const form = panel.querySelector('[data-form="enter"]');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (form.dataset.busy) return;
        const email = form.elements.email.value.trim();
        if (!CHARTER_EMAIL.test(email)) { showError(form, 'Enter a valid email, like name@email.com.'); return; }
        if (!form.elements.eligible.checked) { showError(form, 'The challenge is open to Florida residents 18 or older.'); return; }
        if (!form.elements.rules.checked) { showError(form, 'Tick the box to agree to the Official Rules.'); return; }
        if (!ccgOpen(state)) { showError(form, `The challenge closed ${CCG_DEADLINE_TEXT}. You can still play for the clues.`); return; }
        const api = hero.dataset.challengeApi;
        if ((!api || api.startsWith('__')) && !new URLSearchParams(location.search).has('demo')) {
          console.error('[charter] Falta __CHALLENGE_API__: no se puede inscribir.');
          showError(form, 'Entries are not open right now. Please try again later.');
          return;
        }
        const marketing = form.elements.consent.checked;
        busy(form, true, 'Entering…');
        S.entry = { email, marketing, at: new Date().toISOString() };
        S.skipEntry = false;
        charterSave(S);
        try {
          await sendPending();
        } catch (err) {
          busy(form, false);
          showError(form, err.message);
          return;
        }
        // El permiso de mails es aparte de la inscripción: si ActiveCampaign falla, la persona igual queda inscripta.
        if (marketing) charterSendLead(hero, email).catch((err) => console.warn('[charter] no se pudo sumar a la lista', err));
        step = null;
        paint(panel, true, true);
        say('You’re in. Only your first answer to each question counts.');
      });
    }

    if (st.t === 'collector') {
      capture.stage = cardEl;   // la cámara se ve adentro de tu carta, en el lugar grande
      capture.hidden = false;
      panel.querySelector('[data-ccg-capture-slot]').append(capture);
    }

    if (st.t === 'share') {
      const shot = panel.querySelector('[data-ccg-shot]');
      const hint = panel.querySelector('[data-ccg-fmt-hint]');
      const go = panel.querySelector('[data-act="share-go"]');
      const draw = async () => {
        go.disabled = true;
        shot.closest('.ccg__m-shot').dataset.fmt = pctx.fmt;
        try {
          await ccgDrawShare(shot, pctx.fmt, S, state, capture.fan);
          go.disabled = false;
        } catch (err) {
          console.error('[charter] no se pudo armar la imagen', err);
          shareMsg('We could not create your image. Please try again in a moment.');
        }
      };
      panel.querySelectorAll('[data-fmt]').forEach((b) => b.addEventListener('click', () => {
        pctx.fmt = b.dataset.fmt;
        panel.querySelectorAll('[data-fmt]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        hint.textContent = pctx.fmt === 'story' ? 'Full screen, for Instagram and TikTok stories.' : 'Just your card, with a transparent background. Works anywhere.';
        draw();
      }));
      draw();
    }
  }

  function shareMsg(text) {
    const m = panel.querySelector('[data-ccg-share-msg]');
    if (!m) return;
    m.textContent = text;
    m.hidden = !text;
  }
  async function shareNow() {
    shareMsg('');
    try {
      await ccgShareImage(panel.querySelector('[data-ccg-shot]'), pctx.fmt);
    } catch (err) {
      if (err.name === 'AbortError') return;   // canceló el menú de compartir: no es un fallo
      shareMsg('We could not share your image. Please try again in a moment.');
    }
  }

  function reveal(btn) {
    if (spinning) return;
    S.revealed = true;
    step = null;
    charterSave(S);   // guardado ya: si recarga en medio del giro, vuelve revelada
    const done = () => {
      spinning = false;
      hero.classList.add('hcc--revealing');   // el texto queda en su lugar; la foto y la carta chica entran suave
      paint(null, true);
      setTimeout(() => hero.classList.remove('hcc--revealing'), 2600);
      say(`Card No. 001 revealed: ${nameEl.textContent}.`);
    };
    if (reduce) { paintCard(null); done(); return; }
    // 1) la carta gira y la silueta se apaga; el título sigue siendo el de la semana
    spinning = true;
    btn.disabled = true;
    btn.textContent = 'Revealing…';
    paintCard(null);
    cardEl.reveal();
    // 2) termina el giro (1,3 s), un respiro con la carta revelada, y entra el coach
    setTimeout(done, 2200);
  }

  capture.addEventListener('fanchange', (e) => {
    if (mineShown && step?.t === 'collector') setCard(charterCollectorCard(S, e.detail));
  });
  // Baja a lo que sigue del hero, sea cual sea el bloque siguiente en WordPress.
  $('[data-cc-more]').addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: hero.getBoundingClientRect().bottom + window.scrollY - 64, behavior: reduce ? 'auto' : 'smooth' });
  });
  $('[data-ccg-flip]').addEventListener('click', () => cardEl.flip());

  // Bases oficiales y premios: un <dialog> en el bloque. Se abre desde cualquier [data-rules] o con #official-rules
  // (el link que se usa en Instagram), sin salir de la home.
  const rules = $('[data-ccg-rules]');
  const openRules = () => { if (rules && !rules.open) rules.showModal(); };
  hero.addEventListener('click', (e) => {
    if (!e.target.closest('[data-rules]')) return;
    e.preventDefault();
    openRules();
  });
  rules?.addEventListener('click', (e) => {
    if (e.target === rules || e.target.closest('[data-rules-close]')) rules.close();   // click afuera o en "Close"
  });
  rules?.addEventListener('close', () => {
    if (location.hash === '#official-rules') history.replaceState(null, '', location.pathname + location.search);
  });
  const fromHash = () => { if (location.hash === '#official-rules') openRules(); };
  addEventListener('hashchange', fromHash);
  fromHash();

  // Inscripción que quedó a medias (se cortó al mandar respuestas viejas): se reintenta sola al volver.
  if (S.entry && ccgOpen(state)) sendPending().catch((err) => console.warn('[charter] quedan respuestas sin registrar', err));

  paint();
}

export { initHeroColeccion };
