# dist/ — bloques compilados para WordPress

Salida del compilador `tools/build-blocks.py`. Cada bloque del sitio, listo para pegar en un widget
**HTML** del constructor visual de WordPress (WP VIP), sin romper el template de USL.

## Qué hay acá

| Carpeta / archivo | Qué es |
|---|---|
| **`UPLOAD.md`** | **Empezá acá.** Paso a paso: subir assets, configurar, pegar. |
| `blocks/` | Los **25 bloques finales** (paste-ready). Uno por sección. Nav y News quedan fuera (nativas del template). |
| `upload/` | Fuentes + imágenes + videos. Se suben **una vez** a `ASSET_BASE`. |
| `_pilot/` | Sondas de diagnóstico (`psl-diagnostico.html`, `psl-test-tamano.html`) usadas para validar el flujo en el sitio real. Referencia. |

## Cómo funciona (resumen)

Lo genera `tools/build-blocks.py`. Por cada bloque:

- **CSS namespaceado bajo `.pslsc`** — no pisa el template, y un reset scopeado evita que el template
  pise el bloque. Aislamiento en las dos direcciones, verificado contra un theme hostil.
- **Fuentes y assets hosteados** en `ASSET_BASE`, referenciados por URL (cacheados entre páginas).
  Fuentes subseteadas a Latin y en WOFF2: 1,16 MB → 127 KB.
- **JS como data URI en el `src`** — WordPress corrompe el JS que va como texto dentro de `<script>`
  (ve el `<` de `a < b` y escapa los `&`). En los atributos no entra. Ver `UPLOAD.md`.
- **Full-bleed sin `alignfull`** (el theme no lo soporta): `.pslsc--bleed` con `--psl-vw`.
- **Autodiagnóstico**: una franja al pie que se pone verde si el JS corrió, o roja con el error.

## Estado

- Los 25 bloques verificados en headless: aislamiento, render, montaje de componentes, full-bleed y
  **inmunidad a los filtros de WordPress** (el data URI sobrevive intacto).
- El bloque 06-founders está **andando en el sitio real** (`portstluciesc.com/blocks-test/`).

Pesos por bloque: 17–54 KB (contra ~200 KB si fuera todo inline). Los assets pesados se cargan una vez.
