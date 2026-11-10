/**
 * Charter Collection · lo que comparten el hero de campaña (01b) y Mi colección (c01).
 * - El progreso en el dispositivo (localStorage): { answers, email, skipClaim, revealed, founder, cards?, device? }.
 *   cards y device los escribe Mi colección cuando el servidor verifica el link (ver docs/charter-collection-server.md).
 * - La Collector Card (o Founding Member, edición gold) de la persona.
 * Los bloques lo importan con `import { … } from '../../custom/card/charter.js';`: en el preview es un módulo
 * normal y build-blocks.py lo inlinea en el JS de cada bloque (WordPress no puede importar módulos).
 *
 * Collector Card: sin número. El número es solo de la edición Founding Member, y es su número de socio fundador.
 * La foto y el nombre los carga <psl-photo-capture> y quedan solo en memoria (fan = { photo, cutout, name }).
 */
const CHARTER_KEY = 'pslsc-charter-001';
const CHARTER_CREST = '/assets/brand/crest-aqua.webp';
// Tribuna de Collector/Founder. PENDIENTE DE APROBACIÓN: es un render del micrositio del Groundbreaking, no una
// foto del club. Va recortada al centro (640x800) y en grises, porque la carta siempre la pasa a duotono.
const CHARTER_COLLECTOR_PHOTO = '/assets/cards/terrace.webp';
const CHARTER_ICONS = {
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg>',
  anchor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 11h8M5 14c0 4 3 7 7 7s7-3 7-7"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
};

function charterLoad() {
  const base = { answers: {}, email: null, skipClaim: false, revealed: false };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(CHARTER_KEY) || '{}') };
  } catch (err) {
    return base;
  }
}
function charterSave(S) {
  try { localStorage.setItem(CHARTER_KEY, JSON.stringify(S)); } catch (err) { /* sin storage se juega igual */ }
}

const charterPad = (n) => String(n).padStart(4, '0');

/* ActiveCampaign: POST directo a proc.php, como el newsletter (ver acSubmitDirect en ac-forms.js). Lo usan el hero
   (form de la Collector) y la ficha del DT (form de la Card No. 001): cada bloque lleva su data-ac-form.
   ?demo simula el envío. */
const CHARTER_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
async function charterSendLead(el, email) {
  if (new URLSearchParams(location.search).has('demo')) return;
  const d = el.dataset;
  const set = (v) => v && !v.startsWith('__');
  if (!set(d.acAccount) || !set(d.acForm)) {
    console.error('[charter] Falta configurar ActiveCampaign: el mail NO se envió.');
    throw new Error('Something went wrong on our end. Nothing was saved, please try again later.');
  }
  const body = new FormData();
  Object.entries({ u: d.acForm, f: d.acForm, s: '', c: '0', m: '0', act: 'sub', v: '2', email }).forEach(([k, v]) => body.append(k, v));
  if (set(d.acConsent)) body.append(d.acConsent, 'Yes');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  let data;
  try {
    const res = await fetch(`https://${d.acAccount}.activehosted.com/proc.php?jsonp=true`, { method: 'POST', body, headers: { Accept: 'application/json' }, signal: ctl.signal });
    data = await res.json();
  } catch (err) {
    console.error('[charter] ActiveCampaign no respondió', err);
    throw new Error('We could not reach our server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
  if (data?.action !== 'show_thank_you') throw new Error(data?.data?.message || 'We could not send that, please try again in a moment.');
}

function charterCollectorCard(S, fan = {}) {
  const f = S.founder;
  const no = f && charterPad(f.no);
  const name = fan.name || null;
  const bio = [['Joined', 'Week One'], ['Status', f ? 'Founding Member' : 'Inaugural Collector'], ['First card', 'No. 001']];
  if (f) bio.unshift(['Founder no.', no]);
  return {
    code: f ? `FM-${no}` : 'COLLECTOR', set: f ? 'Founding Member' : 'Inaugural Collector',
    parallel: f ? 'gold' : 'aqua', seed: 23, frame: true,
    background: { photo: CHARTER_COLLECTOR_PHOTO, tone: f ? 'gold' : 'aqua', pattern: f ? 'wallGold' : 'wall' },
    backgroundPhoto: fan.cutout ? null : fan.photo,
    figure: fan.cutout ? { src: fan.cutout, kind: 'fan', alt: '' } : (fan.photo ? null : { src: CHARTER_CREST, kind: 'crest', alt: '' }),
    badge: f ? ['F', `#${no}`] : null, edition: f ? 'Gold' : '',
    first: f ? `Founding Member #${no}` : 'Inaugural Collector', last: name, namePlaceholder: 'Your name', sub: 'Port St. Lucie SC | 2027',
    stamps: [{ word: 'Collector', icon: CHARTER_ICONS.star }, { word: 'Week One', icon: CHARTER_ICONS.sun }, f ? { word: 'Founder', icon: CHARTER_ICONS.anchor } : { word: 'Card 001', icon: CHARTER_ICONS.bolt }],
    back: {
      name: name || (f ? 'Founder' : 'Collector'), bio,
      fact: { text: f ? 'A special edition for the Founding Members of Port St. Lucie SC.' : 'Inaugural Collector cards are for the fans who played the first card of the Charter Collection.' },
    },
  };
}

export { CHARTER_KEY, CHARTER_CREST, CHARTER_COLLECTOR_PHOTO, CHARTER_ICONS, CHARTER_EMAIL, charterLoad, charterSave, charterPad, charterCollectorCard, charterSendLead };
