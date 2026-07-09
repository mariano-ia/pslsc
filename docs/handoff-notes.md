# PSL SC — Handoff para Santi (implementación WordPress)

Prototipo funcional del sitio de **Port St. Lucie SC**, listo para portar a WordPress.
Es HTML + CSS + JS estándar del navegador — **sin frameworks** (nada de React/Vue/Svelte/JSX ni
templating `{{ }}`). Todo lo que ves corre tal cual en cualquier navegador.

> **Modelo acordado:** casi todo se va a inyectar en WordPress como **`<iframe>`** (cada página o
> cada bloque servido como archivo estático y embebido). Por eso el punto más importante de esta guía
> es la **§2 (Integración por iframe)** — leela primero.

Última actualización: 2026-07-09 · Contacto de diseño: Mariano.

---

## 1. Estructura del repo

```
tokens/            tokens.css (variables de marca) · fonts.css (@font-face) · tokens.md (de dónde sale cada valor)
native/            bloques "nativos" (HTML + CSS, a veces + JS). 1 archivo = 1 bloque/sección.
  _patterns/       CSS y JS compartidos: motion.css/js (animaciones) · cards.css (.pcard)
  home/            00-nav … 09-cierre-footer   → la HOME completa
  sumate/          s01-hero … s06-cta          → la página "Become a Founder"
  partners/        p01-hero … p05-contact      → la página Partners
custom/            componentes web a medida (Web Components <psl-*>). Cada uno es autocontenido.
  live-counter/    <psl-live-counter>       — banda de métricas / contadores
  fixtures/        <psl-fixtures>           — Matchday (partidos del equipo reserva)
  jersey-viewer/   <psl-jersey-viewer>      — camiseta 360° que gira con el scroll
  founder-id/      <psl-founder-id>         — BOARDING PASS de fundador (cámara → foto → compartir)
  departures-board/ <psl-departures-board>  — tablero split-flap tipo aeropuerto
  founder-wall/    <psl-founder-wall>       — muro de fundadores buscable (solo en Sumate)
                   <psl-founder-card>       — carnet 9:16 (existe, sin sección montada; ver §7)
assets/            brand/ (logos WebP) · fonts/ (tipografías) · images/ · proof/ · jersey360/ · videos/
pages/             home.html · sumate.html · partners.html  → SOLO para preview (ver §2)
docs/              esta guía
external/          contrato del link a la tienda externa (no se construye acá)
vercel.json        config del deploy de preview (Vercel) — no aplica a WordPress
```

**El nombre de archivo dice el orden y la superficie.** `04-proof` = bloque 4. Prefijo `s` = Sumate,
`p` = Partners. Cada bloque tiene su `.html` y su `.css` (algunos + `.js`).

---

## 2. Integración por iframe (LO IMPORTANTE)

En preview, `pages/home.html` arma la página completa haciendo `fetch()` de cada bloque de
`native/home/` y pegándolos. **Ese ensamblado por fetch es SOLO para previsualizar — no se traspasa.**

En WordPress la idea es servir el prototipo como archivos estáticos y embeberlo en iframes. Dos formas,
elegí según el caso:

- **Página entera en un iframe** (lo más simple): el `src` del iframe apunta a `pages/home.html`
  (o `sumate.html` / `partners.html`) ya hosteado. Adentro el fetch funciona porque los archivos se
  sirven juntos (mismo origen).
- **Bloque suelto en un iframe** (si querés intercalar contenido nativo de WP): servís un HTML mínimo
  que incluya `tokens/fonts.css` + `tokens/tokens.css` + el `.css`/`.html`/`.js` de ese bloque, y lo
  embebés. Los bloques son autocontenidos, así que esto funciona sin el fetch.

### Checklist del iframe (importante, no saltear)

1. **Altura automática.** Un iframe NO crece solo con su contenido. Hay que informar la altura del
   contenido al padre. Snippet listo (poné el script dentro de cada página embebida y el listener en
   WordPress):
   ```html
   <!-- dentro del documento embebido (al final del body) -->
   <script>
     function pslSendHeight(){ parent.postMessage({ pslHeight: document.documentElement.scrollHeight }, '*'); }
     new ResizeObserver(pslSendHeight).observe(document.documentElement);
     addEventListener('load', pslSendHeight);
   </script>
   ```
   ```js
   // en WordPress (padre)
   addEventListener('message', (e) => {
     if (e.data && e.data.pslHeight) document.querySelector('#psl-iframe').style.height = e.data.pslHeight + 'px';
   });
   ```

2. **Permiso de cámara.** El bloque **Founders (06)** usa la cámara (getUserMedia) para el boarding
   pass. Si ese bloque va en iframe, el iframe **necesita** el atributo `allow="camera"`, si no el
   navegador bloquea la cámara:
   ```html
   <iframe src="…/home.html" allow="camera" …></iframe>
   ```
   La cámara además requiere **HTTPS** (el sitio de WP ya lo es). Todo es client-side: la foto nunca
   sale del dispositivo (no hay upload). Si no hay permiso, cae a "subir foto" solo — nunca se rompe.

3. **Links internos.** Adentro del iframe, un link a `home.html#academy` navega DENTRO del iframe.
   Para saltar entre páginas reales de WordPress hay que: (a) remapear los hrefs a las rutas de WP
   (`home_url('/sumate')`, etc.) y (b) usar `target="_parent"` si el iframe es una sección y el link
   debe cambiar la página completa. Ver el mapa de navegación en §6.

4. **Rutas de assets absolutas.** El código referencia assets como `/assets/brand/crest-aqua.webp`
   (barra inicial = raíz del dominio). Al hostear el prototipo bajo un subpath, o al mover assets al
   theme, hay que remapear ese prefijo. Grep: `grep -rn "/assets/" native custom` (son ~10 refs).
   Las fuentes en `fonts.css` ya usan rutas relativas (`../assets/fonts/`).

5. **Cache-busting `?v=N`.** Los `<link>`/`<script>` de `pages/*.html` llevan `?v=N`. Es para forzar
   recarga durante el desarrollo del prototipo. En WordPress lo maneja el versionado de
   `wp_enqueue_*`; el `?v=` se puede sacar.

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

El sitio pesa poco: los assets que se cargan están en **WebP** (imágenes) y el video del hero está
recomprimido. Las fuentes son self-hosted. Formatos:
- **Logos** `assets/brand/`: `crest-aqua.webp`, `crest-black.webp`, `anchor-aqua.webp`,
  `anchor-black.webp` (con transparencia).
- **Fotos**: `assets/images/pslsc_academy.webp` (foto academia), `assets/images/luka-card.webp`
  (mascota Luka para el boarding pass), `assets/proof/stadium-aerial.webp` (render del estadio).
- **Camiseta 360°**: `assets/jersey360/f_00.webp … f_89.webp` (90 cuadros; los usa el jersey-viewer).
  El video fuente `assets/videos/360_shirt.mp4` queda de referencia (no se carga en la página).
- **Video hero**: `assets/videos/hero.mp4` (H.264, muteado, loop) + `hero-poster.webp`.

Las `<img>` de contenido ya llevan `width`/`height` (evita saltos de layout / CLS), `loading="lazy"`
y `decoding="async"`.

> Nota: quedan sin usar la carpeta `i18n/` (vacía, se puede borrar — ver §5) y `assets/videos/360_shirt.mp4`
> es solo fuente. Todo lo demás en `assets/` se usa.

---

## 5. Idioma: SOLO INGLÉS

El sitio es **English-only**. Se removió todo el sistema bilingüe EN/ES (el switch de la nav, los
`data-es`, el `i18n.js` y los helpers `L()` de los componentes). No hay nada que traducir ni cablear
de idioma. La carpeta `i18n/` quedó vacía y se puede borrar.

---

## 6. Páginas y bloques

Buscá `HANDOFF (WP):` en los comentarios del código para encontrar lo que hay que cablear
(endpoints, forms). Cada componente `<psl-*>` corre hoy con **datos demo**; el contrato de API real
está documentado en su `.js`.

### HOME (`pages/home.html`)

| # | Bloque | Superficie | Qué es / a implementar |
|---|---|---|---|
| 00 | Nav (crest + CTA "Become a Founder") | ink | HTML puro. Sticky. |
| 01 | Hero + video + efecto "born" | ink | Video de fondo `hero.mp4`. La última palabra del título hace scramble (JS). |
| 02 | Stats band | ink | `<psl-live-counter variant="stats">` — ver contrato abajo. |
| 03 | The project (timeline horizontal que se dibuja con el scroll) | paper | HTML + JS (`03-project.js`). |
| 04 | Proof / construction schedule | ink | "Peek" del render con linterna → click revela → la timeline de obra aparece SOBRE la foto. Todo client-side (`04-proof.js`). |
| 04b | Matchday (partidos reserva) | paper | `<psl-fixtures>` — ver contrato abajo. |
| 05 | Jersey / Shop | ink | `<psl-jersey-viewer>` — camiseta 360° que gira con el scroll. |
| 06 | **Founders** | paper | `<psl-founder-id>` (boarding pass con cámara) + `<psl-departures-board>` (tablero split-flap) + CTA. **Este bloque necesita `allow="camera"` en el iframe.** |
| 07 | Academy | ink | Foto real + copy. HTML puro. |
| 08 | News ("From the build") | paper | 3 cards estáticas. HTML puro. |
| 09 | Newsletter + Footer | ink | Form de suscripción (`09-cierre-footer.js`) — ver contrato abajo. |

### SUMATE (`pages/sumate.html`) — página "Become a Founder"
S01 hero · S02 beneficios · **S03 planes** (alta de fundador) · **S04 muro buscable**
(`<psl-founder-wall searchable>`) · S05 FAQ (`<details>` nativo, sin JS) · S06 CTA final.

### PARTNERS (`pages/partners.html`)
P01 hero · P02 oportunidad · P03 "Three ways this pays back" · **P04 tracción**
(`<psl-live-counter variant="sponsor">`) · **P05 contacto** (form + descarga del partner deck).

### Navegación entre páginas
El **nav y el footer son bloques compartidos** (van iguales en las 3 páginas). Sus links usan
`archivo.html#ancla` para funcionar desde cualquier página. **HANDOFF:** remapear a rutas reales de
WordPress (`home_url('/sumate')`, `home_url('/partners')#contact`, etc.). Si el nav va en un iframe de
sección, los links entre páginas necesitan `target="_parent"`.

---

## 7. Componentes web y contratos de API

Todos son `customElements.define` (API nativa del navegador). Se insertan como una etiqueta HTML.
Hoy corren con datos demo; **conectar el endpoint real reemplazando la función de datos indicada**.

- **`<psl-live-counter variant="stats|fan|reservation|sponsor">`** — banda de métricas.
  Contrato: `GET /api/live-counter?scope=…`. Schema completo en `custom/live-counter/live-counter.config.js`.
  Reemplazar `_demoData()` por `fetch(this.config.endpoint)`. Las métricas enteras hacen count-up 0→valor
  al entrar en viewport.

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
  `<canvas>` en el dispositivo (la foto nunca se sube; eso es un feature de privacidad, está escrito en
  la card). Requisitos: `allow="camera"` en el iframe + HTTPS. El asiento del pase DIY es aleatorio; el
  "número de fundador" real se reclama en Sumate. Detalle en `custom/founder-id/founder-id.js`.

- **`<psl-jersey-viewer>`** (bloque Jersey) — camiseta 360° hecha con una secuencia de 90 cuadros WebP
  (`assets/jersey360/`) que se dibuja en canvas según el scroll. No necesita backend. Para cambiar el kit:
  reemplazar la secuencia manteniendo nombres y relación de aspecto (recorte 4:5).

- **`<psl-founder-wall searchable>`** (Sumate S04) — muro público de fundadores: nombre + #número + ciudad
  (sin email). Buscable por número. Contrato: `GET /api/founders?number=…` para buscar fuera de la ventana
  cargada. Detalle en `custom/founder-wall/founder-wall.js`.

- **`<psl-founder-card>`** — carnet 9:16 compartible (versión previa al boarding pass). **Existe pero no
  está montado en ninguna página** (la Home usa `<psl-founder-id>` en su lugar). Si se monta, la generación
  ideal es server-side (OG image). Ver §8.

### Formularios (POST a implementar)
- **Newsletter** (Home 09 / footer): `native/home/09-cierre-footer.js` → `POST { email }` al endpoint de suscripción.
- **Contacto Partners** (P05): `native/partners/p05-contact.js` → `POST /api/partner-contact { name, company, email, message }`. El "partner deck" es un link a un PDF (href a definir).
- **Alta de fundador** (Sumate S03): el CTA de cada plan → `POST /api/founder-signup { plan, name, email, city }`
  → `201 { founderNumber, tier }`. `free` no cobra; los pagos son **seña reembolsable hasta 2027**.

---

## 8. Pendientes / deuda técnica

- **Placeholders** `▦ … DROP HERE` en algunos bloques (ej. foto del academy en Partners, renders):
  reemplazar por assets reales del cliente.
- **`<psl-founder-card>`** existe restylado pero sin sección propia montada (la Home quedó con el
  boarding pass). Definir si se monta una sección "Your card" o se descarta.
- **Nav en mobile**: muestra crest + CTA (sin menú desplegable). Candidato a hamburguesa más adelante.
- **Carpeta `i18n/`**: vacía, borrable.

---

## 9. Preview local

Servir la raíz del repo con cualquier server estático y abrir las páginas:
```
python3 -m http.server 4321
# → http://localhost:4321/pages/home.html   (sumate.html · partners.html)
```
Al editar CSS/JS, subir el `?v=N` en `pages/*.html` para saltear el caché del navegador.
Nada de esto (el server, el `?v=`, el fetch de bloques) se traspasa a WordPress — es andamiaje de preview.
