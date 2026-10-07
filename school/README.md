# school/ — PSLSC Soccer School · landing v1 (preinscripción)

Landing mínima para captar **preinscripciones** de familias (chicos de 5 a 13 años) mientras se arma el
micrositio definitivo, que después la reemplaza en la misma URL.

**Rama `school`.** El Soccer School es otro micrositio: se trabaja **solo en la rama `school`**, sin mezclarlo
con `develop` ni con `main` (ver "Ramas" en el `README.md` de la raíz). Se ve en
`pslsc-git-school-marianonoceti-gmailcoms-projects.vercel.app/school`, la URL fija de la rama en Vercel. La v1
también quedó en `main` (`pslsc.vercel.app/school`) porque se mergeó ahí el 2026-10-07, antes de separar la rama.

**Sin las restricciones de WordPress.** No va a WP ni pasa por `tools/build-blocks.py`, así que no aplican las
reglas de bloques (CSS bajo `.pslsc`, JS como data URI, etc.): HTML/CSS/JS libre y con identidad propia. Hoy es
una página autocontenida que no importa nada de `tokens/`, `native/` ni `custom/`, así que se muda a otro dominio
copiando la carpeta. Mismo proyecto de Vercel que el prototipo.

Nada sube a `main` sin doble check de Mariano.

Spec: [`docs/superpowers/specs/2026-10-07-soccer-school-landing-design.md`](../docs/superpowers/specs/2026-10-07-soccer-school-landing-design.md) ·
Plan: [`docs/superpowers/plans/2026-10-07-soccer-school-landing.md`](../docs/superpowers/plans/2026-10-07-soccer-school-landing.md) ·
Identidad: [`docs/soccer-school/`](../docs/soccer-school/) (manual + fuentes del logo y la portada)

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | La página. Los textos que no son de la editora llevan `<!-- COPY: revisar -->`. |
| `school.css` | Estilos. Tokens de marca en `:root`. Mobile-first, un breakpoint a 960px. |
| `config.js` | **Lo único que hay que tocar** para conectar ActiveCampaign y analytics. |
| `form.js` | Lógica pura del form (UTM, validación, mapeo a AC). Tests: `node --test "tools/tests/*.test.mjs"`. |
| `school.js` | Cableado del form (proxy a AC, estados, honeypot), analytics opcional y fade de secciones. |
| `assets/` | Generados con `python3 tools/school-assets.py` (logo aqua, og-image, íconos, escudo, ancla, fuentes). |

## Ver localmente

```bash
python3 -m http.server 4321   # → http://localhost:4321/school/
```

Las rutas son absolutas (`/school/…`), así que hay que servir la **raíz del repo**, no la carpeta `school/`.

## Conectar ActiveCampaign (antes de difundir la URL)

Mientras falte la config, el form valida, muestra *"Something went wrong on our end"* y deja un
`console.error`: **no envía y no finge éxito**.

1. **En AC**, crear el form *"Soccer School — Pre-registration"* que suscriba a la lista del mismo nombre, con:
   *Full Name* · *Email* · *Kids' ages* (checkbox con opciones `5` a `13`) · *Consent* (checkbox) ·
   *utm_source*, *utm_medium*, *utm_campaign*, *utm_content*, *utm_term* (ocultos). Idealmente, con un email
   de confirmación automático.
2. Del **código de embed** del form: el subdominio (`https://<account>.activehosted.com`) → `account`, y el id
   (`embed.php?id=N`) → `formId`, en `config.js`.
3. Del **export "full embed"**: el `name` de cada campo → `config.js > fields` (los checkboxes son `field[NN][]`).
4. **Probar**: abrir `/school/?utm_source=test`, preinscribir un email de prueba y verificar en AC nombre, edades,
   consentimiento y UTM. Después, borrar el contacto de prueba.

Cómo funciona el envío: la página monta el *embed simple* de AC oculto en `#ac-proxy`, le copia los valores
y dispara su submit (el mismo patrón que tryouts, newsletter y partners en el sitio; ver el comentario de
`school.js`). El éxito se detecta en `._form-thank-you` y el error en `._form_error`, con un timeout de 15 s.

## Analytics (opcional)

`config.js > analytics`: con `metaPixelId` se carga el pixel (PageView + `Lead` al preinscribirse); con
`ga4Id`, GA4 (`generate_lead`). Vacíos = no se carga nada.

## Pendientes

- **Revisión de copy** por la editora: buscar `COPY: revisar` en `index.html`.
- **Texto legal** del consentimiento: hoy reusa el de tryouts (*USL privacy policy* y *emails from USL*). Confirmar que aplica.
- **Rangos de edad** por categoría (las tarjetas van sin edades).
- **Tipografías del manual**: el archivo de *Druk XCond* es Trial y no hay *Coolvetica*; hoy van Druk Heavy y
  Proxima Nova (licencias del club). Cambiar las `@font-face` de `school.css` cuando haya licencias web.
- **Dominio propio** para la pauta: al cambiarlo, actualizar `canonical`, `og:url` y `og:image` en `index.html`.
