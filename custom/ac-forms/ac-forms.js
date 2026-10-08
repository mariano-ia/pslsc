/**
 * Errores de ActiveCampaign, traducidos.
 *
 * AC rechaza del lado del servidor y contesta con JS que llama a `_show_error(id, mensaje)`. Ese
 * mensaje es lo unico que existe: el envio rechazado no crea contacto, no aparece en los reportes
 * de AC y no pasa por nuestro WordPress, asi que no hay ningun log donde buscarlo despues.
 *
 * Por eso lo mostramos en el momento, y lo mas especifico posible: buscamos en el texto de AC el
 * nombre del campo ("phone", "email", ...) y con eso elegimos un mensaje accionable y marcamos el
 * input culpable. Si no reconocemos el patron, mostramos el texto de AC tal cual — sigue siendo
 * mas util que un "algo salio mal" generico. El generico queda solo para cuando AC no dice nada
 * (timeout, red caida).
 */

/* Orden = prioridad: la primera que matchea gana. */
const AC_ERROR_RULES = [
  { re: /phone|tele(f|ph)/i, field: 'phone',
    msg: 'That phone number was not accepted — check the country code and the digits, then try again.' },
  { re: /e-?mail/i, field: 'email',
    msg: 'That email address was not accepted — please check it and try again.' },
  { re: /(first |last |full )?name/i, field: 'name',
    msg: 'Please check the name field and try again.' },
  { re: /compan|organi[sz]ation/i, field: 'company',
    msg: 'Please check the company field and try again.' },
  { re: /(zip|postal)/i, field: 'zip',
    msg: 'Please check the postal code and try again.' },
  { re: /already (been )?(subscribed|added|exists)|duplicate/i, field: null,
    msg: "You are already on the list — nothing else to do." },
  { re: /required|fill (in|out)|cannot be (blank|empty)/i, field: null,
    msg: 'Something required is missing — please complete the highlighted field and try again.' },
];

const AC_GENERIC_ERROR = 'We could not send that — please try again in a moment.';

/* Un mismo campo logico se llama distinto en cada formulario. */
const AC_FIELD_ALIASES = {
  phone: ['phone', 'phone-iti'],
  email: ['email'],
  name: ['fullName', 'playerFirstName', 'name'],
  company: ['company'],
  zip: ['zip', 'postal', 'postalCode'],
};

function acFriendlyError(raw) {
  const texto = String(raw == null ? '' : raw).trim();
  if (!texto) return { field: null, message: AC_GENERIC_ERROR, raw: '' };
  for (let i = 0; i < AC_ERROR_RULES.length; i++) {
    const r = AC_ERROR_RULES[i];
    if (r.re.test(texto)) return { field: r.field, message: r.msg, raw: texto };
  }
  return { field: null, message: texto, raw: texto };
}

/* Busca en NUESTRO formulario el input visible que corresponde al campo logico. */
function acFindField(form, logico) {
  if (!form || !logico) return null;
  const nombres = AC_FIELD_ALIASES[logico] || [logico];
  for (let i = 0; i < nombres.length; i++) {
    const el = form.querySelector('[name="' + nombres[i] + '"]');
    if (el && el.type !== 'hidden' && el.offsetParent !== null) return el;
  }
  return null;
}

/* Marca el input, lo enfoca y limpia la marca apenas la persona lo corrige. */
function acMarkField(el) {
  if (!el) return;
  el.setAttribute('aria-invalid', 'true');
  el.classList.add('psl-field-invalid');
  const limpiar = () => {
    el.removeAttribute('aria-invalid');
    el.classList.remove('psl-field-invalid');
  };
  el.addEventListener('input', limpiar, { once: true });
  el.addEventListener('change', limpiar, { once: true });
  try {
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch (err) { /* focus/scroll no criticos */ }
}

/* Aplica el error al formulario: devuelve el texto a mostrar y deja el campo marcado. */
function acApplyError(form, raw, contexto) {
  const info = acFriendlyError(raw);
  const el = acFindField(form, info.field);
  acMarkField(el);
  console.warn('[psl-form]' + (contexto ? ' ' + contexto : '') + ' — ActiveCampaign rechazo el envio:', {
    mensajeDeAC: info.raw || '(vacio)',
    campo: info.field || '(no identificado)',
    mostrado: info.message,
  });
  return info.message;
}

/**
 * Engancha las dos funciones globales con las que el embed de AC avisa el resultado. Se usa
 * defineProperty porque el script de AC las define DESPUES que nosotros: envolverlas sin mas
 * haria que AC las pisara al cargar.
 */
const AC_RESULT_EVENT = 'psl:ac-result';

function acInstallResultHooks() {
  if (window.__pslAcHooksReady) return;
  window.__pslAcHooksReady = true;
  const hook = (fnName, ok) => {
    let real = window[fnName];
    const wrapper = function () {
      const args = Array.prototype.slice.call(arguments);
      document.dispatchEvent(new CustomEvent(AC_RESULT_EVENT, { detail: { ok: ok, args: args } }));
      if (typeof real === 'function') return real.apply(this, args);
      return undefined;
    };
    try {
      Object.defineProperty(window, fnName, {
        configurable: true,
        get: function () { return wrapper; },
        set: function (fn) { real = fn; },
      });
    } catch (err) {
      window[fnName] = wrapper;
    }
  };
  hook('_show_thank_you', true);
  hook('_show_error', false);
}

/* Texto del cartel de error que AC pinta dentro de su propio form (respaldo del hook). */
function acDomErrorText(acForm) {
  if (!acForm) return '';
  const el = acForm.querySelector('._form_error, ._error-inner._form_error, ._error-inner p');
  return el ? el.textContent.trim() : '';
}

/**
 * Envio DIRECTO a proc.php, sin pasar por el JS de ActiveCampaign.
 *
 * Por que: el embed de AC manda el formulario inyectando un <script src="proc.php?...&jsonp=true">
 * (su helper _load_script). En iPhone con Osano / bloqueo de contenido, esos <script> a dominios de
 * terceros NO se insertan: en el HAR del 24-09-2026 se ve que el CSS de intl-tel-input cargo y el
 * JS del mismo dominio ni siquiera genero un pedido. Resultado: el submit no salia nunca, no habia
 * POST, y nuestra UI caia al timeout de 15s con un "algo salio mal" que no explicaba nada.
 *
 * Posteamos nosotros con fetch. Comprobado en vivo: proc.php acepta POST cross-origin desde
 * portstluciesc.com y devuelve JSON legible, asi que ademas nos deja SIEMPRE el motivo real:
 *   {"action":"show_error","data":{"id":"...","message":"..."},"js":"_show_error(...)"}
 */
function acSerializeForm(acForm) {
  const fd = new FormData();
  const vistos = {};
  const els = acForm.querySelectorAll('input[name], select[name], textarea[name]');
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    if (el.disabled || el.name === 'hideButton') continue;
    if (el.type === 'submit' || el.type === 'button' || el.type === 'reset') continue;
    if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) continue;
    // el widget de telefono de AC deja mas de un input con el mismo name: gana el ultimo con valor
    if (vistos[el.name] !== undefined && !String(el.value).trim()) continue;
    if (vistos[el.name] !== undefined) fd.delete(el.name);
    vistos[el.name] = true;
    fd.append(el.name, el.value);
  }
  return fd;
}

async function acSubmitDirect(acForm) {
  const action = (acForm.getAttribute('action') || '').trim();
  if (!action) throw new Error('el form de AC no tiene action');
  const url = action + (action.indexOf('?') === -1 ? '?' : '&') + 'jsonp=true';
  const res = await fetch(url, {
    method: 'POST',
    body: acSerializeForm(acForm),
    headers: { Accept: 'application/json' },
  });
  const data = await res.json();
  const ok = !!(data && data.action === 'show_thank_you');
  const message = data && data.data && data.data.message ? String(data.data.message) : '';
  return { ok: ok, message: message, raw: data };
}
