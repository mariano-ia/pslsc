# Staff Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Staff ("Leadership") page: a self-contained WordPress HTML block with a portrait grid whose bios open on click, reachable from the nav.

**Architecture:** One native block `native/staff/st01-staff.html` (+ `.css`) — an ink header section plus a paper body with two labeled groups. Each person is a native `<details>` card (photo/name/role in the `<summary>`, bio inside), so the accordion needs **zero JavaScript**. Photos come from the current production site, cropped 4:5 and exported to WebP in `assets/staff/`. A preview page `pages/staff.html` assembles nav + block + footer exactly like `pages/academy.html`, and the shared nav gets a "Staff" link.

**Tech Stack:** Vanilla HTML/CSS (no framework), namespaced-to-`.pslsc` block compiler (`tools/build-blocks.py`), Python 3 + Pillow for the image pipeline. Spec: `docs/superpowers/specs/2026-07-24-staff-page-design.md`.

**Note on "tests":** This is a static site with **no automated test framework**. "Verify" steps are concrete manual checks: run the block compiler, run the local preview server + `curl`, `grep` the output, and eyeball the page in a browser. Follow them literally.

---

## File Structure

**Create:**
- `native/staff/st01-staff.html` — block markup (ink header + 2 groups of `<details>` cards).
- `native/staff/st01-staff.css` — block styles (grid, card, accordion toggle, placeholder tile).
- `pages/staff.html` — preview page (nav + block + footer), mirrors `pages/academy.html`.
- `assets/staff/*.webp` — 6 optimized portraits (Sean McDaniel uses a CSS placeholder, no file).

**Modify:**
- `tools/build-blocks.py` — register `("staff", "st01-staff")` in `BLOCKS`.
- `native/home/00-nav.html` — add a "Staff" link to `.nav__links`.
- `docs/handoff-notes.md` — document the new page + the WordPress menu step.

---

## Task 1: Optimize the staff photos to WebP

**Files:**
- Create: `assets/staff/gustavo-suarez.webp`, `agostina-galimberti.webp`, `paulo-suarez.webp`, `diego-delledonne.webp`, `bernardo-romeo.webp`, `juan-ignacio-brown.webp`
- Scratch (not committed): a Pillow script in the scratchpad dir.

Only `sips` is installed and it cannot write WebP; **Pillow 12.1.1 is available and supports WebP**, so the pipeline is a small Python script. Sean McDaniel has no source photo → no file (CSS placeholder in Task 2).

- [ ] **Step 1: Write the image script**

Create `fetch_staff_photos.py` in the scratchpad directory (`/private/tmp/claude-501/-Users-marianonoceti-Desktop-Antigravity-PSLSC-Website-portstlucie/c946d3f5-a21b-494c-84f4-d66002524b14/scratchpad/`). Set `REPO` to the project root.

```python
#!/usr/bin/env python3
"""One-off: download the production headshots, crop to 4:5 (face-biased), export WebP to assets/staff/."""
import io, os, urllib.request
from PIL import Image

REPO = "/Users/marianonoceti/Desktop/Antigravity/PSLSC Website/portstlucie"
OUT  = os.path.join(REPO, "assets", "staff")
os.makedirs(OUT, exist_ok=True)

# (slug, source URL, vertical focus 0=top..1=bottom)
PEOPLE = [
    ("gustavo-suarez",      "https://www.portstluciesc.com/wp-content/uploads/sites/388/2025/12/Gustavo_Suarez_01.png?resize=1200,1800",       0.30),
    ("agostina-galimberti", "https://www.portstluciesc.com/wp-content/uploads/sites/388/2025/12/Agostina_Galimberti_04.png?resize=1200,1800",  0.28),
    ("paulo-suarez",        "https://www.portstluciesc.com/wp-content/uploads/sites/388/2025/12/PauloSaurez_02.png?resize=1200,1800",          0.30),
    ("diego-delledonne",    "https://www.portstluciesc.com/wp-content/uploads/sites/388/2025/12/Diego_Delledonne_01.png?resize=1200,1800",     0.30),
    ("bernardo-romeo",      "https://www.portstluciesc.com/wp-content/uploads/sites/388/2026/03/20260303_153315_0000.png",                     0.35),
    ("juan-ignacio-brown",  "https://www.portstluciesc.com/wp-content/uploads/sites/388/2026/03/Juani_Brown_03_69f3f0.png?resize=1200,1800",   0.30),
]

RATIO = 4 / 5          # target width/height
TARGET_W = 900         # → 900 x 1125
QUALITY = 82

def process(url, focus_y):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = urllib.request.urlopen(req, timeout=30).read()
    im = Image.open(io.BytesIO(data)).convert("RGB")
    w, h = im.size
    want_h = w / RATIO
    if want_h <= h:                      # source too tall → crop height, bias toward top
        extra = h - want_h
        top = round(extra * focus_y)
        im = im.crop((0, top, w, top + round(want_h)))
    else:                                # source too wide → crop width, centered
        want_w = h * RATIO
        left = round((w - want_w) / 2)
        im = im.crop((left, 0, left + round(want_w), h))
    im = im.resize((TARGET_W, round(TARGET_W / RATIO)), Image.LANCZOS)
    return im

for slug, url, focus_y in PEOPLE:
    im = process(url, focus_y)
    out = os.path.join(OUT, f"{slug}.webp")
    im.save(out, "WEBP", quality=QUALITY, method=6)
    print(f"  {slug:22} {im.size}  {os.path.getsize(out)/1024:6.1f} KB")
print("done")
```

- [ ] **Step 2: Run the script**

Run: `python3 "<scratchpad>/fetch_staff_photos.py"`
Expected: six lines like `gustavo-suarez  (900, 1125)  ~40–90 KB` then `done`. No traceback.

- [ ] **Step 3: Eyeball the crops (faces not cut) — especially Romeo**

Open each file in `assets/staff/` (Finder/Preview, or `open assets/staff/`). Confirm each is a clean portrait with the face in frame.
- If a face is cut off, tweak that person's `focus_y` in the script (lower = keep more top) and re-run Step 2.
- **Romeo risk:** `20260303_153315_0000.png` may be a composed graphic, not a clean headshot. If `bernardo-romeo.webp` doesn't read as a portrait, delete it (`rm assets/staff/bernardo-romeo.webp`) and use the CSS initials placeholder for his card in Task 2 (initials `BR`) instead of an `<img>`. Note this decision in the final commit message.

- [ ] **Step 4: Confirm the assets are not gitignored**

Run: `cd "<REPO>" && git check-ignore assets/staff/gustavo-suarez.webp; echo "exit=$?"`
Expected: no path printed and `exit=1` (i.e. NOT ignored). If it prints the path, add `!assets/staff/` (un-ignore) to `.gitignore` and re-check.

- [ ] **Step 5: Commit the photos**

```bash
cd "<REPO>"
git add assets/staff/
git commit -m "Staff: fotos de perfil del equipo, recortadas 4:5 y optimizadas a WebP"
```

---

## Task 2: Block markup — `native/staff/st01-staff.html`

**Files:**
- Create: `native/staff/st01-staff.html`

Bios are verbatim from the spec (`docs/superpowers/specs/2026-07-24-staff-page-design.md` §4). The full file is below — write it exactly. If Romeo used a placeholder in Task 1, replace his `<img class="scard__media" ...>` with the same `scard__media--ph` block used for Sean, initials `BR`.

- [ ] **Step 1: Write the block HTML**

```html
<!--
  Bloque ST01 · Staff / Leadership — equipo de liderazgo. 🟩 Nativo.
  Grilla de retratos; la bio se abre al click con <details> nativo (CERO JS).
  Fotos en assets/staff/ (WebP 4:5). Sean McDaniel: placeholder de marca (sin foto en origen).
  HANDOFF (WP): agregar "Staff" al menú del template de USL. La nav no es de estos bloques.
-->
<section class="staff staff--head surface-ink">
  <div class="psl-container">
    <span class="psl-kicker">Port St. Lucie SC</span>
    <h2 class="psl-h2 staff__title">Leadership</h2>
    <p class="staff__intro">The people building Port St. Lucie SC — from the executive team to the sporting side.</p>
  </div>
</section>

<section class="staff staff--body surface-paper">
  <div class="psl-container">

    <div class="staff__group">
      <span class="psl-kicker staff__grouplabel">Executive Leadership</span>
      <div class="staff__grid">

        <details class="scard">
          <summary class="scard__summary">
            <img class="scard__media" src="/assets/staff/gustavo-suarez.webp" alt="Gustavo Suárez" width="900" height="1125" loading="lazy" decoding="async" />
            <div class="scard__bar">
              <div class="scard__id">
                <p class="scard__name">Gustavo Suárez</p>
                <p class="scard__role">Founder &amp; CEO</p>
              </div>
              <span class="scard__toggle" aria-hidden="true"></span>
            </div>
          </summary>
          <div class="scard__bio">
            <p>Entrepreneur and investor with over 20 years of experience leading sports, real estate, and business ventures across Latin America and the United States. Founder and CEO of Port Saint Lucie SC, he spearheads the creation of an ecosystem that connects sports, real estate, and community development in Florida.</p>
            <p>With a deep connection to sports and hands-on experience managing teams and athletic organizations, he combines human leadership, strategic vision, and an unshakable belief that sports can transform lives and drive progress.</p>
          </div>
        </details>

        <details class="scard">
          <summary class="scard__summary">
            <img class="scard__media" src="/assets/staff/agostina-galimberti.webp" alt="Agostina Galimberti" width="900" height="1125" loading="lazy" decoding="async" />
            <div class="scard__bar">
              <div class="scard__id">
                <p class="scard__name">Agostina Galimberti</p>
                <p class="scard__role">President | Co-Founder</p>
              </div>
              <span class="scard__toggle" aria-hidden="true"></span>
            </div>
          </summary>
          <div class="scard__bio">
            <p>Argentinian entrepreneur based in Florida, with experience in sports innovation, technology, and international business development. Co-founder of Port Saint Lucie SC and founder of a sports technology project, she leads the club's strategic growth in the United States and builds partnerships with institutions, brands, and investors.</p>
            <p>A former field hockey player in Argentina, Australia, and Europe, she continues the legacy of her mother, a former player for the Argentine National Hockey Team. Her athletic background shaped her discipline, resilience, and leadership — values she now applies to every project she drives.</p>
            <p>Her work blends global vision, creative thinking, and bold execution, integrating sports, real estate, and technology with a lasting social and community impact.</p>
          </div>
        </details>

        <details class="scard">
          <summary class="scard__summary">
            <img class="scard__media" src="/assets/staff/paulo-suarez.webp" alt="Paulo Suárez" width="900" height="1125" loading="lazy" decoding="async" />
            <div class="scard__bar">
              <div class="scard__id">
                <p class="scard__name">Paulo Suárez</p>
                <p class="scard__role">Co-Founder | Managing Partner USA</p>
              </div>
              <span class="scard__toggle" aria-hidden="true"></span>
            </div>
          </summary>
          <div class="scard__bio">
            <p>Entrepreneur with broad experience in business development, human leadership, infrastructure, and sports. Co-founder and Managing Partner of Port Saint Lucie SC, and founder of a sports technology project, he leads the club's expansion in the United States and contributes his expertise in construction, team management, and investment oversight within the family business group.</p>
            <p>Currently managing a service franchise in Florida, he combines strategic vision, people-focused leadership, and strong execution — bridging sports, real estate, and business development into one integrated ecosystem.</p>
          </div>
        </details>

        <details class="scard">
          <summary class="scard__summary">
            <img class="scard__media" src="/assets/staff/diego-delledonne.webp" alt="Diego Delledonne" width="900" height="1125" loading="lazy" decoding="async" />
            <div class="scard__bar">
              <div class="scard__id">
                <p class="scard__name">Diego Delledonne</p>
                <p class="scard__role">Chief Operating Officer</p>
              </div>
              <span class="scard__toggle" aria-hidden="true"></span>
            </div>
          </summary>
          <div class="scard__bio">
            <p>Soccer executive with more than a decade of experience leading the professional first division at San Lorenzo de Almagro, one of Argentina's traditional top five clubs. From 2013 to 2023, he oversaw the department that bridges sport, business, and people — coordinating first-team operations, managing transfers, and strengthening institutional relationships.</p>
            <p>He represented San Lorenzo de Almagro before FIFA at the 2014 Club World Cup and played a pivotal role in the professionalization and stabilization of the soccer department during challenging times. Recognized for his strategic vision and people-centered leadership, Diego believes true success in soccer lies in building sustainable processes, fostering credibility, and achieving balance between sporting performance and institutional growth.</p>
          </div>
        </details>

        <!-- Sean McDaniel — sin foto en origen: placeholder de marca. Reemplazar el div por
             <img class="scard__media" src="/assets/staff/sean-mcdaniel.webp" ...> cuando exista la foto. -->
        <details class="scard">
          <summary class="scard__summary">
            <div class="scard__media scard__media--ph" role="img" aria-label="Sean McDaniel">
              <span class="scard__initials">SM</span>
            </div>
            <div class="scard__bar">
              <div class="scard__id">
                <p class="scard__name">Sean McDaniel</p>
                <p class="scard__role">Chief Revenue Officer</p>
              </div>
              <span class="scard__toggle" aria-hidden="true"></span>
            </div>
          </summary>
          <div class="scard__bio">
            <p>Sean McDaniel is an experienced sports executive with more than 15 years in professional soccer management, operations, and commercial strategy. He previously served as President and General Manager of Chattanooga Red Wolves SC, where he played a key role in launching the club's professional program and driving significant revenue growth.</p>
            <p>He also contributed to operations for the FIFA Club World Cup 2025, gaining experience in high-level international event management and coordinating with key stakeholders to ensure operational excellence.</p>
            <p>At Port St. Lucie SC, McDaniel leads the club's commercial strategy, focusing on partnerships, revenue development, and building a sustainable business model that supports the club's long-term vision.</p>
          </div>
        </details>

      </div>
    </div>

    <div class="staff__group">
      <span class="psl-kicker staff__grouplabel">Sporting Leadership</span>
      <div class="staff__grid">

        <details class="scard">
          <summary class="scard__summary">
            <img class="scard__media" src="/assets/staff/bernardo-romeo.webp" alt="Bernardo Romeo" width="900" height="1125" loading="lazy" decoding="async" />
            <div class="scard__bar">
              <div class="scard__id">
                <p class="scard__name">Bernardo Romeo</p>
                <p class="scard__role">Sporting Director</p>
              </div>
              <span class="scard__toggle" aria-hidden="true"></span>
            </div>
          </summary>
          <div class="scard__bio">
            <p>Former professional soccer player and experienced executive with proven leadership in club management and national team structures. After a successful playing career in Argentina and Europe — including stints at Hamburger SV in Germany and RCD Mallorca and CA Osasuna in Spain — Romeo transitioned into sporting management roles at the highest level.</p>
            <p>He served as Sporting Director at San Lorenzo de Almagro, where he was part of the leadership team that guided the club to multiple titles, including its first CONMEBOL Libertadores. He later played a key role within Argentina's national team structures, particularly at the youth level, contributing to talent identification, player development pathways, and the strengthening of competitive environments.</p>
            <p>With experience supporting elite player development — including within the generation that featured Lionel Messi — Romeo brings a deep understanding of long-term sporting structure and high-performance standards.</p>
          </div>
        </details>

        <details class="scard">
          <summary class="scard__summary">
            <img class="scard__media" src="/assets/staff/juan-ignacio-brown.webp" alt="Juan Ignacio Brown" width="900" height="1125" loading="lazy" decoding="async" />
            <div class="scard__bar">
              <div class="scard__id">
                <p class="scard__name">Juan Ignacio Brown</p>
                <p class="scard__role">Academy Director</p>
              </div>
              <span class="scard__toggle" aria-hidden="true"></span>
            </div>
          </summary>
          <div class="scard__bio">
            <p>Former professional soccer player and experienced coach with a global career across South America, Europe, and the Middle East. After playing for Estudiantes de La Plata and several clubs in Argentina, Portugal, and Bolivia, he transitioned to coaching, first at Estudiantes' youth academy and later as Technical Secretary at San Lorenzo de Almagro.</p>
            <p>He worked with Argentina's youth national teams alongside Javier Mascherano, Pablo Aimar, and Diego Placente before joining Saudi Arabia's Al-Hilal, where he led the team to the Saudi Professional League title (2017–2018). Brown also managed Al-Wehda, Ismaily SC, Al-Shabab, and Brown de Adrogué. In 2024, he became Head Coach of Al-Safa in the Saudi First Division.</p>
            <p>Son of José Luis Brown, Soccer World Cup champion in 1986, Juan Ignacio continues a legacy of leadership, discipline, and passion for soccer.</p>
          </div>
        </details>

      </div>
    </div>

  </div>
</section>
```

- [ ] **Step 2: Verify the file is well-formed and has all 7 people**

Run:
```bash
cd "<REPO>"
grep -c '<details class="scard">' native/staff/st01-staff.html   # expect 7
grep -c 'scard__media--ph' native/staff/st01-staff.html          # expect 1 (Sean) or 2 (if Romeo placeholder)
python3 -c "import xml.dom.minidom,sys; s=open('native/staff/st01-staff.html').read(); xml.dom.minidom.parseString('<root>'+s.split('-->',1)[1]+'</root>'); print('well-formed')"
```
Expected: `7`, `1` (or `2`), then `well-formed`. (The Python check wraps the markup minus the leading comment in a root and parses it as XML to catch unclosed tags.)

---

## Task 3: Block styles — `native/staff/st01-staff.css`

**Files:**
- Create: `native/staff/st01-staff.css`

Uses only existing tokens (`tokens/tokens.css`): `--section-pad`, `--color-line`, `--color-paper-card`, `--color-paper-line`, `--color-text-on-paper`, `--color-text-on-paper-muted`, `--color-aqua-deep`, `--color-ink`, `--color-aqua`, `--color-text-muted`, `--fs-card-title`, `--fs-kicker`, `--fs-body`, `--fs-body-lg`, `--font-display`, `--font-label`, `--font-body`, `--ls-display`, `--radius-md`. Follows the section pattern from `native/academy/a05-parents.css` (`.NAME .psl-container { padding-block: var(--section-pad); }`).

- [ ] **Step 1: Write the CSS**

```css
/* Bloque ST01 · Staff / Leadership — grilla de retratos con bio en acordeón (<details>, cero JS) */

/* ── Header (oscuro) ── */
.staff--head .psl-container { padding-block: clamp(64px, 9vw, 120px) clamp(28px, 4vw, 44px); }
.staff__title { margin-top: 12px; max-width: 14ch; }
.staff__intro {
  margin: 20px 0 0;
  max-width: 48ch;
  font: 400 var(--fs-body-lg)/1.6 var(--font-body);
  color: var(--color-text-muted);
}

/* ── Cuerpo (claro) ── */
.staff--body { border-top: 1px solid var(--color-line); }
.staff--body .psl-container { padding-block: clamp(40px, 5vw, 64px) var(--section-pad); }

.staff__group + .staff__group { margin-top: clamp(44px, 6vw, 84px); }
.staff__grouplabel { display: block; }

.staff__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(18px, 2.2vw, 30px);
  align-items: start;               /* abrir una tarjeta NO estira a las vecinas */
  margin-top: 26px;
}
@media (max-width: 960px) { .staff__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .staff__grid { grid-template-columns: 1fr; } }

/* ── Tarjeta (details) ── */
.scard {
  background: var(--color-paper-card);
  border: 1px solid var(--color-paper-line);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.scard[open] { box-shadow: 0 16px 30px rgba(18, 17, 13, .08); }

.scard__summary {
  display: block;
  cursor: pointer;
  list-style: none;                 /* saca el triángulo por defecto */
}
.scard__summary::-webkit-details-marker { display: none; }
.scard__summary:focus-visible { outline: 2px solid var(--color-aqua-deep); outline-offset: 2px; }

.scard__media {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  background: var(--color-ink);
}

/* placeholder de marca (Sean; y Romeo si su foto no sirve) */
.scard__media--ph {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 5;
  background:
    radial-gradient(120% 90% at 50% 8%, rgba(170, 246, 230, .16), transparent 60%),
    var(--color-ink);
}
.scard__initials {
  font: 800 clamp(46px, 7vw, 80px)/1 var(--font-display);
  letter-spacing: var(--ls-display);
  color: var(--color-aqua);
}

.scard__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 15px 17px 16px;
}
.scard__name {
  font: 800 var(--fs-card-title)/1.1 var(--font-display);
  letter-spacing: var(--ls-display);
  color: var(--color-text-on-paper);
}
.scard__role {
  margin-top: 5px;
  font: 500 var(--fs-kicker)/1.3 var(--font-label);
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--color-aqua-deep);
}

/* toggle "+" que rota a "x" al abrir */
.scard__toggle {
  position: relative;
  flex: none;
  width: 24px;
  height: 24px;
  transition: transform .2s ease;
}
.scard__toggle::before,
.scard__toggle::after {
  content: "";
  position: absolute;
  left: 3px;
  right: 3px;
  top: 50%;
  height: 2px;
  margin-top: -1px;
  border-radius: 2px;
  background: var(--color-text-on-paper);
}
.scard__toggle::after { transform: rotate(90deg); }
.scard[open] .scard__toggle { transform: rotate(45deg); }   /* + → x */

.scard__bio {
  display: grid;
  gap: 12px;
  padding: 0 17px 20px;
}
.scard__bio p {
  font: 400 var(--fs-body)/1.6 var(--font-body);
  color: var(--color-text-on-paper-muted);
}

@media (prefers-reduced-motion: reduce) {
  .scard__toggle { transition: none; }
}
```

- [ ] **Step 2: Verify the CSS references only existing tokens**

Run:
```bash
cd "<REPO>"
for v in --section-pad --color-line --color-paper-card --color-paper-line --color-text-on-paper --color-text-on-paper-muted --color-aqua-deep --color-ink --color-aqua --color-text-muted --fs-card-title --fs-kicker --fs-body --fs-body-lg --font-display --font-label --font-body --ls-display --radius-md; do
  grep -q -- "$v:" tokens/tokens.css || echo "MISSING TOKEN: $v";
done; echo "token check done"
```
Expected: `token check done` with no `MISSING TOKEN` lines.

- [ ] **Step 3: Commit block HTML + CSS**

```bash
cd "<REPO>"
git add native/staff/st01-staff.html native/staff/st01-staff.css
git commit -m "Staff: bloque ST01 (grilla de retratos + bio en acordeón <details>, cero JS)"
```

---

## Task 4: Register the block in the compiler

**Files:**
- Modify: `tools/build-blocks.py` (the `BLOCKS` list, ends at line 45)

- [ ] **Step 1: Add the staff block to `BLOCKS`**

In `tools/build-blocks.py`, find the end of the `BLOCKS` list (the academy tuples) and add a staff entry. Change:

```python
    ("academy", "a05-parents"), ("academy", "a06-faq"), ("academy", "a07-tryouts"),
]
```

to:

```python
    ("academy", "a05-parents"), ("academy", "a06-faq"), ("academy", "a07-tryouts"),
    ("staff", "st01-staff"),
]
```

- [ ] **Step 2: Compile and verify the staff block builds**

Run: `cd "<REPO>" && python3 tools/build-blocks.py`
Expected: the run lists a line `staff/st01-staff        NN.N KB` and finishes with `... bloques · NNN KB en total` and no traceback. Confirm the output file exists:
```bash
ls -la dist/blocks/psl-staff-st01-staff.html
grep -c 'Juan Ignacio Brown' dist/blocks/psl-staff-st01-staff.html   # expect 1
grep -c 'pslsc' dist/blocks/psl-staff-st01-staff.html                # >0 (namespaced)
```
Expected: file exists, `1`, and a positive count.

- [ ] **Step 3: Confirm asset URLs were rewritten to ASSET_BASE**

Run: `grep -o '__PSL_ASSET_BASE__/assets/staff/[a-z-]*\.webp' dist/blocks/psl-staff-st01-staff.html | sort -u`
Expected: six `__PSL_ASSET_BASE__/assets/staff/*.webp` lines (the compiler rewrote `/assets/` → `ASSET_BASE/assets/`). If Romeo used the placeholder, expect five.

- [ ] **Step 4: Commit**

```bash
cd "<REPO>"
git add tools/build-blocks.py dist/blocks/psl-staff-st01-staff.html
git commit -m "Staff: registrar el bloque ST01 en el compilador + dist"
```

---

## Task 5: Preview page — `pages/staff.html`

**Files:**
- Create: `pages/staff.html`

Mirrors `pages/academy.html`: loads shared nav + footer, fetches the staff block into a slot, and boots motion + the footer newsletter (the staff block itself needs no JS).

- [ ] **Step 1: Write the preview page**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Staff — Port St. Lucie SC</title>

  <!-- Fuentes de marca -->
  <link rel="stylesheet" href="../tokens/fonts.css?v=66" />
  <!-- Tokens -->
  <link rel="stylesheet" href="../tokens/tokens.css?v=66" />

  <!-- Patrones compartidos -->
  <link rel="stylesheet" href="../native/_patterns/motion.css?v=66" />

  <!-- Nav + footer compartidos (reusan los bloques de Home) -->
  <link rel="stylesheet" href="../native/home/00-nav.css?v=66" />
  <link rel="stylesheet" href="../native/home/09-cierre-footer.css?v=66" />

  <!-- Bloque Staff -->
  <link rel="stylesheet" href="../native/staff/st01-staff.css?v=66" />

  <style>
    html, body { margin: 0; padding: 0; background: var(--color-ink); }
    body { font-family: var(--font-body); color: var(--color-text); overflow-x: hidden; }
    ::selection { background: var(--color-aqua); color: var(--color-black); }
  </style>
</head>
<body>
  <div data-block="00-nav"></div>
  <div data-block="st01-staff"></div>
  <div data-block="footer"></div>

  <script type="module">
    // Nav y footer se toman de los bloques compartidos de Home; el staff es un bloque de /staff.
    const blocks = [
      { slot: '00-nav',     path: '../native/home/00-nav.html' },
      { slot: 'st01-staff', path: '../native/staff/st01-staff.html' },
      { slot: 'footer',     path: '../native/home/09-cierre-footer.html' },
    ];
    const bust = `?t=${Date.now()}`;   // cache-buster solo-preview para los HTML de bloque
    await Promise.all(blocks.map(async ({ slot, path }) => {
      const html = await fetch(path + bust).then((r) => r.text());
      document.querySelector(`[data-block="${slot}"]`).innerHTML = html;
    }));

    // init: form de newsletter del footer (mockeado) + sistema de motion (nav/footer).
    // El bloque staff no tiene JS propio (acordeón nativo <details>).
    const [{ initNewsletter }, { initMotion }] = await Promise.all([
      import('../native/home/09-cierre-footer.js?v=66'),
      import('../native/_patterns/motion.js?v=66'),
    ]);
    initNewsletter();
    initMotion();

    // Aterrizaje con #ancla desde otra página: los bloques se inyectan después del load.
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  </script>
</body>
</html>
```

- [ ] **Step 2: Serve and verify the page loads**

Run (in one shell):
```bash
cd "<REPO>" && python3 -m http.server 4321
```
In another shell:
```bash
curl -s -o /dev/null -w "page=%{http_code}\n" http://localhost:4321/pages/staff.html
curl -s -o /dev/null -w "block=%{http_code}\n" http://localhost:4321/native/staff/st01-staff.html
curl -s http://localhost:4321/native/staff/st01-staff.html | grep -c 'scard__name'
```
Expected: `page=200`, `block=200`, and `7`. Then stop the server (Ctrl-C).

- [ ] **Step 3: Eyeball in a browser**

Open `http://localhost:4321/pages/staff.html`. Confirm:
- Ink header "Leadership"; below it the two labeled groups on the paper surface.
- 3 columns on desktop; resize the window → 2 columns, then 1 column; no horizontal scroll.
- Photos render 4:5; Sean shows the "SM" placeholder tile.
- Clicking a card (photo or bar) reveals the bio and rotates the `+` to `×`; clicking again closes it.
- Opening one card does **not** stretch its neighbors.

- [ ] **Step 4: Commit**

```bash
cd "<REPO>"
git add pages/staff.html
git commit -m "Staff: página de preview (nav + bloque + footer)"
```

---

## Task 6: Add "Staff" to the shared nav

**Files:**
- Modify: `native/home/00-nav.html` (the `.nav__links` block, lines 16-21)

The nav is shared across preview pages. In WordPress the menu is the template's, so this link is preview-only — the handoff note (Task 7) tells Santi to add the WP menu item.

- [ ] **Step 1: Insert the Staff link after Academy**

In `native/home/00-nav.html`, change:

```html
      <a href="academy.html">Academy</a>
      <a href="home.html#news">News</a>
```

to:

```html
      <a href="academy.html">Academy</a>
      <a href="staff.html">Staff</a>
      <a href="home.html#news">News</a>
```

- [ ] **Step 2: Verify the link is present**

Run: `cd "<REPO>" && grep -n 'href="staff.html"' native/home/00-nav.html`
Expected: one match inside `.nav__links`.

- [ ] **Step 3: Verify nav still compiles (nav is not a compiled block, but the pages that share it are)**

Re-run the preview check from Task 5 Step 2 (server + the two `curl`s) OR just re-open `http://localhost:4321/pages/academy.html` and confirm the nav now shows a "Staff" item that links to the staff page.

- [ ] **Step 4: Commit**

```bash
cd "<REPO>"
git add native/home/00-nav.html
git commit -m "Nav: agregar link 'Staff' (preview; en WP va como ítem de menú del template)"
```

---

## Task 7: Update the handoff docs

**Files:**
- Modify: `docs/handoff-notes.md`

- [ ] **Step 1: Add a Staff subsection under §6**

In `docs/handoff-notes.md`, after the ACADEMY subsection (the block ends at the "### Navegación entre páginas" heading), insert a new subsection just before "### Navegación entre páginas":

```markdown
### STAFF (`pages/staff.html`) — equipo de liderazgo
ST01 (`native/staff/st01-staff.*`): header oscuro ("Leadership") + dos grupos en superficie clara
(Executive Leadership · Sporting Leadership). Cada persona es una tarjeta `<details>` nativa: foto
4:5 + nombre + rol en el `<summary>`, y la bio se abre al click. **Cero JS** (acordeón nativo).
Fotos en `assets/staff/*.webp`. **Sean McDaniel** no tiene foto de origen → placeholder de marca
(iniciales); reemplazar por `<img>` cuando exista. En WordPress: crear la página, pegar el bloque
compilado y **agregar "Staff" al menú del template de USL** (la nav no sale de estos bloques).

```

- [ ] **Step 2: Update the repo-structure tree (§1) to mention `native/staff/`**

In the `native/` tree of §1, after the `academy/` line, add:

```
  staff/           st01-staff → la página Staff (equipo de liderazgo)
```

- [ ] **Step 3: Commit**

```bash
cd "<REPO>"
git add docs/handoff-notes.md
git commit -m "Docs: documentar la página de Staff en el handoff"
```

---

## Task 8: Final full-page verification

- [ ] **Step 1: Clean build**

Run: `cd "<REPO>" && python3 tools/build-blocks.py`
Expected: no traceback; the `staff/st01-staff` line is present.

- [ ] **Step 2: Preview smoke test**

Run `cd "<REPO>" && python3 -m http.server 4321`, open `http://localhost:4321/pages/staff.html`, and re-confirm the Task 5 Step 3 checklist. Also click "Staff" in the nav from `home.html` to confirm navigation. Stop the server.

- [ ] **Step 3: Confirm the tree is clean**

Run: `cd "<REPO>" && git status`
Expected: `working tree clean` (everything committed across Tasks 1–7).

---

## Self-Review Notes (author checked against spec)

- Spec §2 (bloque + preview + nav + fotos) → Tasks 1–6. ✅
- Spec §4 content (7 people, verbatim bios) → Task 2 embeds all 7. ✅
- Spec §5 layout (ink header, paper body, 3/2/1 grid, `align-items:start`) → Tasks 2–3. ✅
- Spec §6 accordion, zero JS, reduced-motion → Task 2 (`<details>`) + Task 3 (toggle + `prefers-reduced-motion`). ✅
- Spec §7 WebP pipeline + Sean placeholder + Romeo risk → Task 1 + Task 2/3 placeholder. ✅
- Spec §8 files → all covered; `.gitignore` check in Task 1 Step 4. ✅
- Spec §10 WordPress steps → Task 7 handoff note + Task 4 compiled block. ✅
- Class names consistent across Task 2 (HTML) and Task 3 (CSS): `.staff--head/--body`, `.staff__title/__intro/__group/__grouplabel/__grid`, `.scard/__summary/__media/__media--ph/__initials/__bar/__id/__name/__role/__toggle/__bio`. ✅
