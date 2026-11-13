# Charter Collection · estado por fecha (`__COLECCION_API__`)

El backend que mueve la campaña. Un solo endpoint `GET` que responde un JSON distinto según la fecha y la hora
(hora de Florida, ET). Lo leen cuatro bloques: el hero de la home (`01b-hero-coleccion`), la entrada de fin de
campaña (`01c-coleccion`), Front Office (`t02-front-office`), Soccer Staff (`t00-soccer-staff`) y la ficha del Head
Coach (`t01-coach`). En todos el placeholder es `__COLECCION_API__` (la URL completa del endpoint).

**La regla de oro: el JSON trae solo lo liberado a esa hora.** El repo es público y los bloques no tienen nada del
DT: nombre, foto, silueta, pistas y ficha llegan únicamente por este endpoint, el día que corresponde. Si el endpoint
manda de más (por ejemplo, la ficha un miércoles), se filtra: el front no lo esconde.

Los ejemplos con el contenido real de la Card No. 001 no están acá: van en el paquete privado que se entrega aparte
(mocks `state-mon.json` … `state-sat.json`, que son exactamente lo que tiene que responder este endpoint cada día).

## Calendario

| Desde | `day` | `revealed` | `closed` | Qué se suma |
|---|---|---|---|---|
| Viernes 13/11 10:00 AM ET | `0` | `false` | — | `days[0]` (pregunta y pista del viernes) |
| Sábado 14/11 10:00 AM ET | `1` | `false` | — | `days[1]` |
| Domingo 15/11 10:00 AM ET | `2` | `false` | — | `days[2]` |
| Lunes 16/11 10:00 AM ET | `3` | `false` | — | `days[3]` |
| Lunes 16/11 1:00 PM ET (reveal) | `4` | `true` | — | `card` pasa a la revelada, `shell` (la cerrada), `presentation` y `profile` |
| Martes 17/11 00:00 ET en adelante | `5` | `true` | `true` | Igual que el reveal, sin `shell`. Las preguntas se cierran |

Los mocks del paquete privado conservan los nombres del calendario anterior: `state-mon` = viernes, `state-tue` = sábado,
`state-wed` = domingo, `state-thu` = lunes 10 AM, `state-fri` = reveal, `state-sat` = martes en adelante. En cada día,
`full` es `"Friday"`, `"Saturday"`, `"Sunday"` y `"Monday"`; en la carta cerrada los candados dicen
`"Unlocks Saturday"` (trayectoria) y `"Unlocks Monday"` (el dato).

Antes del viernes 10:00 AM ET el endpoint puede responder `404` o el JSON del primer día sin `days` (el hero muestra un
aviso y no se rompe). Después del fin de campaña **tiene que seguir respondiendo como el martes**: lo usan `01c`, Front
Office (para mostrar la navegación del Club), Soccer Staff y la ficha.

## Campos

```jsonc
{
  "day": 0,              // 0 = viernes … 3 = lunes 10 AM, 4 = lunes 1 PM (reveal), 5 = martes en adelante
  "revealed": false,     // true desde el lunes 1:00 PM ET
  "closed": true,        // solo desde el martes (si no, se omite)
  "card": { },           // la carta a mostrar: cerrada hasta el lunes 10 AM, revelada desde el reveal
  "shell": { },          // solo el lunes del reveal: la carta cerrada (de ahí arranca quien todavía no apretó "Reveal")
  "days": [ ],           // una entrada por día liberado (viernes a lunes), en orden
  "presentation": { "src": "https://…/foto-presentacion.webp", "staff": "https://…/foto-staff.webp", "alt": "…" },   // desde el reveal
  "profile": { }         // desde el reveal: la ficha del Head Coach
}
```

- **`card` y `shell`**: datos de `<psl-card>`, con el esquema de `docs/charter-card-schema.md`. La carta cerrada lleva
  la silueta (una imagen: también es secreta hasta el lunes, así que su URL tiene que servirse desde el backend o un
  lugar no público, no desde `assets/` del repo).
- **`presentation`**: `src` es la foto del hero (desde el viernes) y `staff`, la de la tarjeta del Head Coach en Soccer
  Staff. `staff` es opcional: si falta, Soccer Staff usa `src`. Las dos son recortes sin fondo (PNG o WebP con alfa).
- **`days[i]`**:

  | Campo | Qué es |
  |---|---|
  | `full` | Nombre del día en inglés (`"Monday"`) |
  | `zone` | Qué parte de la carta destraba: `"nation"`, `"career"`, `"stamp"` o `"fact"` |
  | `clueTitle` | Título corto de la pista (`"Nationality"`) |
  | `q` | La pregunta (sobre el club, en inglés) |
  | `opts` | Las 4 opciones (array de textos) |
  | `a` | Índice de la correcta (0–3). Acertar no da nada: la pista se destraba igual |
  | `fact` | El dato que se muestra al contestar (una línea) |
  | `clue` | La pista sobre el DT |
  | `unlock` | Lo que se aplica a la carta cerrada al contestar: `flag`, `bio`, `table`, `stamp` o `fact` (mismos formatos que en `docs/charter-card-schema.md`) |

- **`profile`** (ficha del DT, `t01-coach`, y la tarjeta de Soccer Staff):

  | Campo | Qué es |
  |---|---|
  | `kicker` | Línea chica arriba del nombre |
  | `nameLines` | El nombre en renglones (array) |
  | `summary` | Una o dos líneas (tarjeta de Soccer Staff y hero del coach) |
  | `bio` | Párrafos (array) |
  | `quote`, `quoteDraft` | La frase y si todavía es borrador (muestra la marca "Draft quote") |
  | `career` | Filas `[año, texto, esActual]` |
  | `stamps` | Los sellos: `{ word, icon, text }` (`icon` es un SVG inline) |

## Requisitos del endpoint

- **Sin caché**: el front pide con `cache: 'no-store'`; el servidor tiene que mandar `Cache-Control: no-store` (o un
  `max-age` de pocos segundos). Un CDN que cachee la respuesta del lunes rompe el martes.
- **Hora ET** del servidor, no del navegador: la persona no puede adelantar el reloj para ver la pista de mañana.
- **CORS**: si el endpoint está en otro dominio que el sitio, `Access-Control-Allow-Origin` con el dominio del sitio.
- **Imágenes** (`presentation.src`, `presentation.staff`, silueta, foto de la carta): URLs absolutas, con el mismo cuidado de fecha que el
  JSON. Si están en otro dominio y se usan en la imagen para compartir, también necesitan CORS.
- **Errores**: si el endpoint falla, el hero muestra "The game could not load" con "Try again", y `01c`, Soccer Staff,
  la ficha y la navegación del Club se quedan ocultos. Nada se ve roto, pero nada se ve.

## Antes y después del reveal en el Club

- Soccer Staff y la ficha, si el estado dice `revealed: false` (o no trae `profile`), **vuelven solas a Front Office**
  (`location.replace`). Igual se publican recién el viernes.
- Front Office muestra la navegación "Front Office · Soccer Staff" recién cuando `revealed` es `true` y hay `profile`.

## Preview local

Los mocks privados (`.local/coleccion/state-*.json`, fuera de git) son el contrato real día por día. El preview los
usa con `?cc=mon|tue|wed|thu|fri|sat|end`.
