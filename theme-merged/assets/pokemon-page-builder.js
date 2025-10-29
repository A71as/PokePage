class PokemonPageBuilder {
  constructor() {
    this.collectionData = {
      title: 'My Pokemon Collection',
      layout: '3x3',
      theme: 'classic',
      cards: {},
      totalCards: 0
    };
    
    this.pricing = {
      basePrice: 15.00,
      cardPrice: 2.50
    };
    
    this.currentSlot = null;
    this.previewMode = false;
    
    this.init();
  }

  init() {
    this.loadFromURL();
    this.setupEventListeners();
    this.generateGrid();
    this.updatePricing();
    this.loadPricingFromSettings();
  }

  loadFromURL() {
    // Check for URL parameters to pre-configure the builder
    const urlParams = new URLSearchParams(window.location.search);
    const layout = urlParams.get('layout');
    const title = urlParams.get('title');
    
    if (layout && ['3x3', '4x3', '2x4'].includes(layout)) {
      this.collectionData.layout = layout;
      document.getElementById('pageLayout').value = layout;
    }
    
    if (title) {
      this.collectionData.title = decodeURIComponent(title);
      document.getElementById('pageTitle').value = this.collectionData.title;
      document.getElementById('previewTitle').textContent = this.collectionData.title;
    }
  }

  loadPricingFromSettings() {
    // Get pricing from Shopify section settings if available
    const sectionElement = document.querySelector('.pokemon-page-builder');
    if (sectionElement) {
      const basePrice = sectionElement.dataset.basePrice;
      const cardPrice = sectionElement.dataset.cardPrice;
      
      if (basePrice) this.pricing.basePrice = parseFloat(basePrice);
      if (cardPrice) this.pricing.cardPrice = parseFloat(cardPrice);
    }
  }

  setupEventListeners() {
    // Layout change
    document.getElementById('pageLayout').addEventListener('change', (e) => {
      this.collectionData.layout = e.target.value;
      this.generateGrid();
    });

    // Title change
    document.getElementById('pageTitle').addEventListener('input', (e) => {
      this.collectionData.title = e.target.value || 'My Pokemon Collection';
      document.getElementById('previewTitle').textContent = this.collectionData.title;
    });

    // Theme change
    document.getElementById('collectionTheme').addEventListener('change', (e) => {
      this.collectionData.theme = e.target.value;
      this.applyTheme();
    });

    // Control buttons
    document.getElementById('clearAll').addEventListener('click', () => this.clearAllCards());
    document.getElementById('saveCollection').addEventListener('click', () => this.saveCollection());
    document.getElementById('addToCart').addEventListener('click', () => this.addToCart());

    // Browser toggle
    document.getElementById('toggleBrowser').addEventListener('click', () => this.toggleBrowser());

    // Preview/Edit mode
    document.getElementById('previewMode').addEventListener('click', () => this.setPreviewMode(true));
    document.getElementById('editMode').addEventListener('click', () => this.setPreviewMode(false));

    // Pokemon card selection from browser
    document.addEventListener('pokemonCardSelected', (e) => this.handleCardSelection(e.detail));

    // Close browser when clicking outside
    document.addEventListener('click', (e) => {
      const browser = document.getElementById('pokemonBrowser');
      const toggleBtn = document.getElementById('toggleBrowser');
      
      if (!browser.contains(e.target) && !toggleBtn.contains(e.target)) {
        browser.classList.remove('active');
      }
    });
  }

  generateGrid() {
    const grid = document.getElementById('cardGrid');
    const layout = this.collectionData.layout;
    
    // Clear existing grid
    grid.innerHTML = '';
    grid.className = `card-grid grid-${layout}`;
    
    // Calculate grid dimensions
    let rows, cols;
    switch (layout) {
      case '3x3': rows = 3; cols = 3; break;
      case '4x3': rows = 3; cols = 4; break;
      case '2x4': rows = 4; cols = 2; break;
      default: rows = 3; cols = 3;
    }
    
    // Generate slots
    for (let i = 0; i < rows * cols; i++) {
      const slot = this.createCardSlot(i);
      grid.appendChild(slot);
    }
    
    // Restore existing cards
    this.restoreCards();
  }

  createCardSlot(index) {
    const slot = document.createElement('div');
    slot.className = 'card-slot';
    slot.dataset.slotIndex = index;
    
    slot.innerHTML = `
      <div class="placeholder-content">
        <div class="placeholder-icon">🎴</div>
        <div>Click to add card</div>
      </div>
      <button class="remove-card" title="Remove card">×</button>
    `;
    
    // Add click listener for empty slots
    slot.addEventListener('click', (e) => {
      if (!slot.classList.contains('filled') && !this.previewMode) {
        this.currentSlot = index;
        this.toggleBrowser(true);
      }
    });
    
    // Add remove card listener
    slot.querySelector('.remove-card').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeCard(index);
    });
    
    return slot;
  }

  handleCardSelection(cardData) {
    if (this.currentSlot !== null && !this.previewMode) {
      this.addCardToSlot(this.currentSlot, cardData);
      this.currentSlot = null;
      this.toggleBrowser(false);
    }
  }

  addCardToSlot(slotIndex, cardData) {
    const slot = document.querySelector(`[data-slot-index="${slotIndex}"]`);
    if (!slot) return;
    
    // Store card data
    this.collectionData.cards[slotIndex] = cardData;
    this.collectionData.totalCards++;
    
    // Update slot appearance
    slot.classList.add('filled', 'dropping');
    slot.innerHTML = `
      <img src="${cardData.images?.small || cardData.image}" alt="${cardData.name}" class="card-image">
      <button class="remove-card" title="Remove card">×</button>
    `;
    
    // Re-add remove listener
    slot.querySelector('.remove-card').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeCard(slotIndex);
    });
    
    // Remove animation class after animation
    setTimeout(() => slot.classList.remove('dropping'), 500);
    
    this.updatePricing();
  }

  removeCard(slotIndex) {
    const slot = document.querySelector(`[data-slot-index="${slotIndex}"]`);
    if (!slot) return;
    
    // Remove from data
    delete this.collectionData.cards[slotIndex];
    this.collectionData.totalCards--;
    
    // Reset slot
    slot.classList.remove('filled');
    slot.innerHTML = `
      <div class="placeholder-content">
        <div class="placeholder-icon">🎴</div>
        <div>Click to add card</div>
      </div>
      <button class="remove-card" title="Remove card">×</button>
    `;
    
    // Re-add click listener
    slot.addEventListener('click', (e) => {
      if (!slot.classList.contains('filled') && !this.previewMode) {
        this.currentSlot = slotIndex;
        this.toggleBrowser(true);
      }
    });
    
    // Re-add remove listener
    slot.querySelector('.remove-card').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeCard(slotIndex);
    });
    
    this.updatePricing();
  }

  restoreCards() {
    Object.entries(this.collectionData.cards).forEach(([slotIndex, cardData]) => {
      this.addCardToSlot(parseInt(slotIndex), cardData);
    });
  }

  clearAllCards() {
    if (confirm('Are you sure you want to clear all cards?')) {
      this.collectionData.cards = {};
      this.collectionData.totalCards = 0;
      this.generateGrid();
      this.updatePricing();
    }
  }

  updatePricing() {
    const baseCost = this.pricing.basePrice;
    const cardCost = this.collectionData.totalCards * this.pricing.cardPrice;
    const totalCost = baseCost + cardCost;
    
    document.getElementById('baseCost').textContent = `$${baseCost.toFixed(2)}`;
    document.getElementById('cardCount').textContent = this.collectionData.totalCards;
    document.getElementById('cardCost').textContent = `$${cardCost.toFixed(2)}`;
    document.getElementById('totalCost').textContent = `$${totalCost.toFixed(2)}`;
    
    // Enable/disable add to cart button
    const addToCartBtn = document.getElementById('addToCart');
    addToCartBtn.disabled = this.collectionData.totalCards === 0;
    
    // Add animation to pricing card
    const pricingCard = document.querySelector('.pricing-card');
    pricingCard.classList.add('updated');
    setTimeout(() => pricingCard.classList.remove('updated'), 300);
    
    // Update collection price in form
    document.getElementById('collectionPrice').value = totalCost.toFixed(2);
  }

  applyTheme() {
    const grid = document.getElementById('cardGrid');
    const theme = this.collectionData.theme;
    
    // Remove existing theme classes
    grid.classList.remove('theme-classic', 'theme-modern', 'theme-vintage', 'theme-holographic');
    
    // Apply new theme
    grid.classList.add(`theme-${theme}`);
    
    // Update CSS custom properties based on theme
    const root = document.documentElement;
    switch (theme) {
      case 'modern':
        root.style.setProperty('--grid-bg', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
        break;
      case 'vintage':
        root.style.setProperty('--grid-bg', 'linear-gradient(135deg, #d4af37 0%, #8b4513 100%)');
        break;
      case 'holographic':
        root.style.setProperty('--grid-bg', 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)');
        break;
      default:
        root.style.setProperty('--grid-bg', 'linear-gradient(135deg, #f8fafc, #e2e8f0)');
    }
  }

  toggleBrowser(forceOpen = null) {
    const browser = document.getElementById('pokemonBrowser');
    if (forceOpen !== null) {
      browser.classList.toggle('active', forceOpen);
    } else {
      browser.classList.toggle('active');
    }
  }

  setPreviewMode(isPreview) {
    this.previewMode = isPreview;
    const grid = document.getElementById('cardGrid');
    const previewBtn = document.getElementById('previewMode');
    const editBtn = document.getElementById('editMode');
    
    if (isPreview) {
      grid.classList.add('preview-mode');
      previewBtn.classList.add('active');
      editBtn.classList.remove('active');
    } else {
      grid.classList.remove('preview-mode');
      previewBtn.classList.remove('active');
      editBtn.classList.add('active');
    }
  }

  saveCollection() {
    // Update form data
    document.getElementById('collectionData').value = JSON.stringify(this.collectionData);
    document.getElementById('collectionTitle').value = this.collectionData.title;
    document.getElementById('collectionLayout').value = this.collectionData.layout;
    document.getElementById('collectionTheme').value = this.collectionData.theme;
    
    // Save to localStorage for persistence
    localStorage.setItem('pokemonCollection', JSON.stringify(this.collectionData));
    
    // Show success message
    this.showNotification('Collection saved successfully!', 'success');
  }

  loadCollection() {
    const saved = localStorage.getItem('pokemonCollection');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.collectionData = { ...this.collectionData, ...data };
        
        // Update UI
        document.getElementById('pageLayout').value = this.collectionData.layout;
        document.getElementById('pageTitle').value = this.collectionData.title;
        document.getElementById('collectionTheme').value = this.collectionData.theme;
        document.getElementById('previewTitle').textContent = this.collectionData.title;
        
        this.generateGrid();
        this.applyTheme();
        this.updatePricing();
        
        this.showNotification('Collection loaded from previous session', 'info');
      } catch (e) {
        console.error('Failed to load collection:', e);
      }
    }
  }

  async addToCart() {
    if (this.collectionData.totalCards === 0) return;
    
    try {
      // First, create the product programmatically using Shopify's Admin API proxy
      // For now, we'll use a simulated approach that creates a cart line item
      const totalPrice = this.pricing.basePrice + (this.collectionData.totalCards * this.pricing.cardPrice);
      
      // Create form data to submit
      const formData = new FormData();
      formData.append('items[0][title]', this.collectionData.title);
      formData.append('items[0][price]', Math.round(totalPrice * 100)); // Price in cents
      formData.append('items[0][quantity]', '1');
      formData.append('items[0][properties][Collection Title]', this.collectionData.title);
      formData.append('items[0][properties][Layout]', this.collectionData.layout);
      formData.append('items[0][properties][Theme]', this.collectionData.theme);
      formData.append('items[0][properties][Total Cards]', this.collectionData.totalCards.toString());
      formData.append('items[0][properties][Collection Data]', JSON.stringify(this.collectionData));
      formData.append('items[0][properties][_Custom Collection]', 'true');
      
      // Add individual card details
      const cardList = Object.values(this.collectionData.cards);
      cardList.forEach((card, index) => {
        formData.append(`items[0][properties][Card ${index + 1}]`, `${card.name} (${card.set?.name || 'Unknown Set'})`);
      });
      
      // Submit to a custom endpoint that will handle the collection creation
      const response = await fetch('/pages/create-collection-product', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.product_url) {
          // Redirect to the created product page
          window.location.href = result.product_url;
        } else {
          // Fallback: redirect to a checkout page with collection data
          this.redirectToCheckout();
        }
      } else {
        // Fallback method
        this.redirectToCheckout();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.redirectToCheckout();
    }
  }
  
  redirectToCheckout() {
    // Create a URL with collection data for manual processing
    const totalPrice = this.pricing.basePrice + (this.collectionData.totalCards * this.pricing.cardPrice);
    const params = new URLSearchParams({
      'collection_title': this.collectionData.title,
      'layout': this.collectionData.layout,
      'theme': this.collectionData.theme,
      'total_cards': this.collectionData.totalCards,
      'total_price': totalPrice.toFixed(2),
      'collection_data': JSON.stringify(this.collectionData)
    });
    
    // Redirect to a custom checkout page
    window.location.href = `/pages/collection-checkout?${params.toString()}`;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      padding: '1rem 2rem',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s ease'
    });
    
    // Set background color based on type
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6',
      warning: '#f59e0b'
    };
    notification.style.background = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const pageBuilder = new PokemonPageBuilder();
  
  // Load any existing collection
  pageBuilder.loadCollection();
  
  // Make it globally accessible for debugging
  window.pokemonPageBuilder = pageBuilder;
});