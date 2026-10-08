# Popups rotativos

Cada popup del sitio vive en su propia carpeta acá (`popups/<nombre>/`) con dos archivos:

- `popup.css` — el CSS del popup, acotado a su propia clase y a su propio formulario.
- `README.md` — cómo se armó: IDs, bloques, decisiones y trampas.

## Dónde va el CSS del popup: adentro del propio popup

El CSS **no va en el CSS adicional del sitio**. Va en el bloque WPForms del popup:
seleccionar el bloque → pestaña *Block* → **Avanzado → "Custom CSS"** (el de WPForms).

- WPForms lo imprime tal cual, sin prefijos ni escapes, en un
  `<style id="wpforms-custom-css-<form>-block-…">` pegado al formulario, cada vez que el
  formulario se muestra. Verificado el 26-09: `>`, `:has()`, comillas y `"\2192"` salen intactos,
  y lo guardado vuelve idéntico.
- Aunque viva en el bloque del form, es un `<style>` normal: también puede estilizar el Grupo, el
  título y la caja del tema (`.popup.lightbox`).
- El CSS vive y muere con el popup: si se borra el popup, se va con él. El CSS adicional del
  sitio no se toca nunca por un popup.
- NO usar el otro campo, **"Additional CSS"** (de Ghostkit): solo acepta propiedades sueltas
  (`color: red;`) para el bloque entero, no reglas con selectores.
- Si un popup futuro **no tiene formulario**, no hay bloque WPForms donde colgarlo: en ese caso
  el CSS va al final del CSS adicional del sitio, entre marcas `POPUP — INICIO/FIN`, para poder
  borrarlo entero después.

La copia de referencia de cada popup queda en `popups/<nombre>/popup.css`. Si se edita el CSS en
el bloque, copiar el cambio también acá.

## Cambiar de popup

1. Armar el popup nuevo (ver abajo) con su propio CSS en su propio bloque WPForms.
2. Despublicar o borrar el popup viejo. Su CSS se va con él.
3. Dejar la carpeta del popup viejo acá como referencia. No se borra.

## Armar uno nuevo

Partir de `popups/tryouts/` (ver su README). Lo que no cambia de un popup a otro:

- **Dónde se carga**: menú *Popups* del admin (post type `sec_popup`). Ajustes propios: Popup
  Delay (segs), Popup Refresh (días), color del botón de cerrar, color y opacidad del velo.
  No hay campo de ubicación.
- **Qué bloques acepta**: solo 12 — buttons, code, cover, group, heading, headline, image,
  navigation-link, paragraph, query, rkv/google-ad y **WPForms**. No hay Custom HTML, así que
  nada de nuestros bloques compilados ni JS propio. El bloque *Code* NO sirve: imprime el
  HTML como texto en pantalla.
- **Formularios**: WPForms (queda guardado en WordPress → WPForms → Entries). No usar el embed
  de ActiveCampaign: envía inyectando un `<script>` de otro dominio y falla en iPhone.
- **Estructura**: todo el contenido dentro de UN bloque Grupo con una clase propia
  (Bloque > Avanzado > Clase CSS adicional), ej. `psl-<nombre>-popup`. Todo el CSS cuelga de esa
  clase y del `#wpforms-<ID>` del form: así no pisa otros popups ni otros formularios.
- **Tokens**: los `--color-*` del sitio viven bajo `.pslsc` y el popup está afuera de ese
  wrapper. En el CSS del popup van los valores literales (tabla en `popups/tryouts/README.md`).
- **Mientras se arma**: dejar el popup publicado **con contraseña**. Así no se muestra en el
  sitio. Se le saca la contraseña recién para salir.
