// Small enhancement only: update footer year automatically.
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
