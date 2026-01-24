/**
 * Inas Cafe - Customer Management Module
 * Handles customer CRUD operations
 */

const Customers = {
  // Current edit ID (null = add mode)
  editId: null,
  
  // Cached customers for filtering
  data: [],

  // =====================================================
  // Render
  // =====================================================

  async render() {
    const pageContent = document.getElementById('pageContent');
    this.data = await DB.getCustomers(); // Cache data
    
    pageContent.innerHTML = `
      <div class="card-header" style="background: none; padding: 0; border: none; margin-bottom: var(--space-6);">
        <h1>👥 Customers</h1>
        <button class="btn btn-primary" onclick="Customers.openForm()">
          ➕ Add Customer
        </button>
      </div>

      <!-- Customer Search -->
      <div class="card mb-4" style="margin-bottom: var(--space-4);">
        <div class="search-bar" style="max-width: 100%; border: 1px solid var(--neutral-300);">
          <span class="search-icon">🔍</span>
          <input type="text" id="customerListSearch" class="search-input" 
                 placeholder="Search by name, mobile, or status..." 
                 oninput="Customers.filterList()" autocomplete="off">
        </div>
      </div>
      
      <!-- Customer List -->
      <div class="card" id="customerListContainer">
        ${this.data.length === 0 ? this.renderEmpty() : this.renderList(this.data)}
      </div>
      
      <!-- Add/Edit Modal -->
      <div class="modal-overlay" id="customerModal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="customerModalTitle">Add Customer</h3>
            <button class="modal-close" onclick="Customers.closeForm()">×</button>
          </div>
          <div class="modal-body">
            <form id="customerForm" onsubmit="Customers.save(event)">
              <div class="form-group">
                <label class="form-label required">Customer Name</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <input type="text" class="form-control" id="custName" 
                         placeholder="Enter full name" required style="padding-right: 40px;">
                  <button type="button" id="custNameVoiceBtn" onclick="Customers.startNameVoice()" 
                          style="position: absolute; right: 8px; background: none; border: none; cursor: pointer; color: var(--primary); transition: all 0.2s;"
                          title="Voice Input">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label required">Mobile Number</label>
                <input type="tel" class="form-control" id="custMobile" 
                       placeholder="10-digit mobile number" 
                       pattern="[0-9]{10}" maxlength="10" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">Address</label>
                <textarea class="form-control" id="custAddress" 
                          placeholder="Full address" rows="2"></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">Subscription Type</label>
                  <select class="form-control form-select" id="custSubType" required>
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Daily Amount (₹)</label>
                  <input type="number" class="form-control" id="custAmount" 
                         value="300" min="0" step="10" required>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label required">Food Times</label>
                <div class="form-check-group" style="margin-bottom: var(--space-4);">
                  <label class="form-check">
                    <input type="checkbox" class="form-check-input" name="custMealType" value="breakfast" checked>
                    <span class="form-check-label">🌅 Breakfast</span>
                  </label>
                  <label class="form-check">
                    <input type="checkbox" class="form-check-input" name="custMealType" value="lunch" checked>
                    <span class="form-check-label">☀️ Lunch</span>
                  </label>
                  <label class="form-check">
                    <input type="checkbox" class="form-check-input" name="custMealType" value="dinner" checked>
                    <span class="form-check-label">🌙 Dinner</span>
                  </label>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group" style="width: 100%;">
                  <label class="form-label">Referral (Optional)</label>
                  ${CustomerSearch.create('custReferralSearch', null, 'Search existing or type name...', false, false)}
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">Start Date</label>
                  <input type="date" class="form-control" id="custStartDate" required>
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Status</label>
                  <select class="form-control form-select" id="custStatus" required>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
              
              <div class="modal-footer" style="padding: var(--space-4) 0 0; margin-top: var(--space-4); border-top: 1px solid var(--neutral-200);">
                <button type="button" class="btn btn-outline" onclick="Customers.closeForm()">Cancel</button>
                <button type="submit" class="btn btn-primary btn-lg">💾 Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Set default start date
    document.getElementById('custStartDate').value = new Date().toISOString().split('T')[0];
  },

  renderEmpty() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <p class="empty-state-title">No customers yet</p>
        <p class="empty-state-text">Add your first customer to get started</p>
        <button class="btn btn-primary" onclick="Customers.openForm()">
          ➕ Add Customer
        </button>
      </div>
    `;
  },

  renderList(customers) {
    let html = '<ul class="list">';
    
    customers.forEach(c => {
      const statusClass = c.status === 'active' ? 'success' : 'warning';
      const statusLabel = c.status === 'active' ? 'Active' : 'Paused';
      
      // Format meal times display
      const mealMap = { 
        breakfast: '<span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 0.85em; margin-right: 4px; font-weight: 500;">Breakfast</span>', 
        lunch: '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 0.85em; margin-right: 4px; font-weight: 500;">Lunch</span>', 
        dinner: '<span style="background: #e0f2fe; color: #075985; padding: 2px 8px; border-radius: 12px; font-size: 0.85em; margin-right: 4px; font-weight: 500;">Dinner</span>' 
      };
      
      const mealTimesHtml = (c.mealTimes || ['breakfast', 'lunch', 'dinner'])
        .map(m => mealMap[m] || '')
        .join('');

      html += `
        <li class="list-item customer-list-item">
          <div class="list-item-content">
            <div class="list-item-title">
              <span class="customer-name">${c.name}</span>
              <span class="customer-meal-icons">${mealTimesHtml}</span>
            </div>
            <div class="list-item-subtitle">
              <span class="customer-meta">📱 ${c.mobile}</span>
              <span class="customer-meta">💰 ₹${c.dailyAmount}/${c.subscriptionType === 'monthly' ? 'month' : 'day'}</span>
              <span class="customer-meta">📝 ${c.subscriptionType}</span>
              ${c.referral ? `<span class="customer-meta">👤 Ref: ${c.referral}</span>` : ''}
            </div>
            <div class="list-item-subtitle" style="margin-top: 4px;">
              ${c.address ? `<span class="customer-meta" title="${c.address}">🏠 ${c.address}</span>` : ''}
              <span class="customer-meta">📅 Start: ${App.formatDate(c.startDate)}</span>
            </div>
          </div>
          <div class="customer-status-actions">
            <span class="badge badge-${statusClass}">${statusLabel}</span>
            <div class="list-item-actions">
              <button class="btn btn-sm btn-outline" onclick="Customers.edit('${c.id}')" title="Edit">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="Customers.delete('${c.id}')" title="Delete">🗑️</button>
            </div>
          </div>
        </li>
      `;
    });
    
    html += '</ul>';
    html += '</ul>';
    return html;
  },

  filterList() {
    const query = document.getElementById('customerListSearch').value.toLowerCase().trim();
    const container = document.getElementById('customerListContainer');
    
    if (!query) {
      container.innerHTML = this.renderList(this.data);
      return;
    }

    const filtered = this.data.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.mobile.includes(query) ||
      c.status.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: var(--space-8) 0;">
          <div class="empty-state-icon" style="font-size: 32px;">🔍</div>
          <p class="empty-state-text">No customers found matching "${query}"</p>
        </div>
      `;
    } else {
      container.innerHTML = this.renderList(filtered);
    }
  },

  // =====================================================
  // Form Operations
  // =====================================================

  async openForm(customerId = null) {
    this.editId = customerId;
    const modal = document.getElementById('customerModal');
    const title = document.getElementById('customerModalTitle');
    const form = document.getElementById('customerForm');
    
    form.reset();
    
    if (customerId) {
      // Edit mode
      const customer = await DB.getCustomer(customerId);
      if (!customer) {
        App.showToast('Customer not found', 'error');
        return;
      }
      
      title.textContent = 'Edit Customer';
      document.getElementById('custName').value = customer.name;
      document.getElementById('custMobile').value = customer.mobile;
      document.getElementById('custAddress').value = customer.address || '';
      document.getElementById('custSubType').value = customer.subscriptionType;
      this.updateAmountLabel(customer.subscriptionType);
      document.getElementById('custAmount').value = customer.dailyAmount;
      
      // Populate meal times
      const mealTimes = customer.mealTimes || ['breakfast', 'lunch', 'dinner'];
      document.querySelectorAll('input[name="custMealType"]').forEach(cb => {
        cb.checked = mealTimes.includes(cb.value);
      });
      
      document.querySelectorAll('input[name="custMealType"]').forEach(cb => {
        cb.checked = mealTimes.includes(cb.value);
      });
      
      // Removed Advance Amount field population
      
      // Update referral search
      CustomerSearch.clear('custReferralSearch');
      if (customer.referral) {
        const referralInput = document.getElementById('custReferralSearchInput');
        if (referralInput) referralInput.value = customer.referral;
      }
      
      if (customer.startDate) {
        const d = new Date(customer.startDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        document.getElementById('custStartDate').value = `${yyyy}-${mm}-${dd}`;
      } else {
        document.getElementById('custStartDate').value = '';
      }
      document.getElementById('custStatus').value = customer.status;
    } else {
      // Add mode
      title.textContent = 'Add Customer';
      document.getElementById('custStartDate').value = new Date().toISOString().split('T')[0];
      this.updateAmountLabel('daily'); // Default
      
      // Default all meal times checked
      document.querySelectorAll('input[name="custMealType"]').forEach(cb => cb.checked = true);
      // Removed Advance Amount default
      CustomerSearch.clear('custReferralSearch');
    }
    
    // Add listener for sub type
    const subTypeSelect = document.getElementById('custSubType');
    subTypeSelect.onchange = (e) => this.updateAmountLabel(e.target.value);
    
    App.openModal('customerModal');
  },

  updateAmountLabel(type) {
    const label = document.querySelector('label[for="custAmount"]') || 
                  document.getElementById('custAmount').previousElementSibling;
    if (label) {
      label.textContent = type === 'monthly' ? 'Monthly Amount (₹)' : 'Daily Amount (₹)';
    }
  },

  closeForm() {
    this.editId = null;
    App.closeModal('customerModal');
  },

  async save(event) {
    event.preventDefault();
    
    const data = {
      name: document.getElementById('custName').value.trim(),
      mobile: document.getElementById('custMobile').value.trim(),
      address: document.getElementById('custAddress').value.trim(),
      subscriptionType: document.getElementById('custSubType').value,
      dailyAmount: document.getElementById('custAmount').value,
      mealTimes: Array.from(document.querySelectorAll('input[name="custMealType"]:checked')).map(cb => cb.value),
      advanceAmount: 0, // Removed field, set to 0
      referral: '', // Placeholder, set below
      startDate: document.getElementById('custStartDate').value,
      status: document.getElementById('custStatus').value
    };
    
    // Get referral - from search selection or manual text
    const referralId = CustomerSearch.getValue('custReferralSearch');
    if (referralId) {
      const refCustomer = await DB.getCustomer(referralId);
      data.referral = refCustomer ? `${refCustomer.name} (${refCustomer.mobile})` : '';
    } else {
      data.referral = document.getElementById('custReferralSearchInput')?.value.trim() || '';
    }
    
    // Validation
    if (!data.name || !data.mobile) {
      App.showToast('Please fill in all required fields', 'error');
      return;
    }
    
    if (data.mobile.length !== 10) {
      App.showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    
    try {
      if (this.editId) {
        // Update existing
        await DB.updateCustomer(this.editId, data);
        App.showToast('Customer updated successfully!', 'success');
      } else {
        // Add new
        await DB.addCustomer(data);
        App.showToast('Customer added successfully!', 'success');
      }
      
      this.closeForm();
      await this.render();
    } catch (error) {
      console.error('Save error:', error);
      App.showToast('Error saving customer', 'error');
    }
  },

  // =====================================================
  // CRUD Operations
  // =====================================================

  edit(id) {
    this.openForm(id);
  },

  async delete(id) {
    const customer = await DB.getCustomer(id);
    if (!customer) return;
    
    App.confirm(
      `Are you sure you want to delete "${customer.name}"? This cannot be undone.`,
      async () => {
        await DB.deleteCustomer(id);
        App.showToast('Customer deleted', 'success');
        await this.render();
      }
    );
  },

  async toggleStatus(id) {
    const customer = await DB.getCustomer(id);
    if (!customer) return;
    
    const newStatus = customer.status === 'active' ? 'paused' : 'active';
    await DB.updateCustomer(id, { status: newStatus });
    App.showToast(`Customer ${newStatus === 'active' ? 'activated' : 'paused'}`, 'success');
    await this.render();
  },

  startNameVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      App.showToast('Voice input not supported', 'warning');
      return;
    }

    const btn = document.getElementById('custNameVoiceBtn');
    const originalIcon = btn.innerHTML;
    
    // Visual feedback: show red recording icon
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444"><circle cx="12" cy="12" r="10"/></svg>';
    btn.classList.add('listening');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true; // Enable real-time typing
    recognition.maxAlternatives = 1;

    try {
      recognition.start();
      App.showToast('Listening... Say name', 'info', 2000);
    } catch (e) {
      console.error(e);
      // Reset on error start
      btn.innerHTML = originalIcon;
      btn.classList.remove('listening');
    }

    recognition.onresult = (event) => {
      // Get the latest transcript segment
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      const input = document.getElementById('custName');
      if (input) {
        // Capitalize first letters of every word
        const formatted = transcript.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
        input.value = formatted;
        
        // Visual feedback for success
        input.style.borderColor = 'var(--primary)';
      }
    };
    
    recognition.onend = () => {
      // Reset button
      const btn = document.getElementById('custNameVoiceBtn');
      const input = document.getElementById('custName');
      
      if (input) {
         input.style.borderColor = 'var(--success)';
         setTimeout(() => input.style.borderColor = '', 1000);
      }

      if (btn) {
         btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        `;
        btn.classList.remove('listening');
      }
    };

    recognition.onerror = (event) => {
      console.error('Voice error:', event.error);
      if (event.error === 'not-allowed') {
        App.showToast('Microphone access denied', 'error');
      } else if (event.error === 'no-speech') {
        App.showToast('No speech detected. Try again.', 'warning');
      }
      
      // Reset button
      const btn = document.getElementById('custNameVoiceBtn');
      if (btn) {
         btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        `;
        btn.classList.remove('listening');
      }
    };
  }
};

// Make available globally
window.Customers = Customers;
