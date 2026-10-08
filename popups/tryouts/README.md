# Popup: TRYOUTS — campaña video Valentín Scarsini

Cargado el 26-09-2026. Estado al cargarlo: publicado **con contraseña** (no visible), a la espera
de los campos definitivos del formulario.

## IDs

| qué | dónde | ID |
|---|---|---|
| Popup | admin → Popups (`sec_popup`) | **14812** |
| Formulario | admin → WPForms, "Tryout Request (Popup)" | **14813** |
| Clase del Grupo | Bloque > Avanzado > Clase CSS adicional | `psl-tryout-popup` |
| Título del popup (solo admin) | título del post | `tryout` |

## Contenido del popup

```
Grupo  .psl-tryout-popup
├── Encabezado H2   "Hey amigo, ready for your shot?"
├── Párrafo         "Show us your fútbol and earn your spot in the family"
└── Bloque WPForms  form 14813 (sin título ni descripción del form)
```

## Formulario 14813

Réplica del form de Academy (`native/academy/a07-tryouts.html`, form 10 de ActiveCampaign), más
nacionalidad, experiencia profesional y último partido (agregados el 26-09). Orden en el form:

| # | campo | tipo | obligatorio |
|---|---|---|---|
| 1 | Player's first name | texto | sí |
| 2 | Birth year | desplegable 2019 → 2000 + "Other" (Santiago, 26-09), placeholder "Select" | sí |
| 3 | Position | desplegable Goalkeeper / Defender / Midfielder / Forward / Not sure yet | sí |
| 8 | Player's nationality | desplegable con 198 países en inglés (A→Z) + "Other" | sí |
| 9 | Has the player ever played professionally? | opción única Yes / No, en línea | sí |
| 10 | Last professional match | texto, placeholder "Club, opponent and date" — **solo aparece si eligen Yes** (lógica condicional) | sí, cuando se ve |
| 4 | Email (parent / guardian if under 18) | email, placeholder `you@email.com` | sí |
| 5 | Phone (optional) | teléfono formato **Smart** (bandera + detecta el país) | no |
| 6 | Consent | checkbox "I'm the player (18+) or their parent / guardian and agree to be contacted about tryouts.", etiqueta oculta, descripción "Free. No commitment…" | sí |
| 7 | USL consent | campo HTML con la frase de USL y sus dos links | — |

Botón: "Request a tryout spot".

- **Teléfono Smart**: la campaña llega a Argentina y Estados Unidos. WPForms sirve intl-tel-input
  desde el propio sitio, así que no tiene el problema de iPhone que tenía el embed de AC.
- **Solo WordPress**: las respuestas quedan en WPForms → Entries. La integración con
  ActiveCampaign quedó para después (decisión del 26-09). Para integrarla: WPForms → Settings →
  Integrations → ActiveCampaign (API URL + API Key) y en el form, Marketing → ActiveCampaign.
  Las entradas previas se exportan a CSV desde Entries y se importan en AC.
- **Notificación**: por defecto va a `{admin_email}`, que en este WordPress puede ser un mail de
  SportsEngine y no del club. Revisarlo en el form → Settings → Notifications.
- **La frase de USL** es condición de USL para todos los formularios del sitio (Madison Suitor,
  28-08-2026). No sacarla.

## CSS — `popup.css`

**Dónde está pegado:** en el bloque WPForms del popup 14812 → Avanzado → *Custom CSS* (versión
sin comentarios, ~10,7 KB). No está en el CSS adicional del sitio. Si se toca ahí, copiar el
cambio a `popup.css`.

Copia la tarjeta del form de Academy (`native/academy/a07-tryouts.css`, `.tryouts__card` +
`.tform`): fondo `#131118`, campos `#16150F` con borde fino, chevron aqua en los desplegables,
año y posición de a dos, Yes/No como dos cajas que se marcan en aqua, botón pill aqua con flecha, frase de USL debajo del botón, sin
asteriscos (se marca el opcional, no los obligatorios).

**Si cambian los campos, revisar estas tres reglas**, que apuntan a campos por ID:

- `#wpforms-14813-field_2-container` y `…field_3-container` → los que van de a dos.
- `#wpforms-14813-field_7-container` → el que va debajo del botón (`order: 2`).

Cómo está armado y por qué:

- `.popup.lightbox:has(.psl-tryout-popup)` le saca fondo y padding a la caja del tema, para que
  se vea solo nuestra tarjeta.
- Se pisan las variables `--wpforms-*` del form con `!important`. El ajuste global de WPForms
  "Include Form Styling" NO se toca: afectaría a todos los formularios del sitio.
- `.wpforms-field-container` va con `display: contents` para que los campos, el botón y el campo
  HTML (que WPForms pone en contenedores distintos) compartan una sola grilla y se puedan ordenar.
- WPForms agrega **2 campos honeypot** anti-spam con IDs por encima del último campo real (con 10
  campos salieron field_11 y field_12), de 1×1 px. No tocarles `position` ni darles padding: se harían visibles.
- En ≤ 420 px año y posición se apilan y la tarjeta queda con 16 px de margen a los costados.

Valores de marca en literal (los tokens viven bajo `.pslsc` y el popup está afuera):

| token | valor |
|---|---|
| ink-2 (tarjeta) | `#131118` |
| ink-3 (campos) | `#16150F` |
| texto | `#F4F1EA` |
| texto muted | `rgba(244,241,234,.68)` |
| texto faint | `rgba(244,241,234,.5)` |
| línea | `rgba(244,241,234,.16)` |
| aqua | `#AAF6E6` |
| error | `#FF5A5A` |

## Estado en vivo (26-09)

- Activo en el **Home**, desde Personalizar → *Custom Popup* (popup "tryout", Where to Display: Home).
  Esa sección es la que manda: un popup publicado no aparece en ningún lado hasta que se elige ahí.
  Para probar sin exponerlo, se elige una página con contraseña (se usó academy-old).
- Popup Delay **2** s · Popup Refresh **0** (aparece en cada visita). El tema solo guarda la cookie
  `sec_popup` al CERRAR (X, ESC o clic en un link de adentro), no al enviar el form: con Refresh 0
  el que ya se anotó lo sigue viendo.
- Close Button Color en **blanco** (en negro no se veía sobre el velo). El tema solo cierra con la X
  o ESC, no tocando afuera: la X tiene que verse siempre. Medido: en 375×667 y 390×844 la X queda
  a 14 px del borde superior y la tarjeta hace scroll interno; en desktop el lightbox (~987 px)
  pasa por ~12 px el alto de una pantalla de 975 y la X sigue visible arriba.
- Edad: no hay lógica por edad. El año va hasta 2000 + "Other", y los textos de email y
  consentimiento sirven para mayor o menor de 18 (se probó una versión con pregunta "18 or older?"
  y campos condicionales y se volvió atrás a pedido de Santiago).

## Verificación

Probado en la vista previa de WPForms (`/?wpforms_form_preview=14813`) envolviendo el form en el
contenedor del tema (`.sec-popup-container.active > .popup.lightbox`), en desktop y a 375 px.
Falta verlo con el popup real en vivo, cuando se le saque la contraseña.
