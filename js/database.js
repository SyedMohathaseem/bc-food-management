/**
 * Inas Cafe - Database Layer
 * LocalStorage-based data persistence
 */

const DB = {
  // API endpoint - Automatically switches between local and production
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname
    ? 'http://localhost:5000/api' 
    : '/api', // Use relative path for production (assuming Netlify proxy or same domain)

  // =====================================================
  // API Helpers
  // =====================================================

  async fetchAPI(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  },

  // =====================================================
  // Customer Operations
  // =====================================================

  async getCustomers() {
    return this.fetchAPI('/customers');
  },

  async getActiveCustomers() {
    const customers = await this.getCustomers();
    return customers.filter(c => c.status === 'active');
  },

  async getCustomer(id) {
    return this.fetchAPI(`/customers/${id}`);
  },

  async addCustomer(customer) {
    return this.fetchAPI('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: customer.name,
        mobile: customer.mobile,
        address: customer.address || '',
        subscriptionType: customer.subscriptionType || 'daily',
        dailyAmount: parseFloat(customer.dailyAmount) || 300,
        mealTimes: customer.mealTimes || ['breakfast', 'lunch', 'dinner'],
        advanceAmount: parseFloat(customer.advanceAmount) || 0,
        referral: customer.referral || '',
        startDate: customer.startDate || new Date().toISOString().split('T')[0],
        status: customer.status || 'active'
      })
    });
  },

  async updateCustomer(id, updates) {
    return this.fetchAPI(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteCustomer(id) {
    return this.fetchAPI(`/customers/${id}`, {
      method: 'DELETE'
    });
  },

  // =====================================================
  // Menu Item Operations
  // =====================================================

  async getMenuItems() {
    return this.fetchAPI('/menu');
  },

  async getAvailableMenuItems() {
    const items = await this.getMenuItems();
    return items.filter(m => m.available);
  },

  async getMenuItemsByCategory(category) {
    const items = await this.getAvailableMenuItems();
    return items.filter(m => m.category === category);
  },

  async getMenuItem(id) {
    const items = await this.getMenuItems();
    return items.find(m => m.id === id) || null;
  },

  async addMenuItem(menuItem) {
    return this.fetchAPI('/menu', {
      method: 'POST',
      body: JSON.stringify({
        name: menuItem.name,
        category: menuItem.category,
        price: parseFloat(menuItem.price) || 0,
        description: menuItem.description || '',
        available: menuItem.available !== false
      })
    });
  },

  async updateMenuItem(id, updates) {
    return this.fetchAPI(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteMenuItem(id) {
    return this.fetchAPI(`/menu/${id}`, {
      method: 'DELETE'
    });
  },

  // =====================================================
  // Daily Extras Operations
  // =====================================================

  async getDailyExtras() {
    return this.fetchAPI('/extras');
  },

  async getExtrasByCustomer(customerId) {
    const extras = await this.getDailyExtras();
    return extras.filter(e => e.customerId === customerId);
  },

  async getExtrasByDate(date) {
    return this.fetchAPI(`/extras/date/${date}`);
  },

  async getExtrasByCustomerAndMonth(customerId, year, month) {
    const extras = await this.getExtrasByCustomer(customerId);
    return extras.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  },

  async getExtras(customerId, date, mealType) {
    const extras = await this.getExtrasByDate(date);
    return extras.filter(e => e.customerId === customerId && e.mealType === mealType);
  },

  async addDailyExtra(extra) {
    return this.fetchAPI('/extras', {
      method: 'POST',
      body: JSON.stringify(extra)
    });
  },

  async deleteDailyExtra(id) {
    return this.fetchAPI(`/extras/${id}`, {
      method: 'DELETE'
    });
  },

  async deleteExtraByDetails(customerId, date, mealType = null) {
    return this.fetchAPI('/extras/delete-by-details', {
      method: 'POST',
      body: JSON.stringify({ customerId, date, mealType })
    });
  },

  // =====================================================
  // Invoice Generation Helpers
  // =====================================================

  async generateInvoiceData(customerId, year, month) {
    const customer = await this.getCustomer(customerId);
    if (!customer) return null;

    const extras = await this.getExtrasByCustomerAndMonth(customerId, year, month);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dateWiseData = [];
    let breakfastTotal = 0;
    let lunchTotal = 0;
    let dinnerTotal = 0;
    
    const menuItems = await this.getMenuItems();
    const findMenuItem = (id) => menuItems.find(m => m.id === id);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Helper to match dates ignoring time
      const matchDate = (extraDate) => {
        const d = new Date(extraDate);
        const dStr = d.toISOString().split('T')[0];
        return dStr === dateStr;
      };

      const dayBreakfasts = extras.filter(e => matchDate(e.date) && e.mealType === 'breakfast');
      const dayLunches = extras.filter(e => matchDate(e.date) && e.mealType === 'lunch');
      const dayDinners = extras.filter(e => matchDate(e.date) && e.mealType === 'dinner');
      
      dayBreakfasts.forEach(e => breakfastTotal += parseFloat(e.price));
      dayLunches.forEach(e => lunchTotal += parseFloat(e.price));
      dayDinners.forEach(e => dinnerTotal += parseFloat(e.price));
      
      dateWiseData.push({
        date: dateStr,
        day,
        breakfast: dayBreakfasts.length > 0 ? dayBreakfasts.map(e => this.formatExtraDisplay(e, findMenuItem(e.menuItemId))).join('<br>') : '-',
        lunch: dayLunches.length > 0 ? dayLunches.map(e => this.formatExtraDisplay(e, findMenuItem(e.menuItemId))).join('<br>') : '-',
        dinner: dayDinners.length > 0 ? dayDinners.map(e => this.formatExtraDisplay(e, findMenuItem(e.menuItemId))).join('<br>') : '-'
      });
    }

    let subscriptionTotal = customer.subscriptionType === 'monthly' ? parseFloat(customer.dailyAmount) : parseFloat(customer.dailyAmount) * daysInMonth;
    const extrasTotal = breakfastTotal + lunchTotal + dinnerTotal;
    const grandTotal = subscriptionTotal + extrasTotal;

    return {
      customer,
      month,
      year,
      periodType: 'monthly',
      monthName: new Date(year, month).toLocaleString('default', { month: 'long' }),
      dateWiseData,
      summary: {
        daysInMonth,
        dailyAmount: customer.dailyAmount,
        subscriptionTotal,
        breakfastTotal,
        lunchTotal,
        dinnerTotal,
        extrasTotal,
        grandTotal
      }
    };
  },

  async generateDailyInvoiceData(customerId, date) {
    const customer = await this.getCustomer(customerId);
    if (!customer) return null;

    const extras = await this.getExtrasByDate(date);
    const customerExtras = extras.filter(e => e.customerId === customerId);
    
    const menuItems = await this.getMenuItems();
    const findMenuItem = (id) => menuItems.find(m => m.id === id);

    let breakfastTotal = 0, lunchTotal = 0, dinnerTotal = 0;
    customerExtras.forEach(e => {
      if (e.mealType === 'breakfast') breakfastTotal += parseFloat(e.price);
      if (e.mealType === 'lunch') lunchTotal += parseFloat(e.price);
      if (e.mealType === 'dinner') dinnerTotal += parseFloat(e.price);
    });

    const subscriptionTotal = customer.subscriptionType === 'monthly' ? 0 : parseFloat(customer.dailyAmount);
    const extrasTotal = breakfastTotal + lunchTotal + dinnerTotal;
    const grandTotal = subscriptionTotal + extrasTotal;

    const dateObj = new Date(date);

    return {
      customer,
      date,
      periodType: 'daily',
      monthName: dateObj.toLocaleString('default', { month: 'long' }),
      year: dateObj.getFullYear(),
      day: dateObj.getDate(),
      dateWiseData: [{
        date,
        day: dateObj.getDate(),
        breakfast: customerExtras.filter(e => e.mealType === 'breakfast').map(e => this.formatExtraDisplay(e, findMenuItem(e.menuItemId))).join('<br>') || '-',
        lunch: customerExtras.filter(e => e.mealType === 'lunch').map(e => this.formatExtraDisplay(e, findMenuItem(e.menuItemId))).join('<br>') || '-',
        dinner: customerExtras.filter(e => e.mealType === 'dinner').map(e => this.formatExtraDisplay(e, findMenuItem(e.menuItemId))).join('<br>') || '-'
      }],
      summary: {
        daysInMonth: 1,
        dailyAmount: customer.dailyAmount,
        subscriptionTotal,
        breakfastTotal,
        lunchTotal,
        dinnerTotal,
        extrasTotal,
        grandTotal
      }
    };
  },

  formatExtraDisplay(extra, menuItem) {
    const name = menuItem ? menuItem.name : 'Item';
    let display = `${name} – ₹${extra.price}`;
    if (extra.notes && extra.notes.trim()) {
      display += ` (${extra.notes})`;
    }
    return display;
  },

  // =====================================================
  // Statistics
  // =====================================================

  async getStats() {
    const customers = await this.getCustomers();
    const menuItems = await this.getMenuItems();
    const extras = await this.getDailyExtras();
    const today = new Date().toISOString().split('T')[0];
    const todayExtras = await this.getExtrasByDate(today);

    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      totalMenuItems: menuItems.length,
      availableMenuItems: menuItems.filter(m => m.available).length,
      todayExtrasCount: todayExtras.length,
      totalExtras: extras.length
    };
  },

  // =====================================================
  // Data Migration
  // =====================================================

  async migrateData() {
    const KEYS = {
      CUSTOMERS: 'bc_customers',
      MENU_ITEMS: 'bc_menu_items',
      DAILY_EXTRAS: 'bc_daily_extras'
    };

    const getLocal = (key) => JSON.parse(localStorage.getItem(key)) || [];

    const customers = getLocal(KEYS.CUSTOMERS);
    const menu = getLocal(KEYS.MENU_ITEMS);
    const extras = getLocal(KEYS.DAILY_EXTRAS);

    console.log('Starting migration...');

    // Migrate Customers
    for (const c of customers) {
      await this.addCustomer(c).catch(err => console.error('Error migrating customer', c.name, err));
    }

    // Migrate Menu
    for (const m of menu) {
      await this.addMenuItem(m).catch(err => console.error('Error migrating menu item', m.name, err));
    }

    // Migrate Extras
    for (const e of extras) {
      await this.addDailyExtra(e).catch(err => console.error('Error migrating extra', e, err));
    }

    console.log('Migration complete!');
    return true;
  }
};

// Make DB available globally
window.DB = DB;
