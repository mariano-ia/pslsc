# Publicar los bloques en WordPress — paso a paso

Los 19 bloques del sitio, listos para pegar en widgets **HTML** del constructor visual.
Validado en el WordPress real de USL (WP VIP) con el bloque más complejo del sitio.

Nav y News **no** están acá: son nativas del template de USL.

---

## Una sola vez: subir los assets y configurar el build

Todos los bloques comparten fuentes, imágenes y videos. Se suben **una vez** y cada bloque los
referencia por URL (se cachean entre páginas).

### 1. Subir las fuentes y los assets

A un lugar del **mismo dominio** de WordPress (en VIP, lo natural es `/wp-content/uploads/psl/`),
subí **dos cosas** para que quede esta estructura:

```
…/wp-content/uploads/psl/
   fonts/     ← subir dist/upload/fonts/  (12 .woff2, 160 KB)
   assets/    ← subir la carpeta /assets del repo  (brand, images, proof, videos, jersey360)
```

Las fuentes woff2 subseteadas están en `dist/upload/fonts/`. Los assets (imágenes, videos, camiseta 360)
son los del repo en `/assets` — no se duplican en `dist/upload/` para no inflar el repo. Los archivos
sin usar que el `.gitignore` excluye (`anchor-white.png`, `360_shirt.mp4`, etc.) no hacen falta subirlos.

> **Mismo dominio, importante.** Los `<script type="module">` y los `@font-face` cross-origin exigen
> cabecera `Access-Control-Allow-Origin`. Hosteando bajo el dominio de WP no hay que configurar nada.

### 2. Rellenar 4 tokens (find-and-replace)

Los bloques en `dist/blocks/` traen 4 placeholders a propósito. Cuando tengas las URLs reales,
hacé un **find-and-replace** de estos 4 tokens (en los archivos de `dist/blocks/`, o directamente
en los bloques ya pegados en WordPress). Son únicos y greppables:

| Token (buscar) | Reemplazar por (ejemplo) | Qué es |
|---|---|---|
| `__PSL_ASSET_BASE__` | `https://www.portstluciesc.com/wp-content/uploads/psl` | Dónde subiste `dist/upload/`. **Sin barra final** (los bloques ya la ponen). |
| `__URL_HOME__` | `/` | Permalink de Home |
| `__URL_SUMATE__` | `/become-a-founder/` | Permalink de la página de Founders |
| `__URL_PARTNERS__` | `/partners/` | Permalink de Partners |

`__PSL_ASSET_BASE__` aparece en cada bloque (fuentes + imágenes); los `__URL_*__` solo en los bloques
que enlazan a otras páginas (nav-CTAs, footer). Ningún bloque queda sin al menos el asset base.

> Equivalente: en vez del find-and-replace, se pueden poner esos valores en `ASSET_BASE` y `PERMALINKS`
> arriba de `tools/build-blocks.py` y correr `python3 tools/build-blocks.py` — regenera todo con las
> URLs reales. Cualquiera de los dos caminos sirve.

---

## Por cada bloque: copiar y pegar

1. Abrir el `.html` del bloque en `dist/blocks/`, copiar **todo**.
2. En la página de WordPress, agregar un bloque **HTML** (Custom HTML) y pegar.
3. Publicar y mirar **la página publicada** (no la previa del editor).
4. Al pie del bloque hay una franja de autodiagnóstico:
   - **Verde** → todo corrió bien. Borrar el `<p class="psl-diag">` y el primer `<script>` (el reporter),
     o dejarlos (son inofensivos).
   - **Roja con un error** → ahí está el motivo exacto. Mandámelo.

Qué bloque va en qué página:

| Página WP | Bloques (en orden) |
|---|---|
| Home | 01-hero · 02-stats · 03-project · 04-proof · 04b-fixtures · 05-jersey · 06-founders · 07-academy · 09-cierre-footer |
| Become a Founder | s01-hero · s02-benefits · s03-plans · s05-faq · s06-cta |
| Partners | p01-hero · p02-opportunity · p03-value · p04-traction · p05-contact |

---

## ⚠️ La trampa de WordPress (por qué el JS va como lo va)

WordPress procesa el **contenido** de las etiquetas `<script>` como si fuera HTML: en cuanto ve un `<`
seguido más adelante de un `&` (p. ej. `if (a < b && c)`), escapa los `&` y rompe el script.
Por eso el compilador mete el JS como **data URI en el atributo `src`** (los atributos no se filtran).
**Regla: nunca pegar JavaScript como texto dentro de un `<script>` en este WordPress.**

---

## Pendientes de cableado (el compilador ya dejó todo listo, falta el backend)

Estas cosas quedan como el dev decida — el markup y el contrato están, pero no hay backend en el prototipo:

- **Alta de fundador** (s03-plans): los 3 CTA scrollean a la banda de cierre (`#join`) por ahora.
  Cada uno lleva `data-signup="free|founder|premium"`. Cablear a `POST /api/founder-signup`.
- **Formularios** (newsletter en 09-cierre-footer, contacto en p05-contact): **hoy muestran un mensaje
  de éxito sin enviar nada.** Antes de lanzar hay que cablearlos (WPForms o endpoint), o se pierden los
  leads. Contrato del payload en el `.js` de cada bloque.
- **Partner deck** (p05-contact): el link "Download the partner deck" baja al form de contacto hasta que
  exista el PDF. Cuando exista, poner su URL.

Detalle completo en `docs/auditoria-2026-07-10.md`.
