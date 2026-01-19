/**
 * BC Food Subscription App - Customer Management Module
 * Handles customer CRUD operations
 */

const Customers = {
  // Current edit ID (null = add mode)
  editId: null,

  // =====================================================
  // Render
  // =====================================================

  render() {
    const pageContent = document.getElementById('pageContent');
    const customers = DB.getCustomers();
    
    pageContent.innerHTML = `
      <div class="card-header" style="background: none; padding: 0; border: none; margin-bottom: var(--space-6);">
        <h1>👥 Customers</h1>
        <button class="btn btn-primary" onclick="Customers.openForm()">
          ➕ Add Customer
        </button>
      </div>
      
      <!-- Customer List -->
      <div class="card">
        ${customers.length === 0 ? this.renderEmpty() : this.renderList(customers)}
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
                <input type="text" class="form-control" id="custName" 
                       placeholder="Enter full name" required>
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
      
      html += `
        <li class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">${c.name}</div>
            <div class="list-item-subtitle">
              📱 ${c.mobile} • ₹${c.dailyAmount}/day • ${c.subscriptionType}
            </div>
          </div>
          <span class="badge badge-${statusClass}">${statusLabel}</span>
          <div class="list-item-actions">
            <button class="btn btn-sm btn-outline" onclick="Customers.edit('${c.id}')" title="Edit">
              ✏️
            </button>
            <button class="btn btn-sm btn-danger" onclick="Customers.delete('${c.id}')" title="Delete">
              🗑️
            </button>
          </div>
        </li>
      `;
    });
    
    html += '</ul>';
    return html;
  },

  // =====================================================
  // Form Operations
  // =====================================================

  openForm(customerId = null) {
    this.editId = customerId;
    const modal = document.getElementById('customerModal');
    const title = document.getElementById('customerModalTitle');
    const form = document.getElementById('customerForm');
    
    form.reset();
    
    if (customerId) {
      // Edit mode
      const customer = DB.getCustomer(customerId);
      if (!customer) {
        App.showToast('Customer not found', 'error');
        return;
      }
      
      title.textContent = 'Edit Customer';
      document.getElementById('custName').value = customer.name;
      document.getElementById('custMobile').value = customer.mobile;
      document.getElementById('custAddress').value = customer.address || '';
      document.getElementById('custSubType').value = customer.subscriptionType;
      document.getElementById('custAmount').value = customer.dailyAmount;
      document.getElementById('custStartDate').value = customer.startDate;
      document.getElementById('custStatus').value = customer.status;
    } else {
      // Add mode
      title.textContent = 'Add Customer';
      document.getElementById('custStartDate').value = new Date().toISOString().split('T')[0];
    }
    
    App.openModal('customerModal');
  },

  closeForm() {
    this.editId = null;
    App.closeModal('customerModal');
  },

  save(event) {
    event.preventDefault();
    
    const data = {
      name: document.getElementById('custName').value.trim(),
      mobile: document.getElementById('custMobile').value.trim(),
      address: document.getElementById('custAddress').value.trim(),
      subscriptionType: document.getElementById('custSubType').value,
      dailyAmount: parseFloat(document.getElementById('custAmount').value),
      startDate: document.getElementById('custStartDate').value,
      status: document.getElementById('custStatus').value
    };
    
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
        DB.updateCustomer(this.editId, data);
        App.showToast('Customer updated successfully!', 'success');
      } else {
        // Add new
        DB.addCustomer(data);
        App.showToast('Customer added successfully!', 'success');
      }
      
      this.closeForm();
      this.render();
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

  delete(id) {
    const customer = DB.getCustomer(id);
    if (!customer) return;
    
    App.confirm(
      `Are you sure you want to delete "${customer.name}"? This cannot be undone.`,
      () => {
        DB.deleteCustomer(id);
        App.showToast('Customer deleted', 'success');
        this.render();
      }
    );
  },

  toggleStatus(id) {
    const customer = DB.getCustomer(id);
    if (!customer) return;
    
    const newStatus = customer.status === 'active' ? 'paused' : 'active';
    DB.updateCustomer(id, { status: newStatus });
    App.showToast(`Customer ${newStatus === 'active' ? 'activated' : 'paused'}`, 'success');
    this.render();
  }
};

// Make available globally
window.Customers = Customers;
