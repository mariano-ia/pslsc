/**
 * <psl-founder-id></psl-founder-id>
 *
 * 🟦 A medida — bloque 05 (Founders, Home). EL BOARDING PASS del vuelo PSL·2027 — turquesa de
 * marca. Cohesión con <psl-departures-board>: el tablero muestra quiénes abordan; acá generás TU
 * pase de abordar. Default: LUKA (mascota), pasajero #0001. "Make your boarding pass" → cámara
 * (getUserMedia) o subir foto → snapshot al pase → nombre → share como IMAGEN real (canvas
 * 1080×1500 → navigator.share con files; fallback download PNG + caption al clipboard).
 *
 * Anatomía de boarding pass: head (crest + BOARDING PASS) → foto → PASSENGER / SEAT →
 * FLIGHT · DEPARTS · CLASS → línea de perforación con muescas → talón (acciones + barcode).
 *
 * PRIVACIDAD: todo es client-side. La foto nunca sale del dispositivo (sin backend, sin upload).
 * La cámara se apaga (stop tracks) al capturar, cancelar, fallar, subir foto o desmontar.
 *
 * Robustez (post-review adversarial): single-flight de getUserMedia; stream frenado si el
 * elemento se desmonta mientras la cámara está pendiente; permiso denegado → "Upload a photo"
 * (no auto-click); acciones bloqueadas durante el share; cancel del share ≠ fallo real.
 *
 * El pase DIY recibe un ASIENTO aleatorio al capturar (sabor boarding pass, no es número de
 * fundador real); el número de fundador REAL se reclama en Sumate (CTA del bloque).
 */
const LUKA_SRC = '/assets/images/luka-card.webp';
const CREST_SRC = '/assets/brand/crest-black.webp';   // crest oscuro: el pase es aqua
const CAPTION = "I'm boarding Flight PSL·2027 — claiming my spot as a founding member of Port St. Lucie SC, the Treasure Coast's first pro club. #PSLSC #FoundingClass";

class PSLFounderID extends HTMLElement {
  connectedCallback() {
    this._mode = 'idle';       // idle | live | captured
    this._photo = null;        // dataURL de la foto del usuario
    this._name = '';
    this._seat = '';           // asiento aleatorio asignado al capturar (como el check-in)
    this._stream = null;
    this._starting = false;    // single-flight de getUserMedia
    this._busy = false;        // share en curso
    this._showUpload = false;  // idle muestra "Upload a photo" (cámara falló)
    this._note = '';           // mensaje contextual
    this._rendered = false;    // para no robar foco en el primer render
    this._render();
  }

  disconnectedCallback() {
    this._stopCamera();
    clearTimeout(this._labelT);
  }

  // asiento aleatorio de 4 dígitos (sabor boarding pass; NO es un número de fundador real)
  _randomSeat() {
    return `#${String(100 + Math.floor(Math.random() * 1900)).padStart(4, '0')}`;
  }

  _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
  }

  /* ============ render ============ */

  _render() {
    const firstRender = !this._rendered;
    this._rendered = true;
    const m = this._mode;
    const isYou = m === 'captured';
    this.innerHTML = `
      <div class="fid">
        <div class="fid__card" data-mode="${m}">
          <span class="fid__slot" aria-hidden="true"></span>
          <div class="fid__head">
            <img class="fid__crest" src="${CREST_SRC}" alt="" width="34" height="36" />
            <span class="fid__head-club">Port St. Lucie SC</span>
            <span class="fid__head-type">Boarding pass · Founding class</span>
          </div>
          <div class="fid__photo">
            ${m === 'live'
              ? `<video class="fid__video" autoplay playsinline muted></video>
                 <span class="fid__frame" aria-hidden="true"></span>`
              : `<img class="fid__img" src="${isYou ? this._photo : LUKA_SRC}"
                     alt="${isYou ? 'Your boarding pass photo' : 'Luka, the club mascot'}" />`}
            <span class="fid__shine" aria-hidden="true"></span>
          </div>

          <div class="fid__data">
            <div class="fid__field fid__field--passenger">
              <span class="fid__label">Passenger</span>
              ${isYou
                ? `<input class="fid__name-input" type="text" maxlength="18" placeholder="YOUR NAME" aria-label="Passenger name on the boarding pass" />`
                : `<span class="fid__value fid__value--name">Luka</span>`}
            </div>
            <div class="fid__field fid__field--seat">
              <span class="fid__label">Seat</span>
              <span class="fid__value fid__value--seat tnum">${isYou ? this._seat : '#0001'}</span>
            </div>
            <div class="fid__field">
              <span class="fid__label">Flight</span>
              <span class="fid__value">PSL·2027</span>
            </div>
            <div class="fid__field">
              <span class="fid__label">Departs</span>
              <span class="fid__value">First whistle</span>
            </div>
            <div class="fid__field">
              <span class="fid__label">Class</span>
              <span class="fid__value">${isYou ? 'Founding' : 'First fan'}</span>
            </div>
          </div>

          <div class="fid__tear" aria-hidden="true"></div>

          <div class="fid__stub">
            <div class="fid__actions">
              ${m === 'idle' ? (this._showUpload
                ? `<button class="fid__btn" type="button" data-act="upload">Upload a photo</button>`
                : `<button class="fid__btn" type="button" data-act="start">Make your boarding pass</button>`) : ''}
              ${m === 'live' ? `
                <button class="fid__btn" type="button" data-act="snap">Take photo</button>
                <button class="fid__btn fid__btn--ghost" type="button" data-act="cancel">Cancel</button>` : ''}
              ${m === 'captured' ? `
                <button class="fid__btn" type="button" data-act="share" aria-live="polite">Share my pass</button>
                <button class="fid__btn fid__btn--ghost" type="button" data-act="retake">Retake</button>` : ''}
              <input class="fid__file" type="file" accept="image/*" hidden />
            </div>
            ${this._note ? `<p class="fid__note" role="status">${this._note}</p>` : ''}
            <div class="fid__foot">
              <span class="fid__foot-label">Your photo never leaves your device</span>
              <span class="fid__barcode" aria-hidden="true"></span>
            </div>
          </div>
        </div>
      </div>
    `;

    this._file = this.querySelector('.fid__file');
    this._file.addEventListener('change', (e) => this._onFile(e));
    this.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => this._act(b.dataset.act, b));
    });
    const nameInput = this.querySelector('.fid__name-input');
    if (nameInput) {
      nameInput.value = this._name;   // por propiedad → sin riesgo de inyección por atributo
      nameInput.addEventListener('input', () => { this._name = nameInput.value; });
    }

    if (m === 'live') this._attachStream();

    // tras una transición por acción del usuario, llevo el foco al botón principal
    if (!firstRender) {
      const primary = this.querySelector('.fid__btn');
      if (primary) primary.focus();
    }
  }

  _act(act, btn) {
    if (act === 'start') this._startCamera();
    if (act === 'upload') this._file.click();
    if (act === 'snap') this._snap();
    if (act === 'cancel') { this._stopCamera(); this._mode = 'idle'; this._note = ''; this._render(); }
    if (act === 'retake') this._startCamera();
    if (act === 'share') this._share(btn);
  }

  /* ============ cámara / foto ============ */

  async _startCamera() {
    if (this._starting) return;   // single-flight
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this._file.click();         // sin soporte: seguimos dentro del gesto → el picker funciona
      return;
    }
    this._starting = true;
    this._stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      if (!this.isConnected) { stream.getTracks().forEach((t) => t.stop()); return; }
      this._stopCamera();
      this._stream = stream;
      this._mode = 'live';
      this._note = '';
      this._render();
    } catch {
      // permiso denegado / sin cámara → ofrezco subir foto (no auto-click: la activación expira)
      this._showUpload = true;
      this._note = 'Camera unavailable — upload a photo instead.';
      this._mode = 'idle';
      this._render();
    } finally {
      this._starting = false;
    }
  }

  _attachStream() {
    const video = this.querySelector('.fid__video');
    if (video && this._stream) video.srcObject = this._stream;
  }

  // congela el frame actual: recorte cuadrado centrado, ESPEJADO (coincide con el preview selfie)
  _snap() {
    const video = this.querySelector('.fid__video');
    if (!video || !video.videoWidth) return;
    const s = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - s) / 2;
    const sy = (video.videoHeight - s) / 2;
    const c = document.createElement('canvas');
    c.width = c.height = 900;
    const ctx = c.getContext('2d');
    ctx.translate(900, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, s, s, 0, 0, 900, 900);
    this._photo = c.toDataURL('image/jpeg', 0.9);
    this._stopCamera();
    this._seat = this._randomSeat();
    this._mode = 'captured';
    this._note = '';
    this._render();
  }

  // foto subida (sin espejo): recorte cuadrado centrado
  _onFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    this._stopCamera();   // por si veníamos de un estado live
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - s) / 2;
      const sy = (img.naturalHeight - s) / 2;
      const c = document.createElement('canvas');
      c.width = c.height = 900;
      c.getContext('2d').drawImage(img, sx, sy, s, s, 0, 0, 900, 900);
      this._photo = c.toDataURL('image/jpeg', 0.9);
      this._seat = this._randomSeat();
      this._mode = 'captured';
      this._showUpload = false;
      this._note = '';
      this._render();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);   // sin fuga si no decodifica (ej: HEIC en desktop)
      this._showUpload = true;
      this._note = "Couldn't read that photo — try another one.";
      this._mode = 'idle';
      this._render();
    };
    img.src = url;
  }

  /* ============ export + share ============ */

  _loadImg(src) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // compone el boarding pass 1080×1500 (mismo look turquesa que el DOM) para compartir/descargar
  async _compose() {
    const W = 1080, H = 1500, PAD = 72;
    const INK = '#0C0C0A';
    try {
      await Promise.all([
        document.fonts.load('800 120px Druk'),
        document.fonts.load('700 56px Druk'),
        document.fonts.load('500 30px "Druk Text Wide"'),
      ]);
    } catch { /* fallback sans-serif */ }

    const isYou = this._mode === 'captured' && this._photo;
    const [crest, photo] = await Promise.all([
      this._loadImg(CREST_SRC),
      this._loadImg(isYou ? this._photo : LUKA_SRC),
    ]);

    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // fondo turquesa de marca
    const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
    bg.addColorStop(0, '#B4F8EA');
    bg.addColorStop(1, '#9DEFDC');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // borde hairline oscuro + ranura de lanyard
    ctx.strokeStyle = 'rgba(12,12,10,.3)';
    ctx.lineWidth = 3;
    this._roundRect(ctx, 6, 6, W - 12, H - 12, 40);
    ctx.stroke();
    ctx.fillStyle = 'rgba(12,12,10,.4)';
    this._roundRect(ctx, W / 2 - 60, 40, 120, 16, 8);
    ctx.fill();

    // head: crest + club + boarding pass
    const crestH = 96, crestW = crestH * (crest.naturalWidth / crest.naturalHeight);
    ctx.drawImage(crest, PAD, 96, crestW, crestH);
    ctx.fillStyle = INK;
    ctx.font = '500 34px "Druk Text Wide", sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('PORT ST. LUCIE SC', PAD + crestW + 28, 138);
    ctx.fillStyle = 'rgba(12,12,10,.62)';
    ctx.font = '500 24px "Druk Text Wide", sans-serif';
    ctx.fillText('BOARDING PASS · FOUNDING CLASS', PAD + crestW + 28, 176);
    ctx.letterSpacing = '0px';

    // foto (ventana ancha, recorte cover)
    const pw = W - PAD * 2, phh = 680;
    const srcH = photo.naturalHeight * Math.min(1, (phh / pw) * (photo.naturalWidth / photo.naturalHeight));
    const srcY = (photo.naturalHeight - srcH) / 2;
    ctx.save();
    this._roundRect(ctx, PAD, 216, pw, phh, 28);
    ctx.clip();
    ctx.drawImage(photo, 0, srcY, photo.naturalWidth, srcH, PAD, 216, pw, phh);
    const vg = ctx.createRadialGradient(W / 2, 216 + phh / 2, phh * 0.5, W / 2, 216 + phh / 2, phh * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.25)');
    ctx.fillStyle = vg;
    ctx.fillRect(PAD, 216, pw, phh);
    ctx.restore();
    ctx.strokeStyle = 'rgba(12,12,10,.42)';
    ctx.lineWidth = 2;
    this._roundRect(ctx, PAD, 216, pw, phh, 28);
    ctx.stroke();

    // PASSENGER / SEAT
    const label = (t, x, y, align = 'left') => {
      ctx.fillStyle = 'rgba(12,12,10,.55)';
      ctx.font = '500 21px "Druk Text Wide", sans-serif';
      ctx.letterSpacing = '4px';
      ctx.textAlign = align;
      ctx.fillText(t, x, y);
      ctx.letterSpacing = '0px';
    };
    const name = (isYou ? (this._name.trim() || 'FUTURE FOUNDER') : 'LUKA').toUpperCase();
    label('PASSENGER', PAD, 986);
    ctx.fillStyle = INK;
    ctx.font = '700 62px Druk, "Arial Narrow", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name, PAD, 1052);
    label('SEAT', W - PAD, 986, 'right');
    ctx.fillStyle = INK;
    ctx.font = '800 120px Druk, "Arial Narrow", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(isYou ? this._seat : '#0001', W - PAD, 1074);
    ctx.textAlign = 'left';

    // FLIGHT / DEPARTS / CLASS
    const cols = [
      ['FLIGHT', 'PSL·2027', PAD],
      ['DEPARTS', 'FIRST WHISTLE', 430],
      ['CLASS', isYou ? 'FOUNDING' : 'FIRST FAN', 810],
    ];
    cols.forEach(([l, v, x]) => {
      label(l, x, 1160);
      ctx.fillStyle = INK;
      ctx.font = '700 40px Druk, "Arial Narrow", sans-serif';
      ctx.fillText(v, x, 1212);
    });

    // línea de perforación con muescas
    const ty = 1290;
    ctx.strokeStyle = 'rgba(12,12,10,.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 14]);
    ctx.beginPath();
    ctx.moveTo(34, ty);
    ctx.lineTo(W - 34, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#7FDCC8';
    [0, W].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, ty, 26, 0, Math.PI * 2);
      ctx.fill();
    });

    // talón: caption line + barcode grande
    ctx.fillStyle = 'rgba(12,12,10,.6)';
    ctx.font = '500 22px "Druk Text Wide", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(isYou ? 'CLAIM YOUR FOUNDING NUMBER' : 'FIRST FAN · CLUB MASCOT', PAD, 1372);
    ctx.fillStyle = 'rgba(12,12,10,.5)';
    ctx.font = '500 20px "Druk Text Wide", sans-serif';
    ctx.fillText('EST. 2025 · FIRST WHISTLE 2027', PAD, 1420);
    ctx.letterSpacing = '0px';
    let bx = W - PAD - 240;
    for (let i = 0; i < 34; i++) {
      const bw = i % 3 === 0 ? 8 : 4;
      ctx.fillStyle = `rgba(12,12,10,${i % 2 ? .75 : .35})`;
      ctx.fillRect(bx, 1340, bw, 90);
      bx += bw + 3;
    }

    return c;
  }

  _download(blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pslsc-boarding-pass.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  async _share(btn) {
    if (this._busy) return;
    this._busy = true;
    clearTimeout(this._labelT);
    const actionEls = [...this.querySelectorAll('.fid__btn, .fid__name-input')];
    actionEls.forEach((el) => { el.disabled = true; });
    btn.textContent = 'Preparing…';
    try {
      const canvas = await this._compose();
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      if (!blob) throw new Error('toBlob returned null');
      const file = new File([blob], 'pslsc-boarding-pass.png', { type: 'image/png' });

      // un solo delivery garantizado (nunca descarga/comparte la imagen dos veces)
      let delivered = false;
      const download = () => { if (delivered) return; delivered = true; this._download(blob); };
      // share de ARCHIVO solo en touch/mobile (ahí el share sheet anda bien y lista IG). En desktop
      // es inconsistente (a veces entrega Y además rechaza → doble copia): descargamos + copiamos caption.
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const canFileShare = navigator.canShare && navigator.canShare({ files: [file] });

      if (canFileShare && coarse) {
        try {
          await navigator.share({ files: [file], text: CAPTION });
          delivered = true;
          btn.textContent = 'Shared!';
        } catch (err) {
          if (err && err.name === 'AbortError') {
            btn.textContent = 'Share my pass';        // usuario canceló: sin ruido
          } else {
            download();                               // fallo real → descarga como fallback
            btn.textContent = 'Saved!';
          }
        }
      } else {
        download();                                   // desktop: descarga el PNG + copia el caption
        let copied = false;
        try { await navigator.clipboard.writeText(CAPTION); copied = true; } catch { /* sin permiso */ }
        btn.textContent = copied ? 'Saved! Caption copied' : 'Saved!';
      }
    } catch {
      btn.textContent = 'Something failed — retry';
    } finally {
      this._busy = false;
      actionEls.forEach((el) => { el.disabled = false; });
    }
    this._labelT = setTimeout(() => {
      if (btn.isConnected && !this._busy) btn.textContent = 'Share my pass';
    }, 2400);
  }
}

customElements.define('psl-founder-id', PSLFounderID);

export { PSLFounderID };
