/**
 * Newsletter — bloque 09. Nativo, sin backend: valida y muestra confirmación.
 * HANDOFF (WP): reemplazar el handler por un POST { email } al endpoint real de suscripción.
 */
function initNewsletter(root = document) {
  const form = root.querySelector('[data-newsletter]');
  if (!form) return;
  const msg = form.parentElement.querySelector('[data-newsletter-msg]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // HANDOFF (WP): POST { email } al endpoint de suscripción
    msg.textContent = "✓ You're on the list. Welcome to the build.";
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => initNewsletter());

export { initNewsletter };
