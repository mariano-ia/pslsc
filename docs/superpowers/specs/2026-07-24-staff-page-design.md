# Staff page — design spec

Fecha: 2026-07-24 · Rama: `staff-page` · Autor de diseño: Mariano

## 1. Objetivo

Sumar una página de **Staff** al sitio de Port St. Lucie SC, accesible desde la nav,
que presente al equipo de liderazgo con el **look and feel nuevo** del prototipo.
Se basa en la página actual del sitio en producción (https://www.portstluciesc.com/staff/)
pero adaptada: retratos en grilla y la **bio que se abre al hacer click** (acordeón), en
vez del muro de texto alternado de hoy.

**Entregable clave:** un bloque HTML autocontenido que Santi pega **una sola vez** en un
widget "HTML" del constructor de WordPress — misma mecánica que Academy/Partners.

## 2. Alcance

**Incluye:**
- Un bloque nuevo `native/staff/st01-staff.html` (+ `.css`), compilado a `dist/blocks/`.
- Página de preview `pages/staff.html` (nav + bloque + footer).
- Link "Staff" en la nav compartida del prototipo.
- Descarga y optimización a WebP de las 6 fotos existentes + 1 placeholder de marca.

**No incluye (YAGNI):**
- Ningún backend, form ni dato dinámico (la página es 100% estática).
- Buscador/filtros de staff.
- Modal/lightbox (se descartó a favor del acordeón inline, más simple y robusto).
- Alta/edición de miembros por CMS (el contenido es estático en el bloque).

## 3. Cómo encaja en el build (referencia: `docs/handoff-notes.md`)

- El bloque se compila con `python3 tools/build-blocks.py`. **Hay que registrarlo** agregando
  `("staff", "st01-staff")` a la lista `BLOCKS` de [tools/build-blocks.py](../../../tools/build-blocks.py).
- El compilador ya inyecta `tokens/tokens.css` + `native/_patterns/motion.css`, agrega
  `cards.css` si el HTML usa `.pcard`, y `motion.js` solo si hay `data-reveal|parallax|...`.
- Todo el CSS queda namespaceado bajo `.pslsc` (no pisa el template ni al revés).
- Los assets `/assets/...` se reescriben a `ASSET_BASE/assets/...` (Santi los hostea una vez).
- **La nav (00) NO se compila** — es del template de USL. En WordPress, Santi agrega el ítem
  "Staff" al menú del template. El link en `native/home/00-nav.html` es solo para el preview.

## 4. Contenido (verbatim del sitio actual, English-only)

Dos grupos. Fotos originales en `sites/388/...` del WP de producción; se bajan y optimizan.

### Grupo A — Executive Leadership

**Gustavo Suárez** — *Founder & CEO*
Foto: `.../2025/12/Gustavo_Suarez_01.png`
> Entrepreneur and investor with over 20 years of experience leading sports, real estate, and business ventures across Latin America and the United States. Founder and CEO of Port Saint Lucie SC, he spearheads the creation of an ecosystem that connects sports, real estate, and community development in Florida.
>
> With a deep connection to sports and hands-on experience managing teams and athletic organizations, he combines human leadership, strategic vision, and an unshakable belief that sports can transform lives and drive progress.

**Agostina Galimberti** — *President | Co-Founder*
Foto: `.../2025/12/Agostina_Galimberti_04.png`
> Argentinian entrepreneur based in Florida, with experience in sports innovation, technology, and international business development. Co-founder of Port Saint Lucie SC and founder of a sports technology project, she leads the club's strategic growth in the United States and builds partnerships with institutions, brands, and investors.
>
> A former field hockey player in Argentina, Australia, and Europe, she continues the legacy of her mother, a former player for the Argentine National Hockey Team. Her athletic background shaped her discipline, resilience, and leadership — values she now applies to every project she drives.
>
> Her work blends global vision, creative thinking, and bold execution, integrating sports, real estate, and technology with a lasting social and community impact.

**Paulo Suárez** — *Co-Founder | Managing Partner USA*
Foto: `.../2025/12/PauloSaurez_02.png` (ojo: el archivo tiene el typo "Saurez")
> Entrepreneur with broad experience in business development, human leadership, infrastructure, and sports. Co-founder and Managing Partner of Port Saint Lucie SC, and founder of a sports technology project, he leads the club's expansion in the United States and contributes his expertise in construction, team management, and investment oversight within the family business group.
>
> Currently managing a service franchise in Florida, he combines strategic vision, people-focused leadership, and strong execution — bridging sports, real estate, and business development into one integrated ecosystem.

**Diego Delledonne** — *Chief Operating Officer*
Foto: `.../2025/12/Diego_Delledonne_01.png`
> Soccer executive with more than a decade of experience leading the professional first division at San Lorenzo de Almagro, one of Argentina's traditional top five clubs. From 2013 to 2023, he oversaw the department that bridges sport, business, and people — coordinating first-team operations, managing transfers, and strengthening institutional relationships.
>
> He represented San Lorenzo de Almagro before FIFA at the 2014 Club World Cup and played a pivotal role in the professionalization and stabilization of the soccer department during challenging times. Recognized for his strategic vision and people-centered leadership, Diego believes true success in soccer lies in building sustainable processes, fostering credibility, and achieving balance between sporting performance and institutional growth.

**Sean McDaniel** — *Chief Revenue Officer*
Foto: **no existe en el sitio actual** → placeholder de marca (ver §7).
> Sean McDaniel is an experienced sports executive with more than 15 years in professional soccer management, operations, and commercial strategy. He previously served as President and General Manager of Chattanooga Red Wolves SC, where he played a key role in launching the club's professional program and driving significant revenue growth.
>
> He also contributed to operations for the FIFA Club World Cup 2025, gaining experience in high-level international event management and coordinating with key stakeholders to ensure operational excellence.
>
> At Port St. Lucie SC, McDaniel leads the club's commercial strategy, focusing on partnerships, revenue development, and building a sustainable business model that supports the club's long-term vision.

### Grupo B — Sporting Leadership

**Bernardo Romeo** — *Sporting Director*
Foto: `.../2026/03/20260303_153315_0000.png` (posible gráfico compuesto, no headshot limpio → ver §7 riesgo)
> Former professional soccer player and experienced executive with proven leadership in club management and national team structures. After a successful playing career in Argentina and Europe — including stints at Hamburger SV in Germany and RCD Mallorca and CA Osasuna in Spain — Romeo transitioned into sporting management roles at the highest level.
>
> He served as Sporting Director at San Lorenzo de Almagro, where he was part of the leadership team that guided the club to multiple titles, including its first CONMEBOL Libertadores. He later played a key role within Argentina's national team structures, particularly at the youth level, contributing to talent identification, player development pathways, and the strengthening of competitive environments.
>
> With experience supporting elite player development — including within the generation that featured Lionel Messi — Romeo brings a deep understanding of long-term sporting structure and high-performance standards.

**Juan Ignacio Brown** — *Academy Director*
Foto: `.../2026/03/Juani_Brown_03_69f3f0.png`
> Former professional soccer player and experienced coach with a global career across South America, Europe, and the Middle East. After playing for Estudiantes de La Plata and several clubs in Argentina, Portugal, and Bolivia, he transitioned to coaching, first at Estudiantes' youth academy and later as Technical Secretary at San Lorenzo de Almagro.
>
> He worked with Argentina's youth national teams alongside Javier Mascherano, Pablo Aimar, and Diego Placente before joining Saudi Arabia's Al-Hilal, where he led the team to the Saudi Professional League title (2017–2018). Brown also managed Al-Wehda, Ismaily SC, Al-Shabab, and Brown de Adrogué. In 2024, he became Head Coach of Al-Safa in the Saudi First Division.
>
> Son of José Luis Brown, Soccer World Cup champion in 1986, Juan Ignacio continues a legacy of leadership, discipline, and passion for soccer.

## 5. Layout y diseño visual

Alternancia de superficies del sistema (`docs/handoff-notes.md §3`): header oscuro, cuerpo claro.

- **Header** (`surface-ink`): kicker chico (Druk Text Wide, tipo "PORT ST. LUCIE SC") + título
  grande en Druk **"Leadership"** + (opcional) una línea de intro corta. Contenido dentro de
  `.psl-container`.
- **Cuerpo** (`surface-paper`): los dos grupos, cada uno con su subtítulo (Grupo A "Executive
  Leadership", Grupo B "Sporting Leadership") como label/kicker sobre la grilla.
- **Grilla de retratos**: `grid` con `align-items: start`.
  - Desktop (>960px): 3 columnas.
  - Tablet (≤960px): 2 columnas.
  - Mobile (≤560px): 1 columna.
- **Tarjeta de persona** (`<details>` nativo, ver §6):
  - `<summary>`: foto retrato **4:5** (WebP, `width`/`height` para evitar CLS, `loading="lazy"`,
    `decoding="async"`), nombre (Druk, `--font-display`), rol (Druk Text Wide o mono, color
    `--color-teal`), y un afford "Read bio" con un ícono ＋ que rota a × al abrir.
  - Contenido abierto: los párrafos de la bio (Proxima Nova, `--font-body`).
- **Tipografía y color**: todo desde `tokens/tokens.css`. Sin naranja (prohibido por marca).

## 6. Interacción (acordeón, cero JS)

- Cada tarjeta es un `<details><summary>…</summary> …bio… </details>` nativo del navegador.
- Abrir/cerrar por click o teclado (accesible por defecto). **No requiere JavaScript** — es la
  opción más robusta para el WP de USL (evita la "trampa del `<script>`" del §2 del handoff).
- `align-items: start` en la grilla → abrir una tarjeta **no estira** a las vecinas.
- Transición sutil (opacidad/altura) al abrir; el ícono ＋→× rota. Todo bajo
  `@media (prefers-reduced-motion: reduce)` se desactiva.
- **Nota:** se evita animar la entrada con `[data-reveal]` para NO arrastrar `motion.js` al
  bloque y mantenerlo 100% sin JS. (Si más adelante se quiere el fade-in de entrada, alcanza con
  agregar `data-reveal` a las tarjetas; el compilador incluye `motion.js` solo.)

## 7. Assets y placeholder

- **Pipeline de fotos:** bajar los 6 PNG originales del WP de producción, recortar a retrato
  **4:5**, exportar a **WebP** (calidad ~82), guardar en `assets/staff/` con nombres
  kebab-case: `gustavo-suarez.webp`, `agostina-galimberti.webp`, `paulo-suarez.webp`,
  `diego-delledonne.webp`, `bernardo-romeo.webp`, `juan-ignacio-brown.webp`.
- **Sean McDaniel (sin foto):** placeholder de marca **inline en CSS/HTML** (no imagen): tile con
  fondo `--color-ink`/aqua, iniciales "SM" en Druk y el crest chico, con el mismo marco 4:5 que
  las demás tarjetas. Deja la grilla pareja y queda on-brand. Marcar en el HTML dónde iría la foto
  real para que Santi la reemplace cuando exista.
- **Riesgo — foto de Romeo:** `20260303_153315_0000.png` parece un gráfico compuesto (no un
  headshot limpio). Al recortarlo 4:5 puede quedar raro. En implementación: revisar el recorte; si
  no cierra, usar el mismo placeholder de marca (iniciales "BR") y avisar.

## 8. Archivos a crear / modificar

**Crear:**
- `native/staff/st01-staff.html` — markup del bloque (header + 2 grupos + tarjetas `<details>`).
- `native/staff/st01-staff.css` — estilos del bloque (grilla, tarjeta, acordeón, placeholder).
- `pages/staff.html` — preview (nav + bloque + footer), calcado de `pages/academy.html`.
- `assets/staff/*.webp` — 6 fotos optimizadas.

**Modificar:**
- `tools/build-blocks.py` — agregar `("staff", "st01-staff")` a `BLOCKS`.
- `native/home/00-nav.html` — agregar `<a href="staff.html">Staff</a>` en `.nav__links`.
- `docs/handoff-notes.md` — documentar la página nueva (§6 páginas, tabla/entrada Staff) y que en
  WordPress hay que agregar "Staff" al menú del template.
- `.gitignore` — revisar que `assets/staff/*.webp` NO quede excluido.

## 9. Accesibilidad

- `<details>/<summary>` da toggle por teclado y semántica de disclosure sin ARIA extra.
- Contraste según tokens (paleta ya auditada). Foco visible en `<summary>`.
- Cada `<img>` con `alt` = nombre de la persona.
- Respeta `prefers-reduced-motion`.

## 10. Integración WordPress (para el handoff)

1. `python3 tools/build-blocks.py` → genera `dist/blocks/psl-staff-st01-staff.html`.
2. Santi crea una página "Staff" en WordPress y pega el bloque en un widget HTML.
3. Santi agrega "Staff" al menú del template de USL (la nav no es de estos bloques).
4. Hostea `assets/staff/*.webp` junto al resto de assets (`ASSET_BASE`).

## 11. Verificación

- Preview local: `python3 -m http.server 4321` → `http://localhost:4321/pages/staff.html`.
  - Las 7 tarjetas se ven; el acordeón abre/cierra; abrir una no descuadra las vecinas.
  - Responsive 3/2/1 columnas; sin scroll horizontal.
  - El link "Staff" aparece en la nav y navega al preview.
- Build: `python3 tools/build-blocks.py` corre sin error e incluye el bloque staff; el
  `dist/blocks/psl-staff-st01-staff.html` abre y funciona. Nota: el compilador siempre agrega el
  script de boot + autodiagnóstico, así que la franja de diagnóstico se pone **verde** (aunque el
  bloque no tenga JS propio); se puede borrar una vez validada, como en los demás bloques.
