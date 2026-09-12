# Luca — Character Sheet (referencia canónica)

**Luca** es la mascota y embajador de Port St. Lucie SC ("Club Mascot & Ambassador"). Este documento
describe el character sheet oficial y fija las reglas para **cualquier generación de imagen o video**
donde aparezca Luca: prompts, storyboards, renders, clips, redes, web. Sin excepción.

> **Regla única:** toda generación con Luca parte de este sheet. Se adjunta la imagen de referencia
> (el sheet completo o el recorte de la vista que corresponda) y se pega el bloque de prompt canónico
> de abajo. Si el resultado no pasa el checklist del final, se descarta y se vuelve a generar.

## Archivos

| Archivo | Para qué |
|---|---|
| [`luca/luca-character-sheet.png`](luca/luca-character-sheet.png) | Sheet completo (1536×1024), **con el aqua unificado al de la marca**. Fuente de verdad. |
| [`luca/luca-character-sheet-original.png`](luca/luca-character-sheet-original.png) | El sheet tal como se generó, con cyan saturado. **Histórico, no usar como referencia.** |
| [`luca/ref-turnaround-all.png`](luca/ref-turnaround-all.png) | Las 5 vistas en una tira. Referencia principal para **video** (el modelo ve todos los ángulos). |
| [`luca/ref-turnaround-front.png`](luca/ref-turnaround-front.png) | Frente, manos en la cintura. Referencia por defecto para **imagen fija**. |
| [`luca/ref-turnaround-right.png`](luca/ref-turnaround-right.png) | Perfil derecho, brazos cruzados (se ve el ojo sano y la cola). |
| [`luca/ref-turnaround-back.png`](luca/ref-turnaround-back.png) | Espalda: "LUCA 10", ancla bajo el cuello, cola. |
| [`luca/ref-turnaround-left.png`](luca/ref-turnaround-left.png) | Perfil izquierdo (lado del parche), brazos cruzados. |
| [`luca/ref-turnaround-front-alt.png`](luca/ref-turnaround-front-alt.png) | Frente alternativo: señala a cámara con las dos manos y guiña. |
| [`luca/ref-expressions.png`](luca/ref-expressions.png) | Las 4 expresiones canon: Confident · Happy · Focused · Playful. |
| [`luca/ref-details.png`](luca/ref-details.png) | Detalles de cerca: escudo, parche, aro, espalda, adidas, textura, short, medias, botines. |
| [`luca/takeover/`](luca/takeover/README.md) | Primera pieza generada con el sheet: video del takeover mobile de Season Tickets (frames, prompts, pipeline, pendientes). |

El sheet se generó con un cyan saturado que no era el de la marca; el 2026-09-11 se decidió unificar
el aqua de Luca con el del escudo, y el sheet versionado acá ya está recoloreado (la vincha, los
botines, los escudos, las anclas y el iris). El original sin tocar queda como `-original.png` solo
para historia. El archivo del escritorio de Mariano (`luca_charecter_sheet.png`) es ese original. `docs/` **no** se sube a WordPress (solo `assets/`), así que estos
archivos son referencia interna, no van al sitio.

---

## 1. Identidad

- **Nombre:** Luca. **Número:** 10. **Dorsal:** "LUCA" sobre el "10".
- **Rol:** mascota y embajador del club. Tono: canchero, seguro, juguetón. Nunca agresivo, nunca tonto.
- **Especie:** mono joven caricaturesco (base capuchino, muy estilizado). No es chimpancé ni gorila.
- **Frases que acompañan al sheet:** "Same club. A bigger story." · "Play. Belong. More together." ·
  "Port St. Lucie SC — Treasure Coast, FL".

## 2. Anatomía y proporciones

- **Render 3D estilizado**, estilo película animada (Pixar / DreamWorks): formas redondas, superficies
  limpias, pelaje con mechones visibles, ojos grandes con brillo especular.
- **Proporción:** unas **3 cabezas de alto**. Cabeza grande y ancha, cuerpo compacto, piernas cortas,
  brazos algo largos (mono). Postura erguida, humana.
- **Cabeza:** copete de pelo marrón despeinado hacia arriba y adelante, asoma por encima de la vincha.
  **Orejas grandes y redondas**, de piel (no de pelo), a los costados de la cabeza.
- **Cara:** zona facial de piel peach/tostada en forma de corazón (frente, alrededor de los ojos,
  mejillas), hocico más claro, nariz chica, **boca ancha y muy expresiva**. **Cejas gruesas** marrón
  oscuro, protagonistas de la expresión.
- **Ojo visible (el derecho del personaje):** grande, redondo, **iris aquamarine** (el aqua de la
  marca), pupila negra, brillo especular arriba. Es el ojo que lleva la mirada.
- **Pelaje:** marrón cálido medio, más claro en las puntas del copete y los brazos, más oscuro en
  sombra. Cubre cabeza, cuello, brazos, piernas y cola. Manos y pies de piel.
- **Manos:** cartoon, de piel peach, dedos gruesos. No forzar la cantidad de dedos en el prompt.
- **Cola:** larga, peluda, marrón, **curva en S hacia arriba**. Se ve de perfil y de espalda; de frente
  puede asomar por un costado.

## 3. Rasgos no negociables

Estos ocho puntos definen a Luca. Si falta o cambia uno, no es Luca.

1. **Parche negro en el OJO IZQUIERDO del personaje** (el de la **derecha del espectador** en vista
   frontal). Forma cuadrada redondeada, cuero negro semibrillante. Una **cinta negra fina** cruza la
   frente en diagonal y pasa **por debajo de la vincha**. Nunca cambia de lado. El ojo derecho está
   siempre descubierto.
2. **Vincha (sweatband) aquamarine de marca** (`#AAF6E6`), ancha, de toalla, sobre la frente y por
   encima de las orejas, debajo del copete.
3. **Aros dorados tipo argolla en las dos orejas.** De frente el de la oreja izquierda (lado del
   parche) es el que más se ve; el derecho puede quedar tapado por la oreja o la cabeza, pero existe.
4. **Camiseta negra**, manga corta, **cuello en V con vivo blanco**, **tres tiras blancas** en los
   hombros. Pecho: **logo adidas blanco** en el pecho derecho del personaje (izquierda del espectador),
   **escudo del club en aquamarine** en el pecho izquierdo (derecha del espectador), **"VIXON" en blanco**
   centrado en el pecho (sponsor). Tela negra con **textura de tejido en diagonal** sutil.
   Espalda: **"LUCA"** en blanco sobre el **"10"** (número condensado con línea interior), y una
   **ancla aquamarine chica** bajo el cuello.
5. **Short negro** con **tres tiras blancas** verticales en los laterales y **escudo aquamarine** en la
   pierna derecha del personaje (izquierda del espectador).
6. **Medias negras hasta la rodilla**, **dos anillos blancos** en el puño superior, **ancla aquamarine**
   en la canilla.
7. **Botines aquamarine de marca** con **tres tiras negras**, cordones oscuros y **tapones dorados**.
8. **Fondo negro** de estudio cuando no hay escena: `#090A0A`, sombra suave y reflejo tenue en el piso.

## 4. Paleta

**Un solo aqua para todo el club.** Luca usa el mismo Aquamarine que el escudo, la ancla y los tokens
del sitio. Decisión de Mariano del 2026-09-11; el sheet ya está recoloreado con este valor.

| Elemento | Hex | Nota |
|---|---|---|
| **Aquamarine de marca** (vincha, botines, escudos, anclas, iris) | `#AAF6E6` | Pantone 0921 C. Es `--color-aqua` en `tokens/tokens.css` y el color medido en `assets/brand/crest-aqua.webp`. |
| Aquamarine en sombra | `#5FB5A6` aprox. | Mismo material sin luz. En un prompt no hace falta pedirlo: sale del sombreado. |
| Aquamarine sobre superficie clara | `#0E8C79` | `--color-aqua-deep`. Solo para UI; Luca no lo usa. |
| Pelaje, base | `#51301E` | Marrón cálido. |
| Pelaje, luz | `#7F5037` | Puntas del copete, hombros. |
| Pelaje, sombra | `#47291A` | |
| Piel cara y manos | `#D1936E` | Peach/tostado. |
| Interior de orejas | `#AE5D41` | Más rojizo. |
| Aros | `#C49B52` | Oro cálido, metálico. |
| Camiseta / short / medias | `#131312` | Negro con textura, no negro puro. |
| Vivos y tiras | `#E8E8E9` | Blanco levemente frío. |
| Tapones de botines | dorado / amarillo oro | |
| Fondo de estudio | `#090A0A` | |

> El sheet original traía un cyan saturado (`#08C0CC` en luz) para vincha, botines e iris. **Ya no es
> canon.** Si un modelo devuelve ese turquesa fuerte, o cualquier teal/cian neón, el resultado se
> descarta. El aqua correcto es claro, tirando a menta, y se lee como el mismo color del escudo.

## 5. Expresiones canon

| Nombre | Qué hace | Cuándo usarla |
|---|---|---|
| **Confident** | Sonrisa de costado, ceja del ojo sano levantada, mentón arriba, mirada a cámara. | Default. Presentaciones, CTAs, anuncios. |
| **Happy** | Boca bien abierta, dientes visibles, ojo grande, cejas arriba. | Celebración, goles, bienvenida, buenas noticias. |
| **Focused** | Ceño fruncido, boca cerrada y tensa, mirada fija. | Partido, competencia, "vamos", contenido deportivo serio. |
| **Playful** | Guiño con el ojo sano, lengua afuera, cabeza inclinada. | Humor, redes, guiños al hincha, easter eggs. |

Las cuatro se hacen con el mismo parche, vincha y aros. La expresión vive en la **ceja, la boca y la
inclinación de la cabeza**; el ojo sano hace el resto.

## 6. Poses canon

| Vista | Pose |
|---|---|
| Front | Pies separados, **manos en la cintura**, pecho afuera. Expresión Confident. |
| Right / Left | **Brazos cruzados**, mirada al frente, cola visible en S. |
| Back | Manos en la cintura, se lee el dorsal completo. |
| Front (alternate) | **Señala a cámara con las dos manos** (dedo índice), guiño, cabeza inclinada. Pose de "vos". |

Para nuevas poses: manos expresivas y grandes gestos (presentar con la palma abierta, señalar, empujar,
asomarse), cuerpo erguido, nunca en cuatro patas.

## 7. Estilo de render y luz

- **Iluminación de estudio suave**: luz principal frontal-superior, relleno suave, **rim light** tenue
  que recorta el pelaje contra el fondo negro. Sin luz de color fuerte sobre el personaje.
- **Materiales:** camiseta de tejido mate con textura diagonal; parche de cuero semibrillante; aro de
  metal dorado pulido; botines sintéticos con brillo; vincha de toalla; pelaje suave con mechones.
- **Cámara:** altura de ojos del personaje o apenas por encima, lente normal (ni gran angular ni tele).
  Encuadre limpio, sin recortes raros de la cola o las orejas.
- **Fondo:** negro de estudio por defecto. En escena, ambientes del club (estadio nocturno, palmeras,
  obra) en tonos oscuros, con el aqua como único acento de color.

## 8. Cómo usar el sheet en generación

### Imagen fija

1. Adjuntar como referencia **el recorte de la vista más cercana al ángulo buscado** (ver tabla de
   archivos). Si el modelo acepta varias referencias, sumar `ref-expressions.png` y `ref-details.png`.
2. Pegar el **prompt canónico** (sección 9) y agregar solo la escena, la pose y la expresión.
3. Pedir siempre **"same character as reference"** y no describir cosas que el sheet ya muestra de
   forma distinta a como están.

### Video

1. Adjuntar `ref-turnaround-all.png` como referencia de personaje y, si el modelo lo permite, el
   recorte frontal además.
2. Usar el **prompt corto de video** (sección 9). Los modelos de video responden mal a prompts largos.
3. Describir **una sola acción por clip**, con dirección de entrada y salida explícita (ej.: "enters
   from the right edge, exits through the right edge"). Ver también la skill `writing-video-prompts`.
4. Si el clip termina en un frame que se va a reemplazar por HTML (como el takeover de Season
   Tickets), **Luca sale del cuadro antes del último frame**: el frame final no puede tener personaje.
5. El método completo, con herramientas, orden de generación, prompts y revisión, está en
   [`luca-video-playbook.md`](luca-video-playbook.md). Leerlo antes de producir cualquier video.

### Reglas de continuidad entre piezas

- El parche está **siempre en el ojo izquierdo del personaje**. En espejo, en reflejos, en 3/4, en
  cualquier ángulo. Si un modelo lo invierte, se descarta.
- Cuando Luca mira a cámara en 3/4, el ojo sano (derecho) es el que lleva la mirada; preferir el 3/4
  que muestre su lado derecho salvo que el parche sea protagonista.
- El kit es siempre el mismo: negro, VIXON, 10, aquamarine de marca en todos los acentos. Sin variantes de color, sin campera, sin gorra, sin
  bufanda salvo pedido explícito documentado acá.
- Un solo Luca por pieza, salvo pedido explícito.

## 9. Prompt canónico

### Bloque de personaje (imagen, en inglés)

```
Luca, the Port St. Lucie SC mascot: a stylized 3D-animated young monkey, Pixar/DreamWorks look,
about 3 heads tall with a big round head, compact body, short legs and slightly long arms.
Warm medium-brown fluffy fur with a messy tuft of hair sticking up above the headband; large round
peach-colored skin ears; heart-shaped peach/tan skin face with a lighter muzzle, small nose and a
wide expressive mouth; thick dark-brown eyebrows.
He wears a wide pale aquamarine (#AAF6E6, a light mint-cyan, the club's brand color) terry sweatband
across his forehead.
His LEFT eye is covered by a black rounded-square leather eye patch with a thin black strap that
runs diagonally under the headband; his RIGHT eye is uncovered: large, round, glossy, with a pale
aquamarine iris and a white specular highlight. Small gold hoop earrings in both ears.
Kit: black short-sleeve football jersey with a white-trimmed V-neck, three white adidas stripes on
the shoulders, white adidas logo on the right chest, the club's pale aquamarine shield crest with an anchor
on the left chest, and the sponsor wordmark "VIXON" in white across the chest; subtle diagonal knit
texture. Black shorts with three white side stripes and a small aquamarine crest on the right leg.
Black knee-high socks with two thin white rings at the top and an aquamarine anchor on the shin.
Pale aquamarine football boots with three black stripes and gold studs.
Long fluffy brown monkey tail curling upward in an S.
Every accent (headband, boots, crests, anchors, iris) is the same single pale aquamarine, never a
saturated turquoise. Clean studio look: soft key light from the upper front, subtle rim light,
near-black background (#090A0A), soft floor shadow. Same character as the reference image, exactly.
```

Después del bloque se agrega, en una o dos líneas: **pose + expresión + escena**. Ejemplo:

```
Pose: standing, hands on hips, chest out, looking at camera. Expression: confident smirk, right
eyebrow raised. Scene: studio, black background.
```

### Prompt corto para video (en inglés)

```
Luca, the Port St. Lucie SC monkey mascot from the reference image: stylized 3D animated young
monkey, brown fluffy fur, pale aquamarine (mint) sweatband, black eye patch on his LEFT eye, gold
hoop earrings in both ears, black adidas football kit with "VIXON" on the chest and number 10, pale
aquamarine boots, long curling tail.
Exactly the same character, kit and colors as the reference. [una acción, con entrada y salida].
Soft studio lighting, dark background, smooth animated-film motion, no text, no watermark.
```

### Negativos / evitar

```
no second visible eye under the patch, eye patch on the wrong eye, no eye patch, sunglasses, hat,
cap, different jersey color, red or blue kit, no sponsor text, wrong sponsor, no number, jacket,
scarf, realistic monkey, chimpanzee, gorilla, photorealistic fur, human skin body, extra limbs,
duplicated character, two Lucas, saturated turquoise or neon cyan headband, teal boots, text
overlays, watermark, logo of the AI model
```

## 10. Checklist al recibir un resultado

Todo tiene que dar sí. Un no y se vuelve a generar.

- [ ] El parche está en el **ojo izquierdo del personaje** (derecha del espectador de frente).
- [ ] El ojo derecho se ve, con iris aquamarine.
- [ ] Vincha aquamarine de marca (clara, menta), ancha, bajo el copete. No turquesa saturado.
- [ ] Aros dorados: el de la oreja izquierda visible; el derecho si el ángulo lo muestra.
- [ ] Camiseta negra: V blanca, tres tiras en hombros, adidas a la derecha del personaje, escudo a la
      izquierda, "VIXON" en el pecho. Si se ve la espalda: "LUCA" y "10".
- [ ] Short negro con tiras blancas; medias negras con anillos blancos y ancla; botines aquamarine con
      tiras negras y tapones dorados.
- [ ] Todos los acentos son el mismo aquamarine que el escudo del club.
- [ ] Pelaje marrón cálido, piel peach en cara, orejas y manos. Cola presente si el ángulo la muestra.
- [ ] Proporción de ~3 cabezas, estilo animado 3D, no realista.
- [ ] Sin texto, marcas de agua ni elementos que no estén en el sheet.

## 11. Decisiones tomadas (Mariano, 2026-09-11)

El sheet generado tenía tres puntos inconsistentes. Quedaron resueltos así:

1. **Aros: en las dos orejas.** El sheet los mostraba en ambas de perfil y espalda, y solo el izquierdo
   de frente. Canon: argolla dorada en cada oreja.
2. **Aqua: unificado con el del logo.** Luca usa el Aquamarine `#AAF6E6` del escudo y de los tokens. El
   cyan saturado del sheet original queda descartado; el sheet versionado está recoloreado.
3. **Sponsor: "VIXON" se mantiene por ahora.** Puede cambiar más adelante; cuando pase, actualizar
   este documento (secciones 3, 9 y 10) y regenerar las referencias.

