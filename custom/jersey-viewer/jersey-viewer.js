/**
 * <psl-jersey-viewer></psl-jersey-viewer>
 *
 * 🟦 A medida — bloque 05 (La camiseta / Shop). Stage 360° scroll-scrubbed.
 * Secuencia de N frames (giro real de la camiseta, del render 360_shirt.mp4) mapeada al SCROLL:
 * el giro COMPLETO (frente → perfil → espalda) ocurre mientras el stage está totalmente visible
 * (de "entra completo abajo" a "llega arriba"), así se ve el 180° entero sin tener que pasarlo de largo.
 *
 * Suavidad: el frame mostrado persigue al objetivo con damping (lerp), de modo que un scroll rápido
 * recorre los frames intermedios en vez de saltar. Se dibuja en <canvas> (sin parpadeo).
 *
 * reduced-motion / sin scroll aún = frame 0 (frente) estático.
 *
 * Assets: /assets/jersey360/f_00.webp … f_89.webp (recorte 4:5, generados del render).
 */
const FRAMES = 90;
const framePath = (i) => `/assets/jersey360/f_${String(i).padStart(2, '0')}.webp`;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const DAMP = 0.18; // 0..1 — más bajo = más suave/perezoso; más alto = más pegado al scroll

class PSLJerseyViewer extends HTMLElement {
  connectedCallback() {
    this._idx = -1;       // -1 → fuerza el primer dibujo
    this._current = 0;    // frame mostrado (fraccional, suavizado)
    this._target = 0;     // frame objetivo según el scroll
    this._animing = false;
    this._render();
    this._preload();
    this._bindScroll();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
    cancelAnimationFrame(this._raf);
  }

  _render() {
    this.innerHTML = `
      <div class="jviewer" role="img" aria-label="Founders edition jersey — 360° view">
        <div class="jviewer__skeleton"><div class="jviewer__skeleton-shape"></div></div>
        <canvas class="jviewer__canvas"></canvas>
        <span class="jviewer__tag jviewer__tag--hint">SCROLL TO ROTATE</span>
      </div>
    `;
    this._stage = this.querySelector('.jviewer');
    this._canvas = this.querySelector('.jviewer__canvas');
    this._ctx = this._canvas.getContext('2d');
    this._hint = this.querySelector('.jviewer__tag--hint');
  }

  _preload() {
    this._stage.classList.add('is-loading');
    this._imgs = new Array(FRAMES);
    for (let i = 0; i < FRAMES; i++) {
      const im = new Image();
      im.decoding = 'async';
      if (i === 0) {
        im.onload = () => {
          this._sizeCanvas();
          this._draw(0);
          this._stage.classList.remove('is-loading');
          this._stage.classList.add('is-loaded');
        };
      }
      im.src = framePath(i);
      this._imgs[i] = im;
    }
  }

  _sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this._stage.getBoundingClientRect();
    if (!rect.width) return;
    this._canvas.width = Math.round(rect.width * dpr);
    this._canvas.height = Math.round(rect.height * dpr);
  }

  // frames 4:5 = stage 4:5 → drawImage a canvas completo (fill, sin distorsión)
  _draw(idx) {
    const im = this._imgs && this._imgs[idx];
    if (!im || !im.complete || !im.naturalWidth) return;
    const { width: cw, height: ch } = this._canvas;
    this._ctx.clearRect(0, 0, cw, ch);
    this._ctx.drawImage(im, 0, 0, cw, ch);
  }

  _bindScroll() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // frente estático
    this._onScroll = () => this._kick();
    this._onResize = () => { this._sizeCanvas(); this._kick(); };
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize, { passive: true });
    this._kick();
  }

  _kick() {
    if (this._animing) return;
    this._animing = true;
    this._raf = requestAnimationFrame(() => this._tick());
  }

  _tick() {
    const r = this._stage.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const h = r.height;
    // giro completo mientras el stage está TOTALMENTE visible:
    // p=0 cuando entra completo (bottom alineado abajo) → p=1 cuando su top llega arriba (rect.top=0).
    // el rango es la ventana de "totalmente visible" (vh - h); piso vh*0.35 si el stage es muy alto.
    const denom = Math.max(vh - h, vh * 0.35) || 1;
    const p = clamp(((vh - h) - r.top) / denom, 0, 1);
    this._target = p * (FRAMES - 1);

    const diff = this._target - this._current;
    this._current += diff * DAMP;
    this._drawIdx();

    this._hint.classList.toggle('is-hidden', p > 0.04);

    if (Math.abs(diff) > 0.03) {
      this._raf = requestAnimationFrame(() => this._tick());
    } else {
      this._current = this._target;
      this._drawIdx();
      this._animing = false;
    }
  }

  _drawIdx() {
    const idx = clamp(Math.round(this._current), 0, FRAMES - 1);
    if (idx !== this._idx) { this._idx = idx; this._draw(idx); }
  }
}

customElements.define('psl-jersey-viewer', PSLJerseyViewer);

export { PSLJerseyViewer };
