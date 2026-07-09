/**
 * <psl-founder-card number="42" name="Marco R." joined="June 2025" tier="charter"></psl-founder-card>
 *
 * 🟦 A medida — el carnet digital de fundador (formato 9:16, tipo Stories).
 *
 * OJO: este componente NO está montado en ninguna página. La Home usa <psl-founder-id> (el boarding
 * pass, en /custom/founder-id/) en su lugar. Queda acá por si se decide armar una sección "Your card".
 *
 * Cómo funciona:
 * - El número de fundador es el elemento más grande del carnet.
 * - Sin precio ni tier visible como recibo: es una credencial, no una transacción.
 * - Charter Member (primeros 100) / Early Founder (primeros 500) / Founding Member (resto).
 *
 * HANDOFF (WP): el render acá es client-side (CSS/canvas). Si se monta, para que el share se vea
 * igual en todos los dispositivos conviene generar la imagen SERVER-SIDE (OG image endpoint) —
 * requiere backend (ver comentario en _share()).
 */
class PSLFounderCard extends HTMLElement {
  static get observedAttributes() {
    return ['number', 'name', 'joined', 'tier'];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _tierLabel() {
    const tier = this.getAttribute('tier') || 'founding';
    if (tier === 'charter') return 'Charter Member';
    if (tier === 'early') return 'Early Founder';
    return 'Founding Member';
  }

  _render() {
    const number = this.getAttribute('number') || '0';
    const name = this.getAttribute('name') || 'Founder';
    const joined = this.getAttribute('joined') || '';
    const tier = this.getAttribute('tier') || 'founding';

    this.innerHTML = `
      <div class="founder-card founder-card--${tier}">
        <div class="founder-card__art" aria-hidden="true"></div>

        <div class="founder-card__top">
          <img class="founder-card__crest" src="/assets/brand/crest-aqua.webp" alt="PSL SC" width="40" height="43" />
          <span class="founder-card__tier">${this._tierLabel()}</span>
        </div>

        <div class="founder-card__center">
          <div class="founder-card__number tnum">#${this._pad(number)}</div>
          <div class="founder-card__name">${name}</div>
        </div>

        <div class="founder-card__meta">
          <span class="founder-card__club">Port St. Lucie SC · 2027</span>
          ${joined ? `<span class="founder-card__joined">Joined ${joined}</span>` : ''}
        </div>

        <button class="founder-card__share" type="button">Share my card</button>
      </div>
    `;
    this.querySelector('.founder-card__share').addEventListener('click', () => this._share());
  }

  _pad(n) {
    return String(n).padStart(4, '0');
  }

  // HANDOFF (WP): generar imagen 9:16 vía endpoint server-side, ej. GET /api/founder-card/{number}.png
  // (renderizado en servidor para consistencia visual entre dispositivos).
  // Hoy usa Web Share API compartiendo el link de la página como fallback de demo.
  async _share() {
    const number = this.getAttribute('number');
    const text = `I'm founding member #${number} of @pslsc — the first professional club in the Treasure Coast. #PSLSC #FoundingMember`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url: location.href });
      } catch {
        // usuario canceló el share — no hacer nada
      }
    } else {
      await navigator.clipboard.writeText(`${text} ${location.href}`);
      this.querySelector('.founder-card__share').textContent = 'Copied!';
      setTimeout(() => {
        this.querySelector('.founder-card__share').textContent = 'Share my card';
      }, 1500);
    }
  }
}

customElements.define('psl-founder-card', PSLFounderCard);

export { PSLFounderCard };
