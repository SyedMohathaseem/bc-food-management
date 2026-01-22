/**
 * Inas Cafe - Menu Management Module
 * Handles menu item CRUD operations
 */

const Menu = {
  // Current edit ID (null = add mode)
  editId: null,

  // Category labels
  categories: {
    breakfast: '🌅 Breakfast',
    lunch: '☀️ Lunch',
    dinner: '🌙 Dinner'
  },

  // =====================================================
  // Render
  // =====================================================

  async render() {
    const pageContent = document.getElementById('pageContent');
    const menuItems = await DB.getMenuItems();
    
    pageContent.innerHTML = `
      <div class="card-header" style="background: none; padding: 0; border: none; margin-bottom: var(--space-6);">
        <h1>📋 Menu Items</h1>
        <button class="btn btn-primary" onclick="Menu.openForm()">
          ➕ Add Item
        </button>
      </div>
      
      <!-- Menu Items by Category -->
      <div id="categoryContainer">
        ${await this.renderByCategory(menuItems)}
      </div>
      
      <!-- Add/Edit Modal -->
      <div class="modal-overlay" id="menuModal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="menuModalTitle">Add Menu Item</h3>
            <button class="modal-close" onclick="Menu.closeForm()">×</button>
          </div>
          <div class="modal-body">
            <form id="menuForm" onsubmit="Menu.save(event)">
              <div class="form-group">
                <label class="form-label required">Item Name</label>
                <input type="text" class="form-control" id="menuName" 
                       placeholder="e.g., Veg Thali" required>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">Category</label>
                  <select class="form-control form-select" id="menuCategory" required>
                    <option value="">Select Category</option>
                    <option value="breakfast">🌅 Breakfast</option>
                    <option value="lunch">☀️ Lunch</option>
                    <option value="dinner">🌙 Dinner</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Price (₹)</label>
                  <input type="number" class="form-control" id="menuPrice" 
                         placeholder="0" min="0" step="5" required>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="menuDesc" 
                          placeholder="Brief description of the item" rows="2"></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">
                  <input type="checkbox" id="menuAvailable" checked>
                  <span class="form-check-label">Available for ordering</span>
                </label>
              </div>
              
              <div class="modal-footer" style="padding: var(--space-4) 0 0; margin-top: var(--space-4); border-top: 1px solid var(--neutral-200);">
                <button type="button" class="btn btn-outline" onclick="Menu.closeForm()">Cancel</button>
                <button type="submit" class="btn btn-primary btn-lg">💾 Save Item</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  async renderByCategory(menuItems) {
    if (menuItems.length === 0) {
      return `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">🍽️</div>
            <p class="empty-state-title">No menu items yet</p>
            <p class="empty-state-text">Add your extra food items</p>
            <button class="btn btn-primary" onclick="Menu.openForm()">
              ➕ Add Item
            </button>
          </div>
        </div>
      `;
    }

    // Group by category
    const grouped = {
      breakfast: menuItems.filter(m => m.category === 'breakfast'),
      lunch: menuItems.filter(m => m.category === 'lunch'),
      dinner: menuItems.filter(m => m.category === 'dinner')
    };

    let html = '';
    
    for (const category of ['breakfast', 'lunch', 'dinner']) {
      const items = grouped[category];
      if (items.length === 0) continue;
      
      html += `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${this.categories[category]}</h3>
            <span class="badge badge-primary">${items.length} items</span>
          </div>
          <ul class="list">
      `;
      
      items.forEach(item => {
        const isAvailable = item.isAvailable === 1 || item.available === true || item.isAvailable === true;
        const statusClass = isAvailable ? 'success' : 'warning';
        const statusLabel = isAvailable ? 'Available' : 'Unavailable';
        
        html += `
          <li class="list-item">
            <div class="list-item-content">
              <div class="list-item-title">${item.name}</div>
              <div class="list-item-subtitle">
                ₹${item.price} ${item.description ? '• ' + item.description : ''}
              </div>
            </div>
            <span class="badge badge-${statusClass}">${statusLabel}</span>
            <div class="list-item-actions">
              <button class="btn btn-sm btn-outline" onclick="Menu.edit('${item.id}')" title="Edit">
                ✏️
              </button>
              <button class="btn btn-sm btn-danger" onclick="Menu.delete('${item.id}')" title="Delete">
                🗑️
              </button>
            </div>
          </li>
        `;
      });
      
      html += '</ul></div>';
    }

    return html;
  },

  // =====================================================
  // Form Operations
  // =====================================================

  async openForm(itemId = null) {
    this.editId = itemId;
    const modal = document.getElementById('menuModal');
    const title = document.getElementById('menuModalTitle');
    const form = document.getElementById('menuForm');
    
    form.reset();
    document.getElementById('menuAvailable').checked = true;
    
    if (itemId) {
      // Edit mode
      const item = await DB.getMenuItem(itemId);
      if (!item) {
        App.showToast('Item not found', 'error');
        return;
      }
      
      title.textContent = 'Edit Menu Item';
      document.getElementById('menuName').value = item.name;
      document.getElementById('menuCategory').value = item.category;
      document.getElementById('menuPrice').value = item.price;
      document.getElementById('menuDesc').value = item.description || '';
      document.getElementById('menuAvailable').checked = (item.isAvailable === 1 || item.isAvailable === true || item.available === true);
    } else {
      // Add mode
      title.textContent = 'Add Menu Item';
    }
    
    App.openModal('menuModal');
  },

  closeForm() {
    this.editId = null;
    App.closeModal('menuModal');
  },

  async save(event) {
    event.preventDefault();
    
    const data = {
      name: document.getElementById('menuName').value.trim(),
      category: document.getElementById('menuCategory').value,
      price: parseFloat(document.getElementById('menuPrice').value),
      description: document.getElementById('menuDesc').value.trim(),
      isAvailable: document.getElementById('menuAvailable').checked ? 1 : 0
    };
    
    // Validation
    if (!data.name || !data.category) {
      App.showToast('Please fill in all required fields', 'error');
      return;
    }
    
    if (data.price < 0) {
      App.showToast('Price cannot be negative', 'error');
      return;
    }
    
    try {
      if (this.editId) {
        // Update existing
        await DB.updateMenuItem(this.editId, data);
        App.showToast('Menu item updated!', 'success');
      } else {
        // Add new
        await DB.addMenuItem(data);
        App.showToast('Menu item added!', 'success');
      }
      
      this.closeForm();
      await this.render();
    } catch (error) {
      console.error('Save error:', error);
      App.showToast('Error saving item', 'error');
    }
  },

  // =====================================================
  // CRUD Operations
  // =====================================================

  async edit(id) {
    await this.openForm(id);
  },

  async delete(id) {
    const item = await DB.getMenuItem(id);
    if (!item) return;
    
    App.confirm(
      `Are you sure you want to delete "${item.name}"?`,
      async () => {
        await DB.deleteMenuItem(id);
        App.showToast('Item deleted', 'success');
        await this.render();
      }
    );
  },

  async toggleAvailability(id) {
    const item = await DB.getMenuItem(id);
    if (!item) return;
    
    const isAvailable = item.isAvailable === 1 || item.available === true || item.isAvailable === true;
    await DB.updateMenuItem(id, { isAvailable: isAvailable ? 0 : 1 });
    App.showToast(`Item ${isAvailable ? 'marked unavailable' : 'available now'}`, 'success');
    await this.render();
  }

};

// Make available globally
window.Menu = Menu;
