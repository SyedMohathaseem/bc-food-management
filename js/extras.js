/**
 * Inas Cafe - Daily Extras Module
 * Handles daily extra food item entries
 * CRITICAL LOGIC: When extra is added for ONE meal, other meals for that date are marked as "-"
 */

const Extras = {
  // =====================================================
  // Render
  // =====================================================

  async render() {
    const pageContent = document.getElementById('pageContent');
    const today = new Date().toISOString().split('T')[0];
    
    pageContent.innerHTML = `
      <h1 class="mb-6">🍽️ Daily Extra Entry</h1>
      
      <!-- Entry Form -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">➕ Add Extra Item</h3>
        </div>
        
        <form id="extraForm" onsubmit="Extras.save(event)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Search Customer</label>
              ${CustomerSearch.create('extraCustomerSearch', (customer) => Extras.onCustomerChange(customer), 'Type name or mobile...', false)}
            </div>
            
            <div class="form-group">
              <label class="form-label required">Date</label>
              <input type="date" class="form-control" id="extraDate" 
                     value="${today}" required onchange="Extras.onDateChange()">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label required">Meal Type</label>
            <div class="form-check-group" id="mealTypeGroup">
              <label class="form-check">
                <input type="radio" class="radio radio-primary" name="mealType" value="breakfast" required
                       onchange="Extras.onMealTypeChange()">
                <span class="form-check-label">🌅 Breakfast</span>
              </label>
              <label class="form-check">
                <input type="radio" class="radio radio-primary" name="mealType" value="lunch" required
                       onchange="Extras.onMealTypeChange()">
                <span class="form-check-label">☀️ Lunch</span>
              </label>
              <label class="form-check">
                <input type="radio" class="radio radio-primary" name="mealType" value="dinner" required
                       onchange="Extras.onMealTypeChange()">
                <span class="form-check-label">🌙 Dinner</span>
              </label>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Extra Item</label>
              <select class="form-control form-select" id="extraItem" required 
                      onchange="Extras.onItemChange()">
                <option value="">-- Select meal type first --</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Price (₹)</label>
              <input type="number" class="form-control" id="extraPrice" 
                     placeholder="Auto-filled" min="0" step="5" required>
              <span class="form-text">Price auto-fills from menu (editable)</span>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Notes (optional)</label>
            <input type="text" class="form-control" id="extraNotes" 
                   placeholder="Any special instructions">
          </div>
          
          <!-- Status Indicator -->
          <div id="extraStatus" class="mb-4" style="display: none;"></div>
          
          <button type="submit" class="btn btn-primary btn-lg btn-block">
            💾 Save Entry
          </button>
        </form>
      </div>
      
      <!-- Today's Entries -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📋 Today's Entries</h3>
          <input type="date" id="viewDate" value="${today}" class="form-control" 
                 style="max-width: 180px;" onchange="Extras.loadEntriesForDate()">
        </div>
        <div id="entriesList">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
    `;
    
    // Initial load
    await this.loadEntriesForDate();
  },

  async renderEntries(date) {
    const extras = await DB.getExtrasByDate(date);
    
    if (extras.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p class="empty-state-title">No entries for this date</p>
        </div>
      `;
    }
    
    // Group by customer
    const grouped = {};
    let grandTotal = 0;
    
    extras.forEach(e => {
      if (!grouped[e.customerId]) {
        grouped[e.customerId] = { items: [], total: 0 };
      }
      grouped[e.customerId].items.push(e);
      grouped[e.customerId].total += parseFloat(e.price);
      grandTotal += parseFloat(e.price);
    });
    
    const menuItems = await DB.getMenuItems();
    const findMenuItem = (id) => menuItems.find(m => m.id === id);

    let html = '<ul class="list">';
    
    for (const customerId of Object.keys(grouped)) {
      const customer = await DB.getCustomer(customerId);
      const meals = grouped[customerId];
      
      const mealDetails = [];
      const mealNotes = [];
      
      meals.items.forEach(e => {
        const item = findMenuItem(e.menuItemId);
        mealDetails.push(`${this.getMealIcon(e.mealType)} ${item?.name || 'Item'} ₹${e.price}`);
        if (e.notes && e.notes.trim()) {
          mealNotes.push(`${this.getMealIcon(e.mealType)} ${e.notes}`);
        }
      });
      
      const notesHtml = mealNotes.length > 0 
        ? `<div class="list-item-notes">📝 ${mealNotes.join(' | ')}</div>` 
        : '';
      
      html += `
        <li class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">${customer?.name || 'Unknown'}</div>
            <div class="list-item-subtitle">${mealDetails.join(' • ')}</div>
            ${notesHtml}
          </div>
          <div class="list-item-amount">
            <span class="amount-badge">₹${meals.total}</span>
          </div>
          <div class="list-item-actions">
            <button class="btn btn-sm btn-outline" onclick="Extras.editCustomerEntries('${customerId}', '${date}')" title="Edit">
              ✏️
            </button>
          </div>
        </li>
      `;
    }
    
    html += '</ul>';
    
    // Add grand total
    html += `
      <div class="extras-grand-total">
        <span>Day Total:</span>
        <strong>₹${grandTotal.toLocaleString('en-IN')}</strong>
      </div>
    `;
    
    return html;
  },

  getMealIcon(meal) {
    const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };
    return icons[meal] || '';
  },

  // =====================================================
  // Form Handlers
  // =====================================================

  onCustomerChange(customer) {
    this.updateStatus();
    this.restrictMealTypes(customer);
  },

  restrictMealTypes(customer) {
    const mealInputs = document.querySelectorAll('input[name="mealType"]');
    const subscribedMeals = customer ? (customer.mealTimes || []) : ['breakfast', 'lunch', 'dinner'];
    
    let currentCheckedStillValid = false;

    mealInputs.forEach(input => {
      const isSubscribed = subscribedMeals.includes(input.value);
      input.disabled = !isSubscribed;
      
      const label = input.closest('.form-check');
      if (label) {
        if (!isSubscribed) {
          label.style.opacity = '0.5';
          label.style.cursor = 'not-allowed';
          label.title = 'Not in customer subscription';
          if (input.checked) input.checked = false;
        } else {
          label.style.opacity = '1';
          label.style.cursor = 'pointer';
          label.title = '';
          if (input.checked) currentCheckedStillValid = true;
        }
      }
    });

    // If current selection was disabled, reset item list
    if (!currentCheckedStillValid) {
      this.onMealTypeChange();
    }
  },

  onDateChange() {
    this.updateStatus();
  },

  async onMealTypeChange() {
    const mealType = document.querySelector('input[name="mealType"]:checked')?.value;
    const itemSelect = document.getElementById('extraItem');
    
    if (!mealType) {
      itemSelect.innerHTML = '<option value="">-- Select meal type first --</option>';
      return;
    }
    
    // Get menu items for this meal type
    const items = await DB.getMenuItemsByCategory(mealType);
    
    if (items.length === 0) {
      itemSelect.innerHTML = '<option value="">No items available</option>';
      return;
    }
    
    itemSelect.innerHTML = `
      <option value="">-- Select Item --</option>
      ${items.map(m => `<option value="${m.id}" data-price="${m.price}">${m.name} - ₹${m.price}</option>`).join('')}
    `;
    
    await this.updateStatus();
  },

  onItemChange() {
    const itemSelect = document.getElementById('extraItem');
    const priceInput = document.getElementById('extraPrice');
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.price) {
      priceInput.value = selectedOption.dataset.price;
    }
  },

  async updateStatus() {
    const customerId = CustomerSearch.getValue('extraCustomerSearch');
    const date = document.getElementById('extraDate').value;
    const statusDiv = document.getElementById('extraStatus');
    
    if (!customerId || !date) {
      statusDiv.style.display = 'none';
      return;
    }
    
    // Check existing entries for this customer and date
    const allExtras = await DB.getExtrasByDate(date);
    const customerExtras = allExtras.filter(e => e.customerId === customerId);
    
    if (customerExtras.length > 0) {
      statusDiv.style.display = 'block';
      statusDiv.innerHTML = `
        <div style="background: var(--primary-light); padding: var(--space-3); border-radius: var(--radius-md); color: var(--primary); font-size: var(--font-size-sm);">
          <strong>ℹ️ Existing items today for this customer:</strong> ${customerExtras.map(e => `${this.getMealIcon(e.mealType)} ₹${parseFloat(e.price)}`).join(', ')}
        </div>
      `;
    } else {
      statusDiv.style.display = 'none';
    }
  },

  async loadEntriesForDate() {
    const date = document.getElementById('viewDate').value;
    const listDiv = document.getElementById('entriesList');
    if (listDiv) {
      listDiv.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      listDiv.innerHTML = await this.renderEntries(date);
    }
  },

  // =====================================================
  // Save Entry
  // =====================================================

  async save(event) {
    event.preventDefault();
    
    const customerId = CustomerSearch.getValue('extraCustomerSearch');
    const date = document.getElementById('extraDate').value;
    const mealType = document.querySelector('input[name="mealType"]:checked')?.value;
    const menuItemId = document.getElementById('extraItem').value;
    const price = parseFloat(document.getElementById('extraPrice').value);
    const notes = document.getElementById('extraNotes').value.trim();
    
    // Validation
    if (!customerId || !date || !mealType || !menuItemId) {
      App.showToast('Please fill in all required fields', 'error');
      return;
    }
    
    if (price < 0) {
      App.showToast('Price cannot be negative', 'error');
      return;
    }
    
    try {
      // Save the extra entry
      await DB.addDailyExtra({
        customerId,
        date,
        mealType,
        menuItemId,
        price,
        notes
      });
      
      App.showToast(`${this.getMealLabel(mealType)} extra saved!`, 'success');
      
      // Reset form (keep customer and date for convenience)
      document.querySelectorAll('input[name="mealType"]').forEach(r => r.checked = false);
      document.getElementById('extraItem').innerHTML = '<option value="">-- Select meal type first --</option>';
      document.getElementById('extraPrice').value = '';
      document.getElementById('extraNotes').value = '';
      
      // Refresh entries list
      await this.loadEntriesForDate();
      await this.updateStatus();
      
    } catch (error) {
      console.error('Save error:', error);
      App.showToast('Error saving entry', 'error');
    }
  },

  getMealLabel(meal) {
    const labels = { 
      breakfast: '🌅 Breakfast', 
      lunch: '☀️ Lunch', 
      dinner: '🌙 Dinner' 
    };
    return labels[meal] || meal;
  },

  // =====================================================
  // Edit & Delete
  // =====================================================

  async editCustomerEntries(customerId, date) {
    // Pre-select the customer using CustomerSearch
    const customer = await DB.getCustomer(customerId);
    if (customer) {
      CustomerSearch.select('extraCustomerSearch', customerId, customer);
    }
    document.getElementById('extraDate').value = date;
    await this.updateStatus();
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    App.showToast('Select meal type to add or update entry', 'info');
  },

  async deleteEntry(customerId, date, mealType) {
    App.confirm(
      `Delete ${this.getMealLabel(mealType)} entry for this date?`,
      async () => {
        await DB.deleteExtraByDetails(customerId, date, mealType);
        App.showToast('Entry deleted', 'success');
        await this.loadEntriesForDate();
        await this.updateStatus();
      }
    );
  }
};

// Make available globally
window.Extras = Extras;
