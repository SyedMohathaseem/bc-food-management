/**
 * Inas Cafe - Database Layer
 * LocalStorage-based data persistence
 */

const DB = {
  // Collection keys
  KEYS: {
    CUSTOMERS: 'bc_customers',
    MENU_ITEMS: 'bc_menu_items',
    DAILY_EXTRAS: 'bc_daily_extras'
  },

  // =====================================================
  // Generic CRUD Operations
  // =====================================================

  /**
   * Get all items from a collection
   * @param {string} key - Collection key
   * @returns {Array} Array of items
   */
  getAll(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return [];
    }
  },

  /**
   * Save all items to a collection
   * @param {string} key - Collection key
   * @param {Array} items - Array of items to save
   */
  saveAll(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  },

  /**
   * Get a single item by ID
   * @param {string} key - Collection key
   * @param {string} id - Item ID
   * @returns {Object|null} Item or null if not found
   */
  getById(key, id) {
    const items = this.getAll(key);
    return items.find(item => item.id === id) || null;
  },

  /**
   * Add a new item to a collection
   * @param {string} key - Collection key
   * @param {Object} item - Item to add (without ID)
   * @returns {Object} Added item with generated ID
   */
  add(key, item) {
    const items = this.getAll(key);
    const prefix = key.split('_')[1].substring(0, 4); // e.g., 'cust' from 'bc_customers'
    const newItem = {
      ...item,
      id: `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    this.saveAll(key, items);
    return newItem;
  },

  /**
   * Update an existing item
   * @param {string} key - Collection key
   * @param {string} id - Item ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated item or null if not found
   */
  update(key, id, updates) {
    const items = this.getAll(key);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveAll(key, items);
    return items[index];
  },

  /**
   * Delete an item by ID
   * @param {string} key - Collection key
   * @param {string} id - Item ID
   * @returns {boolean} True if deleted, false if not found
   */
  delete(key, id) {
    const items = this.getAll(key);
    const filtered = items.filter(item => item.id !== id);
    
    if (filtered.length === items.length) return false;
    
    this.saveAll(key, filtered);
    return true;
  },

  // =====================================================
  // Customer Operations
  // =====================================================

  getCustomers() {
    return this.getAll(this.KEYS.CUSTOMERS);
  },

  getActiveCustomers() {
    return this.getCustomers().filter(c => c.status === 'active');
  },

  getCustomer(id) {
    return this.getById(this.KEYS.CUSTOMERS, id);
  },

  addCustomer(customer) {
    return this.add(this.KEYS.CUSTOMERS, {
      name: customer.name,
      mobile: customer.mobile,
      address: customer.address || '',
      subscriptionType: customer.subscriptionType || 'daily',
      dailyAmount: parseFloat(customer.dailyAmount) || 300,
      startDate: customer.startDate || new Date().toISOString().split('T')[0],
      status: customer.status || 'active'
    });
  },

  updateCustomer(id, updates) {
    if (updates.dailyAmount) {
      updates.dailyAmount = parseFloat(updates.dailyAmount);
    }
    return this.update(this.KEYS.CUSTOMERS, id, updates);
  },

  deleteCustomer(id) {
    return this.delete(this.KEYS.CUSTOMERS, id);
  },

  // =====================================================
  // Menu Item Operations
  // =====================================================

  getMenuItems() {
    return this.getAll(this.KEYS.MENU_ITEMS);
  },

  getAvailableMenuItems() {
    return this.getMenuItems().filter(m => m.available);
  },

  getMenuItemsByCategory(category) {
    return this.getAvailableMenuItems().filter(m => m.category === category);
  },

  getMenuItem(id) {
    return this.getById(this.KEYS.MENU_ITEMS, id);
  },

  addMenuItem(menuItem) {
    return this.add(this.KEYS.MENU_ITEMS, {
      name: menuItem.name,
      category: menuItem.category,
      price: parseFloat(menuItem.price) || 0,
      description: menuItem.description || '',
      available: menuItem.available !== false
    });
  },

  updateMenuItem(id, updates) {
    if (updates.price) {
      updates.price = parseFloat(updates.price);
    }
    return this.update(this.KEYS.MENU_ITEMS, id, updates);
  },

  deleteMenuItem(id) {
    return this.delete(this.KEYS.MENU_ITEMS, id);
  },

  // =====================================================
  // Daily Extras Operations
  // =====================================================

  getDailyExtras() {
    return this.getAll(this.KEYS.DAILY_EXTRAS);
  },

  getExtrasByCustomer(customerId) {
    return this.getDailyExtras().filter(e => e.customerId === customerId);
  },

  getExtrasByDate(date) {
    return this.getDailyExtras().filter(e => e.date === date);
  },

  getExtrasByCustomerAndMonth(customerId, year, month) {
    return this.getDailyExtras().filter(e => {
      if (e.customerId !== customerId) return false;
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  },

  /**
   * Get extras for a specific customer, date, and meal type
   * @param {string} customerId 
   * @param {string} date - YYYY-MM-DD format
   * @param {string} mealType - breakfast | lunch | dinner
   * @returns {Object|null}
   */
  getExtra(customerId, date, mealType) {
    return this.getDailyExtras().find(
      e => e.customerId === customerId && e.date === date && e.mealType === mealType
    ) || null;
  },

  /**
   * Add or update a daily extra
   * This implements the critical business rule:
   * - When adding extra for one meal, other meals for that date are marked as attended (no extra)
   * @param {Object} extra - Extra entry data
   * @returns {Object} Added/updated extra
   */
  addDailyExtra(extra) {
    const extras = this.getDailyExtras();
    const { customerId, date, mealType, menuItemId, price, notes } = extra;
    
    // Check if entry already exists for this customer/date/meal
    const existingIndex = extras.findIndex(
      e => e.customerId === customerId && e.date === date && e.mealType === mealType
    );
    
    if (existingIndex !== -1) {
      // Update existing entry
      extras[existingIndex] = {
        ...extras[existingIndex],
        menuItemId,
        price: parseFloat(price),
        notes: notes || '',
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new entry
      const newExtra = {
        id: `extr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        customerId,
        date,
        mealType,
        menuItemId,
        price: parseFloat(price),
        notes: notes || '',
        createdAt: new Date().toISOString()
      };
      extras.push(newExtra);
    }
    
    this.saveAll(this.KEYS.DAILY_EXTRAS, extras);
    return this.getExtra(customerId, date, mealType);
  },

  /**
   * Delete a daily extra
   * @param {string} id - Extra ID
   * @returns {boolean}
   */
  deleteDailyExtra(id) {
    return this.delete(this.KEYS.DAILY_EXTRAS, id);
  },

  /**
   * Delete extras by customer, date, and optionally meal type
   */
  deleteExtraByDetails(customerId, date, mealType = null) {
    const extras = this.getDailyExtras();
    const filtered = extras.filter(e => {
      if (e.customerId !== customerId) return true;
      if (e.date !== date) return true;
      if (mealType && e.mealType !== mealType) return true;
      return false;
    });
    this.saveAll(this.KEYS.DAILY_EXTRAS, filtered);
  },

  // =====================================================
  // Invoice Generation Helpers
  // =====================================================

  /**
   * Get invoice data for a customer for a specific month
   * @param {string} customerId 
   * @param {number} year 
   * @param {number} month - 0-indexed
   * @returns {Object} Invoice data
   */
  generateInvoiceData(customerId, year, month) {
    const customer = this.getCustomer(customerId);
    if (!customer) return null;

    // Get all extras for this customer and month
    const extras = this.getExtrasByCustomerAndMonth(customerId, year, month);
    
    // Create a map for quick lookup
    const extrasMap = {};
    extras.forEach(e => {
      const key = `${e.date}_${e.mealType}`;
      extrasMap[key] = e;
    });

    // Get days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Build date-wise data
    const dateWiseData = [];
    let breakfastTotal = 0;
    let lunchTotal = 0;
    let dinnerTotal = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const breakfast = extrasMap[`${dateStr}_breakfast`];
      const lunch = extrasMap[`${dateStr}_lunch`];
      const dinner = extrasMap[`${dateStr}_dinner`];
      
      if (breakfast) breakfastTotal += breakfast.price;
      if (lunch) lunchTotal += lunch.price;
      if (dinner) dinnerTotal += dinner.price;
      
      dateWiseData.push({
        date: dateStr,
        day,
        breakfast: breakfast ? this.formatExtraDisplay(breakfast) : '-',
        lunch: lunch ? this.formatExtraDisplay(lunch) : '-',
        dinner: dinner ? this.formatExtraDisplay(dinner) : '-'
      });
    }

    const subscriptionTotal = customer.dailyAmount * daysInMonth;
    const extrasTotal = breakfastTotal + lunchTotal + dinnerTotal;
    const grandTotal = subscriptionTotal + extrasTotal;

    return {
      customer,
      month,
      year,
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

  /**
   * Format extra entry for display in invoice
   * @param {Object} extra 
   * @returns {string} Formatted string like "Veg Thali – ₹80"
   */
  formatExtraDisplay(extra) {
    const menuItem = this.getMenuItem(extra.menuItemId);
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

  getStats() {
    const customers = this.getCustomers();
    const menuItems = this.getMenuItems();
    const extras = this.getDailyExtras();
    const today = new Date().toISOString().split('T')[0];
    const todayExtras = extras.filter(e => e.date === today);

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
  // Demo Data
  // =====================================================

  /**
   * Load demo data for testing
   */
  loadDemoData() {
    // Only load if collections are empty
    if (this.getCustomers().length === 0) {
      this.addCustomer({
        name: 'Ramesh Kumar',
        mobile: '9876543210',
        address: '123 Main Street, Sector 15',
        subscriptionType: 'daily',
        dailyAmount: 300,
        startDate: '2026-01-01',
        status: 'active'
      });

      this.addCustomer({
        name: 'Sunita Sharma',
        mobile: '9876543211',
        address: '456 Park Road, Block B',
        subscriptionType: 'monthly',
        dailyAmount: 280,
        startDate: '2026-01-01',
        status: 'active'
      });
    }

    if (this.getMenuItems().length === 0) {
      // Breakfast items
      this.addMenuItem({ name: 'Poha', category: 'breakfast', price: 40, description: 'Flattened rice with vegetables' });
      this.addMenuItem({ name: 'Upma', category: 'breakfast', price: 40, description: 'Semolina preparation' });
      this.addMenuItem({ name: 'Paratha (2 pcs)', category: 'breakfast', price: 50, description: 'Stuffed flatbread with curd' });
      
      // Lunch items
      this.addMenuItem({ name: 'Veg Thali', category: 'lunch', price: 80, description: 'Rice, Dal, Sabzi, Roti, Salad' });
      this.addMenuItem({ name: 'Special Thali', category: 'lunch', price: 120, description: 'Premium thali with paneer' });
      this.addMenuItem({ name: 'Rice & Dal', category: 'lunch', price: 60, description: 'Simple rice and dal combo' });
      
      // Dinner items
      this.addMenuItem({ name: 'Roti Sabzi', category: 'dinner', price: 70, description: '4 Rotis with seasonal vegetable' });
      this.addMenuItem({ name: 'Light Meal', category: 'dinner', price: 50, description: 'Khichdi or simple preparation' });
      this.addMenuItem({ name: 'Full Dinner', category: 'dinner', price: 90, description: 'Complete dinner set' });
    }
  }
};

// Make DB available globally
window.DB = DB;
