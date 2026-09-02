/**
 * Cadastro em 2 passos (Profissional da Estética / Cliente Final).
 *
 * Passo 1: escolhe o tipo de perfil.
 * Passo 2: nome, e-mail, senha -> cria o cliente via Storefront API (customerCreate,
 * mesmo endpoint independente do sistema de contas — clássico ou Novas Contas de
 * Cliente — já que os dois mexem no mesmo registro de cliente por baixo).
 *
 * Se o perfil escolhido for "profissional", depois de criar o cliente chama o
 * Cloudflare Worker (URL configurável no editor de temas) que cuida da parte B2B
 * (criar empresa, vincular o cliente, atribuir catálogo) via Admin API — token de
 * Admin nunca fica no tema. Ver Studio3-B2B-Worker/README.md pro deploy do Worker.
 */
(function () {
  const root = document.querySelector('[data-studio3-register]');
  if (!root) return;

  const shopDomain = root.dataset.shopDomain;
  const storefrontToken = root.dataset.storefrontToken;
  const workerUrl = root.dataset.workerUrl;
  const loginUrl = root.dataset.loginUrl;

  const step1 = root.querySelector('[data-step="1"]');
  const step2 = root.querySelector('[data-step="2"]');
  const profileCards = root.querySelectorAll('[data-profile-card]');
  const continueBtn = root.querySelector('[data-continue-btn]');
  const backBtn = root.querySelector('[data-back-btn]');
  const form = root.querySelector('[data-register-form]');
  const submitBtn = root.querySelector('[data-submit-btn]');
  const errorEl = root.querySelector('[data-form-error]');
  const stepDots = root.querySelectorAll('[data-step-dot]');
  const stepLabel = root.querySelector('[data-step-label]');
  const selectedProfileLabel = root.querySelector('[data-selected-profile-label]');

  let selectedProfile = null; // 'profissional' | 'cliente-final'

  function setStep(n) {
    step1.hidden = n !== 1;
    step2.hidden = n !== 2;
    stepDots.forEach((dot, i) => dot.classList.toggle('is-active', i === n - 1));
    if (stepLabel) stepLabel.textContent = stepLabel.dataset.template.replace('[n]', n);
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  profileCards.forEach((card) => {
    card.addEventListener('click', () => {
      profileCards.forEach((c) => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      selectedProfile = card.dataset.profileCard;
      continueBtn.disabled = false;
    });
  });

  continueBtn.addEventListener('click', () => {
    if (!selectedProfile) return;
    if (selectedProfileLabel) {
      const card = root.querySelector(`[data-profile-card="${selectedProfile}"]`);
      selectedProfileLabel.textContent = card.querySelector('[data-profile-title]').textContent;
    }
    setStep(2);
  });

  if (backBtn) {
    backBtn.addEventListener('click', () => setStep(1));
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('is-loading', isLoading);
  }

  async function storefrontFetch(query, variables) {
    const res = await fetch(`https://${shopDomain}/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
    });
    return res.json();
  }

  async function createCustomer({ firstName, lastName, email, password }) {
    const query = `
      mutation studio3CustomerCreate($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer { id email }
          customerUserErrors { field message code }
        }
      }
    `;
    const result = await storefrontFetch(query, {
      input: { firstName, lastName, email, password },
    });
    return result.data.customerCreate;
  }

  async function triggerB2bSetup({ customerId, businessName }) {
    if (!workerUrl) {
      // Worker ainda não foi deployado/configurado — a conta é criada normalmente,
      // só fica faltando a parte B2B (empresa/catálogo). Sem travar o cadastro por
      // isso: erro registrado no console pra facilitar depois, cadastro segue.
      console.warn('[studio3-register] workerUrl não configurado — pulando setup B2B.');
      return;
    }
    try {
      await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, businessName }),
      });
    } catch (err) {
      console.error('[studio3-register] Falha ao chamar o Worker de setup B2B:', err);
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const data = new FormData(form);
    const firstName = (data.get('first_name') || '').toString().trim();
    const lastName = (data.get('last_name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const password = (data.get('password') || '').toString();
    const passwordConfirm = (data.get('password_confirm') || '').toString();

    if (!firstName || !email || !password) {
      showError(root.dataset.errorRequired);
      return;
    }
    if (password.length < 8) {
      showError(root.dataset.errorPasswordLength);
      return;
    }
    if (password !== passwordConfirm) {
      showError(root.dataset.errorPasswordMatch);
      return;
    }

    setLoading(true);
    try {
      const { customer, customerUserErrors } = await createCustomer({
        firstName,
        lastName,
        email,
        password,
      });

      if (customerUserErrors && customerUserErrors.length) {
        showError(customerUserErrors.map((e) => e.message).join(' '));
        setLoading(false);
        return;
      }

      if (selectedProfile === 'profissional') {
        await triggerB2bSetup({
          customerId: customer.id,
          businessName: `${firstName} ${lastName}`.trim(),
        });
      }

      window.location.href = loginUrl + (loginUrl.includes('?') ? '&' : '?') + 'customer_created=1';
    } catch (err) {
      console.error('[studio3-register] Erro ao criar cliente:', err);
      showError(root.dataset.errorGeneric);
      setLoading(false);
    }
  });
})();
