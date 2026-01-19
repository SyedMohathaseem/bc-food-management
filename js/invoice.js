/**
 * BC Food Subscription App - Invoice Generation Module
 * Generates monthly invoices with PDF and print support
 */

const Invoice = {
  // Current invoice data
  currentData: null,

  // =====================================================
  // Render
  // =====================================================

  render() {
    const pageContent = document.getElementById('pageContent');
    const customers = DB.getActiveCustomers();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    pageContent.innerHTML = `
      <h1 class="mb-6">🧾 Invoice Generation</h1>
      
      <!-- Invoice Filters -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📊 Generate Invoice</h3>
        </div>
        
        <form id="invoiceForm" onsubmit="Invoice.generate(event)">
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label required">Search Customer</label>
              ${CustomerSearch.create('invoiceCustomerSearch', null, 'Type name or mobile...')}
            </div>
            
            <div class="form-group">
              <label class="form-label required">Month</label>
              <select class="form-control form-select" id="invoiceMonth" required>
                ${this.getMonthOptions(currentMonth)}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Year</label>
              <select class="form-control form-select" id="invoiceYear" required>
                ${this.getYearOptions(currentYear)}
              </select>
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary btn-lg">
            📊 Generate Invoice
          </button>
        </form>
      </div>
      
      <!-- Invoice Preview -->
      <div id="invoicePreview" style="display: none;">
        <!-- Will be populated by generate() -->
      </div>
    `;
  },

  getMonthOptions(selectedMonth) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return months.map((name, index) => 
      `<option value="${index}" ${index === selectedMonth ? 'selected' : ''}>${name}</option>`
    ).join('');
  },

  getYearOptions(currentYear) {
    const years = [];
    for (let y = currentYear; y >= currentYear - 2; y--) {
      years.push(`<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`);
    }
    return years.join('');
  },

  // =====================================================
  // Generate Invoice
  // =====================================================

  generate(event) {
    event.preventDefault();
    
    const customerId = CustomerSearch.getValue('invoiceCustomerSearch');
    const month = parseInt(document.getElementById('invoiceMonth').value);
    const year = parseInt(document.getElementById('invoiceYear').value);
    
    if (!customerId) {
      App.showToast('Please select a customer', 'error');
      return;
    }
    
    // Generate invoice data
    const data = DB.generateInvoiceData(customerId, year, month);
    
    if (!data) {
      App.showToast('Unable to generate invoice', 'error');
      return;
    }
    
    this.currentData = data;
    this.renderPreview(data);
    
    App.showToast('Invoice generated!', 'success');
  },

  renderPreview(data) {
    const preview = document.getElementById('invoicePreview');
    preview.style.display = 'block';
    
    preview.innerHTML = `
      <!-- Action Buttons -->
      <div class="card no-print" style="position: sticky; top: 80px; z-index: 10;">
        <div style="display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center;">
          <button class="btn btn-primary btn-lg" onclick="Invoice.print()">
            🖨️ Print Invoice
          </button>
          <button class="btn btn-success btn-lg" onclick="Invoice.downloadPDF()">
            📥 Download PDF
          </button>
          <button class="btn btn-outline" onclick="Invoice.render()">
            🔄 New Invoice
          </button>
        </div>
      </div>
      
      <!-- Invoice Document -->
      <div class="invoice-container card" id="invoiceDocument">
        <!-- Header -->
        <div class="invoice-header">
          <div class="invoice-logo">🍛 BC FOOD SERVICES</div>
          <div class="invoice-title">Monthly Invoice - ${data.monthName} ${data.year}</div>
        </div>
        
        <!-- Customer Details -->
        <div class="invoice-customer">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);">
            <div>
              <strong>Customer:</strong> ${data.customer.name}
            </div>
            <div>
              <strong>Mobile:</strong> ${data.customer.mobile}
            </div>
            <div>
              <strong>Subscription:</strong> ${data.customer.subscriptionType} - ₹${data.customer.dailyAmount}/day
            </div>
            ${data.customer.address ? `<div><strong>Address:</strong> ${data.customer.address}</div>` : ''}
          </div>
        </div>
        
        <!-- Date-wise Table -->
        <div class="table-responsive" style="padding: var(--space-4);">
          <table class="invoice-table">
            <thead>
              <tr>
                <th style="width: 100px;">Date</th>
                <th>🌅 Breakfast</th>
                <th>☀️ Lunch</th>
                <th>🌙 Dinner</th>
              </tr>
            </thead>
            <tbody>
              ${data.dateWiseData.map(row => `
                <tr>
                  <td>${row.day}-${data.monthName.substring(0, 3)}</td>
                  <td>${row.breakfast}</td>
                  <td>${row.lunch}</td>
                  <td>${row.dinner}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Summary Section -->
        <div class="invoice-summary">
          <h3 style="margin-bottom: var(--space-4); text-align: center;">📊 INVOICE SUMMARY</h3>
          
          <div class="invoice-summary-row">
            <span>Daily Subscription:</span>
            <span>₹${data.summary.dailyAmount} × ${data.summary.daysInMonth} days = <strong>₹${data.summary.subscriptionTotal.toLocaleString('en-IN')}</strong></span>
          </div>
          
          <hr style="margin: var(--space-4) 0; border: none; border-top: 1px dashed var(--neutral-300);">
          
          <div class="invoice-summary-row">
            <span>🌅 Breakfast Extras Total:</span>
            <span>₹${data.summary.breakfastTotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="invoice-summary-row">
            <span>☀️ Lunch Extras Total:</span>
            <span>₹${data.summary.lunchTotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="invoice-summary-row">
            <span>🌙 Dinner Extras Total:</span>
            <span>₹${data.summary.dinnerTotal.toLocaleString('en-IN')}</span>
          </div>
          
          <div class="invoice-summary-row" style="background: var(--primary-light); padding: var(--space-3); border-radius: var(--radius-md); margin-top: var(--space-3);">
            <span><strong>EXTRAS GRAND TOTAL:</strong></span>
            <span><strong>₹${data.summary.extrasTotal.toLocaleString('en-IN')}</strong></span>
          </div>
          
          <div class="invoice-summary-row total" style="background: var(--neutral-900); color: var(--white); padding: var(--space-4); border-radius: var(--radius-md);">
            <span style="font-size: var(--font-size-lg);">💰 FINAL PAYABLE AMOUNT:</span>
            <span style="font-size: var(--font-size-2xl);">₹${data.summary.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: var(--space-4); color: var(--neutral-500); font-size: var(--font-size-sm);">
          Generated on ${new Date().toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
          <br>Thank you for your business! 🙏
        </div>
      </div>
    `;
    
    // Scroll to preview
    preview.scrollIntoView({ behavior: 'smooth' });
  },

  // =====================================================
  // Print & PDF
  // =====================================================

  print() {
    window.print();
  },

  async downloadPDF() {
    const invoiceElement = document.getElementById('invoiceDocument');
    
    if (!invoiceElement) {
      App.showToast('No invoice to download', 'error');
      return;
    }
    
    // Check if html2canvas and jsPDF are available
    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
      // Dynamically load libraries
      await this.loadPDFLibraries();
    }
    
    try {
      App.showToast('Generating PDF...', 'info');
      
      // Use html2canvas to capture the invoice
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF using jsPDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add pages if needed
      let heightLeft = imgHeight;
      let position = 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Generate filename
      const filename = `Invoice_${this.currentData.customer.name.replace(/\s+/g, '_')}_${this.currentData.monthName}_${this.currentData.year}.pdf`;
      
      pdf.save(filename);
      App.showToast('PDF downloaded!', 'success');
      
    } catch (error) {
      console.error('PDF generation error:', error);
      App.showToast('Error generating PDF. Try using Print instead.', 'error');
    }
  },

  async loadPDFLibraries() {
    return new Promise((resolve, reject) => {
      // Load html2canvas
      const html2canvasScript = document.createElement('script');
      html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.head.appendChild(html2canvasScript);
      
      // Load jsPDF
      const jspdfScript = document.createElement('script');
      jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(jspdfScript);
      
      // Wait for both to load
      let loaded = 0;
      const checkLoaded = () => {
        loaded++;
        if (loaded === 2) resolve();
      };
      
      html2canvasScript.onload = checkLoaded;
      jspdfScript.onload = checkLoaded;
      
      html2canvasScript.onerror = reject;
      jspdfScript.onerror = reject;
    });
  }
};

// Make available globally
window.Invoice = Invoice;
