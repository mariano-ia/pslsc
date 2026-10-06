# Takeover mobile · Season Tickets — video v3 (sheet v2, aquamarine)

Pieza generada en kie.ai siguiendo el storyboard de 5 fases y las decisiones documentadas (video desde
el frame 1, Luca sale de cuadro antes del final, handoff al HTML en `ended`). Método general:
[`../../luca-video-playbook.md`](../../luca-video-playbook.md). Personaje: [`../../luca-character-sheet.md`](../../luca-character-sheet.md).

**Versión vigente: v3 (2026-10-06)**, regenerada con el **character sheet v2 recoloreado al Aquamarine
de marca**: escudo real en el kit, botines con tiras blancas, medias lisas, vincha con moño. Sin estadio
desde el anclaje, así que no hizo falta posproducción.

## Resultado

| Archivo | Qué es |
|---|---|
| [`/assets/videos/takeover-season-tickets.mp4`](../../../assets/videos/takeover-season-tickets.mp4) | **Video final para WordPress.** 1080×1920, 12 s, 24 fps, H.264 sin audio. |
| [`/assets/videos/takeover-season-tickets-poster.webp`](../../../assets/videos/takeover-season-tickets-poster.webp) | Poster = primer frame real del video (la home falsa). Va en `poster=` del `<video>`. |
| [`/assets/videos/takeover-season-tickets-last-frame.webp`](../../../assets/videos/takeover-season-tickets-last-frame.webp) | **Último frame real del video.** El bloque HTML del estado final tiene que usar ESTA imagen de fondo. |
| `takeover-season-tickets-master.mp4` | Master a mayor bitrate (crf 18), por si hay que recomprimir. |
| `frame-0-home-mobile.png` | Captura de la home del prototipo a 405×720 CSS px, escala 2.67 → 1080×1920. Primer frame del clip 1. |
| `frame-B-final-clean-nostadium.png` | Estado final limpio, sin Luca y sin estadio. Base del anclaje con Luca y último frame del clip 2. |
| `frame-A-luca-presenting.png` | Base + Luca presentando (GPT Image 2.5 Sunburst, sheet v2 aquamarine). Último frame del clip 1 y primero del clip 2. |
| `video-last-frame.png` | El último frame del video en PNG sin comprimir. |
| `prompts-seedance.txt` | Prompts completos de los dos clips (v3). |
| `gen_a.py` · `gen_clips.py` | Scripts exactos de la corrida v3 (usan `tools/kie.py` con `KIE_API_KEY` en el entorno). |
| `frame-A-luca-presenting-sheet-v1.png` · `frame-B-final-clean.png` · `gen_b.py` · `composite_remove_stadium.py` | Historia de v1/v2: anclaje con el sheet viejo, el frame B con estadio y el script que lo quitó. No usar. |

## Pipeline (v3)

1. **Home falsa**: captura de `pages/home.html` con Playwright (viewport 405×720, DSF 2.667, UA iPhone).
   Ojo: la nav es la del prototipo. Cuando exista la home en WP hay que recapturar desde el teléfono.
2. **Base sin Luca**: `frame-B-final-clean-nostadium.png` (heredada de v2: el último frame real del
   video v1 con el estadio reemplazado por pared, vía GPT Image 2.5).
3. **Anclaje con Luca**: `gpt-image-2-5-sunburst-image-to-image`, 9:16, 2K, editando la base con
   `ref-turnaround-front-alt.png`, `ref-expressions.png`, `ref-details.png` y el escudo real
   `assets/brand/crest-aqua.webp` como entradas. Checklist del sheet antes de seguir.
4. **Clip 1** (8 s, home → anclaje) y **clip 2** (4 s, anclaje → base): `bytedance/seedance-2`, 1080p,
   9:16, sin audio, modo primer + último frame. El prompt pide explícitamente "LUCA 10" en la espalda y
   que no gire del todo: el dorsal salió bien en los dos clips.
5. Concat con ffmpeg (corte duro; la juntura difiere 1.4/255) y recompresión a crf 23.

Costo v3: 10 créditos el anclaje + 816 + 408 los clips = 1234. Quedaron ~190 créditos en la cuenta de
kie: **recargar antes de cualquier regeneración.**

## Qué revisar / notas

- **Hold inicial**: la home queda quieta ~1.5 s antes de que asomen las manos de Luca (en v1 eran 3.5 s).
- **Dorsal**: corregido respecto de v1; de espaldas se lee "LUCA 10" en ambos clips.
- **Corrimiento**: Seedance devuelve los anclajes con un corrimiento de pocos píxeles. Por eso el HTML
  debe usar `takeover-season-tickets-last-frame.webp` como fondo del estado final y el poster es el
  primer frame real. Así los dos cortes (poster → video, video → HTML) son exactos.
- **Aspect ratio**: el video es 9:16; los teléfonos son ~9:19.5. Con `object-fit: cover` se recortan
  ~40 px por lado. La home falsa fue capturada a 9:16 a propósito para que el titular quede centrado.
- Las URLs temporales de kie expiran a los 3 días; todo lo necesario está copiado acá.

## Integración web

Bloque `native/season_tickets/00-takeover` (+ página de preview `pages/season_tickets.html` = Home + bloque).
Overlay fijo solo mobile: video en escenario 9:16 → al terminar, el último frame real como imagen en la
misma caja + CTAs "Buy my season tickets →" (`data-buy-href` → `pasarela.html`, placeholder de la pasarela; en WP
`__URL_PASARELA__`) y "I don't want season tickets" (cierra y deja la página). El video corre en cada carga. Detalle en `docs/handoff-notes.md`, sección Season Tickets.

## Historial

- **v1 (2026-09-11)**: sheet v1, con estadio al pie. **v2 (2026-09-11)**: estadio quitado en
  posproducción (`composite_remove_stadium.py`). **v3 (2026-10-06)**: regenerado con el sheet v2
  recoloreado al aquamarine, sin estadio desde el anclaje.
