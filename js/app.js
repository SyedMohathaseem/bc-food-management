/**
 * Inas Cafe - Main Application
 * Handles navigation, toasts, modals, and page loading
 */

const App = {
  // Current page
  currentPage: 'dashboard',

  // =====================================================
  // Initialization
  // =====================================================

  init() {
    // Load demo data if empty
    DB.loadDemoData();
    
    // Setup navigation
    this.setupNavigation();
    
    // Setup global event listeners
    this.setupEventListeners();
    
    // Load initial page based on hash or default
    const hash = window.location.hash.slice(1) || 'dashboard';
    this.loadPage(hash);
  },

  // =====================================================
  // Navigation
  // =====================================================

  setupNavigation() {
    // Sidebar toggle (mobile)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');

    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const isActive = sidebar?.classList.contains('active');
        if (isActive) {
          this.closeSidebar();
        } else {
          this.openSidebar();
        }
      });
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => this.closeSidebar());
    }

    // Nav link clicks
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) {
          this.loadPage(page);
          this.closeSidebar();
        }
      });
    });
  },

  openSidebar() {
    document.getElementById('sidebar')?.classList.add('active');
    document.getElementById('sidebarOverlay')?.classList.add('active');
    document.getElementById('sidebarToggle').textContent = '✕';
    document.body.style.overflow = 'hidden';
  },

  closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('active');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
    document.getElementById('sidebarToggle').textContent = '☰';
    document.body.style.overflow = '';
  },

  loadPage(page) {
    this.currentPage = page;
    window.location.hash = page;

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    // Hide search bar on extras page
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) {
      searchContainer.style.display = page === 'extras' ? 'none' : 'block';
    }

    // Load page content (use pageContent to preserve search bar)
    const pageContent = document.getElementById('pageContent');
    if (!pageContent) return;

    // Show loading
    pageContent.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    // Simulate async load (for future server-side fetch)
    setTimeout(() => {
      this.renderPage(page);
    }, 100);
  },

  renderPage(page) {
    const pageContent = document.getElementById('pageContent');
    
    switch (page) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'customers':
        if (typeof Customers !== 'undefined') Customers.render();
        break;
      case 'menu':
        if (typeof Menu !== 'undefined') Menu.render();
        break;
      case 'extras':
        if (typeof Extras !== 'undefined') Extras.render();
        break;
      case 'invoice':
        if (typeof Invoice !== 'undefined') Invoice.render();
        break;
      case 'security':
        if (typeof Security !== 'undefined') Security.render();
        break;
      default:
        pageContent.innerHTML = '<div class="card"><p>Page not found</p></div>';
    }
  },

  // =====================================================
  // Dashboard
  // =====================================================

  renderDashboard() {
    const stats = DB.getStats();
    const pageContent = document.getElementById('pageContent');
    
    pageContent.innerHTML = `
      <h1 class="mb-6">📊 Dashboard</h1>
      
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card" onclick="App.loadPage('customers')" style="cursor: pointer;">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${stats.activeCustomers}</div>
          <div class="stat-label">Active Customers</div>
        </div>
        <div class="stat-card success" onclick="App.loadPage('menu')" style="cursor: pointer;">
          <div class="stat-icon">🍽️</div>
          <div class="stat-value">${stats.availableMenuItems}</div>
          <div class="stat-label">Menu Items</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">📝</div>
          <div class="stat-value">${stats.todayExtrasCount}</div>
          <div class="stat-label">Today's Extras</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-value">${stats.totalExtras}</div>
          <div class="stat-label">Total Entries</div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <h2 class="mb-4">⚡ Quick Actions</h2>
      <div class="quick-actions">
        <a href="#customers" class="quick-action-btn" data-page="customers" onclick="App.loadPage('customers'); return false;">
          <span class="quick-action-icon">➕</span>
          <span class="quick-action-label">Add Customer</span>
        </a>
        <a href="#extras" class="quick-action-btn" data-page="extras" onclick="App.loadPage('extras'); return false;">
          <span class="quick-action-icon">🍛</span>
          <span class="quick-action-label">Add Daily Extra</span>
        </a>
        <a href="#menu" class="quick-action-btn" data-page="menu" onclick="App.loadPage('menu'); return false;">
          <span class="quick-action-icon">📋</span>
          <span class="quick-action-label">Manage Menu</span>
        </a>
        <a href="#invoice" class="quick-action-btn" data-page="invoice" onclick="App.loadPage('invoice'); return false;">
          <span class="quick-action-icon">🧾</span>
          <span class="quick-action-label">Generate Invoice</span>
        </a>
      </div>
      
      <!-- Recent Activity -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📌 Today's Summary</h3>
        </div>
        <div id="todaySummary">
          ${this.renderTodaySummary()}
        </div>
      </div>
    `;
  },

  renderTodaySummary() {
    const today = new Date().toISOString().split('T')[0];
    const todayExtras = DB.getExtrasByDate(today);
    
    if (todayExtras.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p class="empty-state-title">No extras recorded today</p>
          <p class="empty-state-text">Start by adding today's extra items</p>
        </div>
      `;
    }
    
    // Group by customer
    const byCustomer = {};
    todayExtras.forEach(extra => {
      if (!byCustomer[extra.customerId]) {
        byCustomer[extra.customerId] = [];
      }
      byCustomer[extra.customerId].push(extra);
    });
    
    let html = '<ul class="list">';
    Object.keys(byCustomer).forEach(customerId => {
      const customer = DB.getCustomer(customerId);
      const extras = byCustomer[customerId];
      
      const mealsList = extras.map(e => {
        const menuItem = DB.getMenuItem(e.menuItemId);
        return `${e.mealType}: ${menuItem?.name || 'Item'} (₹${e.price})`;
      }).join(', ');
      
      html += `
        <li class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">${customer?.name || 'Unknown Customer'}</div>
            <div class="list-item-subtitle">${mealsList}</div>
          </div>
        </li>
      `;
    });
    html += '</ul>';
    
    return html;
  },

  // =====================================================
  // Event Listeners
  // =====================================================

  setupEventListeners() {
    // Hash change
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      if (hash !== this.currentPage) {
        this.loadPage(hash);
      }
    });

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  },

  // =====================================================
  // Modals
  // =====================================================

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  },

  // =====================================================
  // Toast Notifications
  // =====================================================

  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // =====================================================
  // Confirmation Dialog
  // =====================================================

  confirm(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">⚠️ Confirm</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="confirmCancel">Cancel</button>
          <button class="btn btn-danger" id="confirmOk">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#confirmCancel').onclick = () => {
      overlay.remove();
      if (onCancel) onCancel();
    };

    overlay.querySelector('#confirmOk').onclick = () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (onCancel) onCancel();
      }
    };
  },

  // =====================================================
  // Utility Functions
  // =====================================================

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  formatCurrency(amount) {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  },

  getCustomerDropdownOptions(selectedId = '') {
    const customers = DB.getActiveCustomers();
    return customers.map(c => 
      `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name} - ${c.mobile}</option>`
    ).join('');
  },

  getMenuDropdownOptions(category = '', selectedId = '') {
    let items = category ? DB.getMenuItemsByCategory(category) : DB.getAvailableMenuItems();
    return items.map(m => 
      `<option value="${m.id}" data-price="${m.price}" ${m.id === selectedId ? 'selected' : ''}>${m.name} - ₹${m.price}</option>`
    ).join('');
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Make App available globally
window.App = App;
