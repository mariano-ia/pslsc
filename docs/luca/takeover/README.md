# Takeover mobile · Season Tickets — video v2 (sin estadio)

Pieza generada el 2026-09-11 en kie.ai siguiendo el storyboard de 5 fases y las decisiones documentadas
(video desde el frame 1, Luca sale de cuadro antes del final, handoff al HTML en `ended`).

## Resultado

| Archivo | Qué es |
|---|---|
| [`/assets/videos/takeover-season-tickets.mp4`](../../../assets/videos/takeover-season-tickets.mp4) | **Video final para WordPress.** 1080×1920, 13 s, 24 fps, H.264 sin audio, 3.0 MB. Versión v2: el estadio del tercio inferior fue reemplazado por pared negra en posproducción (ver abajo). |
| [`/assets/videos/takeover-season-tickets-poster.webp`](../../../assets/videos/takeover-season-tickets-poster.webp) | Poster = primer frame real del video (la home falsa). Va en `poster=` del `<video>`. |
| [`/assets/videos/takeover-season-tickets-last-frame.webp`](../../../assets/videos/takeover-season-tickets-last-frame.webp) | **Último frame real del video.** El bloque HTML del estado final tiene que usar ESTA imagen de fondo, no `frame-B`. |
| `takeover-season-tickets-master.mp4` | Master v2 a mayor bitrate (crf 18, 5.7 MB), por si hay que recomprimir. |
| `frame-B-final-clean-nostadium.png` | Último frame real del video con el estadio reemplazado por pared (GPT Image 2.5). Es la textura que tapa el estadio en todos los frames. |
| `composite_remove_stadium.py` | Script de posproducción que quitó el estadio (necesita los frames del master en `src_frames/`, `cover-wall.png` = el archivo anterior, `final-last-frame.png` y `home-mobile-1080x1920.png`). |
| `frame-0-home-mobile.png` | Captura de la home del prototipo a 405×720 CSS px, escala 2.67 → 1080×1920. Primer frame del clip 1. |
| `frame-B-final-clean.png` | Estado final limpio, generado con GPT Image 2.5 Sunburst. Último frame del clip 2. |
| `frame-A-luca-presenting.png` | Frame B + Luca presentando (edición con GPT Image 2.5 y las referencias del sheet). Último frame del clip 1 y primero del clip 2. |
| `video-last-frame.png` | El último frame del video en PNG sin comprimir. |
| `prompts-seedance.txt` | Prompts completos de los dos clips. |
| `gen_b.py` · `gen_a.py` | Prompts y parámetros exactos de los dos frames (necesitan el cliente `kie.py`, no incluido). |

## Pipeline

1. **Home falsa**: captura de `pages/home.html` con Playwright (viewport 405×720, DSF 2.667, UA iPhone).
   Ojo: la nav es la del prototipo. Cuando exista la home en WP hay que recapturar desde el teléfono.
2. **Frame B** (final limpio): `gpt-image-2-5-sunburst-image-to-image`, 9:16, 2K, con el escudo
   `crest-aqua.webp` y el render `stadium-iso-night.webp` como referencias.
3. **Frame A** (B + Luca): mismo modelo, editando B con `ref-turnaround-front-alt.png` y
   `ref-expressions.png` del character sheet.
4. **Clip 1** (8 s) y **clip 2** (5 s): `bytedance/seedance-2`, 1080p, 9:16, sin audio, modo
   primer + último frame (home → A, A → B). Seedance no permite combinar primer/último frame con
   imágenes de referencia, así que la consistencia de Luca la sostienen los frames A y B.
5. Concat con ffmpeg (corte duro, las junturas difieren < 2/255) y recompresión a crf 23.
6. **v2, quitar el estadio sin regenerar** (decisión de Mariano: el fondo tiene que ser negro). Seedance
   re-renderiza el estadio con variación temporal, así que una máscara por diferencia no sirve. Lo que
   funcionó: (a) pared negra de reemplazo generada con GPT Image 2.5 editando el último frame real del
   video; (b) cobertura de toda la banda desde la primera fila clara del estadio (y=1284) hacia abajo;
   (c) el borde del panel de la home, mientras se desliza, detectado frame a frame en la banda (la home es
   oscura a la derecha de los botones y el estadio tiene luces claras en todas las columnas), para no
   cortar el panel; (d) botines de Luca protegidos por color (aqua pálido, tono 156–184°) con un halo del
   que se excluyen los píxeles azulados o verdes del estadio; (e) los 85 frames de home quieta quedan
   idénticos al original. Script: `composite_remove_stadium.py`.

Costo: 1326 créditos de kie en los dos clips (816 + 510) más los dos frames.

## Qué revisar / pendientes para v2

- **Dorsal**: en el clip 1, entre 5.8 y 6.3 s Luca queda de espaldas y el número se lee "3" en vez
  de "LUCA 10". Medio segundo. Se corrige regenerando el clip 1 con un prompt que prohíba el giro
  completo o pidiendo "LUCA 10" explícito en la espalda.
- **Hold inicial**: la home queda quieta 3.5 s antes de que Luca aparezca. Si es mucho, recortar el
  arranque (`-ss 1.5`) o regenerar pidiendo que las manos entren a 1 s.
- **Corrimiento**: Seedance devuelve los frames de anclaje con un corrimiento de pocos píxeles y
  detalle re-renderizado. Color y layout coinciden. Por eso el HTML debe usar
  `takeover-season-tickets-last-frame.webp` (ya sin estadio) como fondo del estado final, y el poster
  del video es su primer frame real. Así los dos cortes (poster → video, video → HTML) son exactos.
- **Estadio**: `frame-B-final-clean.png` y `frame-A-luca-presenting.png` todavía tienen el estadio,
  porque fueron los anclajes del video. Si se regenera algún clip, generar antes los frames de anclaje
  sin estadio (pared negra hasta abajo) y no hará falta la posproducción.
- **Aspect ratio**: el video es 9:16; los teléfonos son ~9:19.5. Con `object-fit: cover` se recortan
  ~40 px por lado. La home falsa fue capturada a 9:16 a propósito para que el titular quede centrado.
- Las URLs temporales de kie (tempfile.redpandaai.co / aiquickdraw.com) expiran a los 3 días; todo lo
  necesario está copiado acá.
