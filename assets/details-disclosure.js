class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');

    // Hover-intent: open on hover for pointer devices that support true hover
    // (desktop mouse). Touch/tablet keeps click-only behavior so a tap can't
    // leave the menu "stuck" open. Checked once — device capability doesn't
    // change mid-session.
    this.supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (this.supportsHover) {
      this.addEventListener('mouseenter', this.onMouseEnter.bind(this));
      this.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    }
  }

  onMouseEnter() {
    // Moving from the summary into the dropdown panel re-enters this element,
    // so cancel any pending close before it can fire.
    if (this.hoverCloseTimeout) {
      clearTimeout(this.hoverCloseTimeout);
      this.hoverCloseTimeout = null;
    }
    // Setting the attribute (rather than calling a custom open method) fires
    // the native 'toggle' event, which onToggle() below already handles.
    this.mainDetailsToggle.setAttribute('open', '');
  }

  onMouseLeave() {
    if (this.hoverCloseTimeout) clearTimeout(this.hoverCloseTimeout);
    // Small delay avoids flicker when the cursor crosses the gap between the
    // summary trigger and the dropdown panel below it.
    this.hoverCloseTimeout = setTimeout(() => {
      this.close();
    }, 250);
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }
}

customElements.define('header-menu', HeaderMenu);
