/**
 * <psl-photo-capture></psl-photo-capture>
 *
 * 🟦 A medida — foto y nombre de la Collector Card. Misma experiencia que el boarding pass
 * (<psl-founder-id>): cámara o foto subida, gate "I'm 13 or older" y aviso de privacidad en modal.
 * El video se ve adentro de la carta: el.stage = <psl-card>.
 * Evento 'fanchange' con detail { photo, cutout, name } cuando cambia la foto o el nombre.
 *
 * RECORTE: la persona se separa del fondo en el navegador (MediaPipe, Apache 2.0). De la red se baja
 * solo el modelo; la foto no sale. Si el recorte falla o no encuentra a nadie, queda la foto entera.
 * ANTES DE PUBLICAR: alojar el modelo y el wasm en ASSET_BASE, hoy vienen de jsDelivr y de Google.
 *
 * PRIVACIDAD: todo es client-side y vive en memoria. La foto y el nombre nunca salen del dispositivo
 * ni van a localStorage: al recargar se pierden, como dice el aviso. La cámara se apaga al capturar,
 * cancelar, fallar, subir foto o desmontar.
 */

// BORRADOR, NO PUBLICAR. Es el aviso del Founder Boarding Pass con solo el nombre de la función
// cambiado. Es texto legal: lo tiene que aprobar el abogado, y recién ahí se saca la marca de
// borrador y se completa la fecha.
const PCAP_DRAFT = true;
const PCAP_EFFECTIVE = '[pending]';
const PCAP_EMAIL = 'contact@portstluciesc.com';
const PCAP_PARAS = [
  'This Collector Card Privacy Notice applies only to the Collector Card photo feature and supplements the privacy policy applicable to the website.',
  'The Collector Card feature allows you, at your option, to create a personalized, shareable digital card that may include your name and a photo.',
  'If you choose to take a photo using your device&rsquo;s camera, the camera will only be activated after you grant permission through your browser and only while you are taking the photo. You may also choose to upload a photo from your device instead of using the camera.',
  'Whether you take a photo using your camera or upload one from your device, the image is processed entirely on your device and within your browser for the limited purpose of generating the Collector Card.',
  'Ebenezer Partnership LLC d/b/a Port St. Lucie SC does not upload, transmit, collect, store, retain, or have access to your photo, your camera feed, the name you enter on the Collector Card, or the generated card, and does not provide third parties access to those items.',
  'Port St. Lucie SC does not use the photo, camera feed, name, or generated Collector Card for facial recognition, biometric identification, identity verification, profiling, analytics, advertising, or any other purpose.',
  'The information used to create the card exists only temporarily in your browser memory and is discarded when you leave or reload the page, unless you choose to download or share the generated card using your own device controls.',
  'If you choose to download or share your Collector Card, the resulting image is saved or shared only through the options, applications, services, and destination you select using your own device. Your use of those device controls or third-party services may be subject to their separate terms and privacy practices.',
  'Port St. Lucie SC does not automatically publish or post your Collector Card; any download or sharing is initiated and controlled by you through your own device. Port St. Lucie SC does not retain a copy of your photo or generated Collector Card.',
];
// Proporción de la ventana de la carta: la foto se recorta igual que lo que se ve en vivo.
const PCAP_W = 1000;
const PCAP_H = 1428;

const PCAP_VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const PCAP_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
// Lienzo del recorte: misma proporción que .tc__fig.is-fan
const PCAP_CUT_W = 900;
const PCAP_CUT_H = 1000;
const PCAP_CUT_TIMEOUT = 30000;

let pcapSegmenter = null;
function pcapLoadSegmenter() {
  if (!pcapSegmenter) {
    pcapSegmenter = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import(`${PCAP_VISION}/vision_bundle.mjs`);
      const files = await FilesetResolver.forVisionTasks(`${PCAP_VISION}/wasm`);
      return ImageSegmenter.createFromOptions(files, {
        baseOptions: { modelAssetPath: PCAP_MODEL, delegate: 'CPU' },
        runningMode: 'IMAGE',
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
    })();
    pcapSegmenter.catch(() => { pcapSegmenter = null; });   // deja reintentar en la próxima foto
  }
  return pcapSegmenter;
}

const pcapSmooth = (v, a, b) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Devuelve un PNG con la persona sobre transparente, encuadrada para la carta; null si no hay nadie.
async function pcapCutout(dataUrl) {
  const segmenter = await pcapLoadSegmenter();
  const img = new Image();
  await new Promise((resolve, reject) => {   // onload y no decode(): decode() se traba con la pestaña en segundo plano
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });
  const result = segmenter.segment(img);
  const masks = result.confidenceMasks;
  const mask = masks[masks.length - 1];   // la última categoría es la persona
  const conf = mask.getAsFloat32Array();
  const w = mask.width;
  const h = mask.height;

  const layer = document.createElement('canvas');
  layer.width = w;
  layer.height = h;
  const lctx = layer.getContext('2d');
  lctx.drawImage(img, 0, 0, w, h);
  const pixels = lctx.getImageData(0, 0, w, h);
  let top = h, bottom = 0, left = w, right = 0, area = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = conf[y * w + x];
      pixels.data[(y * w + x) * 4 + 3] = Math.round(pcapSmooth(v, 0.45, 0.8) * 255);
      if (v > 0.6) {
        area++;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  masks.forEach((m) => m.close());
  if (area < w * h * 0.05) return null;   // no hay una persona clara en la foto
  lctx.putImageData(pixels, 0, 0);

  // Entra a lo ancho o a lo alto. Si sobra alto se apoya en el banner; si no, la cabeza va arriba.
  const bw = right - left + 1;
  const bh = bottom - top + 1;
  const scale = Math.min(PCAP_CUT_W / bw, PCAP_CUT_H / Math.min(bh, bw * 1.25));
  const out = document.createElement('canvas');
  out.width = PCAP_CUT_W;
  out.height = PCAP_CUT_H;
  const dy = bh * scale < PCAP_CUT_H ? PCAP_CUT_H - bh * scale : 0;
  out.getContext('2d').drawImage(layer, left, top, bw, bh, (PCAP_CUT_W - bw * scale) / 2, dy, bw * scale, bh * scale);
  return out.toDataURL('image/png');
}

class PSLPhotoCapture extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;   // se mueve de lugar en el DOM: conserva foto, nombre y gate
    this._mode = 'idle';          // idle | live | captured
    this._photo = null;
    this._name = '';
    this._stream = null;
    this._starting = false;
    this._showUpload = false;
    this._ageOk = false;
    this._note = '';
    this._render();
  }

  disconnectedCallback() {
    if (this._mode === 'live') this._cancelLive();
  }

  get fan() { return { photo: this._photo, cutout: this._cutout || null, name: this._name }; }

  _emit() {
    this.dispatchEvent(new CustomEvent('fanchange', { detail: this.fan }));
  }

  _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
    this._detachVideo();
  }

  _detachVideo() {
    this.stage?.classList.remove('is-live');
    this.stage?.querySelector('.pcap__video')?.remove();
  }

  _cancelLive() {
    this._stopCamera();
    this._mode = this._photo ? 'captured' : 'idle';
  }

  _render() {
    this._rendered = true;
    const m = this._mode;
    this.innerHTML = `
      <div class="pcap">
        ${m !== 'live' ? `<div class="pcap__field"><label for="pcap-name">Name on your card</label><input id="pcap-name" class="pcap__name" type="text" maxlength="14" placeholder="YOUR NAME" autocomplete="off"></div>` : ''}
        ${m === 'idle' ? `<label class="pcap__gate"><input class="pcap__gate-check" type="checkbox"><span>I&rsquo;m 13 or older</span></label>` : ''}
        <div class="pcap__actions">
          ${m === 'idle' ? (this._showUpload
            ? `<button class="pcap__btn" type="button" data-act="upload" ${this._ageOk ? '' : 'disabled'}>Upload a photo</button>`
            : `<button class="pcap__btn" type="button" data-act="start" ${this._ageOk ? '' : 'disabled'}>Add your photo</button>`) : ''}
          ${m === 'live' ? `<button class="pcap__btn" type="button" data-act="snap">Take photo</button>
            <button class="pcap__btn pcap__btn--ghost" type="button" data-act="cancel">Cancel</button>` : ''}
          ${m === 'captured' ? `<button class="pcap__btn pcap__btn--ghost" type="button" data-act="start">Retake</button>
            <button class="pcap__btn pcap__btn--ghost" type="button" data-act="remove">Remove photo</button>` : ''}
          <input class="pcap__file" type="file" accept="image/*" hidden>
        </div>
        ${this._note ? `<p class="pcap__note" role="status">${this._note}</p>` : ''}
        <p class="pcap__foot"><span>Your photo never leaves your device</span> <button class="pcap__link" type="button" data-act="privacy">Privacy notice</button></p>
        <dialog class="pcap__modal" aria-label="Collector Card Privacy Notice">
          <article>
            <header><h2>Collector Card Privacy Notice</h2><button type="button" class="pcap__x" data-act="privacy-close" aria-label="Close">&times;</button></header>
            ${PCAP_DRAFT ? '<p class="pcap__draft">Draft, pending legal review</p>' : ''}
            <p class="pcap__eff">Effective Date: ${PCAP_EFFECTIVE}</p>
            ${PCAP_PARAS.map((t) => `<p>${t}</p>`).join('')}
            <h3>Questions</h3>
            <p>If you have questions about this Collector Card Privacy Notice or the Collector Card feature, you may contact Ebenezer Partnership LLC d/b/a Port St. Lucie SC at <a href="mailto:${PCAP_EMAIL}">${PCAP_EMAIL}</a>.</p>
          </article>
        </dialog>
      </div>`;

    const modal = this.querySelector('.pcap__modal');
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
    const gate = this.querySelector('.pcap__gate-check');
    if (gate) {
      gate.checked = this._ageOk;   // sobrevive a los re-render (no se persiste)
      gate.addEventListener('change', () => {
        this._ageOk = gate.checked;
        const b = this.querySelector('.pcap__actions .pcap__btn');
        if (b) b.disabled = !this._ageOk;
      });
    }
    const name = this.querySelector('.pcap__name');
    if (name) {
      name.value = this._name;      // por propiedad: sin riesgo de inyección por atributo
      name.addEventListener('input', () => { this._name = name.value; this._emit(); });
    }
    this._file = this.querySelector('.pcap__file');
    this._file.addEventListener('change', (e) => this._onFile(e));
    this.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => this._act(b.dataset.act)));
  }

  _act(act) {
    // el botón ya va disabled, pero el gate se chequea igual: es el único camino a cámara y picker
    if ((act === 'start' || act === 'upload') && !this._ageOk) return;
    if (act === 'start') this._startCamera();
    if (act === 'upload') this._file.click();
    if (act === 'snap') this._snap();
    if (act === 'cancel') { this._cancelLive(); this._note = ''; this._render(); }
    if (act === 'remove') { this._photo = null; this._cutout = null; this._cutToken = 0; this._mode = 'idle'; this._note = ''; this._render(); this._emit(); }
    if (act === 'privacy') this.querySelector('.pcap__modal').showModal();
    if (act === 'privacy-close') this.querySelector('.pcap__modal').close();
  }

  async _startCamera() {
    if (this._starting) return;   // single-flight
    if (!navigator.mediaDevices?.getUserMedia) {
      this._file.click();         // sin soporte: seguimos dentro del gesto, el picker funciona
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
      this._stream = stream;
      this._mode = 'live';
      this._note = '';
      this._render();
      const video = document.createElement('video');
      video.className = 'pcap__video';
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      this.stage?.flip(false);
      this.stage?.classList.add('is-live');
      this.stage?.querySelector('.tc__win')?.append(video);
    } catch (err) {
      // permiso denegado o sin cámara: ofrezco subir foto (no auto-click, la activación expira)
      this._showUpload = true;
      this._note = 'Camera unavailable. Upload a photo instead.';
      this._mode = this._photo ? 'captured' : 'idle';
      this._render();
    } finally {
      this._starting = false;
    }
  }

  _crop(source, sw, sh, mirror) {
    const scale = Math.max(PCAP_W / sw, PCAP_H / sh);
    const w = PCAP_W / scale;
    const h = PCAP_H / scale;
    const c = document.createElement('canvas');
    c.width = PCAP_W;
    c.height = PCAP_H;
    const ctx = c.getContext('2d');
    if (mirror) { ctx.translate(PCAP_W, 0); ctx.scale(-1, 1); }   // coincide con el preview selfie
    ctx.drawImage(source, (sw - w) / 2, (sh - h) / 2, w, h, 0, 0, PCAP_W, PCAP_H);
    return c.toDataURL('image/jpeg', 0.9);
  }

  async _setPhoto(dataUrl) {
    this._photo = dataUrl;
    this._cutout = null;
    this._mode = 'captured';
    this._showUpload = false;
    this._note = 'Cutting out your photo...';
    this._render();
    this._emit();

    const token = (this._cutToken = (this._cutToken || 0) + 1);
    let cutout = null;
    try {
      cutout = await Promise.race([
        pcapCutout(dataUrl),
        new Promise((_, reject) => { setTimeout(() => reject(new Error('timeout')), PCAP_CUT_TIMEOUT); }),
      ]);
    } catch (err) {
      console.warn('[photo-capture] no se pudo recortar, queda la foto entera', err);
    }
    if (token !== this._cutToken) return;   // ya cambió la foto mientras recortaba
    this._cutout = cutout;
    this._note = cutout ? '' : 'We could not cut out your photo, so it stays as it is.';
    this._render();
    this._emit();
  }

  // Foto ya elegida por otro camino (laboratorio local)
  setPhotoFromImage(img) {
    return this._setPhoto(this._crop(img, img.naturalWidth, img.naturalHeight, false));
  }

  _snap() {
    const video = this.stage?.querySelector('.pcap__video');
    if (!video?.videoWidth) return;
    const photo = this._crop(video, video.videoWidth, video.videoHeight, true);
    this._stopCamera();
    this._setPhoto(photo);
  }

  _onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    this._stopCamera();
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      this.setPhotoFromImage(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);   // sin fuga si no decodifica (ej: HEIC en desktop)
      this._showUpload = true;
      this._note = 'We could not read that photo. Try another one.';
      this._mode = this._photo ? 'captured' : 'idle';
      this._render();
    };
    img.src = url;
  }
}

customElements.define('psl-photo-capture', PSLPhotoCapture);
