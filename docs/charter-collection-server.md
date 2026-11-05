# Charter Collection · servidor de Mi colección (bloque `c01-collection`)

Lo que tiene que hacer el servidor para que la colección se vea desde cualquier dispositivo. Es el contrato entre el
front (`native/collection/c01-collection.js`) y el back: si cambia algo de acá, cambia en los dos lados.

**Sin servidor el bloque funciona igual**, con lo que hay en el dispositivo: mientras `__COLLECTION_API__` no esté
reemplazado, la colección sale de `localStorage` y no se ofrece "Send me my link". Se puede publicar así y sumar el
servidor después sin tocar el bloque.

## Decisiones

- **Sin usuario y contraseña** (Martín, 04/11). La identidad es el mail que la persona ya dejó en el juego,
  verificado con un **link personal** (magic link). No hay registro ni login aparte.
- **Qué se guarda en el servidor:** mail, número de socio fundador (si es founder) y las cartas que tiene. Nada más.
- **La foto y el nombre de la carta quedan en el dispositivo.** El aviso de privacidad de la Collector Card (borrador,
  pendiente del abogado) dice que el club no guarda ni la foto ni el nombre que se escribe en la carta. El plan
  hablaba de guardar el nombre: **no se guarda** mientras ese aviso diga lo contrario. Si legal lo cambia, se suma un
  campo `name` a las respuestas y el front lo usa como valor inicial.
- **Founder:** el cruce del mail con la base de socios fundadores lo hace el servidor (la API key no puede ir en el
  navegador). El front solo muestra la edición gold cuando la API devuelve `founder`.

## Reemplazos en el bloque

| Placeholder | Valor |
|---|---|
| `__COLLECTION_API__` | Base de la API, sin barra final. Ej.: `https://api.portstluciesc.com/collection` |
| `__COLECCION_API__` | El mismo estado de la campaña que usan 01b, 01c y t01 (trae la Card No. 001) |
| `__URL_COACH__` | Ficha del DT (`/team/head-coach/` o la que quede) |
| `__URL_COLLECTION__` | En **01c** y **t01**: la URL de esta página (`/collection/`). Con eso aparecen "My collection" y "See my collection" |

## Endpoints

Todo es JSON (`Content-Type: application/json`), con CORS abierto solo al dominio del sitio. El front corta a los
15 s y lo trata como error de red.

### `POST {api}/link` · pedir el link

```json
{ "email": "fan@example.com" }
```

- Responde **`202` siempre que el mail tenga formato válido**, exista o no en la colección. Así nadie puede usar la
  página para averiguar qué mails juegan (la pantalla "Check your inbox" dice "If x has a Charter Collection…").
- Si el mail tiene colección, manda el mail con el link: `https://<sitio>/collection/?t=<token>`.
- `400` si el mail no tiene formato válido. `429` si se pidió demasiadas veces (sugerido: 5 por mail y 20 por IP por
  hora). El front además deja reenviar recién a los 30 s.

**Quién tiene colección:** todo mail que reclamó su Collector en el hero (hoy eso queda en ActiveCampaign con la
etiqueta `charter-collection-001`, ver `docs/charter-collection-activecampaign.md`). Lo más simple es que el servidor
lea esa etiqueta de ActiveCampaign (por API, del lado del servidor) al recibir el pedido; así el hero no cambia.

### `POST {api}/verify` · abrir el link

```json
{ "token": "<token del link>" }
```

Respuesta `200`:

```json
{
  "email": "fan@example.com",
  "founder": { "no": 42 },
  "cards": ["collector", "001"],
  "device": "<token del dispositivo>"
}
```

- `founder`: `null` si no es socio fundador. `no` es el número de socio (el front lo muestra con cuatro cifras).
- `cards`: `"collector"` (la Collector o Founding Member) y los números de las cartas que tiene (`"001"`, `"002"`…).
- `device`: token largo y opaco para que este dispositivo pueda actualizar la colección después (`GET /me`).
- `401` token que no existe o mal formado · `410` vencido o ya usado. Para los dos el front muestra "This link doesn't
  work anymore" y ofrece pedir otro. `5xx`, `429` o sin red: "We could not open your collection" con "Try again".

**Por qué POST y no GET:** los filtros de mail corporativos (y algunos antivirus) abren los links para revisarlos. Si
el link gastara el token con solo abrirse, a la persona le llegaría vencido. La página abre con el token en la URL,
el JS lo saca de la barra de direcciones enseguida (no queda en el historial) y recién ahí lo canjea con este POST.

### `GET {api}/me` · actualizar la colección

Header `Authorization: Bearer <device>`. Responde `200` con `{ email, founder, cards }` (lo mismo que `/verify`, sin
`device`), o `401` si el token del dispositivo no vale más. El front lo llama al entrar a la página, sin que la persona
haga nada: así aparecen las cartas nuevas o el gold si se hizo socio después. Con `401` sigue mostrando lo que tiene
guardado y borra el token.

## Tokens

| Token | Vida | Uso |
|---|---|---|
| Link (`t`) | **24 h, un solo uso** (lo dice la pantalla "Check your inbox") | Solo `POST /verify` |
| Dispositivo (`device`) | Largo (sugerido: 1 año). Revocable | Solo `GET /me` |

Los dos se guardan en el servidor **hasheados**. El token del link tiene que ser aleatorio (≥ 128 bits), no derivado
del mail. Un link nuevo no invalida los anteriores que sigan vigentes.

## Qué guarda el front en el dispositivo

`localStorage`, clave `pslsc-charter-001` (la misma del juego, ver `custom/card/charter.js`):

| Campo | De dónde sale |
|---|---|
| `answers`, `guess`, `revealed`, `skipClaim` | El juego del hero. El servidor no los usa |
| `email` | Al reclamar en el hero, o de `/verify` |
| `founder` | De `/verify` o `/me` (en el preview, `?demo=founder`) |
| `cards` | De `/verify` o `/me`. Si no está y hay `email`, el front asume `["collector", "001"]` |
| `device` | De `/verify` |

Si el `email` de `/verify` es distinto del que había, gana el del link (es otra persona usando el mismo dispositivo).

## Secrecía: qué depende del servidor

- **Card No. 001 antes del viernes:** Mi colección no tiene contenido de la carta: la pide a `__COLECCION_API__`, que
  hasta el reveal solo manda la carta cerrada. La página nunca adelanta nada que el estado no haya liberado.
- **Cartas que vienen:** las siluetas ("Card No. 002 · Coming soon") son genéricas, sin rol ni pista. Cuando haya una
  carta nueva, sus datos llegan igual que la 001: por el estado, desde la fecha de salida. Hasta ahí, el servidor
  **no** devuelve en `cards` un número que todavía no salió.
- **Los mails** (link y avisos) no nombran a nadie que no esté anunciado.

## Errores que ve la persona

| Caso | Pantalla / mensaje |
|---|---|
| Mail con formato inválido (front o `400`) | "Enter a valid email, like name@email.com." |
| `429` | "Too many requests. Wait a few minutes and try again." |
| `5xx` | "Something went wrong on our end. Please try again in a moment." |
| Sin red o más de 15 s | "We could not reach our server. Check your connection and try again." |
| Link `401` / `410` | Pantalla "This link doesn't work anymore" con el form para pedir otro |
| `/verify` con `5xx`, `429` o sin red | Pantalla "We could not open your collection" con "Try again" (el token sigue en memoria) |
| No llega el estado de la campaña | La colección se muestra igual; la Card No. 001 queda como silueta |

## Preview (sin servidor)

`pages/collection.html` simula el servidor en el navegador:

| URL | Qué muestra |
|---|---|
| `?me=collector` / `?me=founder` / `?me=none` | Colección con Collector, con Founding Member, o vacía |
| `&api` | Con servidor simulado ("On another device?" y el form del link) |
| `&api&t=ok` · `&t=founder` · `&t=expired` · `&t=offline` | Abrir el link: bien, founder, vencido, sin red |
| `&cc=tue` | A mitad de semana (la 001 dice "Reveals Friday") |
| `&claim=closed` | Terminó la campaña y nunca reclamó |
| `&slow` | El servidor tarda 2 s ("Opening your collection…", "Sending…") |
