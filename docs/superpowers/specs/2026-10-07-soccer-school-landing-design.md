# Soccer School — landing v1 (preinscripción) — design spec

Fecha: 2026-10-07 · Autor de diseño: Mariano · Mockups aprobados en la sesión de brainstorming
(mobile "A v2" y escritorio "hero A dividido").

## 1. Objetivo

Publicar **hoy** una landing mínima de la **PSLSC Soccer School** que capture preinscripciones de
familias con chicos de 5 a 13 años, mientras se arma el micrositio definitivo. Es la v1: una sola
página, un solo formulario. El micrositio completo (sede, horarios, precios, inscripción real) viene
después y reemplaza a esta página en la misma URL.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Dónde vive | Mismo proyecto de Vercel (`pslsc`), ruta **`/school`** → `pslsc.vercel.app/school`. No va a WordPress ni pasa por `tools/build-blocks.py`. Precedente: `shop/`. |
| Identidad | La del **manual del Soccer School** (no la del sitio principal). |
| Promesa | **Preinscripción con prioridad**: los preinscriptos reciben primero sede, horarios y precio, y se inscriben antes que el resto. CTA: **"Pre-register now"**. |
| Formulario | Nombre del padre/madre, email, **edades de los chicos** (chips 5–13, se pueden marcar varias) y consentimiento. Sin teléfono, código postal ni "cómo nos conocieron". |
| Destino de los leads | **ActiveCampaign**, form nuevo, con el mismo patrón de proxy que tryouts/newsletter/partners. |
| Estructura | Mobile "A v2" y escritorio con hero dividido (marca a la izquierda, form a la derecha). |
| Validación local | El club se ve explícito en 4 lugares: barra superior con escudo + ciudad, bajada del hero, título de las razones, footer. |

## 3. Estructura de la página

1. **Barra del club** (ink): escudo PSLSC (aqua) + "Port St. Lucie SC" + "Port St. Lucie, Florida" ·
   a la derecha "Official Soccer School". Sin links (no queremos fugas antes del form).
2. **Hero** (red marine): pill "Pre-registration open · Ages 5–13" · logo oval del Soccer School (aqua) ·
   H1 "Your journey starts here." · "Learn. Play. Enjoy." · bajada de la editora · **formulario**
   (card blanca). Escritorio: grilla 7/5, form a la derecha, completo arriba del pliegue en 1280×800.
   Mobile: el form arranca en la primera pantalla.
3. **Learn / Play / Enjoy** (blanco): tres pilares. Mobile en lista, escritorio en 3 columnas.
4. **Your journey** (blanco): 4 tarjetas de categoría con su color y una esquina redondeada
   (Little Explorers `#FF7800`, Junior Sailors `#FEEB0A`, First Mates `#FE00FE`, Junior Captains `#2EE600`).
   Sin rangos de edad (no están definidos todavía).
5. **Why choose Port St. Lucie SC Soccer School?** (ink): 5 razones. Escritorio: título a la izquierda, lista a la derecha.
6. **Your questions answered** (blanco): FAQ con `<details>` nativo (sin JS). 4 de la editora + 1 nuestra.
7. **Cierre** (red marine): "Your journey starts here." + botón "Pre-register now ↑" que vuelve al form.
8. **Footer** (ink): escudo, "Port St. Lucie SC", ciudad, link a `portstluciesc.com` y redes del club
   (mismos links canónicos que el footer del sitio).

## 4. Textos y su origen

Todo en inglés (como el resto del sitio). **Regla: lo de la editora va tal cual.**

| Pieza | Origen |
|---|---|
| "Your journey starts here." · "Learn. Play. Enjoy." · bajada del hero · 3 pilares · 4 FAQ con sus respuestas | **Editora, tal cual** |
| "Why choose Port St. Lucie SC Soccer School?" + 5 razones | **Traducido** del castellano de la editora |
| Descripciones de las 4 categorías | **Adaptado** de la pieza "Categorías" del manual (castellano, uso interno) |
| Pill, título/bajada/labels del form, consentimiento, mensajes de éxito y error, FAQ "Does pre-registering commit me to anything?", títulos "Your journey" y "Your questions answered" (este último sale de la serie de redes de la editora) | **Nuestro** |

Lo traducido, adaptado y nuestro **lo revisa la editora antes de que empiece la pauta**. En el código
cada uno de esos textos lleva un comentario `<!-- COPY: revisar -->` para encontrarlos rápido.

Respuesta de la FAQ nuestra: *"No. Pre-registering is free and doesn't commit you to anything. You'll
be the first to hear about location, schedule and pricing, and you'll get to register before
registration opens to everyone."*

## 5. Diseño visual

- **Color:** red marine `#FF0048` (hero y cierre), aqua `#AAF6E6`, ink `#1C1C1C`, blanco, y los 4
  colores de categoría solo en las tarjetas. (El manual del club prohíbe el naranja; el del Soccer
  School lo usa para Little Explorers. Seguimos el del Soccer School).
- **Tipografía:**
  - Títulos: **Druk Heavy** (licencia del club, WOFF2 subseteado ya en `dist/upload/fonts/`). El manual
    pide *Druk XCond*, pero el archivo del manual es **Trial** y no se puede publicar. Se cambia cuando
    haya licencia.
  - Cuerpo: **Proxima Nova** (licencia del club, WOFF2 subseteado). El manual pide *Coolvetica*; se cambia
    cuando haya archivo y licencia web.
  - *Tracy Queen* no hace falta: vive solo dentro del logo, que va como imagen.
- **Logo:** el oval de `logo.png` (monocromo con alfa) recoloreado a aqua y exportado a WebP
  (`<img alt="PSLSC Soccer School">`). Escudo del club: `assets/brand/crest-aqua.webp`.
- **Contraste:** blanco sobre `#FF0048` da 3,9:1, así que sobre rojo **solo texto grande**
  (≥ 24px regular o ≥ 19px bold). Todo lo chico (form, legales) va sobre blanco o ink.
- **Motion:** casi nada. Las secciones aparecen con un fade sutil, el form no se anima y todo respeta
  `prefers-reduced-motion`.

## 6. Formulario

**Campos visibles:** `parentName` (texto, obligatorio) · `email` (obligatorio, validado) · `kidsAges`
(checkboxes 5–13 con forma de chip, al menos uno) · `consent` (checkbox obligatorio:
*"I'm the parent or guardian and agree to be contacted about the Soccer School."*) · línea legal
debajo del botón con el link a la privacy policy (misma fórmula que tryouts; ver §8).

**Ocultos:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` (leídos de la URL
al cargar) + un **honeypot** (`company`, oculto para humanos; si viene lleno se descarta en silencio).

**Envío (proxy a ActiveCampaign, mismo patrón que `native/academy/a07-tryouts.js`):** la página carga
el *embed simple* de AC (`<div class="_form_N">` + `<script src="https://<cuenta>.activehosted.com/f/embed.php?id=N">`),
lo oculta, copia nuestros valores a sus campos y dispara su `._submit`. El éxito se detecta por el
`style.display` de `._form-thank-you`, y el error por `._form_error`. Hay un timeout de 15 s. Se
selecciona siempre por **clase**, nunca por id (el embed simple genera ids aleatorios). El id del
form, la URL de la cuenta y el mapeo de campos viven en **un solo objeto de config** al principio del JS.

**Estados:**
- *Validación:* mensaje humano en el primer campo que falla, y foco ahí.
- *Enviando:* botón deshabilitado con "Sending…".
- *Éxito:* el form se reemplaza por *"You're on the list! We'll email {email} as soon as registration
  opens, before anyone else."* Si hay pixel o GA configurados, se dispara `Lead` / `generate_lead`.
- *Error o timeout:* mensaje y botón habilitado para reintentar.
- *Sin config de AC:* el submit **no finge éxito** (los forms viejos lo hacían y la handoff lo marca
  como riesgo). Muestra el error y deja un `console.error` explícito.

**Analytics (opcional, por config):** Meta Pixel y GA4. Si el ID está vacío, no se carga nada.

## 7. Implementación

```
school/
  index.html      la página (HTML semántico, lang="en", meta + Open Graph)
  school.css      estilos (custom properties al tope, mobile-first, un breakpoint a 960px)
  school.js       form: validación, UTM, honeypot, proxy AC, estados, analytics (module, sin dependencias)
  assets/         logo-aqua.webp, crest-aqua.webp, og-image.jpg (1200×630), favicon, fuentes WOFF2
  README.md       qué es, cómo verla, qué falta conectar
```

- **Rutas absolutas** `/school/assets/…` (como `shop/`): así funcionan con y sin barra final (`/school` y `/school/`).
- `vercel.json`: no requiere cambios. Se verifica después del deploy que `/school` y `/school/` respondan 200.
- **Autocontenida:** no importa nada de `tokens/`, `native/` ni `custom/`, así se puede mudar al micrositio
  definitivo (otro dominio) copiando la carpeta.
- Meta: `<title>PSLSC Soccer School — Pre-register now</title>`, description, `og:image` armada con el
  lockup sobre rojo, `theme-color` `#FF0048`, favicon con el ancla.

## 8. Dependencias para publicar

El código se puede terminar sin esto, pero **la URL no se difunde hasta tener los dos primeros puntos.**

1. **Form nuevo en ActiveCampaign** (lo arma quien tenga acceso a la cuenta): campos *Full name*,
   *Email*, *Kids' ages* (checkbox 5–13), *Consent* (checkbox), *utm_source/medium/campaign/content/term*
   (ocultos). Debe suscribir a una lista "Soccer School — Pre-registration", idealmente con un email de
   confirmación automático. Necesito el **código de embed** (cuenta + id) y los `name` de los campos.
2. **Revisión de copy** por la editora (lo marcado en §4).
3. **Pixel de Meta y GA4** del club, si la pauta va a optimizar por leads (opcional para salir).
4. **Texto legal del consentimiento:** por defecto reusa el de tryouts (*USL privacy policy*). Confirmar
   que aplica al Soccer School.
5. Más adelante: rangos de edad por categoría, licencias de Druk XCond y Coolvetica, dominio propio.

## 9. Fuera de alcance (YAGNI)

Sede, horarios y precios · inscripción y pago reales · versión en castellano · fotos y video ·
open day / RSVP · CMS · tests A/B · dominio propio.

## 10. Verificación

- Preview local (`python3 -m http.server 4321` → `/school/`), con capturas a **390px** y **1280px**
  comparadas contra los mockups aprobados.
- Validación del form: vacío, email inválido, sin edades y sin consentimiento.
- Con la config de AC cargada: un envío real de prueba que aparezca en AC con edades y UTM
  (`?utm_source=test`), y después se borra el contacto.
- Lighthouse mobile (accesibilidad ≥ 95) y la página sin scroll horizontal a 360px.
- Después del deploy: `/school` y `/school/` responden 200 y el `og:image` se ve en el debugger de Meta.
