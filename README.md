# Port St. Lucie SC — sitio (prototipo → WordPress)

Prototipo funcional del sitio de **Port St. Lucie SC**, en HTML + CSS + JavaScript estándar del
navegador — **sin frameworks**. Se entrega para portar a **WordPress** (WP VIP), donde cada sección
se pega como un **bloque HTML** en el constructor visual.

## Por dónde empezar

| Si querés… | Andá a |
|---|---|
| **Publicar en WordPress** (paso a paso) | **[`dist/UPLOAD.md`](dist/UPLOAD.md)** |
| Entender el proyecto entero (estructura, componentes, contratos de API) | [`docs/handoff-notes.md`](docs/handoff-notes.md) |
| Ver los bloques ya compilados | [`dist/`](dist/) — `blocks/` (pegar) · `upload/` (hostear) |
| Regenerar los bloques desde el fuente | [`tools/README.md`](tools/README.md) |
| La revisión/auditoría del prototipo | [`docs/auditoria-2026-07-10.md`](docs/auditoria-2026-07-10.md) |

## Ver el sitio localmente

```bash
python3 -m http.server 4321
# → http://localhost:4321/pages/home.html   (sumate · partners · academy)
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
docs/       handoff-notes.md (la guía completa) + auditoría
```

Detalle completo de cada carpeta y de cómo se integra en WordPress: **[`docs/handoff-notes.md`](docs/handoff-notes.md)**.
