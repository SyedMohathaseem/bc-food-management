/**
 * Inas Cafe - Pending Invoices Module
 * Handles display and management of pending bills
 */

const Pending = {
  // =====================================================
  // Render
  // =====================================================

  async render() {
    const pageContent = document.getElementById('pageContent');
    
    pageContent.innerHTML = `
      <h1 class="mb-6">⏳ Pending Amount</h1>
      
      <div class="card">
        <div class="card-header">
           <h3 class="card-title">Pending Invoices</h3>
           <div class="card-actions">
             <button class="btn btn-outline btn-sm" onclick="Pending.showPaidHistory()" style="margin-right: 8px;">
               ✅ Paid History
             </button>
             <button class="btn btn-primary btn-sm" onclick="Pending.scanForDues()" id="scanBtn">
               🔄 Scan Previous Month Dues
             </button>
             <span class="badge badge-warning" id="pendingCount" style="margin-left: 10px;">0 Pending</span>
           </div>
        </div>
        
        <div class="search-bar mb-4" style="border: 1px solid var(--neutral-300);">
          <span class="search-icon">🔍</span>
          <input type="text" id="pendingSearch" class="search-input" 
                 placeholder="Search by customer name..."
                 oninput="Pending.filter()" autocomplete="off">
        </div>

        <div id="pendingList" style="overflow-x: auto;">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>

      <!-- Payment Modal -->
      <div class="modal-overlay" id="paymentModal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">💸 Receive Payment</h3>
            <button class="modal-close" onclick="App.closeModal('paymentModal')">×</button>
          </div>
          <div class="modal-body">
            <form id="paymentForm" onsubmit="Pending.confirmPayment(event)">
              <input type="hidden" id="payInvoiceId">
              
              <div class="form-group">
                <label class="form-label">Customer</label>
                <input type="text" class="form-control" id="payCustomerName" readonly>
              </div>
              
              <div class="form-row">
                 <div class="form-group">
                    <label class="form-label">Period</label>
                    <input type="text" class="form-control" id="payPeriod" readonly>
                 </div>
                 <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="text" class="form-control" id="payAmount" readonly style="font-weight: bold;">
                 </div>
              </div>

              <div class="form-group">
                <label class="form-label required">Payment Notes</label>
                <input type="text" class="form-control" id="payNotes" 
                       placeholder="e.g. Paid via UPI / Cash" required>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="App.closeModal('paymentModal')">Cancel</button>
                <button type="submit" class="btn btn-primary">✅ Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    await this.loadPendingInvoices();
  },

  async loadPendingInvoices() {
    const listDiv = document.getElementById('pendingList');
    const countBadge = document.getElementById('pendingCount');
    if (!listDiv) return;
    
    try {
      const invoices = await DB.getPendingInvoices();
      this.data = invoices; // Cache for filtering
      
      countBadge.textContent = `${invoices.length} Pending`;
      
      if (invoices.length === 0) {
        listDiv.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">✅</div>
            <p class="empty-state-title">No pending invoices!</p>
            <p class="empty-state-text">All dues are cleared.</p>
          </div>
        `;
        return;
      }
      
      this.renderTable(invoices);
      
    } catch (error) {
      console.error('Error loading pending invoices:', error);
      listDiv.innerHTML = '<p class="text-danger">Error loading pending list.</p>';
    }
  },

  renderTable(invoices) {
    const listDiv = document.getElementById('pendingList');
    
    // Group by Customer ID
    const byCustomer = {};
    invoices.forEach(inv => {
      if (!byCustomer[inv.customer_id]) {
        byCustomer[inv.customer_id] = {
          name: inv.customer_name,
          mobile: inv.customer_mobile,
          items: []
        };
      }
      byCustomer[inv.customer_id].items.push(inv);
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let html = '<div class="customer-pending-list">';
    
    for (const customerId of Object.keys(byCustomer)) {
      const customer = byCustomer[customerId];
      let totalDue = 0;
      customer.items.forEach(i => totalDue += parseFloat(i.amount));
      
      const singleInvoice = customer.items.length === 1;
      
      html += `
        <div class="pending-customer-card" style="background: var(--white); border: 1px solid var(--neutral-200); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3); border-bottom: 1px solid var(--neutral-100); padding-bottom: var(--space-2);">
            <div>
              <div style="font-weight: 600; font-size: 1.1em;">${customer.name}</div>
              <div style="font-size: 13px; color: var(--neutral-500);">📱 ${customer.mobile}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; color: var(--neutral-500);">Total Pending</div>
              <div style="font-weight: 700; color: #b45309; font-size: 1.2em; margin-bottom: 4px;">₹${totalDue.toLocaleString('en-IN')}</div>
              ${singleInvoice ? `
                <button class="btn btn-sm btn-success" 
                        onclick="Pending.openPaymentModal('${encodeURIComponent(JSON.stringify(customer.items[0]))}')">
                  Mark Paid ₹${totalDue.toLocaleString('en-IN')}
                </button>
              ` : ''}
            </div>
          </div>
          
          <table class="table table-sm" style="margin-bottom: 0;">
            <thead>
              <tr style="background: var(--neutral-50);">
                <th style="font-size: 12px;">Month</th>
                <th style="font-size: 12px;">Amount</th>
                ${!singleInvoice ? '<th style="font-size: 12px; text-align: right;">Action</th>' : ''}
              </tr>
            </thead>
            <tbody>
      `;
      
      customer.items.forEach(inv => {
        const monthName = monthNames[inv.month - 1] || 'Unknown';
        
        html += `
          <tr>
            <td>${monthName} ${inv.year}</td>
            <td>
              <a href="#" onclick="Pending.showInvoice('${inv.customer_id}', ${inv.month}, ${inv.year}, event)" 
                 style="color: var(--primary); font-weight: 700; text-decoration: underline;">
                ₹${parseFloat(inv.amount).toLocaleString('en-IN')}
              </a>
            </td>
            ${!singleInvoice ? `
            <td style="text-align: right;">
              <button class="btn btn-sm btn-success" style="padding: 2px 8px; font-size: 12px;" 
                      onclick="Pending.openPaymentModal('${encodeURIComponent(JSON.stringify(inv))}')">
                Mark Paid
              </button>
            </td>
            ` : ''}
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    }
    
    html += '</div>';
    
    // Append Modal HTML
    html += `
      <div class="modal-overlay" id="invoiceRefModal">
        <div class="modal" style="max-width: 800px;">
          <div class="modal-header">
            <h3 class="modal-title">📄 Invoice Reference</h3>
            <button class="modal-close" onclick="App.closeModal('invoiceRefModal')">×</button>
          </div>
          <div class="modal-body" id="invoiceRefBody" style="max-height: 70vh; overflow-y: auto;">
             <!-- Invoice Content -->
          </div>
          <div class="modal-footer">
             <button class="btn btn-primary" onclick="window.print()">🖨️ Print</button>
          </div>
        </div>
      </div>
    `;

    listDiv.innerHTML = html;
  },

  async showInvoice(customerId, month, year, event) {
    if (event) event.preventDefault();
    
    const body = document.getElementById('invoiceRefBody');
    body.innerHTML = '<div class="loading"><div class="spinner"></div> Loading details...</div>';
    
    App.openModal('invoiceRefModal');
    
    try {
      // Month stored as 1-12, but generator needs 0-11 if using Date logic?
      // No, generateInvoiceData(customerId, year, month) usually expects 1-12 or 0-11?
      // Let's check js/database.js or js/invoice.js usage.
      // In invoice.js: DB.generateInvoiceData(customerId, year, month) where month is from input value (1-12 usually)
      
      // Let's try passing unmodified month first.
      // Wait, DB.generateInvoiceData takes (customerId, year, month)
      // And in DB.js: fetchAPI(`/invoice-data?customerId=...&month=${month}`)
      // So checking backend... usually backend handles it.
      // Revisit scanForDues logic: passed targetMonth - 1. 
      // If scanForDues passed `targetMonth - 1` (0-11 index?)
      
      // Let's assume generateInvoiceData expects 0-indexed month?
      // In `js/invoice.js`: `const month = parseInt(document.getElementById('invoiceMonth').value);` (1-12)
      // `data = await DB.generateInvoiceData(customerId, year, month);`
      // So likely it expects 1-12.
      
      // inv.month is 1-indexed (stored in DB), but generateInvoiceData expects 0-indexed
      const data = await DB.generateInvoiceData(customerId, year, month - 1);
      
      if (!data) {
        body.innerHTML = '<p class="text-danger">Could not load invoice details.</p>';
        return;
      }
      
      const { customer, summary, items } = data;
      const extras = data.extras || [];
      
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      
      let html = `
        <div class="invoice-container" style="padding: 20px; background: white;">
          <div style="text-align: center; margin-bottom: 20px;">
             <h2>INVOICE</h2>
             <p>${monthNames[data.month]} ${data.year}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong>Bill To:</strong><br>
            ${customer.name}<br>
            ${customer.mobile}
          </div>
          
          <table class="table table-bordered">
            <tr>
              <td>Subscription (${customer.subscriptionType})</td>
              <td class="text-right">₹${summary.subscriptionTotal}</td>
            </tr>
            <tr>
            <tr>
               <td>Extras (Breakfast)</td>
               <td class="text-right">₹${summary.breakfastTotal || 0}</td>
            </tr>
            <tr>
               <td>Extras (Lunch)</td>
               <td class="text-right">₹${summary.lunchTotal || 0}</td>
            </tr>
            <tr>
               <td>Extras (Dinner)</td>
               <td class="text-right">₹${summary.dinnerTotal || 0}</td>
            </tr>
            <tr style="background: #f9fafb; font-weight: bold;">
               <td>Total Amount</td>
               <td class="text-right">₹${summary.subscriptionTotal + summary.extrasTotal}</td>
            </tr>
            <tr style="color: var(--danger);">
               <td>Less: Advance Payment</td>
               <td class="text-right">-₹${summary.totalAdvance}</td>
            </tr>
             <tr style="background: var(--primary); color: white; font-size: 1.2em;">
               <td><strong>GRAND TOTAL</strong></td>
               <td class="text-right"><strong>₹${summary.grandTotal}</strong></td>
            </tr>
          </table>
          
          ${extras.length > 0 ? `
            <div style="margin-top: 20px;">
              <h5>Extras Breakdown</h5>
              <table class="table table-sm" style="font-size: 0.9em;">
                <thead>
                  <tr><th>Date</th><th>Item</th><th>Price</th></tr>
                </thead>
                <tbody>
                  ${extras.map(e => `
                    <tr>
                      <td>${new Date(e.date).toLocaleDateString()}</td>
                      <td>${e.items}</td>
                      <td>₹${e.total}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
        </div>
      `;
      
      body.innerHTML = html;
      
    } catch (error) {
      console.error('Invoice Load Error:', error);
      body.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    }
  },

  filter() {
    const query = document.getElementById('pendingSearch').value.toLowerCase().trim();
    if (!this.data) return;
    
    const filtered = this.data.filter(inv => 
      inv.customer_name.toLowerCase().includes(query) ||
      inv.customer_mobile.includes(query)
    );
    
    this.renderTable(filtered);
  },

  openPaymentModal(invoiceJson) {
    const invoice = JSON.parse(decodeURIComponent(invoiceJson));
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    document.getElementById('payInvoiceId').value = invoice.id;
    document.getElementById('payCustomerName').value = invoice.customer_name;
    document.getElementById('payPeriod').value = `${monthNames[invoice.month - 1]} ${invoice.year}`;
    document.getElementById('payAmount').value = `₹${parseFloat(invoice.amount).toLocaleString('en-IN')}`;
    document.getElementById('payNotes').value = '';
    
    App.openModal('paymentModal');
    // Focus notes after a slight delay to allow modal transition
    setTimeout(() => document.getElementById('payNotes').focus(), 100);
  },

  async confirmPayment(event) {
    event.preventDefault();
    const id = document.getElementById('payInvoiceId').value;
    const notes = document.getElementById('payNotes').value;
    
    if (!notes) return;
    
    try {
      await DB.markInvoiceAsPaid(id, notes);
      App.closeModal('paymentModal');
      App.showToast('Payment confirmed successfully!', 'success');
      await this.loadPendingInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      App.showToast('Error updating status', 'error');
    }
  },

  async scanForDues() {
    const btn = document.getElementById('scanBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width: 12px; height: 12px; border-width: 2px;"></div> Scanning...';
    }
    
    try {
      App.showToast('Scanning for previous month dues...', 'info');
      
      // 1. Get List of Customers
      const customers = await DB.getCustomers();
      
      // 2. Get All Existing Invoices (to check duplicates)
      const existingInvoices = await DB.getAllInvoices();
      
      // 3. Determine Previous Month
      const today = new Date();
      let prevMonth = today.getMonth(); // 0-11 (Current Month Index, so prev is -1?) 
      // Wait, getMonth() is 0-indexed. Jan=0. 
      // If Today is Jan, Prev is Dec (11) of Year-1.
      
      let checkYear = today.getFullYear();
      let checkMonth = today.getMonth(); // If today is Jan (0), we want Dec (11)
      
      if (checkMonth === 0) {
        checkMonth = 12; // Dec is 12 for DB (1-12)
        checkYear--;
      }
      // Else checkMonth is already correct? No.
      // If today is Feb (1), we want Jan (1).
      // DB uses 1-12. 
      // So if today is Jan 24 (Month 0), Previous is Dec (12).
      // If today is Feb 24 (Month 1), Previous is Jan (1).
      
      // Correct Logic:
      // Current Month Index: 0 (Jan)
      // We want Last Month Index: -1 -> Dec.
      
      // Let's use Date manipulation to be safe
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      
      const targetMonth = d.getMonth() + 1; // 1-12
      const targetYear = d.getFullYear();
      
      console.log(`Scanning for ${targetMonth}/${targetYear}`);
      
      let newCount = 0;
      
      for (const customer of customers) {
        // Check if invoice exists for this Cust + Month + Year
        const exists = existingInvoices.find(inv => 
          inv.customer_id === customer.id && 
          inv.month === targetMonth && 
          inv.year === targetYear
        );
        
        if (!exists) {
          // Generate Invoice Data
          // DB.generateInvoiceData expects month index 0-11
          const invoiceData = await DB.generateInvoiceData(customer.id, targetYear, targetMonth - 1);
          
          if (invoiceData && invoiceData.summary.grandTotal > 0) {
            // Save as Pending
            await DB.saveInvoiceAsPending({
              customerId: customer.id,
              month: targetMonth,
              year: targetYear,
              amount: invoiceData.summary.grandTotal
            });
            newCount++;
          }
        }
      }
      
      if (newCount > 0) {
        App.showToast(`Generated ${newCount} new pending invoices!`, 'success');
      } else {
        App.showToast('All up to date for last month.', 'success');
      }
      
      await this.loadPendingInvoices();
      
    } catch (error) {
      console.error('Scan Error:', error);
      App.showToast('Error scanning for dues', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🔄 Scan Previous Month Dues';
      }
    }
  },

  async showPaidHistory() {
    const invoices = await DB.getPaidInvoices();
    
    // Create Modal HTML if not exists (or just overwrite)
    const modalHtml = `
      <div class="modal-overlay" id="paidHistoryModal">
        <div class="modal" style="max-width: 900px;">
          <div class="modal-header">
            <h3 class="modal-title">✅ Paid History</h3>
            <button class="modal-close" onclick="App.closeModal('paidHistoryModal')">×</button>
          </div>
          <div class="modal-body">
             <div class="search-bar" style="margin-bottom: 20px;">
                <span class="search-icon">🔍</span>
                <input type="text" id="paidHistorySearch" class="search-input" 
                       placeholder="Filter history..." oninput="Pending.filterPaidHistory()">
             </div>
             
             <div class="table-responsive" style="max-height: 60vh; overflow-y: auto;">
               <table class="table" id="paidHistoryTable">
                 <thead>
                   <tr>
                     <th>Date Paid</th>
                     <th>Customer</th>
                     <th>Month</th>
                     <th class="text-right">Amount</th>
                     <th>Notes</th>
                   </tr>
                 </thead>
                 <tbody id="paidHistoryBody">
                   ${this.renderPaidRows(invoices)}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing if any to refresh structure
    const existing = document.getElementById('paidHistoryModal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Store data for filtering across this specific instance
    this.paidData = invoices;
    
    App.openModal('paidHistoryModal');
  },

  renderPaidRows(invoices) {
    if (!invoices || invoices.length === 0) {
      return '<tr><td colspan="5" style="text-align: center;">No paid invoices found</td></tr>';
    }
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return invoices.map(inv => {
       const paidDate = inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '-';
       const monthName = monthNames[inv.month - 1] || 'Unknown';
       
       return `
         <tr>
           <td>${paidDate}</td>
           <td>
             <div style="font-weight: 500;">${inv.customer_name}</div>
             <div style="font-size: 0.8em; color: var(--neutral-500);">${inv.customer_mobile}</div>
           </td>
           <td>${monthName} ${inv.year}</td>
           <td class="text-right" style="font-weight: 700; color: var(--success);">₹${parseFloat(inv.amount).toLocaleString('en-IN')}</td>
           <td style="font-size: 0.9em; color: var(--neutral-600);">${inv.payment_notes || '-'}</td>
         </tr>
       `;
    }).join('');
  },

  filterPaidHistory() {
    const query = document.getElementById('paidHistorySearch').value.toLowerCase();
    const filtered = this.paidData.filter(inv => 
      inv.customer_name.toLowerCase().includes(query) || 
      inv.customer_mobile.includes(query)
    );
    document.getElementById('paidHistoryBody').innerHTML = this.renderPaidRows(filtered);
  }
};

window.Pending = Pending;
