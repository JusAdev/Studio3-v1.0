/*
  Slider de categorias: autoplay + loop infinito + um único botão "avançar".

  Não estende a `SliderComponent` nativa do Dawn (assets/global.js) — o construtor
  dela assume um botão "previous" (`this.prevButton.addEventListener(...)` sem
  checar null antes), que deixamos de renderizar de propósito (pedido do cliente:
  só um botão flutuante de avançar). Forçar essa herança exigiria manter um botão
  "previous" fantasma só pra não quebrar o construtor — mais simples reimplementar
  o pouco que este componente precisa (avançar por item, voltar ao início ao chegar
  no fim, pausar em hover/foco, respeitar prefers-reduced-motion).
*/
class Studio3CategoriesSlider extends HTMLElement {
  constructor() {
    super();
    this.track = this.querySelector('.slider');
    this.nextButton = this.querySelector('[data-studio3-categories-next]');
    if (!this.track || !this.nextButton) return;

    this.autoplaySpeed = (Number(this.dataset.speed) || 4) * 1000;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    this.nextButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.advance();
      this.play();
    });

    this.addEventListener('mouseenter', () => this.pause());
    this.addEventListener('mouseleave', () => this.play());
    this.addEventListener('focusin', () => this.pause());
    this.addEventListener('focusout', () => this.play());
    this.reducedMotion.addEventListener('change', () => {
      this.reducedMotion.matches ? this.pause() : this.play();
    });

    this.play();
  }

  advance() {
    // Nada a rolar (todas as categorias já cabem na largura disponível) — sem
    // efeito, evita um scrollTo(0) inútil a cada tick do autoplay.
    if (this.track.scrollWidth <= this.track.clientWidth + 1) return;

    const firstItem = this.track.querySelector('.slider__slide');
    if (!firstItem) return;

    const gap = parseFloat(getComputedStyle(this.track).columnGap) || 0;
    const step = firstItem.getBoundingClientRect().width + gap;
    const atEnd = this.track.scrollLeft + this.track.clientWidth >= this.track.scrollWidth - 2;

    this.track.scrollTo({
      left: atEnd ? 0 : this.track.scrollLeft + step,
      behavior: 'smooth',
    });
  }

  play() {
    this.pause();
    if (this.reducedMotion.matches) return;
    this.autoplayTimer = setInterval(() => this.advance(), this.autoplaySpeed);
  }

  pause() {
    clearInterval(this.autoplayTimer);
  }

  disconnectedCallback() {
    this.pause();
  }
}

customElements.define('studio3-categories-slider', Studio3CategoriesSlider);
