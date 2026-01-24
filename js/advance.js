/**
 * Inas Cafe - Advance Payment Module
 * Handles advance payment entries and history
 */

const Advance = {
  // =====================================================
  // Render
  // =====================================================

  async render() {
    const pageContent = document.getElementById('pageContent');
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    pageContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
        <h1>💰 Advance Payments</h1>
        <button class="btn btn-outline" onclick="Advance.showHistory()">
          📜 Show All Payments
        </button>
      </div>
      
      <!-- Entry Form -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">➕ Add Advance Payment</h3>
        </div>
        
        <form id="advanceForm" onsubmit="Advance.save(event)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Search Customer</label>
              ${CustomerSearch.create('advanceCustomerSearch', null, 'Type name or mobile...', false)}
            </div>
            
            <div class="form-group">
               <label class="form-label required">Date of Payment</label>
               <input type="date" class="form-control" id="advanceDate" value="${today}" required>
            </div>
          </div>
          
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label required">Period (Month & Year)</label>
              <input type="month" class="form-control" id="advancePeriod" 
                     value="${currentYear}-${String(currentMonth).padStart(2, '0')}" required>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Amount (₹)</label>
              <input type="number" class="form-control" id="advanceAmount" 
                     placeholder="0" min="0" step="5" required>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Notes (optional)</label>
            <input type="text" class="form-control" id="advanceNotes" 
                   placeholder="e.g. Paid via UPI">
          </div>
          
          <button type="submit" class="btn btn-primary btn-lg btn-block">
            💾 Save Payment
          </button>
        </form>
      </div>
      
      <!-- Payment History Modal -->
      <div class="modal-overlay" id="historyModal">
        <div class="modal" style="max-width: 800px; max-height: 90vh; display: flex; flex-direction: column;">
          <div class="modal-header">
            <h3 class="modal-title">Payment History</h3>
            <button class="modal-close" onclick="App.closeModal('historyModal')">×</button>
          </div>
          <div class="modal-body" style="padding: 0; display: flex; flex-direction: column; overflow: hidden;">
            <div style="padding: var(--space-4); border-bottom: 1px solid var(--neutral-200);">
               <div class="search-bar" style="border: 1px solid var(--neutral-300);">
                  <span class="search-icon">🔍</span>
                  <input type="text" id="historySearch" class="search-input" 
                         placeholder="Search by customer name..."
                         oninput="Advance.filterHistory()" autocomplete="off">
               </div>
            </div>
            <div id="advanceList" style="flex: 1; overflow-y: auto; padding: var(--space-4);">
               <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  showHistory() {
    App.openModal('historyModal');
    this.loadPayments();
  },

  async loadPayments() {
    const listDiv = document.getElementById('advanceList');
    if (!listDiv) return;
    
    try {
      const payments = await DB.getAdvancePayments();
      
      if (payments.length === 0) {
        listDiv.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">💰</div>
            <p class="empty-state-title">No advance payments recorded</p>
          </div>
        `;
        return;
      }
      
      let html = '<ul class="list">';
      
      payments.forEach(p => {
        const monthName = new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long' });
        
        html += `
          <li class="list-item">
            <div class="list-item-content">
              <div class="list-item-title">${p.customer_name}</div>
              <div class="list-item-subtitle">
                For ${monthName} ${p.year} • Paid on ${App.formatDate(p.date)}
                ${p.notes ? `• <span class="text-muted">${p.notes}</span>` : ''}
              </div>
            </div>
            <div class="list-item-amount">
              <span class="amount-badge">₹${parseFloat(p.amount).toLocaleString('en-IN')}</span>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-sm btn-danger" onclick="Advance.delete('${p.id}')" title="Delete">
                🗑️
              </button>
            </div>
          </li>
        `;
      });
      
      html += '</ul>';
      listDiv.innerHTML = html;
      
    } catch (error) {
      console.error('Error loading payments:', error);
      listDiv.innerHTML = '<p class="text-danger">Error loading payments.</p>';
    }
  },

  filterHistory() {
    const query = document.getElementById('historySearch').value.toLowerCase().trim();
    const list = document.getElementById('advanceList');
    if (!list) return;
    
    const items = list.querySelectorAll('li');
    items.forEach(item => {
      // Search in title (customer name) and subtitle
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? '' : 'none';
    });
  },

  async save(event) {
    event.preventDefault();
    
    const customerId = CustomerSearch.getValue('advanceCustomerSearch');
    const period = document.getElementById('advancePeriod').value; // YYYY-MM
    const amount = parseFloat(document.getElementById('advanceAmount').value);
    const date = document.getElementById('advanceDate').value;
    const notes = document.getElementById('advanceNotes').value.trim();
    
    if (!customerId || !period || !amount || !date) {
      App.showToast('Please fill in all required fields', 'error');
      return;
    }
    
    // Parse Year and Month
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr); // 1-12, matches what DB expects
    
    if (amount <= 0) {
      App.showToast('Amount must be greater than 0', 'error');
      return;
    }
    
    try {
      await DB.addAdvancePayment({
        customerId,
        month,
        year,
        amount,
        date,
        notes
      });
      
      App.showToast('Advance payment saved!', 'success');
      
      // Reset form (keep date)
      document.getElementById('advanceAmount').value = '';
      document.getElementById('advanceNotes').value = '';
      CustomerSearch.clear('advanceCustomerSearch');
      
      await this.loadPayments();
      
    } catch (error) {
      console.error('Save error:', error);
      App.showToast('Error saving payment', 'error');
    }
  },

  async delete(id) {
    App.confirm(
      'Are you sure you want to delete this payment record?',
      async () => {
        try {
          await DB.deleteAdvancePayment(id);
          App.showToast('Payment deleted', 'success');
          await this.loadPayments();
        } catch (error) {
          console.error('Delete error:', error);
          App.showToast('Error deleting payment', 'error');
        }
      }
    );
  }
};

window.Advance = Advance;
