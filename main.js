import { createIcons, icons } from 'lucide';

// Initialize Icons
createIcons({ icons });

document.addEventListener('DOMContentLoaded', () => {
  // --- State ---
  const state = {
    planType: 'individual', // 'individual' or 'familiar'
    selectedPlan: null,     // 'basico', 'premium', 'golden'
    prices: {
      basico: { individual: 20, familiar: 35 },
      premium: { individual: 35, familiar: 50 },
      golden: { individual: 65, familiar: 85 },
    }
  };

  // --- Elements ---
  const form = document.getElementById('contractForm');
  const planTypeInputs = document.querySelectorAll('input[name="tipo_contratacao"]');
  const planInputs = document.querySelectorAll('input[name="plano"]');
  const priceDisplays = document.querySelectorAll('.price-display');
  const sectionDependentes = document.getElementById('section-dependentes');
  const btnAddDependente = document.getElementById('btn-add-dependente');
  const dependentesContainer = document.getElementById('dependentes-container');
  const noDependentsMsg = document.getElementById('no-dependents-msg');
  const dependenteTemplate = document.getElementById('dependente-template');
  
  const totalPriceDisplay = document.getElementById('total-price-display');
  const selectedPlanNameDisplay = document.getElementById('selected-plan-name');
  const selectedPlanTypeDisplay = document.getElementById('selected-plan-type');

  // --- Masks & Formatters ---
  const masks = {
    cpf: (value) => {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    },
    phone: (value) => {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    },
    cep: (value) => {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
    }
  };

  function applyMask(input, maskFunction) {
    input.addEventListener('input', (e) => {
      e.target.value = maskFunction(e.target.value);
    });
  }

  // Apply masks to static inputs
  applyMask(document.getElementById('cpf'), masks.cpf);
  applyMask(document.getElementById('telefone'), masks.phone);
  applyMask(document.getElementById('cep'), masks.cep);

  // --- Logic: Plan & Pricing ---
  
  function updatePrices() {
    // Update price cards based on type
    priceDisplays.forEach(display => {
      const price = display.getAttribute(`data-${state.planType}`);
      display.textContent = `R$ ${price}`;
    });

    // Toggle Dependents Section
    if (state.planType === 'familiar') {
      sectionDependentes.classList.remove('hidden');
      // Require dependent fields if visible? 
      // Logic: If familiar, at least one dependent is usually expected, 
      // but we'll leave it flexible or add validation on submit.
      
      // If switching to familiar and no dependents, maybe add one automatically?
      if (dependentesContainer.children.length <= 1) { // 1 because of the msg div
         // Optional: addDependente(); 
      }
    } else {
      sectionDependentes.classList.add('hidden');
      // Clear dependents? Or just hide. Let's just hide for now, but technically should clear.
    }

    updateTotal();
  }

  function updateTotal() {
    if (!state.selectedPlan) {
      totalPriceDisplay.textContent = 'R$ 0,00';
      selectedPlanNameDisplay.textContent = 'Selecione um plano';
      selectedPlanTypeDisplay.textContent = '-';
      return;
    }

    const price = state.prices[state.selectedPlan][state.planType];
    
    totalPriceDisplay.textContent = `R$ ${price.toFixed(2).replace('.', ',')}`;
    selectedPlanNameDisplay.textContent = `Plano ${state.selectedPlan.charAt(0).toUpperCase() + state.selectedPlan.slice(1)}`;
    selectedPlanTypeDisplay.textContent = state.planType === 'individual' ? 'Individual' : 'Familiar';
  }

  // Event Listeners for Plan Type
  planTypeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      state.planType = e.target.value;
      updatePrices();
    });
  });

  // Event Listeners for Plan Selection
  planInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      state.selectedPlan = e.target.value;
      updateTotal();
      
      // Scroll to payment or dependents
      const nextSection = state.planType === 'familiar' ? sectionDependentes : document.querySelector('section:nth-of-type(4)'); // Payment section
      // smooth scroll logic if desired
    });
  });

  // --- Logic: Dependents ---

  function addDependente() {
    noDependentsMsg.style.display = 'none';
    
    const clone = dependenteTemplate.content.cloneNode(true);
    const root = clone.querySelector('.dependente-item');
    
    // Update counter
    const count = dependentesContainer.querySelectorAll('.dependente-item').length + 1;
    root.querySelector('.dep-counter').textContent = count;

    // Add mask to new CPF input
    const cpfInput = root.querySelector('.cpf-mask');
    applyMask(cpfInput, masks.cpf);

    // Remove button logic
    root.querySelector('.btn-remove-dependente').addEventListener('click', () => {
      root.remove();
      if (dependentesContainer.querySelectorAll('.dependente-item').length === 0) {
        noDependentsMsg.style.display = 'block';
      }
      // Re-index counters if needed, but simple numbers suffice
    });

    // Re-init icons for the new elements
    createIcons({ icons, nameAttr: 'data-lucide', attrs: {class: "w-4 h-4"} }, root); // Need to handle lucide manually for dynamic content usually, or re-run createIcons
    
    dependentesContainer.appendChild(root);
    createIcons({ icons }); // Brute force re-init for simplicity
  }

  btnAddDependente.addEventListener('click', addDependente);

  // --- Logic: CEP (Address) ---
  const cepInput = document.getElementById('cep');
  
  cepInput.addEventListener('blur', async () => {
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    const loading = document.getElementById('cep-loading');
    loading.classList.remove('hidden');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        document.getElementById('rua').value = data.logradouro;
        document.getElementById('bairro').value = data.bairro;
        document.getElementById('cidade').value = data.localidade;
        document.getElementById('uf').value = data.uf;
        document.getElementById('numero').focus();
      } else {
        alert('CEP não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      loading.classList.add('hidden');
    }
  });

  // --- Form Submission ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!state.selectedPlan) {
      alert('Por favor, selecione um plano de saúde.');
      return;
    }

    // Basic validation for Familiar plan
    if (state.planType === 'familiar') {
      const dependentsCount = dependentesContainer.querySelectorAll('.dependente-item').length;
      if (dependentsCount === 0) {
        alert('Para o plano Familiar, é necessário adicionar pelo menos um dependente.');
        sectionDependentes.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Simulate API call
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin w-5 h-5"></i> Processando...';
    createIcons({ icons });

    setTimeout(() => {
      alert(`Contratação realizada com sucesso!\n\nPlano: ${state.selectedPlan.toUpperCase()}\nTipo: ${state.planType.toUpperCase()}\nValor: ${totalPriceDisplay.textContent}\n\nUm e-mail de confirmação foi enviado.`);
      btn.disabled = false;
      btn.innerHTML = originalText;
      createIcons({ icons });
      // form.reset(); // Optional
    }, 2000);
  });

  // Initial setup
  updatePrices();
});
