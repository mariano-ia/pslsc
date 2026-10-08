/**
 * Pumpkin Spiced Lattes RSVP — proxea el form propio a un form de ActiveCampaign embebido en la
 * MISMA página (mismo patrón que native/partners/p05-contact.js — ver ese archivo para el detalle
 * completo del mecanismo: por qué se usa CLASE y no ID, por qué el embed tiene que ser "simple"
 * script externo y no inline, cómo se detecta éxito/error, etc.).
 *
 * Form de ActiveCampaign real: id 14 (class="_form_14"), confirmado 2026-09-10 contra el "full embed"
 * que pasó el cliente. Pendiente del lado del cliente: pegar el "embed simple" de ese form
 * (`<div class="_form_14"></div>` + `<script src=".../embed.php?id=14">`) en un bloque Custom HTML
 * APARTE, en la MISMA página de WordPress, debajo de este bloque — y confirmar que el autoresponder
 * del form ya tiene los detalles del evento cargados (fecha/lugar/horario).
 */
const AC_FORM_CLASS = '_form_14';
const AC_WAIT_TIMEOUT = 10000;
const AC_SUBMIT_TIMEOUT = 15000;
// nuestro name (native/events/pumpkin-spice.html) -> name real en el form de AC (id 14, confirmado
// contra el "full embed" que pasó el cliente 2026-09-10 — window.cfields del embed: {"42":"company",
// "47":"event_attendance_status","44":"job_titleprofession","45":"will_you_be_bringing_a_colleague"})
const AC_FIELD_MAP = {
  fullName: 'fullname',
  email: 'email',
  phone: 'phone',
  company: 'field[42]',
  jobTitle: 'field[44]',
  attendance: 'field[47]',
  bringingColleague: 'field[45]',
};

// 40mo/41er ajuste (2026-09-17): el campo phone del form 14 de AC usa intl-tel-input, y AC arma
// el valor final leyendo SU propio widget (input visible name="phone-iti" -> hidden name="phone").
// Por eso no alcanza con normalizar y pisar el hidden: AC lo recalcula desde el widget vacio y
// rebota con "Please provide a valid phone number (format +XXXXXXXXXXXXX)". La solucion es doble:
// (a) nuestro form tiene su propio desplegable de paises, con la MISMA lista que trae el widget de
// AC (leida del embed real el 2026-09-17, 244 paises, US y Canada primero porque el evento es en
// Florida), asi el visitante no puede escribir el numero en un formato que AC no entienda; y
// (b) al enviar le escribimos el numero YA en E.164 al input visible del widget, que actualiza
// bandera y numero solo, y deja que AC arme el hidden como espera.
const PHONE_COUNTRIES = [
  ['United States', '+1', 'us'],
  ['Canada', '+1', 'ca'],
  ['Afghanistan', '+93', 'af'],
  ['Åland Islands', '+358', 'ax'],
  ['Albania', '+355', 'al'],
  ['Algeria', '+213', 'dz'],
  ['American Samoa', '+1', 'as'],
  ['Andorra', '+376', 'ad'],
  ['Angola', '+244', 'ao'],
  ['Anguilla', '+1', 'ai'],
  ['Antigua & Barbuda', '+1', 'ag'],
  ['Argentina', '+54', 'ar'],
  ['Armenia', '+374', 'am'],
  ['Aruba', '+297', 'aw'],
  ['Ascension Island', '+247', 'ac'],
  ['Australia', '+61', 'au'],
  ['Austria', '+43', 'at'],
  ['Azerbaijan', '+994', 'az'],
  ['Bahamas', '+1', 'bs'],
  ['Bahrain', '+973', 'bh'],
  ['Bangladesh', '+880', 'bd'],
  ['Barbados', '+1', 'bb'],
  ['Belarus', '+375', 'by'],
  ['Belgium', '+32', 'be'],
  ['Belize', '+501', 'bz'],
  ['Benin', '+229', 'bj'],
  ['Bermuda', '+1', 'bm'],
  ['Bhutan', '+975', 'bt'],
  ['Bolivia', '+591', 'bo'],
  ['Bosnia & Herzegovina', '+387', 'ba'],
  ['Botswana', '+267', 'bw'],
  ['Brazil', '+55', 'br'],
  ['British Indian Ocean Territory', '+246', 'io'],
  ['British Virgin Islands', '+1', 'vg'],
  ['Brunei', '+673', 'bn'],
  ['Bulgaria', '+359', 'bg'],
  ['Burkina Faso', '+226', 'bf'],
  ['Burundi', '+257', 'bi'],
  ['Cambodia', '+855', 'kh'],
  ['Cameroon', '+237', 'cm'],
  ['Cape Verde', '+238', 'cv'],
  ['Caribbean Netherlands', '+599', 'bq'],
  ['Cayman Islands', '+1', 'ky'],
  ['Central African Republic', '+236', 'cf'],
  ['Chad', '+235', 'td'],
  ['Chile', '+56', 'cl'],
  ['China', '+86', 'cn'],
  ['Christmas Island', '+61', 'cx'],
  ['Cocos (Keeling) Islands', '+61', 'cc'],
  ['Colombia', '+57', 'co'],
  ['Comoros', '+269', 'km'],
  ['Congo - Brazzaville', '+242', 'cg'],
  ['Congo - Kinshasa', '+243', 'cd'],
  ['Cook Islands', '+682', 'ck'],
  ['Costa Rica', '+506', 'cr'],
  ['Côte d’Ivoire', '+225', 'ci'],
  ['Croatia', '+385', 'hr'],
  ['Cuba', '+53', 'cu'],
  ['Curaçao', '+599', 'cw'],
  ['Cyprus', '+357', 'cy'],
  ['Czechia', '+420', 'cz'],
  ['Denmark', '+45', 'dk'],
  ['Djibouti', '+253', 'dj'],
  ['Dominica', '+1', 'dm'],
  ['Dominican Republic', '+1', 'do'],
  ['Ecuador', '+593', 'ec'],
  ['Egypt', '+20', 'eg'],
  ['El Salvador', '+503', 'sv'],
  ['Equatorial Guinea', '+240', 'gq'],
  ['Eritrea', '+291', 'er'],
  ['Estonia', '+372', 'ee'],
  ['Eswatini', '+268', 'sz'],
  ['Ethiopia', '+251', 'et'],
  ['Falkland Islands', '+500', 'fk'],
  ['Faroe Islands', '+298', 'fo'],
  ['Fiji', '+679', 'fj'],
  ['Finland', '+358', 'fi'],
  ['France', '+33', 'fr'],
  ['French Guiana', '+594', 'gf'],
  ['French Polynesia', '+689', 'pf'],
  ['Gabon', '+241', 'ga'],
  ['Gambia', '+220', 'gm'],
  ['Georgia', '+995', 'ge'],
  ['Germany', '+49', 'de'],
  ['Ghana', '+233', 'gh'],
  ['Gibraltar', '+350', 'gi'],
  ['Greece', '+30', 'gr'],
  ['Greenland', '+299', 'gl'],
  ['Grenada', '+1', 'gd'],
  ['Guadeloupe', '+590', 'gp'],
  ['Guam', '+1', 'gu'],
  ['Guatemala', '+502', 'gt'],
  ['Guernsey', '+44', 'gg'],
  ['Guinea', '+224', 'gn'],
  ['Guinea-Bissau', '+245', 'gw'],
  ['Guyana', '+592', 'gy'],
  ['Haiti', '+509', 'ht'],
  ['Honduras', '+504', 'hn'],
  ['Hong Kong SAR China', '+852', 'hk'],
  ['Hungary', '+36', 'hu'],
  ['Iceland', '+354', 'is'],
  ['India', '+91', 'in'],
  ['Indonesia', '+62', 'id'],
  ['Iran', '+98', 'ir'],
  ['Iraq', '+964', 'iq'],
  ['Ireland', '+353', 'ie'],
  ['Isle of Man', '+44', 'im'],
  ['Israel', '+972', 'il'],
  ['Italy', '+39', 'it'],
  ['Jamaica', '+1', 'jm'],
  ['Japan', '+81', 'jp'],
  ['Jersey', '+44', 'je'],
  ['Jordan', '+962', 'jo'],
  ['Kazakhstan', '+7', 'kz'],
  ['Kenya', '+254', 'ke'],
  ['Kiribati', '+686', 'ki'],
  ['Kosovo', '+383', 'xk'],
  ['Kuwait', '+965', 'kw'],
  ['Kyrgyzstan', '+996', 'kg'],
  ['Laos', '+856', 'la'],
  ['Latvia', '+371', 'lv'],
  ['Lebanon', '+961', 'lb'],
  ['Lesotho', '+266', 'ls'],
  ['Liberia', '+231', 'lr'],
  ['Libya', '+218', 'ly'],
  ['Liechtenstein', '+423', 'li'],
  ['Lithuania', '+370', 'lt'],
  ['Luxembourg', '+352', 'lu'],
  ['Macao SAR China', '+853', 'mo'],
  ['Madagascar', '+261', 'mg'],
  ['Malawi', '+265', 'mw'],
  ['Malaysia', '+60', 'my'],
  ['Maldives', '+960', 'mv'],
  ['Mali', '+223', 'ml'],
  ['Malta', '+356', 'mt'],
  ['Marshall Islands', '+692', 'mh'],
  ['Martinique', '+596', 'mq'],
  ['Mauritania', '+222', 'mr'],
  ['Mauritius', '+230', 'mu'],
  ['Mayotte', '+262', 'yt'],
  ['Mexico', '+52', 'mx'],
  ['Micronesia', '+691', 'fm'],
  ['Moldova', '+373', 'md'],
  ['Monaco', '+377', 'mc'],
  ['Mongolia', '+976', 'mn'],
  ['Montenegro', '+382', 'me'],
  ['Montserrat', '+1', 'ms'],
  ['Morocco', '+212', 'ma'],
  ['Mozambique', '+258', 'mz'],
  ['Myanmar (Burma)', '+95', 'mm'],
  ['Namibia', '+264', 'na'],
  ['Nauru', '+674', 'nr'],
  ['Nepal', '+977', 'np'],
  ['Netherlands', '+31', 'nl'],
  ['New Caledonia', '+687', 'nc'],
  ['New Zealand', '+64', 'nz'],
  ['Nicaragua', '+505', 'ni'],
  ['Niger', '+227', 'ne'],
  ['Nigeria', '+234', 'ng'],
  ['Niue', '+683', 'nu'],
  ['Norfolk Island', '+672', 'nf'],
  ['North Korea', '+850', 'kp'],
  ['North Macedonia', '+389', 'mk'],
  ['Northern Mariana Islands', '+1', 'mp'],
  ['Norway', '+47', 'no'],
  ['Oman', '+968', 'om'],
  ['Pakistan', '+92', 'pk'],
  ['Palau', '+680', 'pw'],
  ['Palestinian Territories', '+970', 'ps'],
  ['Panama', '+507', 'pa'],
  ['Papua New Guinea', '+675', 'pg'],
  ['Paraguay', '+595', 'py'],
  ['Peru', '+51', 'pe'],
  ['Philippines', '+63', 'ph'],
  ['Poland', '+48', 'pl'],
  ['Portugal', '+351', 'pt'],
  ['Puerto Rico', '+1', 'pr'],
  ['Qatar', '+974', 'qa'],
  ['Réunion', '+262', 're'],
  ['Romania', '+40', 'ro'],
  ['Russia', '+7', 'ru'],
  ['Rwanda', '+250', 'rw'],
  ['Samoa', '+685', 'ws'],
  ['San Marino', '+378', 'sm'],
  ['São Tomé & Príncipe', '+239', 'st'],
  ['Saudi Arabia', '+966', 'sa'],
  ['Senegal', '+221', 'sn'],
  ['Serbia', '+381', 'rs'],
  ['Seychelles', '+248', 'sc'],
  ['Sierra Leone', '+232', 'sl'],
  ['Singapore', '+65', 'sg'],
  ['Sint Maarten', '+1', 'sx'],
  ['Slovakia', '+421', 'sk'],
  ['Slovenia', '+386', 'si'],
  ['Solomon Islands', '+677', 'sb'],
  ['Somalia', '+252', 'so'],
  ['South Africa', '+27', 'za'],
  ['South Korea', '+82', 'kr'],
  ['South Sudan', '+211', 'ss'],
  ['Spain', '+34', 'es'],
  ['Sri Lanka', '+94', 'lk'],
  ['St. Barthélemy', '+590', 'bl'],
  ['St. Helena', '+290', 'sh'],
  ['St. Kitts & Nevis', '+1', 'kn'],
  ['St. Lucia', '+1', 'lc'],
  ['St. Martin', '+590', 'mf'],
  ['St. Pierre & Miquelon', '+508', 'pm'],
  ['St. Vincent & Grenadines', '+1', 'vc'],
  ['Sudan', '+249', 'sd'],
  ['Suriname', '+597', 'sr'],
  ['Svalbard & Jan Mayen', '+47', 'sj'],
  ['Sweden', '+46', 'se'],
  ['Switzerland', '+41', 'ch'],
  ['Syria', '+963', 'sy'],
  ['Taiwan', '+886', 'tw'],
  ['Tajikistan', '+992', 'tj'],
  ['Tanzania', '+255', 'tz'],
  ['Thailand', '+66', 'th'],
  ['Timor-Leste', '+670', 'tl'],
  ['Togo', '+228', 'tg'],
  ['Tokelau', '+690', 'tk'],
  ['Tonga', '+676', 'to'],
  ['Trinidad & Tobago', '+1', 'tt'],
  ['Tunisia', '+216', 'tn'],
  ['Turkey', '+90', 'tr'],
  ['Turkmenistan', '+993', 'tm'],
  ['Turks & Caicos Islands', '+1', 'tc'],
  ['Tuvalu', '+688', 'tv'],
  ['U.S. Virgin Islands', '+1', 'vi'],
  ['Uganda', '+256', 'ug'],
  ['Ukraine', '+380', 'ua'],
  ['United Arab Emirates', '+971', 'ae'],
  ['United Kingdom', '+44', 'gb'],
  ['Uruguay', '+598', 'uy'],
  ['Uzbekistan', '+998', 'uz'],
  ['Vanuatu', '+678', 'vu'],
  ['Vatican City', '+39', 'va'],
  ['Venezuela', '+58', 've'],
  ['Vietnam', '+84', 'vn'],
  ['Wallis & Futuna', '+681', 'wf'],
  ['Western Sahara', '+212', 'eh'],
  ['Yemen', '+967', 'ye'],
  ['Zambia', '+260', 'zm'],
  ['Zimbabwe', '+263', 'zw'],
];

function flagEmoji(iso) {
  return String(iso || '')
    .toUpperCase()
    .replace(/[A-Z]/g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

// Desplegable propio de paises, con el mismo criterio visual que el widget de AC: colapsado se ve
// solo la bandera y el codigo (~20% del campo) y todo el resto queda para el numero; abierto, la
// lista completa con buscador. No se puede hacer con un <select> nativo porque ahi el texto de la
// opcion es el mismo colapsado que desplegado.
function initPhonePicker(form) {
  const field = form.querySelector('[data-phone-field]');
  if (!field || field.dataset.phoneReady) return;
  field.dataset.phoneReady = '1';

  const trigger = field.querySelector('[data-phone-trigger]');
  const flagEl = field.querySelector('[data-phone-flag]');
  const codeEl = field.querySelector('[data-phone-code]');
  const hidden = field.querySelector('[data-phone-country]');
  const menu = field.querySelector('[data-phone-menu]');
  const search = field.querySelector('[data-phone-search]');
  const list = field.querySelector('[data-phone-list]');
  const number = field.querySelector('input[name="phone"]');
  if (!trigger || !menu || !list || !hidden) return;

  let current = PHONE_COUNTRIES[0];

  const select = (country) => {
    current = country;
    const [name, dial, iso] = country;
    flagEl.textContent = flagEmoji(iso);
    codeEl.textContent = dial;
    hidden.value = dial;
    trigger.setAttribute('aria-label', `Country code: ${name} ${dial}`);
    close();
    if (number) number.focus();
  };

  const render = (query = '') => {
    const q = query.trim().toLowerCase();
    // ordenar por que tan bien matchea, no por orden de lista: buscar "uru" tiene que dar Uruguay
    // primero y no Burundi, que tambien contiene esas letras
    const score = ([name, dial, iso]) => {
      const n = name.toLowerCase();
      if (!q) return 0;
      if (n.startsWith(q)) return 0;
      if (iso === q || dial === q || dial.replace('+', '') === q.replace('+', '')) return 1;
      if (n.split(/[\s&-]+/).some((word) => word.startsWith(q))) return 2;
      if (n.includes(q)) return 3;
      if (dial.includes(q) || iso.includes(q)) return 4;
      return 99;
    };
    const matches = PHONE_COUNTRIES
      .map((country) => ({ country, rank: score(country) }))
      .filter((entry) => entry.rank !== 99)
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => entry.country);
    list.innerHTML = '';
    if (!matches.length) {
      const empty = document.createElement('li');
      empty.className = 'pfield__empty';
      empty.textContent = 'No country matches that.';
      list.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    matches.forEach((country) => {
      const [name, dial, iso] = country;
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pfield__option';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(country === current));
      btn.innerHTML =
        `<span aria-hidden="true">${flagEmoji(iso)}</span>` +
        `<span class="pfield__option-name"></span>` +
        `<span class="pfield__option-dial"></span>`;
      btn.querySelector('.pfield__option-name').textContent = name;
      btn.querySelector('.pfield__option-dial').textContent = dial;
      btn.addEventListener('click', () => select(country));
      li.appendChild(btn);
      frag.appendChild(li);
    });
    list.appendChild(frag);
  };

  function close() {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  const open = () => {
    render(search ? search.value : '');
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    if (search) { search.value = ''; render(''); search.focus(); }
  };

  trigger.addEventListener('click', () => (menu.hidden ? open() : close()));
  if (search) search.addEventListener('input', () => render(search.value));
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { e.stopPropagation(); close(); trigger.focus(); }
    if (e.key === 'Enter' && !menu.hidden && e.target === search) {
      e.preventDefault();
      const first = list.querySelector('.pfield__option');
      if (first) first.click();
    }
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !field.contains(e.target)) close();
  });

  select(current);
  render();
}

// arma el E.164 con el codigo elegido + el numero nacional. Saca el 0 de tronco que se usa en
// varios paises (011..., 09...), que en E.164 no va. Si el visitante igual pego el numero completo
// con +, se respeta tal cual.
function buildPhone(dial, national) {
  const raw = String(national || '').trim();
  if (raw.startsWith('+')) return `+${raw.replace(/\D/g, '')}`;
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  const code = String(dial || '').replace(/\D/g, '');
  if (!digits || !code) return '';
  return `+${code}${digits}`;
}

const E164_RE = /^\+[1-9]\d{7,14}$/;

function findAcForm() {
  return document.querySelector(`form.${AC_FORM_CLASS}`);
}

function hideAcProxy() {
  const hide = (formEl) => {
    const wrapper = formEl.parentElement || formEl;
    // fuera de pantalla en vez de display:none: el widget de telefono de AC necesita poder medirse
    // para validar, y con display:none algunos navegadores lo dejan a 0 y rebota el envio
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = '1px';
    wrapper.style.height = '1px';
    wrapper.style.overflow = 'hidden';
  };
  const existing = findAcForm();
  if (existing) { hide(existing); return; }
  const observer = new MutationObserver(() => {
    const form = findAcForm();
    if (form) { hide(form); observer.disconnect(); }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), AC_WAIT_TIMEOUT);
}

// 42do ajuste (2026-09-17): detectar el resultado real del envio. El cliente mando un RSVP que AC
// ACEPTO (disparo _show_thank_you) pero la UI mostro "Something went wrong": el observer miraba
// ._form-thank-you DENTRO del <form> y AC lo tiene afuera. La solucion -- engancharse a las dos
// funciones globales del embed (_show_thank_you / _show_error) -- vive ahora en
// custom/ac-forms/ac-forms.js, compartida por los cuatro formularios del sitio.

function initEventRsvp(root = document) {
  const form = root.querySelector('[data-event-rsvp]');
  if (!form) return;
  const msg = form.querySelector('[data-event-msg]');
  const submitBtn = form.querySelector('.pse__submit');
  initPhonePicker(form);
  acInstallResultHooks();
  hideAcProxy();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const acForm = findAcForm();
    const submitButton = acForm?.querySelector('._submit');
    if (!acForm || !submitButton) {
      msg.classList.add('pse__msg--error');
      msg.textContent = "Something's off on our end — email us directly for now.";
      console.error(`[event-rsvp] no se encontró el form oculto de ActiveCampaign (form.${AC_FORM_CLASS}) en la página`);
      return;
    }

    // validar el telefono ANTES de tocar el form de AC: si no normaliza a E.164, avisamos nosotros
    // con un mensaje util en vez de dejar que AC rebote el envio con su propio error interno
    const phoneEl = form.querySelector('[name="phone"]');
    const countryEl = form.querySelector('[data-phone-country]');
    const phoneE164 = buildPhone(countryEl && countryEl.value, phoneEl && phoneEl.value);
    // El telefono es OPCIONAL (en AC tambien): solo lo validamos si la persona escribio algo.
    // Antes era required de nuestro lado y AC ni lo pedia -> mucha gente rebotaba sin necesidad.
    const phoneEscrito = !!(phoneEl && phoneEl.value.trim());
    if (phoneEscrito && !E164_RE.test(phoneE164)) {
      msg.classList.add('pse__msg--error');
      msg.textContent = 'Check the phone number — pick your country and enter the rest of the digits.';
      phoneEl.focus();
      return;
    }

    submitBtn.disabled = true;
    msg.classList.remove('pse__msg--error');
    msg.textContent = 'Sending…';

    // el contenedor, no el <form>: AC mete el ._form-thank-you como hermano del form, no adentro
    const acWrapper = acForm.closest('div') || acForm.parentElement || acForm;
    let settled = false;
    const finish = (ok, text) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      document.removeEventListener(AC_RESULT_EVENT, onAcResult);
      clearTimeout(fallback);
      submitBtn.disabled = false;
      if (!ok) msg.classList.add('pse__msg--error');
      msg.textContent = text;
      if (ok) form.reset();
    };

    // camino principal: lo que diga el propio AC al terminar
    const onAcResult = (e) => {
      if (e.detail && e.detail.ok) {
        finish(true, "✓ You're on the list — check your email for the details.");
        return;
      }
      // _show_error(id, mensaje): lo traducimos a algo accionable y marcamos el campo culpable
      const acMessage = e.detail && Array.isArray(e.detail.args) ? e.detail.args[1] : '';
      finish(false, acApplyError(form, acMessage, 'event-rsvp'));
    };
    document.addEventListener(AC_RESULT_EVENT, onAcResult);

    // respaldo por DOM, por si el embed cambia y deja de usar esas funciones globales
    const observer = new MutationObserver(() => {
      const thankYou = acWrapper.querySelector('._form-thank-you');
      const visible = thankYou && getComputedStyle(thankYou).display !== 'none';
      if (visible) { finish(true, "✓ You're on the list — check your email for the details."); return; }
      const error = acWrapper.querySelector('._form_error, ._error-inner._form_error');
      if (error) finish(false, (error.textContent || '').trim() || 'Something went wrong sending that — try again in a moment.');
    });
    observer.observe(acWrapper, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true });
    const fallback = setTimeout(
      () => finish(false, 'Something went wrong sending that — try again in a moment.'),
      AC_SUBMIT_TIMEOUT
    );

    try {
      Object.entries(AC_FIELD_MAP).forEach(([name, acName]) => {
        const sourceEl = form.querySelector(`[name="${name}"]`);
        if (!sourceEl) return;
        // radios de nuestro form (bringingColleague): tomar el valor tildado, no el primer elemento
        const value = name === 'phone'
          ? (phoneEscrito ? phoneE164 : '')
          : sourceEl.type === 'radio'
            ? (form.querySelector(`[name="${name}"]:checked`)?.value || '')
            : sourceEl.value;

        // el telefono no va al input de siempre: el widget de AC arma el hidden name="phone" desde su
        // propio input visible (name="phone-iti"). Le escribimos el E.164 ahi y el widget actualiza
        // bandera + formato solo; igual pisamos abajo el hidden por si el widget no llego a cargar.
        if (name === 'phone') {
          const itiInput = acForm.querySelector('input[name="phone-iti"], input.iti__tel-input');
          if (itiInput) {
            itiInput.value = value;
            ['input', 'change', 'blur'].forEach((ev) => itiInput.dispatchEvent(new Event(ev, { bubbles: true })));
          }
        }

        const targets = acForm.querySelectorAll(`[name="${acName}"]`);
        if (!targets.length) return;
        if (targets[0].type === 'radio') {
          // el target en AC también puede ser un radio group (ej. field[45]) — tildar el que matchea
          // el value, no pisar .value de un radio (eso no lo marca como checked)
          targets.forEach((el) => {
            el.checked = el.value === value;
            if (el.checked) el.dispatchEvent(new Event('change', { bubbles: true }));
          });
        } else {
          // pisar TODOS los targets, no solo el primero: el widget de telefono de AC deja mas de un
          // input con el mismo name (el visible y el que lee el submit)
          targets.forEach((el) => {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          });
        }
      });
      // Posteamos nosotros a proc.php en vez de apretar el boton de AC: su submit inyecta un
      // <script> a activehosted.com y en iPhone con bloqueo de contenido ese <script> nunca entra,
      // asi que el envio no salia (HAR del 24-09-2026: cero POST). Ver acSubmitDirect().
      acSubmitDirect(acForm).then((r) => {
        if (r.ok) {
          finish(true, "✓ You're on the list — check your email for the details.");
          return;
        }
        finish(false, acApplyError(form, r.message, 'event-rsvp'));
      }).catch((err) => {
        // ultimo recurso: el camino original de AC, por si el fetch no sale (red, CORS, proxy)
        console.warn('[psl-form] event-rsvp — el POST directo fallo, reintento con el submit de AC', err);
        try { submitButton.click(); } catch (err2) {
          finish(false, 'We could not send that — please try again in a moment.');
        }
      });
    } catch (err) {
      finish(false, 'We could not send that — please try again in a moment.');
      console.error('[event-rsvp] ActiveCampaign proxy submit falló', err);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => initEventRsvp());

export { initEventRsvp };
