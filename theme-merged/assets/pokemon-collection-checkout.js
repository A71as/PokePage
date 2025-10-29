class PokemonCollectionCheckout {
  constructor() {
    this.collectionData = null;
    this.pricing = {
      basePrice: 15.00,
      cardPrice: 2.50
    };
    
    this.init();
  }

  init() {
    this.loadCollectionFromURL();
    this.setupEventListeners();
    this.populateCollectionSummary();
    this.updatePricing();
  }

  loadCollectionFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    try {
      this.collectionData = {
        title: urlParams.get('collection_title') || 'Untitled Collection',
        layout: urlParams.get('layout') || '3x3',
        theme: urlParams.get('theme') || 'classic',
        totalCards: parseInt(urlParams.get('total_cards')) || 0,
        cards: JSON.parse(urlParams.get('collection_data') || '{}').cards || {}
      };
      
      // Update pricing if provided
      const totalPrice = parseFloat(urlParams.get('total_price'));
      if (totalPrice) {
        this.pricing.basePrice = totalPrice - (this.collectionData.totalCards * this.pricing.cardPrice);
      }
    } catch (error) {
      console.error('Error loading collection data:', error);
      this.showError('Invalid collection data. Please return to the page builder.');
    }
  }

  setupEventListeners() {
    const form = document.getElementById('checkoutForm');
    form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    
    // Auto-populate from localStorage if available
    this.loadCustomerInfo();
  }

  populateCollectionSummary() {
    if (!this.collectionData) return;
    
    // Update collection info
    document.getElementById('collectionTitle').textContent = this.collectionData.title;
    document.getElementById('collectionLayout').textContent = this.collectionData.layout.toUpperCase();
    document.getElementById('collectionTheme').textContent = this.capitalizeFirst(this.collectionData.theme);
    document.getElementById('totalCards').textContent = this.collectionData.totalCards;
    
    // Create collection preview
    this.createCollectionPreview();
  }

  createCollectionPreview() {
    const preview = document.getElementById('collectionPreview');
    const layout = this.collectionData.layout;
    
    preview.className = `collection-preview-checkout grid-${layout}`;
    
    // Calculate grid dimensions
    let totalSlots;
    switch (layout) {
      case '3x3': totalSlots = 9; break;
      case '4x3': totalSlots = 12; break;
      case '2x4': totalSlots = 8; break;
      default: totalSlots = 9;
    }
    
    // Generate preview slots
    preview.innerHTML = '';
    for (let i = 0; i < totalSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'preview-slot';
      
      const cardData = this.collectionData.cards[i];
      if (cardData) {
        slot.innerHTML = `<img src="${cardData.images?.small || cardData.image}" alt="${cardData.name}" loading="lazy">`;
      } else {
        slot.classList.add('empty');
        slot.textContent = 'Empty';
      }
      
      preview.appendChild(slot);
    }
  }

  updatePricing() {
    const baseCost = this.pricing.basePrice;
    const cardCost = this.collectionData.totalCards * this.pricing.cardPrice;
    const totalCost = baseCost + cardCost;
    
    document.getElementById('basePrice').textContent = `$${baseCost.toFixed(2)}`;
    document.getElementById('cardCount').textContent = this.collectionData.totalCards;
    document.getElementById('cardPrice').textContent = `$${cardCost.toFixed(2)}`;
    document.getElementById('totalPrice').textContent = `$${totalCost.toFixed(2)}`;
    document.getElementById('finalPrice').textContent = `$${totalCost.toFixed(2)}`;
  }

  loadCustomerInfo() {
    // Try to load from localStorage
    const savedInfo = localStorage.getItem('customerInfo');
    if (savedInfo) {
      try {
        const info = JSON.parse(savedInfo);
        Object.keys(info).forEach(key => {
          const input = document.getElementById(key);
          if (input) {
            input.value = info[key];
          }
        });
      } catch (error) {
        console.error('Error loading customer info:', error);
      }
    }
  }

  saveCustomerInfo(formData) {
    // Save customer info to localStorage for future use
    const customerInfo = {};
    for (let [key, value] of formData.entries()) {
      if (key !== 'specialInstructions') { // Don't save special instructions
        customerInfo[key] = value;
      }
    }
    localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.checkout-submit');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
      const formData = new FormData(e.target);
      
      // Save customer info for future use
      this.saveCustomerInfo(formData);
      
      // Add collection data to form
      formData.append('collection_data', JSON.stringify(this.collectionData));
      formData.append('pricing_data', JSON.stringify(this.pricing));
      
      // Submit the order
      await this.submitOrder(formData);
      
    } catch (error) {
      console.error('Order submission error:', error);
      this.showError('Failed to submit order. Please try again.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  async submitOrder(formData) {
    try {
      // Submit to a custom order processing endpoint
      const response = await fetch('/pages/process-collection-order', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Redirect to success page
          window.location.href = result.redirect_url || '/pages/order-confirmation';
        } else {
          throw new Error(result.error || 'Order processing failed');
        }
      } else {
        // Fallback: send email with order details
        await this.sendOrderEmail(formData);
      }
    } catch (error) {
      console.error('Order processing error:', error);
      // Fallback: send email with order details
      await this.sendOrderEmail(formData);
    }
  }

  async sendOrderEmail(formData) {
    try {
      // Create email content
      const emailData = {
        to: 'orders@pokepage.com', // Replace with actual email
        subject: `New Pokemon Collection Order: ${this.collectionData.title}`,
        body: this.createEmailBody(formData)
      };
      
      // Send via contact form or email service
      const response = await fetch('/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_type: 'collection_order',
          email: formData.get('email'),
          subject: emailData.subject,
          message: emailData.body
        })
      });
      
      if (response.ok) {
        this.showSuccess('Order submitted successfully! You will receive a confirmation email shortly.');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        throw new Error('Email submission failed');
      }
    } catch (error) {
      console.error('Email submission error:', error);
      this.showError('Order submission failed. Please contact us directly at orders@pokepage.com');
    }
  }

  createEmailBody(formData) {
    const totalPrice = this.pricing.basePrice + (this.collectionData.totalCards * this.pricing.cardPrice);
    
    let body = `
NEW POKEMON COLLECTION ORDER

Customer Information:
- Name: ${formData.get('firstName')} ${formData.get('lastName')}
- Email: ${formData.get('email')}
- Phone: ${formData.get('phone') || 'Not provided'}

Shipping Address:
${formData.get('address1')}
${formData.get('address2') ? formData.get('address2') + '\n' : ''}${formData.get('city')}, ${formData.get('state')} ${formData.get('zip')}
${formData.get('country')}

Collection Details:
- Title: ${this.collectionData.title}
- Layout: ${this.collectionData.layout.toUpperCase()}
- Theme: ${this.capitalizeFirst(this.collectionData.theme)}
- Total Cards: ${this.collectionData.totalCards}

Pricing:
- Base Cost: $${this.pricing.basePrice.toFixed(2)}
- Card Cost: $${(this.collectionData.totalCards * this.pricing.cardPrice).toFixed(2)}
- Total: $${totalPrice.toFixed(2)}

Cards in Collection:
`;
    
    Object.values(this.collectionData.cards).forEach((card, index) => {
      body += `${index + 1}. ${card.name} (${card.set?.name || 'Unknown Set'})\n`;
    });
    
    if (formData.get('specialInstructions')) {
      body += `\nSpecial Instructions:\n${formData.get('specialInstructions')}`;
    }
    
    body += `\nCollection Data (for processing):\n${JSON.stringify(this.collectionData, null, 2)}`;
    
    return body;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
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
      transition: 'all 0.3s ease',
      maxWidth: '400px'
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
    }, type === 'error' ? 5000 : 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PokemonCollectionCheckout();
});