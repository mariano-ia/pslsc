# Port St. Lucie SC — sitio (prototipo → WordPress)

Prototipo funcional del sitio de **Port St. Lucie SC**, en HTML + CSS + JavaScript estándar del
navegador — **sin frameworks**. Se entrega para portar a **WordPress** (WP VIP), donde cada sección
se pega como un **bloque HTML** en el constructor visual.

## Ramas (desde 2026-10-07)

| Rama | Qué es | Formato | Se ve en |
|---|---|---|---|
| `main` | **Solo lo que está en producción** del sitio del club. | Bloques de WordPress, salvo indicación contraria | `pslsc.vercel.app` · los bloques que se pegan en WP salen de acá |
| `develop` | Rama de trabajo del sitio del club. Va adelantada a `main` **a propósito**. | Bloques de WordPress, salvo indicación contraria | `pslsc-git-develop-marianonoceti-gmailcoms-projects.vercel.app` |
| `school` | El **micrositio del Soccer School**, que es otro sitio. Se trabaja **solo en esta rama**: no se mezcla con `develop` ni con `main`. | **Sin las restricciones de WordPress**: HTML/CSS/JS libre, identidad propia | `pslsc-git-school-marianonoceti-gmailcoms-projects.vercel.app/school` |

Reglas:

- **Nada sube a `main` sin doble check de Mariano.** Antes de cualquier merge o push a `main` se muestra qué
  sale a producción (commits y archivos) y se espera una confirmación explícita. `main` es producción.
- Trabajo del sitio del club → `develop`, y se promueve a `main` cuando está aprobado. Si se arregla algo
  directo en `main` (hotfix), se trae a `develop` enseguida para que no diverjan.
- Trabajo del Soccer School → `school`, y nada más que `school`. `school` **no se mergea con `develop` ni con
  `main` en ninguna dirección**: si hace falta algo de un lado, se copia o se hace cherry-pick. (`develop` no
  tiene la carpeta `school/`, y `main` tampoco desde el próximo pase a producción: un merge le borraría el
  micrositio a `school`).
- `main` y `develop` respetan el formato de **bloques de WordPress** (CSS bajo `.pslsc`, JS como data URI,
  sin frameworks; ver la §2 de [`docs/handoff-notes.md`](docs/handoff-notes.md)), salvo que se indique lo
  contrario. `school` no tiene ese límite.

## Por dónde empezar

| Si querés… | Andá a |
|---|---|
| **Publicar en WordPress** (paso a paso) | **[`dist/UPLOAD.md`](dist/UPLOAD.md)** |
| Entender el proyecto entero (estructura, componentes, contratos de API) | [`docs/handoff-notes.md`](docs/handoff-notes.md) |
| Ver los bloques ya compilados | [`dist/`](dist/) — `blocks/` (pegar) · `upload/` (hostear) |
| Regenerar los bloques desde el fuente | [`tools/README.md`](tools/README.md) |
| La **tienda** (mockup a medida, NO va por bloques) | [`shop/`](shop/) — ver [`shop/README.md`](shop/README.md) |
| El **micrositio del Soccer School** (NO va a WordPress) | Vive en la **rama `school`**, no en esta: ver `school/README.md` en esa rama |
| La revisión/auditoría del prototipo | [`docs/auditoria-2026-07-10.md`](docs/auditoria-2026-07-10.md) |
| **Luca** (mascota): character sheet, paleta y prompts canónicos para imagen/video | [`docs/luca-character-sheet.md`](docs/luca-character-sheet.md) |
| Producir un **video con Luca** (método, herramientas, revisión) | [`docs/luca-video-playbook.md`](docs/luca-video-playbook.md) |

## Ver el sitio localmente

```bash
python3 -m http.server 4321
# sitio:   http://localhost:4321/pages/home.html   (sumate · partners · academy · season_tickets)
# tienda:  http://localhost:4321/shop/
```

Las páginas de `pages/` arman el sitio completo para previsualizar (hacen `fetch` de los bloques de
`native/`). Ese andamiaje **no** se traspasa a WordPress — en WP van los bloques compilados de
`dist/blocks/`.

## Estructura (resumen)

```
native/     los bloques del sitio (home / sumate / partners / academy), 1 archivo = 1 sección
custom/     web components a medida (<psl-*>): boarding pass, tablero, contadores, camiseta 360…
tokens/     variables de marca (colores, tipografías) + @font-face
assets/     imágenes (WebP), videos (H.264), fuentes, camiseta 360
pages/      SOLO preview: arman las páginas completas
tools/      build-blocks.py → compila los bloques para WordPress
dist/       SALIDA para WordPress: blocks/ (pegar) · upload/ (hostear) · UPLOAD.md (instructivo)
shop/       tienda oficial — mockup A MEDIDA (HTML autocontenido). NO va por bloques (ver shop/README.md)
docs/       handoff-notes.md (la guía completa) + auditoría
```

> **Dos entregables distintos:** el **sitio** (home/sumate/partners/academy) se arma pegando los
> **bloques** de `dist/blocks/` en WordPress. La **tienda** (`shop/`) es una página **a medida** — un
> HTML autocontenido, no se compila a bloques.

Detalle completo de cada carpeta y de cómo se integra en WordPress: **[`docs/handoff-notes.md`](docs/handoff-notes.md)**.
