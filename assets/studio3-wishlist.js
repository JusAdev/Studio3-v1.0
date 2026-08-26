/**
 * Wishlist client-side (localStorage). Não é sincronizada com a conta do cliente nem
 * entre dispositivos — ver comentário em snippets/studio3-wishlist-button.liquid.
 */
(function () {
  var STORAGE_KEY = 'studio3:wishlist';

  function readIds() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeIds(ids) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      /* localStorage indisponível (modo privado, etc.) — botão continua funcionando
         só na sessão de página atual, sem persistir. */
    }
  }

  function syncButton(button, ids) {
    var id = button.getAttribute('data-product-id');
    var active = ids.indexOf(id) !== -1;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function syncAllButtons() {
    var ids = readIds();
    document.querySelectorAll('[data-studio3-wishlist-toggle]').forEach(function (button) {
      syncButton(button, ids);
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-studio3-wishlist-toggle]');
    if (!button) return;

    event.preventDefault();
    var id = button.getAttribute('data-product-id');
    var ids = readIds();
    var index = ids.indexOf(id);

    if (index === -1) {
      ids.push(id);
    } else {
      ids.splice(index, 1);
    }

    writeIds(ids);
    syncAllButtons();
  });

  document.addEventListener('DOMContentLoaded', syncAllButtons);
})();
