# Auditoría del prototipo — 2026-07-10

45 hallazgos confirmados, deduplicados. Método: revisión multi-agente (37 hallazgos propuestos,
111 verificaciones adversariales, 5 refutados) + verificación empírica en navegador de lo estructural.

**Modelo de integración asumido:** cada bloque se pega en un widget "HTML" del constructor visual de
WordPress. El scroll es el de la página de WP. La **nav y las noticias son nativas del template** (USL).
Este documento reemplaza el modelo de iframe descrito en `handoff-notes.md` §2, que es incorrecto.

Severidad: 🔴 bloqueante · 🟠 alta · 🟡 media · ⚪ baja

---

## A. Bloqueantes de WordPress

Verificado montando un template de WordPress simulado y pegándole un bloque real.

| # | Sev | Dónde | Qué pasa |
|---|-----|-------|----------|
| A1 | 🔴 | todos los bloques | **Ningún bloque es autocontenido.** Los 22 dependen de `tokens.css`; 12 además de `motion.css`+`motion.js`; `s02-benefits` de `cards.css`. Pegado solo, un bloque queda sin tipografía, color ni animación. |
| A2 | 🔴 | `tokens/tokens.css:135` | `*, *::before, *::after { box-sizing: border-box }` es global. **Medido:** una caja del theme de 390px pasó a 300px. |
| A3 | 🔴 | `native/_patterns/motion.js:165` | `document.querySelector('.nav')` agarra **la nav del template**. Le inyecta `.nav__progress` (medido) y al scrollear le pone `is-scrolled`, que `motion.css:72` pinta de negro con sombra. |
| A4 | 🟠 | `native/_patterns/motion.css:9-15` | `html { scroll-behavior: smooth; scroll-padding-top: 76px }` se aplica a **todo el sitio de WP**. El padding además asume la altura de *nuestra* nav, no la del template. |
| A5 | 🟠 | `motion.js:209`, `motion.js:218` | `.psl-grain` y `.psl-cursor-glow` se hacen `appendChild` al `body`: overlays `position:fixed` sobre toda la página de WordPress. |
| A6 | 🟠 | 33 archivos CSS | **41 clases raíz sin prefijo** chocan con cualquier theme: `.nav .hero .news .footer .stats .plan .plans .project .academy .proof .jersey .founders .cta-primary .cta-secondary .surface-ink/paper/aqua .tnum`. Solo 58 selectores están namespaced contra 379 clases sin prefijo. |
| A7 | 🟠 | los 7 `custom/*/*.js` | `customElements.define()` sin guarda. Si un script se pega dos veces en la misma página → `NotSupportedError` y muere el resto del script. |
| A8 | 🟠 | `custom/live-counter/live-counter.js:1` | Único `import` cross-file (`./live-counter.config.js`). Pegado inline, la ruta relativa no resuelve. |
| A9 | 🟠 | 20 refs + `jersey-viewer.js:17` + `tokens/fonts.css` | 20 rutas absolutas `/assets/...`, los 90 frames del jersey armados por template string, y los `@font-face` con rutas relativas `../assets/fonts/`. Todo debe apuntar a la biblioteca de medios. |
| A10 | 🟠 | `docs/handoff-notes.md` §2 | Documenta el modelo de iframe, que no es el real. Peor: su snippet de auto-altura **rompe el sitio** — las alturas `92vh/86vh/82vh` se realimentan con la altura del iframe (medido: hero de 7.666px → 35.714px en 6 iteraciones, sin converger) y, sin scroll interno, ninguna animación de scroll se dispara. |

**Recaudo propuesto:** envolver cada bloque en `<div class="pslsc">`, prefijar los selectores con `.pslsc`,
mover los tokens de `:root` a `.pslsc`, cambiar `*{box-sizing}` por `.pslsc *`, eliminar las reglas de
`html{}`, y hacer que `motion.js` busque `.pslsc .psl-nav` en vez de `.nav`.

---

## B. Circuitos rotos

| # | Sev | Dónde | Qué pasa |
|---|-----|-------|----------|
| B1 | 🔴 | `native/sumate/s03-plans.html:56` | CTA **"Reserve your seat"** → `#reserve`, ancla inexistente. Es la conversión principal de la página. El click no hace nada: el navegador solo agrega el hash a la URL. |
| B2 | 🟠 | `s03-plans.html:39` | CTA "Join free" → `#join-free`, inexistente. |
| B3 | 🟠 | `s03-plans.html:72` | CTA "Become a Premium Founder" → `#premium`, inexistente. |
| B4 | 🟠 | `09-cierre-footer.js:12` y `p05-contact.js:12` | **Los dos formularios fingen éxito.** Hacen `preventDefault()` y escriben "✓ You're on the list" / "✓ Got it..." sin enviar nada. En producción se pierden todos los leads y el usuario cree que se registró. |
| B5 | 🟡 | `native/home/05-jersey.html:13` | Botón "Buy now" → `#store`. La tienda externa nunca se cableó. |
| B6 | 🟡 | `native/partners/p05-contact.html:17` | "Download the partner deck" → `#deck`. Placeholder documentado en el header del bloque, pero sin destino. |
| B7 | 🟡 | `native/home/07-academy.html:12` | "Academy tryouts" → `#academy`: es la **misma sección que lo contiene**. Botón autorreferencial. |
| B8 | 🟡 | `native/home/00-nav.html:17` | El link **"Teams"** lleva a la timeline "The project". No existe contenido de equipos en el sitio. |
| B9 | ⚪ | `native/home/08-news.html:13` | "All news →" → `#news`, la misma sección. No hay archivo de noticias. |
| B10 | ⚪ | `native/home/08-news.html:16` | La sección News es inerte: ninguna card enlaza a nada. *(Menor: News será nativa del template.)* |

Nota: B1–B3 y B6 están **documentados** como placeholders en el header de sus bloques
(`s03-plans.html:7-15` describe el contrato `POST /api/founder-signup` vía `data-signup`).
Es trabajo diferido y anotado, no un descuido — pero hoy el botón no hace nada.

---

## C. Inconsistencias de texto

| # | Sev | Dónde | Qué pasa |
|---|-----|-------|----------|
| ~~C1~~ | ✅ | `founder-id.js:407` | **RESUELTO (2026-07-10).** Año unificado en **Est. 2019** en todo el sitio. El boarding pass decía "EST. 2025"; ahora pinta `EST. 2019 · FIRST WHISTLE 2027` (verificado interceptando `fillText` en el canvas). |
| ~~C2~~ | ✅ | `s02-benefits.html:41` | **RESUELTO (2026-07-10).** Aclarado con el cliente: el "founders wall" del copy **es el tablero de abordaje** (bloque 06 de la Home, `<psl-departures-board>` + boarding pass). No falta ningún módulo. El link "See your card →" ahora apunta a `home.html#founders`. |
| C3 | 🟡 | `custom/fixtures/fixtures.js:15-30` | **Los 6 partidos dicen "Sat" y todos caen domingo.** Verificado: Jul 12/26, Aug 9/23, Sep 6/20 de 2026 son todos domingo. |
| C4 | 🟡 | `live-counter.config.js:19-22, 57-60` | 8 claves `labelEs` en español, contra la regla English-only. |
| C5 | ⚪ | `08-news.html:42`, `03-project.html:59` | Apóstrofos inconsistentes: `'` crudo vs `&rsquo;`. |
| ~~C6~~ | ✅ | `live-counter.js` | **RESUELTO (2026-07-10).** Se eliminó el tooltip `ⓘ` (y con él el dominio `pslsc.com` hardcodeado). Era el único tooltip del sitio. |
| C7 | ⚪ | `05-jersey.html:4` | El comentario del bloque dice "sin precio/CTA por ahora" pero el bloque tiene un CTA "Buy now". |
| C8 | ⚪ | `external/README.md:9` | Describe el punto de salida a la tienda con bloque y label equivocados ("bloque 04, La camiseta" / "See the store" vs el real "Buy now"). |
| C9 | 🟡 | `pages/*.html` | Ninguna de las 3 páginas tiene `<meta name="description">` ni Open Graph. *(Menor si el SEO lo maneja el template.)* |

---

## D. Accesibilidad

| # | Sev | Dónde | Qué pasa |
|---|-----|-------|----------|
| D1 | 🟠 | `tokens.css:154`, `03-project.css:108` | **Contraste insuficiente.** El kicker `#0E8C79` da **3.69:1** sobre `surface-paper` y **4.16:1** sobre las tarjetas blancas. WCAG AA pide 4.5:1 para texto de 11px. |
| D2 | 🟠 | `00-nav.css:52` | El menú desaparece en mobile/tablet sin hamburguesa ni reemplazo. *(Moot si la nav es del template.)* |
| D3 | 🟡 | `departures-board.js:114` | Declara `role="table"` sin filas ni celdas ARIA. |
| D4 | 🟡 | `08-news.css:35` | Colores hardcodeados fuera de `tokens.css`, violando la regla de marca. |
| D5 | ⚪ | `fixtures.js:153` | El scroll de las flechas ignora `prefers-reduced-motion`. |
| D6 | ⚪ | `motion.js:23` | `prefers-reduced-motion` se evalúa solo al iniciar; no reacciona a cambios en caliente. |

---

## E. Robustez

| # | Sev | Dónde | Qué pasa |
|---|-----|-------|----------|
| E1 | 🟡 | `jersey-viewer.js:59` | Si el primer frame no carga, la camiseta queda en skeleton infinito (no hay `onerror`). |
| E2 | 🟡 | `live-counter.js:193` | El listener de scroll de `_observeReveal` nunca se limpia si el nodo se desmonta antes de revelarse. |
| E3 | ⚪ | `09-cierre-footer.js:7` | `form.parentElement.querySelector(...)` sin guarda antes de escribir `textContent`. |

---

## F. Código muerto

| # | Dónde | Qué |
|---|-------|-----|
| F1 | `native/sumate/s04-wall.html` + `.css` | Huérfanos: ninguna página los monta (el wall se sacó). |
| F2 | `custom/founder-wall/` | `founder-wall.js` y `founder-card.js` huérfanos: ninguna página los carga ni monta sus etiquetas. |
| F3 | `pages/home.html:15`, `pages/partners.html:14` | `cards.css` se carga donde ningún bloque usa `.pcard`. Solo lo usa `sumate/s02`. |
| F4 | `live-counter.config.js:27-50` | Variantes `fan` y `reservation` definidas pero nunca montadas. |
| F5 | `motion.js:152` | `initCountdown()`: ningún HTML usa `data-countdown`. |
| F6 | `assets/` | `anchor-white.png` y `wordmark-sc-aqua.png`: 0 referencias. `360_shirt.mp4` (5,8 MB) solo aparece en un comentario de `jersey-viewer.js:15`. |
| F7 | `motion.js:184-201` | El highlight de sección activa del nav solo funciona en Home; en Sumate y Partners nunca matchea. |

---

## Refutados en verificación (no son defectos)

- Que los `type=module` mueran con `wp_enqueue_script` — aplica al modelo de enqueue, no al de bloque HTML pegado.
- Que `scrollIntoView(location.hash)` scrollee el iframe — no aplica sin iframe.
- Que `#deck` no esté documentado — sí lo está, en el header de `p05-contact.html`.
