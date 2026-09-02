/**
 * Barra de frete grátis. Convenção do projeto (ver CLAUDE.md, seção "utilitários
 * compartilhados"): qualquer mecanismo de carrinho (nativo do Dawn ou customizado via
 * fetch, a decidir) deve disparar `document.dispatchEvent(new CustomEvent('cart:updated'))`
 * depois de adicionar/remover/alterar itens, para esta barra e outros utilitários que
 * dependem do carrinho se atualizarem sem precisar de reload.
 */
(function () {
  function formatMoney(cents) {
    var value = (cents / 100).toFixed(2).replace('.', ',');
    var parts = value.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return 'R$ ' + parts.join(',');
  }

  function updateBar(bar, cartTotalCents) {
    var thresholdCents = parseInt(bar.getAttribute('data-threshold-cents'), 10) || 0;
    var progressEl = bar.querySelector('[data-studio3-shipping-bar-progress]');
    var textEl = bar.querySelector('[data-studio3-shipping-bar-text]');
    if (!progressEl || !textEl) return;

    var percent = thresholdCents > 0 ? Math.min(100, (cartTotalCents / thresholdCents) * 100) : 100;
    progressEl.style.width = percent + '%';

    if (cartTotalCents >= thresholdCents) {
      textEl.textContent = bar.getAttribute('data-text-complete');
    } else {
      var remaining = formatMoney(thresholdCents - cartTotalCents);
      var template = bar.getAttribute('data-text-incomplete');
      textEl.innerHTML = template.replace('[valor]', '<strong>' + remaining + '</strong>');
    }
  }

  function refresh() {
    var bars = document.querySelectorAll('[data-studio3-shipping-bar]');
    if (!bars.length) return;

    fetch(window.Shopify && window.Shopify.routes && window.Shopify.routes.root
      ? window.Shopify.routes.root + 'cart.js'
      : '/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (response) { return response.json(); })
      .then(function (cart) {
        bars.forEach(function (bar) { updateBar(bar, cart.total_price); });
      })
      .catch(function () {
        /* Se o /cart.js falhar, mantém a barra no estado renderizado no servidor. */
      });
  }

  document.addEventListener('DOMContentLoaded', refresh);
  document.addEventListener('cart:updated', refresh);

  /* `pubsub.js`/`constants.js` carregam antes de qualquer section script (ambos são
     `<script defer>` no <head>, e scripts com defer executam em ordem de documento) —
     `subscribe`/`PUB_SUB_EVENTS` já existem no escopo global quando este arquivo roda.
     Isso cobre TODOS os fluxos nativos do Dawn que mexem no carrinho (product-form.js no
     add-to-cart, cart.js no +/-/remover) sem precisar tocar nesses arquivos do Dawn. */
  if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
    subscribe(PUB_SUB_EVENTS.cartUpdate, refresh);
  }
})();
