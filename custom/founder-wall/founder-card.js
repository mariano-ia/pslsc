/**
 * <psl-founder-card number="42" name="Marco R." joined="June 2025" tier="charter"></psl-founder-card>
 *
 * 🟦 A medida — el carnet digital de fundador. Pieza B del benchmark Piezas Diferenciales.
 * Reutilizado en bloque 05 (Home, featured) y S04 (Sumate, muro completo).
 *
 * Decisiones aplicadas:
 * - Formato 9:16 (Stories) — decisión #2 del ranking de 9.
 * - Número de fundador como elemento más grande del carnet, no un dato más — decisión #5 del ranking.
 * - Sin precio ni tier visible como recibo: es una credencial de honor, no una transacción.
 * - Charter Member (primeros 100) vs Early Founder (primeros 500) vs Founding Member (resto).
 *
 * ESTADO ACTUAL: el render del carnet acá es client-side (CSS/canvas) para preview en vivo en
 * la página. El benchmark especifica generación SERVER-SIDE vía OG image endpoint para que el
 * share sea consistente entre dispositivos — eso requiere backend y queda documentado como
 * contrato pendiente, no construido en esta etapa (ver comentario en _share()).
 */
// idioma desde el DOM (fuente única que setea i18n.apply())
const L = (en, es) => (document.documentElement.lang === 'es' ? es : en);

class PSLFounderCard extends HTMLElement {
  static get observedAttributes() {
    return ['number', 'name', 'joined', 'tier'];
  }

  connectedCallback() {
    this._render();
    this._onLang = () => this._render();
    document.addEventListener('psl:langchange', this._onLang);
  }

  disconnectedCallback() {
    document.removeEventListener('psl:langchange', this._onLang);
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _tierLabel() {
    const tier = this.getAttribute('tier') || 'founding';
    if (tier === 'charter') return L('Charter Member', 'Miembro Charter');
    if (tier === 'early') return L('Early Founder', 'Fundador Temprano');
    return L('Founding Member', 'Miembro Fundador');
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
          <img class="founder-card__crest" src="/assets/brand/crest-aqua.png" alt="PSL SC" width="40" height="43" />
          <span class="founder-card__tier">${this._tierLabel()}</span>
        </div>

        <div class="founder-card__center">
          <div class="founder-card__number tnum">#${this._pad(number)}</div>
          <div class="founder-card__name">${name}</div>
        </div>

        <div class="founder-card__meta">
          <span class="founder-card__club">Port St. Lucie SC · 2027</span>
          ${joined ? `<span class="founder-card__joined">${L('Joined', 'Se unió')} ${joined}</span>` : ''}
        </div>

        <button class="founder-card__share" type="button">${L('Share my card', 'Comparte tu carnet')}</button>
      </div>
    `;
    this.querySelector('.founder-card__share').addEventListener('click', () => this._share());
  }

  _pad(n) {
    return String(n).padStart(4, '0');
  }

  // Contrato pendiente: generar imagen 9:16 vía endpoint server-side, ej. GET /api/founder-card/{number}.png
  // (renderizado en servidor para consistencia visual entre dispositivos — ver Pieza B del benchmark).
  // Hoy usa Web Share API compartiendo el link de la página como fallback de demo.
  async _share() {
    const number = this.getAttribute('number');
    const text = L(
      `I'm founding member #${number} of @pslsc — the first professional club in the Treasure Coast. #PSLSC #FoundingMember`,
      `Soy el miembro fundador #${number} de @pslsc — el primer club profesional de la Treasure Coast. #PSLSC #FoundingMember`,
    );
    if (navigator.share) {
      try {
        await navigator.share({ text, url: location.href });
      } catch {
        // usuario canceló el share — no hacer nada
      }
    } else {
      await navigator.clipboard.writeText(`${text} ${location.href}`);
      this.querySelector('.founder-card__share').textContent = L('Copied!', '¡Copiado!');
      setTimeout(() => {
        this.querySelector('.founder-card__share').textContent = L('Share my card', 'Comparte tu carnet');
      }, 1500);
    }
  }
}

customElements.define('psl-founder-card', PSLFounderCard);

export { PSLFounderCard };
