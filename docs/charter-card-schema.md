# Charter Collection · esquema de datos de la carta (`<psl-card>`)

**Estado: congelado (04/11/2026, Etapa 1).** Es el contrato entre el front y el servidor: el servidor manda este
objeto (o las piezas con las que el front lo arma) y la carta dibuja **solo** lo que viene. Si hace falta un campo
nuevo, se suma acá primero y después en `custom/card/card.js`.

El repo es público: en el código no hay contenido de ninguna carta puntual (nombre, foto, pistas, sellos). Todo eso
llega por datos, desde el servidor, cuando corresponde según la fecha.

Implementación: `custom/card/card.js` y `card.css`. Se ve en el laboratorio local (pestañas Estructura y Estados).

---

## Uso

```html
<psl-card flippable></psl-card>
<script>document.querySelector('psl-card').data = { /* ver abajo */ };</script>
```

| Qué | Para qué |
|---|---|
| Atributo `flippable` | La carta se gira con click, Enter o espacio (role="button", con aria-label) |
| `el.data = {…}` | Dibuja la carta. Cada asignación vuelve a dibujarla entera |
| `el.flip(bool?)` | Gira al dorso (`true`), al frente (`false`) o alterna (sin argumento) |
| `el.reveal()` | Giro completo y la silueta que pasa a foto (el viernes). Se puede llamar dos veces |

Respeta `prefers-reduced-motion`: sin inclinación, sin giros, sin destellos ni brillos en movimiento.

La carta escala a cualquier ancho (todo en `cqw`). Por debajo de **280 px** pasa a modo chico (se ocultan el set
vertical, el código, la línea de abajo del apellido y las palabras de los sellos; queda el ícono) y por debajo de
**150 px** a miniatura (figura, escudo de edición y apellido). No hay que mandar nada distinto para cada tamaño.

---

## Campos

`?` = opcional. "Texto" se escapa siempre. **Las dos excepciones** (`stamps[].icon` y `flag.background`) se
insertan tal cual: tienen que salir de nuestro servidor, nunca de algo que escribió un usuario.

### Identidad y edición

| Campo | Tipo | Qué es |
|---|---|---|
| `code` | texto | Código de la carta, arriba a la derecha y en el dorso. Ej.: `CC-001`, `FM-0042`, `COLLECTOR` |
| `set` | texto | Nombre del set: vertical en el frente y en el pie del dorso. Ej.: `Charter Season 2027` |
| `parallel` | `'base'` · `'aqua'` · `'gold'` · `'holo'` | Borde. `base` blanco (club) · `aqua` (hinchas y chicos) · `gold` (especial, brillo metálico) · `holo` tornasol (especial, brillo irisado). Por defecto `base` |
| `badge?` | `[grande, chico]` | Escudo de edición arriba a la izquierda. Ej.: `['1ST', 'Season']`, `['F', '#0042']`. Sin `badge`, no hay escudo |
| `edition?` | texto | Chip bajo el código. Ej.: `Gold`, `72 h`, `Event`. Vacío = sin chip |

### Fondo (la ventana)

Uno de estos tres, en este orden de prioridad:

| Campo | Tipo | Qué es |
|---|---|---|
| `backgroundPhoto?` | url | Foto a color que ocupa toda la ventana, con viñeta. Se usa para la foto del hincha **sin recortar** y para el render del Groundbreaking |
| `background` (objeto) | `{ photo, tone, pattern, big? }` | **La estructura de la colección.** `photo`: foto del club (url) que se pasa a duotono; `tone`: `'sea'` · `'aqua'` · `'gold'` · `'ink'`; `pattern`: miscelánea encima (ver abajo); `big?`: texto grande calado (inicial, número) |
| `background` (texto) | `'base'` · `'wall'` · `'wallGold'` · `'diamond'` · `'shatter'` · `'target'` · `'bolt'` | Solo la miscelánea, sin foto del club. Se mantiene para las cartas "para después" |

| Campo | Tipo | Qué es |
|---|---|---|
| `big?` | texto | Texto calado cuando `background` es texto (con objeto va adentro, en `background.big`) |
| `seed?` | número | Semilla de la miscelánea: misma semilla, mismo dibujo en cada render. Por defecto 7 |
| `frame?` | booleano | Marco interior que la figura rompe. En la colección va siempre `true` |

Familias (ver `docs/frentes/entrenador/estructura-cartas.md` en la carpeta madre): Charter Set `sea` + `base`;
Collector `aqua` + `wall`; Luca `aqua` + `bolt`; Founding Member `gold` + `wallGold`; Firsts `gold` + `diamond`;
Matchday Hero `ink` + `target`.

### Figura

| Campo | Tipo | Qué es |
|---|---|---|
| `figure?` | `{ src, kind, alt }` | Imagen recortada que rompe el marco. `kind`: `'silhouette'` (negra con halo, la carta cerrada) · `'player'` · `'fan'` (recorte del hincha) · `'luca'` · `'crest'` (escudo del club: hincha sin foto). `null` o ausente = sin figura |
| `photo?` | `{ src, alt }` | Foto real de la carta cerrada. Está en la página pero invisible hasta `revealed: true`: es la que aparece cuando la silueta se apaga. **Solo llega el día del reveal** |
| `revealed?` | booleano | `true`: se ve `photo` y se apaga la silueta |

### Arriba a la izquierda: bandera

| Valor de `flag` | Se ve |
|---|---|
| ausente (`undefined`) | Nada (cartas que no son de personas) |
| `null` | Bandera bloqueada: candado y "???" |
| `{ code, background, isNew? }` | Bandera (`background` es CSS, ej. un gradiente) y código de país. `isNew: true` = recién destrabada |

### Banner (abajo)

| Campo | Tipo | Qué es |
|---|---|---|
| `first` | texto | Línea chica sobre el apellido (nombre de pila, rol o edición). Ej.: `Card No. 001`, `Founding Member #0042` |
| `last` | texto · `null` | Apellido grande. Si tiene 12 letras o más se achica solo para entrar (el nombre del hincha llega a 14) |
| `namePlaceholder?` | texto | Si `last` está vacío: se muestra apagado. La Collector manda `'Your name'` mientras el hincha no lo escribe |
| `nameBars?` | `[ancho%, ancho%]` | Si `last` está vacío y no hay `namePlaceholder`: barras rayadas (nombre secreto). Por defecto `[56, 26]` |
| `sub` | texto | Línea de abajo. Ej.: `Port St. Lucie SC \| Head Coach` |

### Sellos (columna derecha)

`stamps`: lista de hasta tres. Cada uno es:

| Valor | Se ve |
|---|---|
| `{ locked: true }` | Recuadro punteado con candado y "Locked" |
| `{ word, icon, isNew? }` | Ícono y palabra. `icon` es un SVG en texto (de nuestro servidor, `stroke="currentColor"`). `isNew: true` = recién destrabado |

### Dorso

`back`:

| Campo | Tipo | Qué es |
|---|---|---|
| `name?` | texto | Nombre en la cabecera del dorso. Si falta, usa `last` |
| `bio?` | `[[etiqueta, valor]]` | Datos en dos columnas. `valor: null` = "Locked" |
| `table?` | `{ rows, isNew? }` o `{ locked: true, unlock }` | Tabla de carrera. `rows`: `[año, club, rol, destacado?]` (el cuarto en `true` resalta la fila). Bloqueada: barras y el texto de `unlock` (ej. `Unlocks Tuesday`) |
| `fact?` | `{ text, isNew? }` o `{ locked: true, unlock }` | "Did you know?" |

Si no hay `table`, el medio del dorso lleva el escudo del club como marca de agua (Collector y Founder).

### Lo recién destrabado

Dos cosas distintas:

| Campo | Qué hace |
|---|---|
| `isNew` (en `flag`, en cada sello, en `back.table` y en `back.fact`) | Marca fija "New" (roja) y un brillo que respira, mientras dure ese render. En la carta chica es un punto rojo |
| `flash` | `'nation'` · `'career'` · `'stamp'` · `'fact'`: además, destello una sola vez sobre esa zona. `'nation'` y `'career'` y `'fact'` ya implican "New"; con `'stamp'` destella el sello que tenga `isNew` |

El juego (`ccgComposeCard`, en `native/home/01b-hero-coleccion.js`) manda las dos cosas al contestar la pregunta del
día. Al volver a dibujar sin pregunta nueva no las manda.

---

## Las tres cartas de esta salida

### Card No. 001 (Head Coach)

- **Lunes a jueves (cerrada):** `figure.kind: 'silhouette'`, `last: null`, `flag: null`, sellos `{ locked: true }`,
  `table` y `fact` bloqueados. Cada día el front aplica lo que destrabó el hincha (`unlock` del día: bandera, tabla,
  un sello, el dato) sobre esa carta base.
- **Viernes (revelada):** `revealed: true`, `photo`, `first`/`last`, bandera, los tres sellos y el dorso completo.
  Nada de esto puede estar en la página antes de la fecha: lo manda el servidor.

```js
{ code: 'CC-001', set: 'Charter Season 2027', parallel: 'base', frame: true, seed: 11,
  background: { photo: '<aérea del estadio>', tone: 'sea', pattern: 'base', big: 'HC' },
  badge: ['1ST', 'Season'], flag: null,
  figure: { src: '<silueta>', kind: 'silhouette', alt: 'Silhouette of card No. 001' },
  first: 'Card No. 001', last: null, sub: 'Port St. Lucie SC | Head Coach',
  stamps: [{ locked: true }, { locked: true }, { locked: true }],
  back: { name: 'No. 001', bio: [['Role', 'Head Coach'], ['Country', null], ['Joined', '2026'], ['Last club', null]],
    table: { locked: true, unlock: 'Unlocks Tuesday' }, fact: { locked: true, unlock: 'Unlocks Thursday' } } }
```

### Collector (hincha, aqua) y Founding Member (gold)

Las arma el front con `ccgCollectorCard(S, fan)`. Del servidor solo hace falta saber si el mail es de un socio
fundador y su número (`S.founder = { no }`). La foto y el nombre del hincha **no salen del dispositivo**.

| Estado | Cómo se arma |
|---|---|
| Foto recortada | `figure: { src: <recorte>, kind: 'fan' }`, fondo de la colección (tribuna en duotono) |
| Foto sin recortar (el recorte falló o no encontró a nadie) | `figure: null`, `backgroundPhoto: <foto>` |
| Sin foto (no la sumó, o es menor de 13) | `figure: { src: <escudo>, kind: 'crest' }` |
| Con nombre | `last: <nombre>` (máx. 14 letras) y `back.name: <nombre>` |
| Sin nombre | `last: null`, `namePlaceholder: 'Your name'` |
| Founding Member | `parallel: 'gold'`, tono `gold` + `wallGold`, `code: 'FM-0042'`, `badge: ['F', '#0042']`, `edition: 'Gold'`, `first: 'Founding Member #0042'`, `Founder no.` en el dorso y el sello `Founder` |

El número de socio fundador va siempre con cuatro cifras (`0042`, `1027`).
