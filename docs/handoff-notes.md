# PSL SC — Handoff para Santi (implementación WordPress)

Prototipo funcional del sitio de **Port St. Lucie SC**, listo para portar a WordPress.
Es HTML + CSS + JS estándar del navegador — **sin frameworks** (nada de React/Vue/Svelte/JSX ni
templating `{{ }}`). Todo lo que ves corre tal cual en cualquier navegador.

> **Cómo se integra (LO IMPORTANTE):** cada sección del sitio se compila a un **bloque HTML**
> autocontenido y se pega en un widget "HTML" (Custom HTML) del constructor visual de WordPress.
> La **nav** y las **noticias** son nativas del template de USL — no van en estos bloques.
> El paso a paso está en **`dist/UPLOAD.md`**. Leé la **§2** antes de tocar nada.

Última actualización: 2026-07-14 · Contacto de diseño: Mariano.

---

## 1. Estructura del repo

```
tokens/            tokens.css (variables de marca) · fonts.css (@font-face) · tokens.md (de dónde sale cada valor)
native/            bloques "nativos" (HTML + CSS, a veces + JS). 1 archivo = 1 bloque/sección.
  _patterns/       CSS y JS compartidos: motion.css/js (animaciones) · cards.css (.pcard)
  home/            00-nav … 09-cierre-footer   → la HOME
  sumate/          s01-hero … s06-cta          → la página "Become a Founder"
  partners/        p01-hero … p05-contact      → la página Partners
  academy/         a01-hero … a07-tryouts      → la página Academy
custom/            componentes web a medida (Web Components <psl-*>). Cada uno es autocontenido.
  live-counter/    <psl-live-counter>       — banda de métricas / contadores
  fixtures/        <psl-fixtures>           — Matchday (partidos del equipo reserva)
  jersey-viewer/   <psl-jersey-viewer>      — camiseta 360° que gira con el scroll
  founder-id/      <psl-founder-id>         — BOARDING PASS de fundador (cámara → foto → compartir)
  departures-board/ <psl-departures-board>  — tablero split-flap tipo aeropuerto
  founder-wall/    <psl-founder-wall> + <psl-founder-card>  — muro/carnet (NO montados hoy; ver §7)
assets/            brand/ (logos WebP) · fonts/ (tipografías) · images/ · proof/ · jersey360/ · videos/
pages/             home · sumate · partners · academy .html  → SOLO para preview (ver §2 y §9)
tools/             build-blocks.py → compila los bloques para WordPress (ver §2). README propio.
dist/              SALIDA para WordPress: blocks/ (pegar), upload/ (hostear), UPLOAD.md (instructivo).
docs/              esta guía + auditoria-2026-07-10.md (revisión del prototipo)
external/          contrato del link a la tienda externa (no se construye acá)
vercel.json        config del deploy de preview (Vercel) — no aplica a WordPress
```

**El nombre de archivo dice el orden y la superficie.** `04-proof` = bloque 4. Prefijo `s` = Sumate,
`p` = Partners, `a` = Academy. Cada bloque tiene su `.html` y (casi siempre) su `.css`, algunos + `.js`.

---

## 2. Cómo publicar en WordPress (bloques HTML) — validado en producción

El sitio de USL corre en **WordPress VIP**, muy restringido. Por eso NO se toca el theme: cada sección
se pega como un **bloque "HTML"** del constructor. **Empezá por `dist/UPLOAD.md`** (subir assets, poner
la URL base y los permalinks con un find-and-replace, pegar). Acá va el porqué de cómo está hecho.

Los bloques se generan con **`python3 tools/build-blocks.py`** → `dist/blocks/*.html`. Lo esencial:

- **Todo el CSS cuelga de `.pslsc`** (namespaceado por el compilador). No pisa el template, y un reset
  scopeado impide que el template pise el bloque. Aislamiento en las dos direcciones, verificado.
- **Fuentes y assets hosteados** una vez en `ASSET_BASE` (ver `dist/upload/` + la carpeta `/assets` del
  repo), referenciados por URL. Fuentes subseteadas a WOFF2 (1,16 MB → 127 KB). Cada bloque queda liviano.
- **Full-bleed sin `alignfull`** (el theme no lo soporta): `.pslsc--bleed` usa `--psl-vw` (ancho real,
  sin la barra de scroll).
- **Autodiagnóstico**: cada bloque trae una franja al pie que se pone **verde** si el JS corrió, o
  **roja con el error** si algo falló. Cuando el bloque funciona, se puede borrar (`<p class="psl-diag">`
  + el primer `<script>`).

### ⚠️ LA TRAMPA: WordPress corrompe el JavaScript que va como texto en un `<script>`

WordPress procesa el **contenido** de las etiquetas `<script>` como si fuera HTML. En cuanto ve un `<`
seguido más adelante de un `&` (p. ej. `if (a < b && c)`), cree que abrió una etiqueta y escapa los
`&`: `&&` se convierte en `&#038;&#038;` → **SyntaxError, y muere todo el script**. También inyecta
`decoding="async"` en cualquier `<img` que encuentre dentro de un template literal de JS.

**Solución (ya aplicada por el compilador):** el JS NO va como texto adentro del `<script>`. Va como
**data URI en el atributo `src`** — los filtros de WP no tocan los atributos:
```html
<script type="module" src="data:text/javascript;charset=utf-8,...(el JS aquí)..."></script>
```
Regla: **nunca pegar JS como texto dentro de un `<script>` en este WordPress.** Ni siquiera en un
comentario HTML conviene escribir `<` junto a `&` o la palabra "script" entre signos.

### Otras cosas confirmadas del entorno (WP VIP)

- Los `<script>` **no** se borran ni se bloquean (no hay CSP restrictiva, no hay KSES agresivo).
- Los `type="module"` inline (vía data URI) **sí** se ejecutan, una sola vez por URL.
- El tamaño no trunca (una sonda de 218 KB pasó entera).
- Si en el futuro se quisiera un `.js` hosteado aparte, tiene que ir en el **mismo dominio** de WP
  (los `type="module"` y `@font-face` cross-origin exigen `Access-Control-Allow-Origin`).

---

## 3. Sistema de diseño

**Color (brandbook):** aquamarine `#AAF6E6` (principal) · negro `#0C0C0A` · blanco · red marine
`#FF0033` (acento). Las secciones alternan `.surface-ink` (oscura) y `.surface-paper` (clara).
El **naranja está prohibido** por manual de marca. Todo sale de `tokens/tokens.css` (variables CSS).

**Tipografía (self-hosted, `@font-face` en `tokens/fonts.css`):**
- `--font-display` **Druk** (peso 800) — títulos de sección, números grandes
- `--font-label` **Druk Text Wide** — kickers, labels, nav
- `--font-body` **Proxima Nova** — texto, UI, botones, inputs
- `--font-hero` **Ferryman** / `--font-detail` **Cabazon** — hero y detalles puntuales

**Primitivas reutilizables (`tokens.css`):** `.psl-container` (ancho máximo + padding) ·
`.surface-ink/paper/aqua` · `.psl-kicker` (kicker numerado, ej "05 — FOUNDING MEMBERS") · `.psl-h2` ·
`.psl-btn` + `.cta-primary` / `.cta-secondary` (botones) · `.tnum` (tabular-nums para números).

**Animaciones compartidas:** `native/_patterns/motion.css` + `motion.js` manejan `[data-reveal]`
(aparición al scrollear), parallax, etc. Son `@keyframes` CSS + `requestAnimationFrame` vanilla, cero
librerías. Todo respeta `prefers-reduced-motion`.

---

## 4. Assets (ya optimizados)

Los assets que se cargan están en **WebP** (imágenes) y **H.264** (videos, recomprimidos). Las fuentes
son self-hosted. Formatos:
- **Logos** `assets/brand/`: `crest-aqua.webp`, `crest-black.webp`, `anchor-aqua.webp`,
  `anchor-black.webp` (con transparencia).
- **Fotos**: `assets/images/pslsc_academy.webp` (foto academia), `assets/images/luka-card.webp`
  (mascota Luka para el boarding pass), `assets/proof/stadium-aerial.webp` (render del estadio, Home 04)
  y `assets/proof/stadium-iso-night.webp` (render aéreo nocturno; sale de `docs/PSL-Renders.pdf` p.2).
- **Camiseta 360°**: `assets/jersey360/f_00.webp … f_89.webp` (90 cuadros; los usa el jersey-viewer).
- **Videos hero** (H.264, muteados, en loop, faststart, **sin pista de audio**, 1280×720):
  - `hero.mp4` + `hero-poster.webp` — Home (estadio en obra)
  - `founder-hero.mp4` + `founder-hero-poster.webp` — Sumate (bandera del club flameando)
  - `partners-hero.mp4` + `partners-hero-poster.webp` — Partners (estructura de acero al atardecer)
  - `hero_academy.mp4` — Academy

Las `<img>` de contenido llevan `width`/`height` (evita saltos de layout / CLS), `loading="lazy"` y
`decoding="async"`. El `.gitignore` excluye archivos sin usar (fuentes OTF sin cargar, `360_shirt.mp4`
fuente, logos sueltos) — no hace falta subirlos a WordPress.

---

## 5. Idioma: SOLO INGLÉS

El sitio es **English-only**. Ya se removió todo el sistema bilingüe EN/ES (el switch de la nav, los
`data-es`, el `i18n.js` y los helpers `L()` de los componentes). No hay nada que traducir ni cablear
de idioma.

---

## 6. Páginas y bloques

Buscá `HANDOFF (WP):` en los comentarios del código para encontrar lo que hay que cablear
(endpoints, forms). Cada componente `<psl-*>` corre hoy con **datos demo**; el contrato de API real
está documentado en su `.js`. **Nav (00) y News (08) son del template de USL** — no se compilan.

### HOME (`pages/home.html`)

| # | Bloque | Superficie | Qué es / a implementar |
|---|---|---|---|
| 00 | Nav (crest + CTA "Become a Founder") | ink | **Del template.** Sticky. |
| 01 | Hero + video + efecto "born" | ink | Video de fondo `hero.mp4`. La última palabra del título hace scramble (`01-hero.js`). |
| 02 | Stats band | ink | `<psl-live-counter variant="stats">` — ver §7. |
| 03 | The project (timeline horizontal que se dibuja con el scroll) | paper | HTML + `03-project.js`. |
| 04 | Proof / construction schedule | ink | "Peek" del render con linterna → click revela la timeline de obra. Client-side (`04-proof.js`). |
| 04b | Matchday (partidos reserva) | paper | `<psl-fixtures>` — ver §7. |
| 05 | Jersey / Shop | ink | `<psl-jersey-viewer>` (360°) + CTA "Buy now" a la tienda externa (ver `external/`). |
| 06 | **Founders** | paper | `<psl-founder-id>` (boarding pass con cámara) + `<psl-departures-board>` (tablero split-flap) + CTA. |
| 07 | Academy (teaser) | ink | Foto real + copy + CTA a la página Academy. HTML puro. |
| 08 | News ("From the build") | paper | **Del template.** |
| 09 | Newsletter + Footer | ink | Form de suscripción (`09-cierre-footer.js`) — ver §7. |

### SUMATE (`pages/sumate.html`) — página "Become a Founder"
S01 hero (video `founder-hero.mp4`) · S02 beneficios · **S03 planes** (alta de fundador) ·
S05 FAQ (`<details>` nativo, sin JS) · S06 CTA final.
> S04 (muro buscable, `<psl-founder-wall>`) se **sacó de la página** por pedido del cliente (2026-07-10).
> El bloque `s04-wall.*` y el componente siguen en el repo por si vuelve (no se compilan).

### PARTNERS (`pages/partners.html`)
P01 hero (video `partners-hero.mp4` + divider animado) · **P02 oportunidad** (reusa la timeline
scroll-scrubbed de la Home: `.ptl` de `03-project.css` + `initProjectTimeline` de `03-project.js`) ·
P03 "Three ways this pays back" · **P04 tracción** (`<psl-live-counter variant="sponsor">`) ·
**P05 contacto** (form + descarga del partner deck).

### ACADEMY (`pages/academy.html`)
A01 hero (video `hero_academy.mp4`) · **A02 pathway** (reusa la misma timeline `.ptl` +
`initProjectTimeline`) · A03 método · A05 parents · A06 FAQ · **A07 tryouts** (form `a07-tryouts.js`).

### Navegación entre páginas
El **nav y el footer** (00 / 09) van iguales en todas las páginas. Sus links usan `archivo.html#ancla`;
el compilador los reescribe a los permalinks reales de WordPress (find-and-replace de `__URL_*__`,
ver `dist/UPLOAD.md`). Los anclas dentro de la misma página (ej. `#join`) funcionan solos.

---

## 7. Componentes web y contratos de API

Todos son `customElements.define` (API nativa del navegador). Se insertan como una etiqueta HTML.
Hoy corren con datos demo; **conectar el endpoint real reemplazando la función de datos indicada**.

- **`<psl-live-counter variant="stats|fan|reservation|sponsor">`** — banda de métricas.
  Contrato: `GET /api/live-counter?scope=…`. Schema completo en `custom/live-counter/live-counter.config.js`.
  Reemplazar `_demoData()` por `fetch(this.config.endpoint)`. Las métricas enteras hacen count-up 0→valor
  al entrar en viewport. La línea "Updated in real time" es opt-in por variante (`showUpdated: true`);
  `stats` y `sponsor` la tienen apagada, igual que el pie `note`.

- **`<psl-fixtures>`** (Matchday) — partidos del equipo reserva.
  Contrato: `GET /api/fixtures?team=reserve` → `[{ competition, kickoff:ISO, venue, home:{name,abbr},
  away:{…}, status:"next|upcoming" }]`. El countdown ("in 3 days") se calcula del `kickoff`. Datos demo
  y detalle en `custom/fixtures/fixtures.js`.

- **`<psl-departures-board>`** (tablero split-flap del bloque Founders) — figura metafórica de fundadores
  "abordando el vuelo PSL·2027". Los asientos son **aleatorios a propósito** (no es un contador real —
  así no "infla" números). Contrato opcional: `GET /api/founders/recent` → `[{ name, from }]` para las
  filas. Detalle en `custom/departures-board/departures-board.js`.

- **`<psl-founder-id>`** (boarding pass, bloque Founders) — el usuario saca una foto con la cámara (o
  sube una), se arma el pase y lo comparte como IMAGEN. **NO necesita backend** — todo se compone en un
  `<canvas>` en el dispositivo (la foto nunca se sube; es un feature de privacidad, está escrito en la
  card). Requiere **HTTPS** (el sitio de WP ya lo es) para `getUserMedia`; como el bloque vive en la
  página (no en un iframe), la cámara funciona sin permisos extra. Si no hay permiso, cae a "subir foto"
  solo — nunca se rompe. Detalle en `custom/founder-id/founder-id.js`.

- **`<psl-jersey-viewer>`** (bloque Jersey) — camiseta 360° hecha con una secuencia de 90 cuadros WebP
  (`assets/jersey360/`) que se dibuja en canvas según el scroll. No necesita backend. Para cambiar el kit:
  reemplazar la secuencia manteniendo nombres y relación de aspecto (recorte 4:5).

- **`<psl-founder-wall>` / `<psl-founder-card>`** — muro público buscable y carnet compartible.
  **Hoy no están montados en ninguna página** (el muro S04 de Sumate se sacó; la Home usa el boarding
  pass). Quedan en `custom/founder-wall/` por si se re-montan. Contrato del muro:
  `GET /api/founders?number=…`.

### Formularios (POST a implementar — hoy muestran confirmación SIN enviar nada)

> ⚠️ Los tres formularios hoy **fingen éxito** (validan y muestran un mensaje, pero no mandan nada).
> **Hay que cablearlos antes de lanzar** o se pierden los leads.

- **Newsletter** (Home 09 / footer): `native/home/09-cierre-footer.js` → `POST { email }` al endpoint de suscripción.
- **Contacto Partners** (P05): `native/partners/p05-contact.js` → `POST /api/partner-contact { name, company, email, message }`.
  El "partner deck" es un link a un PDF (hoy baja al form; poner el `href` real cuando exista el PDF).
- **Tryouts** (Academy A07): `native/academy/a07-tryouts.js` → `POST /api/academy/tryout-request`.
- **Alta de fundador** (Sumate S03): cada plan lleva `data-signup="free|founder|premium"`.
  Cablear a `POST /api/founder-signup { plan, name, email, city }` → `201 { founderNumber, tier }`.
  `free` no cobra; los pagos son **seña reembolsable hasta 2027**. Hoy los 3 CTA scrollean a `#join`
  (deferido) hasta que exista el flujo real.

---

## 8. Pendientes / deuda técnica

- **Formularios sin backend** (ver §7): los cuatro forms necesitan su endpoint. Es lo más importante.
- **Partner deck**: falta el PDF; el link "Download the partner deck" baja al form de contacto mientras tanto.
- **`<psl-founder-wall>` / `<psl-founder-card>`**: existen pero sin sección montada. Definir si vuelven.
- **Nav en mobile**: la nav es del template de USL, así que su responsive lo maneja el theme.
- Revisión completa del prototipo (contraste, código muerto, etc.) en `docs/auditoria-2026-07-10.md`.

---

## 9. Preview local

Servir la raíz del repo con cualquier server estático y abrir las páginas:
```
python3 -m http.server 4321
# → http://localhost:4321/pages/home.html   (sumate · partners · academy)
```
Al editar CSS/JS, subir el `?v=N` en `pages/*.html` para saltear el caché del navegador.
Nada de esto (el server, el `?v=`, el fetch de bloques) se traspasa a WordPress — es andamiaje de preview.
Para ver los **bloques ya compilados** funcionando, ver `dist/README.md`.
