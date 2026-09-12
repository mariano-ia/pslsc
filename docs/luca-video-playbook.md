# Playbook · Videos con Luca

Cómo producir un video con Luca que respete el character sheet y quede listo para la web, con el
método que funcionó en el takeover de Season Tickets (2026-09-11). Sirve para cualquier pieza: takeover,
anuncio, reel, clip para redes. Caso completo con archivos y prompts: [`luca/takeover/`](luca/takeover/README.md).
Referencia del personaje: [`luca-character-sheet.md`](luca-character-sheet.md).

## La idea en una línea

**La consistencia de Luca no la garantiza el modelo de video: la garantizan los frames de anclaje.**
Se generan imágenes fijas con GPT Image 2.5 a partir del sheet, se aprueban con el checklist, y el
video se produce en modo *primer + último frame* entre esos anclajes. El modelo de video solo tiene
que animar lo que hay entre dos imágenes que ya son correctas.

## Herramientas

| Qué | Con qué | Notas |
|---|---|---|
| Frames de anclaje | `gpt-image-2-5-sunburst-image-to-image` en kie.ai | ~40 s por imagen. 9:16, 2K. Hasta 16 imágenes de entrada. |
| Video | `bytedance/seedance-2` en kie.ai | Nº 1 del ranking de video (sept. 2026). 1080p, 9:16, 4–15 s. ~100 créditos por segundo a 1080p. 4–6 min por clip. |
| Cliente API | [`tools/kie.py`](../tools/kie.py) | `export KIE_API_KEY=…` antes de usarlo. Upload, createTask, polling, download. |
| Captura de pantallas del sitio | Playwright (Python) | Viewport 405×720 CSS px con `device_scale_factor=1080/405` → 1080×1920 exactos. |
| Frames, concat, recompresión | ffmpeg de `imageio-ffmpeg` (`python3 -m pip install imageio-ffmpeg`) | El ffmpeg que trae Playwright **no decodifica H.264**. |
| Revisión | PIL + numpy | Hojas de contacto cada 0,5 s, diffs en junturas, recortes a resolución real. |

Restricción clave de Seedance 2.0: *primer frame*, *primer + último frame* y *referencias de imagen* son
modos **mutuamente excluyentes**. No se puede pasar el sheet como referencia y a la vez anclar con dos
frames. Por eso el sheet entra en los anclajes, no en el video.

## Paso a paso

### 1. Storyboard como cadena de estados
Escribir la pieza como **estados** (imágenes fijas) unidos por **acciones** (una por clip):

```
Estado 0 ──acción A──▶ Estado 1 ──acción B──▶ Estado 2
```

- Un clip = una sola acción, 4 a 8 segundos. Más de una acción por clip sale mal.
- **Luca tiene que estar en al menos uno de los dos anclajes de cada clip.** Si no está en ninguno, el
  modelo lo inventa y no se parece.
- Si el video termina en algo que después va a ser HTML, el último estado **no tiene personaje**: Luca
  sale de cuadro en la última acción.
- Cada estado intermedio es a la vez último frame de un clip y primer frame del siguiente. Usar
  **exactamente el mismo archivo** en los dos: así la juntura queda invisible (diff medido < 2/255).

### 2. Anclajes con GPT Image 2.5
Orden que funciona:

1. **Primero el estado sin Luca** (fondo, layout, textos). Entradas: assets reales (escudo
   `assets/brand/crest-aqua.webp`, tipografías, capturas). Describir posiciones en % del alto y ancho,
   colores en hex, textos entre comillas y pedir que se escriban exactos.
2. **Después el estado con Luca, como edición del anterior**: "agregá un personaje, no cambies nada
   más". Entradas: la imagen del paso 1 + `docs/luca/ref-turnaround-front-alt.png` +
   `docs/luca/ref-expressions.png` (o la vista que corresponda al ángulo). Pegar el bloque de personaje
   del sheet (sección 9 del character sheet) y definir pose, expresión y ubicación en % del cuadro.
   Resultado: el fondo queda idéntico entre los dos estados, que es lo que hace posible el clip de salida.
3. Si el sitio real aparece en el video (una "home falsa"), **capturarlo con Playwright** a 1080×1920,
   no dibujarlo ni generarlo. Y capturar la versión publicada, no el prototipo, cuando exista.

**Todo lo que esté en un anclaje va a estar en el video.** Quitar algo después es posible pero caro
(el estadio del takeover llevó un script de posproducción de cinco iteraciones). Aprobar el fondo
definitivo antes de generar nada en video.

### 3. Checklist del sheet sobre cada anclaje
Correr la sección 10 del character sheet sobre cada imagen antes de lanzar el video: parche en el ojo
izquierdo, iris aquamarine, vincha, aros, kit con VIXON, botines aquamarine, cola, sin texto extra.
Un anclaje que no pasa se regenera; un video hecho sobre un anclaje malo se tira entero.

### 4. Prompt de video
Seguir la estructura de la skill `writing-video-prompts` (secciones etiquetadas). Lo que importa
para Luca:

- **SCENE**: describir el primer y el último frame con palabras, aunque ya vayan como imágenes.
- **CAMERA**: "completely static, locked-off, no pan, no zoom" salvo que la pieza pida otra cosa.
- **SUBJECT**: el bloque corto de Luca (sección 9 del sheet), terminando en "exactly as he appears in
  the last frame".
- **ACTION**: numerada, con dirección explícita y redundante ("slides HORIZONTALLY to the LEFT and
  exits through the LEFT edge", "walks to the RIGHT, in profile, exits through the RIGHT edge"). Los
  tiempos indicativos ayudan al orden, pero el modelo **no los respeta al segundo**: pedí manos a 1,5 s y
  aparecieron a 3,5 s. Si el timing importa, recortar en post.
- **NEGATIVES**: sin texto nuevo, sin cámara, sin segundo personaje, "the eye patch never changes eye",
  y prohibir la dirección contraria a la pedida.
- `generate_audio: false` (el takeover va muteado; el audio de Seedance es bueno pero cambia el
  resultado y cuesta lo mismo).

Parámetros que se usaron: `resolution 1080p`, `aspect_ratio 9:16`, `duration` 8 (clip de entrada y
empuje) y 5 (clip de salida).

### 5. Revisión antes de aprobar
1. Hoja de contacto cada 0,5 s de cada clip (`ffmpeg -vf fps=2`) y mirarla completa.
2. Recortes a resolución real de las zonas críticas (pies, manos, borde de un panel, texto).
3. Medir diff en las junturas: último frame del clip N vs. primer frame del clip N+1.
4. Buscar los fallos típicos de Luca en video:
   - **De espaldas, el dorsal se inventa** (salió "3" en vez de "LUCA 10" durante medio segundo).
     Evitar giros de 180° o pedir "LUCA 10 on the back" en el prompt y en los negativos.
   - Las manos cambian de cantidad de dedos en gestos rápidos. No forzar dedos en el prompt; revisar.
   - El aqua se satura en movimiento. Comparar contra `#AAF6E6` en un frame quieto.
5. Mostrarle a Mariano **el clip**, no stills.

### 6. Armado y entrega
- Concat con corte duro cuando las junturas comparten anclaje. Master a crf 18, versión web a crf 23,
  `-pix_fmt yuv420p -movflags +faststart -an`.
- **Exportar el primer y el último frame reales del video** y usarlos como poster y como fondo del
  HTML. Seedance devuelve los anclajes con un corrimiento de pocos píxeles: el HTML que use la imagen
  original va a saltar en el corte; el que use el frame real, no.
- Guardar en el repo: mp4 web en `assets/videos/`, master + anclajes + prompts + scripts en
  `docs/luca/<pieza>/` con un README como el del takeover.
- Las URLs de kie expiran a los 3 días. Todo lo que importe se descarga en el momento.

## Costos y tiempos de referencia (takeover, 13 s)

| Ítem | Créditos | Tiempo |
|---|---|---|
| 3 frames GPT Image 2.5 Sunburst 2K | ~0 (no los reporta el estado) | 40 s c/u |
| Clip 8 s Seedance 2.0 1080p | 816 | 6 min |
| Clip 5 s Seedance 2.0 1080p | 510 | 4 min |
| Posproducción (quitar el estadio) | 0 | ~1 h de iteración |

## Lo que no hacer
- No pedirle al modelo de video que "use el sheet como referencia" y a la vez dos anclajes: no se puede.
- No generar el video antes de aprobar el fondo de los anclajes.
- No usar el frame de anclaje original como fondo del HTML: usar el frame real del video.
- No usar el ffmpeg de Playwright para leer H.264.
- No pegar la API key en scripts que vayan al repo: `export KIE_API_KEY=…` y `tools/kie.py` la lee.
