/**
 * Barra fixa de "adicionar ao carrinho" da página de produto (product-page__sticky-bar).
 * Não reimplementa a lógica de carrinho: o botão desta barra só dispara um `click()`
 * no botão de submit REAL do <product-form> nativo do Dawn (buy-buttons.liquid),
 * reaproveitando toda a lógica de variante/AJAX/notificação de carrinho já existente.
 *
 * Visibilidade: IntersectionObserver observando o botão real de compra — quando ele
 * sai da viewport (isIntersecting === false), a barra ganha a classe
 * `product-page__sticky-bar--visible` e desliza pra dentro; quando volta à viewport,
 * a classe é removida e a barra volta a ficar escondida (transform: translateY(100%)).
 */
(function () {
  function initStickyBar(bar) {
    var targetId = bar.getAttribute('data-target-button-id');
    var targetButton = targetId ? document.getElementById(targetId) : null;
    if (!targetButton) return;

    var cta = bar.querySelector('[data-studio3-sticky-bar-cta]');
    if (cta) {
      cta.addEventListener('click', function () {
        if (targetButton.getAttribute('aria-disabled') === 'true' || targetButton.disabled) return;
        targetButton.click();
      });
    }

    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          bar.classList.toggle('product-page__sticky-bar--visible', !entry.isIntersecting);
        });
      },
      { threshold: 0 }
    );
    observer.observe(targetButton);
  }

  function init() {
    var bars = document.querySelectorAll('[data-studio3-sticky-bar]');
    bars.forEach(initStickyBar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
