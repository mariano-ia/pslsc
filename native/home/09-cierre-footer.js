/**
 * Newsletter — bloque 09. Nativo, sin backend: valida y muestra confirmación.
 * Reemplazar el handler por POST al endpoint real de suscripción en el handoff a WordPress.
 */
function initNewsletter(root = document) {
  const form = root.querySelector('[data-newsletter]');
  if (!form) return;
  const msg = form.parentElement.querySelector('[data-newsletter-msg]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // TODO handoff: POST { email } al endpoint de suscripción
    msg.textContent = "✓ You're on the list. Welcome to the build.";
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => initNewsletter());

export { initNewsletter };
