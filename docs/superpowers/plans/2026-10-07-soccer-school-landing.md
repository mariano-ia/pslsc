# Soccer School landing v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar `pslsc.vercel.app/school`: landing de preinscripción del PSLSC Soccer School con form → ActiveCampaign.

**Architecture:** Página estática y autocontenida en `school/` (como `shop/`), servida por el mismo proyecto de Vercel. HTML + CSS + JS módulo sin dependencias. La lógica pura del form (`form.js`) está separada del cableado DOM (`school.js`) para testearla con `node --test`. La config de ActiveCampaign y analytics vive sola en `config.js`. Los assets se generan con un script Python desde las fuentes de marca.

**Tech Stack:** HTML/CSS/JS vanilla (ES modules) · Node 24 `node:test` · Python 3 + Pillow + NumPy (assets) · Vercel static.

**Spec:** `docs/superpowers/specs/2026-10-07-soccer-school-landing-design.md`

---

## File map

| Archivo | Responsabilidad |
|---|---|
| `docs/soccer-school/brand/` | Fuentes de marca copiadas de la carpeta de identidad (logo, portada, manual) |
| `tools/school-assets.py` | Genera `school/assets/` (logo aqua, og-image, íconos) y copia escudo, ancla y fuentes |
| `school/form.js` | Lógica pura: UTM, validación, config completa, plan de campos para AC |
| `tools/tests/school-form.test.mjs` | Tests de `form.js` |
| `school/config.js` | Config de ActiveCampaign y analytics (único archivo a tocar para conectar) |
| `school/school.js` | DOM: form (estados, proxy AC), analytics opcional, fade de secciones |
| `school/index.html` | La página |
| `school/school.css` | Estilos |
| `school/README.md` | Qué es, cómo verla, cómo conectar AC, pendientes |
| `README.md`, `docs/handoff-notes.md` | Una entrada que apunta a `school/README.md` |

Commits y push: **solo con OK del usuario** (push a `main` = producción en `pslsc.vercel.app`).

---

### Task 1: Fuentes de marca y assets

**Files:**
- Create: `docs/soccer-school/brand/logo.png`, `docs/soccer-school/brand/portada.png`, `docs/soccer-school/manual-de-marca-soccer-school.pdf` (copias)
- Create: `tools/school-assets.py`
- Generates: `school/assets/{logo-aqua.webp, og-image.jpg, favicon.png, apple-touch-icon.png, crest-aqua.webp, anchor-aqua.webp, fonts/*.woff2}`

- [ ] **Step 1: Copiar fuentes de marca al repo**

```bash
mkdir -p docs/soccer-school/brand
cp "$HOME/Downloads/Soccer School/logo.png" docs/soccer-school/brand/logo.png
cp "$HOME/Downloads/Soccer School/Portada.png" docs/soccer-school/brand/portada.png
cp "$HOME/Downloads/Soccer School/Manual de Marca PSLSC Soccer School_compressed.pdf" docs/soccer-school/manual-de-marca-soccer-school.pdf
```

- [ ] **Step 2: Escribir `tools/school-assets.py`**

```python
#!/usr/bin/env python3
"""
Genera los assets de la landing del Soccer School (school/assets/) a partir de las fuentes de marca.
Correr desde la raíz del repo:  python3 tools/school-assets.py

  logo-aqua.webp        logo oval recoloreado a aqua (#AAF6E6), 900 px de ancho, con alfa
  og-image.jpg          1200×630 para compartir: lockup de la portada sobre red marine + línea de contexto
  favicon.png           64×64, ancla aqua sobre red marine
  apple-touch-icon.png  180×180, ídem
  crest-aqua.webp       copia del escudo del club (assets/brand)
  anchor-aqua.webp      copia del ancla (assets/brand), viñeta de las razones
  fonts/*.woff2         copias de las fuentes subseteadas del sitio (dist/upload/fonts)
"""
from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / 'docs' / 'soccer-school' / 'brand'
OUT = ROOT / 'school' / 'assets'
RED = (255, 0, 72)      # #FF0048 — red marine del manual (es el fondo exacto de la portada)
AQUA = (170, 246, 230)  # #AAF6E6
FONTS = ('Druk-Heavy', 'ProximaNova-Regular', 'ProximaNova-Bold')


def recolor(img, rgb):
    """Pinta toda la figura de un color, conservando el alfa (sirve para logos monocromos)."""
    img = img.convert('RGBA')
    solid = Image.new('RGBA', img.size, rgb + (255,))
    solid.putalpha(img.getchannel('A'))
    return solid


def logo():
    out = recolor(Image.open(BRAND / 'logo.png'), AQUA)
    width = 900
    out = out.resize((width, round(out.height * width / out.width)), Image.LANCZOS)
    out.save(OUT / 'logo-aqua.webp', 'WEBP', quality=90, method=6)
    return out.size


def lockup_crop():
    """Recorta el lockup de la portada: todo lo que no es red marine, sin la línea del pie."""
    im = Image.open(BRAND / 'portada.png').convert('RGB')
    pixels = np.asarray(im).astype(int)
    mask = np.abs(pixels - np.array(RED)).sum(axis=2) > 60
    mask[2000:, :] = False  # la línea de categorías del pie queda afuera
    ys, xs = np.where(mask)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def og_image():
    width, height = 1200, 630
    og = Image.new('RGB', (width, height), RED)
    lock = lockup_crop()
    lock_w = 880
    lock = lock.resize((lock_w, round(lock.height * lock_w / lock.width)), Image.LANCZOS)
    og.paste(lock, ((width - lock_w) // 2, 56))
    font = ImageFont.truetype(str(ROOT / 'assets' / 'fonts' / 'ProximaNova-Bold.otf'), 30)
    text = 'PORT ST. LUCIE SC  ·  AGES 5–13  ·  PRE-REGISTRATION OPEN'
    draw = ImageDraw.Draw(og)
    draw.text(((width - draw.textlength(text, font=font)) / 2, height - 86), text, font=font, fill=(255, 255, 255))
    og.save(OUT / 'og-image.jpg', 'JPEG', quality=88, optimize=True)


def icons():
    anchor = recolor(Image.open(ROOT / 'assets' / 'brand' / 'anchor-aqua.webp'), AQUA)
    for size, name in ((64, 'favicon.png'), (180, 'apple-touch-icon.png')):
        icon = Image.new('RGBA', (size, size), RED + (255,))
        mark = anchor.copy()
        mark.thumbnail((round(size * 0.68), round(size * 0.68)), Image.LANCZOS)
        icon.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
        icon.save(OUT / name, 'PNG', optimize=True)


def copies():
    for name in ('crest-aqua.webp', 'anchor-aqua.webp'):
        shutil.copy(ROOT / 'assets' / 'brand' / name, OUT / name)
    (OUT / 'fonts').mkdir(exist_ok=True)
    for font in FONTS:
        shutil.copy(ROOT / 'dist' / 'upload' / 'fonts' / f'{font}.woff2', OUT / 'fonts' / f'{font}.woff2')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    print('logo-aqua.webp', logo())
    og_image()
    icons()
    copies()
    for path in sorted(OUT.rglob('*')):
        if path.is_file():
            print(f'{path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB')
```

- [ ] **Step 3: Generar y revisar**

Run: `python3 tools/school-assets.py`
Expected: lista de 9 archivos en `school/assets/` (logo ≈ 900×428). Abrir `og-image.jpg`, `logo-aqua.webp` y `favicon.png` y confirmar: lockup centrado sin cortes, logo aqua con alfa, ancla legible.

---

### Task 2: Lógica del formulario (TDD)

**Files:**
- Create: `tools/tests/school-form.test.mjs`
- Create: `school/form.js`

- [ ] **Step 1: Escribir los tests**

```js
// Tests de la lógica pura del form de la landing del Soccer School.  Run: node --test "tools/tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readUtms, validate, isConfigured, buildProxyPlan } from '../../school/form.js';

const valid = { parentName: 'Ana Pérez', email: 'ana@example.com', kidsAges: ['6', '9'], consent: true };

test('readUtms: solo claves utm_*, recortadas y sin vacías', () => {
  assert.deepEqual(
    readUtms('?utm_source=instagram&utm_medium=%20paid%20&utm_campaign=&gclid=123'),
    { utm_source: 'instagram', utm_medium: 'paid' },
  );
  assert.deepEqual(readUtms(''), {});
});

test('readUtms: corta valores largos a 200 caracteres', () => {
  assert.equal(readUtms(`?utm_term=${'x'.repeat(300)}`).utm_term.length, 200);
});

test('validate: devuelve el primer error en el orden visual del form', () => {
  assert.equal(validate({ ...valid, parentName: '  ' }).field, 'parentName');
  assert.equal(validate({ ...valid, email: 'ana@' }).field, 'email');
  assert.equal(validate({ ...valid, kidsAges: [] }).field, 'kidsAges');
  assert.equal(validate({ ...valid, consent: false }).field, 'consent');
  assert.equal(validate({ parentName: '', email: '', kidsAges: [], consent: false }).field, 'parentName');
});

test('validate: null con datos completos', () => {
  assert.equal(validate(valid), null);
});

test('isConfigured: exige cuenta, form y los cuatro campos obligatorios', () => {
  const full = {
    account: 'pslsc',
    formId: '14',
    fields: { parentName: 'fullname', email: 'email', kidsAges: 'field[50][]', consent: 'field[51][]' },
  };
  assert.equal(isConfigured(full), true);
  assert.equal(isConfigured({ ...full, formId: '' }), false);
  assert.equal(isConfigured({ ...full, fields: { ...full.fields, kidsAges: '' } }), false);
  assert.equal(isConfigured(undefined), false);
});

test('buildProxyPlan: mapea campos, edades, consentimiento y solo los UTM configurados', () => {
  const fields = {
    parentName: 'fullname', email: 'email', kidsAges: 'field[50][]', consent: 'field[51][]',
    utm_source: 'field[52]', utm_medium: '',
  };
  const plan = buildProxyPlan({ ...valid, parentName: ' Ana Pérez ' }, { utm_source: 'instagram', utm_medium: 'paid' }, fields);
  assert.deepEqual(plan.text, [['fullname', 'Ana Pérez'], ['email', 'ana@example.com'], ['field[52]', 'instagram']]);
  assert.deepEqual(plan.checkGroups, [['field[50][]', ['6', '9']]]);
  assert.deepEqual(plan.checks, ['field[51][]']);
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test "tools/tests/*.test.mjs"`
Expected: FAIL — `Cannot find module '.../school/form.js'`.

- [ ] **Step 3: Implementar `school/form.js`**

```js
/**
 * Lógica pura del formulario de preinscripción (sin DOM): lectura de UTM, validación y armado del
 * plan de campos para el form oculto de ActiveCampaign. Tests: `node --test "tools/tests/*.test.mjs"`.
 */

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_FIELDS = ['parentName', 'email', 'kidsAges', 'consent'];

/** UTM presentes en la query string (recortados a 200 caracteres; los vacíos se omiten). */
export function readUtms(search) {
  const params = new URLSearchParams(search);
  const utms = {};
  for (const key of UTM_KEYS) {
    const value = (params.get(key) || '').trim();
    if (value) utms[key] = value.slice(0, 200);
  }
  return utms;
}

/** Primer error en el orden visual del form, o null si todo está bien. */
export function validate({ parentName, email, kidsAges, consent }) {
  if (!parentName || !parentName.trim()) return { field: 'parentName', message: 'Please add your name.' };
  if (!EMAIL_RE.test((email || '').trim())) return { field: 'email', message: 'Enter a valid email so we can reach you.' };
  if (!kidsAges || kidsAges.length === 0) return { field: 'kidsAges', message: 'Pick at least one age.' };
  if (!consent) return { field: 'consent', message: 'Please confirm you’re the parent or guardian.' };
  return null;
}

/** true si la config de AC alcanza para enviar: cuenta, form y los cuatro campos obligatorios. */
export function isConfigured(ac) {
  if (!ac || !ac.account || !ac.formId || !ac.fields) return false;
  return REQUIRED_FIELDS.every((key) => Boolean(ac.fields[key]));
}

/**
 * Qué hay que escribir en el form de AC:
 *   text:        [name, value] para inputs de texto u ocultos (nombre, email, UTM configurados)
 *   checkGroups: [name, values[]] para checkboxes múltiples (edades)
 *   checks:      [name] para checkboxes simples que van tildados (consentimiento)
 */
export function buildProxyPlan(values, utms, fields) {
  const text = [
    [fields.parentName, values.parentName.trim()],
    [fields.email, values.email.trim()],
  ];
  for (const key of UTM_KEYS) {
    if (fields[key] && utms[key]) text.push([fields[key], utms[key]]);
  }
  return {
    text,
    checkGroups: [[fields.kidsAges, values.kidsAges.map(String)]],
    checks: values.consent ? [fields.consent] : [],
  };
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `node --test "tools/tests/*.test.mjs"`
Expected: `# pass 6` · `# fail 0`.

---

### Task 3: Config y cableado DOM

**Files:**
- Create: `school/config.js`
- Create: `school/school.js`

- [ ] **Step 1: `school/config.js`**

```js
/**
 * PSLSC Soccer School — config de la landing (/school).
 *
 * Es el ÚNICO archivo que hay que tocar para conectar ActiveCampaign y analytics.
 * Mientras activeCampaign no esté completo, el formulario NO envía: muestra un error y deja un
 * console.error. Nunca finge éxito. Ver school/README.md → "Conectar ActiveCampaign".
 */
export const CONFIG = {
  activeCampaign: {
    // Subdominio de la cuenta (https://<account>.activehosted.com), del código de embed de AC.
    account: '',
    // Id del form "Soccer School — Pre-registration" (el N de embed.php?id=N).
    formId: '',
    // Campo nuestro → `name` del campo en el form de AC (copiar del export "full embed").
    fields: {
      parentName: 'fullname',   // campo estándar "Full Name" de AC
      email: 'email',           // campo estándar de AC
      kidsAges: '',             // checkbox con opciones 5…13 (valores "5"…"13"), p. ej. 'field[50][]'
      consent: '',              // checkbox de consentimiento, p. ej. 'field[51][]'
      utm_source: '',           // ocultos, p. ej. 'field[52]'
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
    },
  },
  analytics: {
    metaPixelId: '',            // vacío = no se carga el pixel
    ga4Id: '',                  // vacío = no se carga GA4 (formato 'G-XXXXXXX')
  },
};
```

- [ ] **Step 2: `school/school.js`**

```js
/**
 * PSLSC Soccer School — landing v1 (/school). Cablea el formulario de preinscripción, la carga
 * opcional de analytics y el fade de las secciones. Lógica pura en form.js; config en config.js.
 *
 * Envío: proxy al form oculto de ActiveCampaign (mismo patrón que native/academy/a07-tryouts.js).
 * Cargamos el "embed simple" de AC adentro de #ac-proxy (oculto), copiamos los valores a sus campos
 * y disparamos su `._submit`. AC confirma cambiando el style.display de `._form-thank-you`; un
 * `._form_error` es error. Seleccionamos SIEMPRE por clase (`form._form_N`), nunca por id: el embed
 * simple genera ids aleatorios en cada carga.
 */
import { CONFIG } from './config.js';
import { readUtms, validate, isConfigured, buildProxyPlan } from './form.js';

const AC_SUBMIT_TIMEOUT = 15000;

/* ---------- ActiveCampaign ---------- */

function injectAcEmbed(ac) {
  const host = document.getElementById('ac-proxy');
  if (!host) return;
  const slot = document.createElement('div');
  slot.className = `_form_${ac.formId}`;
  const script = document.createElement('script');
  script.src = `https://${ac.account}.activehosted.com/f/embed.php?id=${encodeURIComponent(ac.formId)}`;
  script.charset = 'utf-8';
  host.append(slot, script);
}

function fire(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function applyPlan(acForm, plan) {
  for (const [name, value] of plan.text) {
    const input = acForm.querySelector(`[name="${name}"]`);
    if (input) { input.value = value; fire(input); }
  }
  for (const [name, values] of plan.checkGroups) {
    acForm.querySelectorAll(`input[type="checkbox"][name="${name}"]`).forEach((box) => {
      box.checked = values.includes(box.value);
      fire(box);
    });
  }
  for (const name of plan.checks) {
    // AC pone un input oculto con el mismo name antes del checkbox real: apuntamos al checkbox.
    const box = acForm.querySelector(`input[type="checkbox"][name="${name}"]`);
    if (box) { box.checked = true; fire(box); }
  }
}

function submitViaAc(ac, plan) {
  return new Promise((resolve, reject) => {
    const acForm = document.querySelector(`form._form_${ac.formId}`);
    const acSubmit = acForm && acForm.querySelector('._submit');
    if (!acForm || !acSubmit) {
      reject(new Error('El form oculto de ActiveCampaign no está en la página'));
      return;
    }
    const thankYou = acForm.querySelector('._form-thank-you');
    let settled = false;
    let timer = 0;
    const observer = new MutationObserver(() => {
      if (thankYou && thankYou.style.display && thankYou.style.display !== 'none') finish();
      else if (acForm.querySelector('._form_error')) finish(new Error('ActiveCampaign devolvió un error'));
    });
    function finish(error) {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      if (error) reject(error); else resolve();
    }
    observer.observe(acForm, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true });
    // Si AC no contesta (red caída, script bloqueado) no dejamos el botón en "Sending..." para siempre.
    timer = setTimeout(() => finish(new Error('ActiveCampaign no respondió a tiempo')), AC_SUBMIT_TIMEOUT);
    try {
      applyPlan(acForm, plan);
      acSubmit.click();
    } catch (error) {
      finish(error);
    }
  });
}

/* ---------- Analytics (opcional: solo si hay IDs en config.js) ---------- */

function loadScript(src) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.append(script);
}

function initAnalytics({ metaPixelId, ga4Id }) {
  if (metaPixelId && !window.fbq) {
    const fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments); else fbq.queue.push(arguments);
    };
    Object.assign(fbq, { push: fbq, loaded: true, version: '2.0', queue: [] });
    window.fbq = window._fbq = fbq;
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', metaPixelId);
    window.fbq('track', 'PageView');
  }
  if (ga4Id && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`);
    window.gtag('js', new Date());
    window.gtag('config', ga4Id);
  }
}

function trackLead() {
  if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
  if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead');
}

/* ---------- Formulario ---------- */

function initForm() {
  const form = document.querySelector('[data-ss-form]');
  const success = document.querySelector('[data-ss-success]');
  if (!form || !success) return;
  const msg = form.querySelector('[data-ss-msg]');
  const button = form.querySelector('button[type="submit"]');
  const ages = form.querySelector('[data-ss-ages]');
  const utms = readUtms(window.location.search);
  const ac = CONFIG.activeCampaign;
  const ready = isConfigured(ac);

  if (ready) injectAcEmbed(ac);
  else console.warn('[soccer-school] ActiveCampaign sin configurar (school/config.js): el formulario no envía.');

  const setMsg = (text, state) => {
    msg.textContent = text;
    if (state) msg.dataset.state = state; else delete msg.dataset.state;
  };
  const clearInvalid = () => {
    form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
  };
  const showInvalid = (field) => {
    clearInvalid();
    if (field === 'kidsAges') {
      ages.setAttribute('aria-invalid', 'true');
      form.querySelector('input[name="kidsAges"]').focus();
      return;
    }
    const input = form.elements[field];
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  };
  const showSuccess = (email) => {
    success.querySelector('[data-ss-email]').textContent = email;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  };

  form.addEventListener('input', () => {
    if (msg.dataset.state === 'err') { clearInvalid(); setMsg(''); }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.dataset.sending) return;
    const data = new FormData(form);
    const values = {
      parentName: String(data.get('parentName') || ''),
      email: String(data.get('email') || '').trim(),
      kidsAges: data.getAll('kidsAges').map(String),
      consent: data.get('consent') === 'on',
    };

    // Honeypot: un humano nunca ve ni completa "company". Se descarta sin avisarle al bot.
    if (String(data.get('company') || '')) { showSuccess(values.email); return; }

    const error = validate(values);
    if (error) { setMsg(error.message, 'err'); showInvalid(error.field); return; }

    if (!ready) {
      setMsg('Something went wrong on our end. Please try again later.', 'err');
      console.error('[soccer-school] Falta configurar ActiveCampaign en school/config.js: el lead NO se envió.');
      return;
    }

    form.dataset.sending = '1';
    button.disabled = true;
    setMsg('Sending...');
    try {
      await submitViaAc(ac, buildProxyPlan(values, utms, ac.fields));
      showSuccess(values.email);
      trackLead();
    } catch (err) {
      console.error('[soccer-school] El envío a ActiveCampaign falló', err);
      setMsg('Something went wrong. Please try again in a moment.', 'err');
    } finally {
      delete form.dataset.sending;
      button.disabled = false;
    }
  });
}

/* ---------- Fade de secciones ---------- */

function initReveal() {
  const sections = document.querySelectorAll('[data-reveal]');
  if (!sections.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // La clase se pone recién acá: sin JS (o si el módulo falla) las secciones se ven igual.
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  sections.forEach((section) => io.observe(section));
}

initForm();
initAnalytics(CONFIG.analytics);
initReveal();
```

- [ ] **Step 3: Tests siguen en verde**

Run: `node --test "tools/tests/*.test.mjs"`
Expected: `# pass 6` · `# fail 0`.

---

### Task 4: Página y estilos

**Files:**
- Create: `school/index.html`
- Create: `school/school.css`

- [ ] **Step 1: `school/index.html`** — contenido completo en el archivo del repo (estructura de §3 del spec; textos de §4).
  Puntos que no se pueden omitir: `lang="en"`; meta + Open Graph con `og:image` absoluto
  (`https://pslsc.vercel.app/school/assets/og-image.jpg`); rutas absolutas `/school/…`; `<script type="module" src="/school/school.js">`;
  form con `data-ss-form novalidate`, campos `parentName`, `email`, 9 chips `kidsAges` (5–13) dentro de `<fieldset data-ss-ages>`,
  `consent`, honeypot `company` en `.hp`, `<p data-ss-msg role="status" aria-live="polite">`; panel `data-ss-success tabindex="-1" hidden`
  con `<strong data-ss-email>`; `<div id="ac-proxy" hidden>`; secciones con `data-reveal`; FAQ con `<details>` (la primera `open`);
  `<!-- COPY: revisar -->` en todo texto que no sea de la editora; flechas de botones como SVG (`.arrow`, `.arrow--up`)
  porque las fuentes subseteadas no tienen → ni ↑; redes con los mismos links y SVG que `native/home/09-cierre-footer.html`.

- [ ] **Step 2: `school/school.css`** — contenido completo en el archivo del repo. Mobile-first, breakpoint `min-width: 960px`,
  tokens en `:root`, `[hidden]{display:none!important}`, texto sobre rojo ≥ 19px bold, chips en grilla de 9 (5 columnas
  bajo 360px), fade solo con `.reveal-on` y `prefers-reduced-motion: no-preference`.

- [ ] **Step 3: Ver la página**

Run: `python3 -m http.server 4321` → `http://localhost:4321/school/`
Expected: renderiza igual que los mockups aprobados (mobile A v2, escritorio hero A), sin errores en consola salvo el
`console.warn` de AC sin configurar.

---

### Task 5: Documentación

**Files:**
- Create: `school/README.md`
- Modify: `README.md` (tabla "Por dónde empezar" y árbol de estructura)
- Modify: `docs/handoff-notes.md` (sección nueva al final)

- [ ] **Step 1:** `school/README.md` con: qué es, archivos, cómo verla, "Conectar ActiveCampaign" (4 pasos del spec §8), pendientes.
- [ ] **Step 2:** En `README.md`, fila "La **landing del Soccer School** (`/school`, fuera de WordPress) → `school/README.md`" y `school/` en el árbol.
- [ ] **Step 3:** En `docs/handoff-notes.md`, sección "Soccer School — landing /school (2026-10-07)" de 5–8 líneas que remite a `school/README.md`.

---

### Task 6: Verificación

- [ ] **Step 1:** `node --test "tools/tests/*.test.mjs"` → `# pass 6`, `# fail 0`.
- [ ] **Step 2:** Capturas headless a 390 px (página completa) y 1280×800 (primera pantalla), comparadas contra los mockups.
- [ ] **Step 3:** Smoke test por CDP (Chrome headless) contra `http://localhost:4321/school/`:
  submit vacío → "Please add your name." con foco en `parentName`; email `ana@` → mensaje de email con foco en `email`;
  sin edades → "Pick at least one age."; sin consentimiento → mensaje de consentimiento; todo completo sin config →
  "Something went wrong on our end…" + `console.error`; sin scroll horizontal a 360 px.
- [ ] **Step 4:** Con OK del usuario: commit (`school/`, `tools/school-assets.py`, `tools/tests/`, `docs/…`, READMEs, `.gitignore`)
  y push. Después del deploy: `curl -sI https://pslsc.vercel.app/school` y `/school/` → 200; `og-image.jpg` → 200.
