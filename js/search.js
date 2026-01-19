/**
 * BC Food Subscription App - Global Search Module
 * Real-time search with voice input support
 */

const Search = {
  // Configuration
  CONFIG: {
    DEBOUNCE_DELAY: 300,
    MIN_SEARCH_LENGTH: 2,
    MAX_RESULTS: 10
  },

  // State
  debounceTimer: null,
  recognition: null,
  isListening: false,

  // =====================================================
  // Initialization
  // =====================================================

  init() {
    this.setupEventListeners();
    this.setupVoiceRecognition();
  },

  setupEventListeners() {
    const searchInput = document.getElementById('globalSearch');
    const voiceBtn = document.getElementById('voiceSearchBtn');
    const searchContainer = document.getElementById('searchContainer');

    if (searchInput) {
      // Real-time search with debounce
      searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });

      // Close results on blur (with delay for click)
      searchInput.addEventListener('blur', () => {
        setTimeout(() => this.hideResults(), 200);
      });

      // Show results on focus if has value
      searchInput.addEventListener('focus', (e) => {
        if (e.target.value.length >= this.CONFIG.MIN_SEARCH_LENGTH) {
          this.performSearch(e.target.value);
        }
      });

      // Keyboard navigation
      searchInput.addEventListener('keydown', (e) => {
        this.handleKeyboard(e);
      });
    }

    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => this.toggleVoiceSearch());
    }

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideResults();
        document.getElementById('globalSearch')?.blur();
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (searchContainer && !searchContainer.contains(e.target)) {
        this.hideResults();
      }
    });
  },

  // =====================================================
  // Search Logic
  // =====================================================

  handleSearchInput(query) {
    // Clear previous debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Hide results if query too short
    if (query.length < this.CONFIG.MIN_SEARCH_LENGTH) {
      this.hideResults();
      return;
    }

    // Debounced search
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, this.CONFIG.DEBOUNCE_DELAY);
  },

  performSearch(query) {
    const normalizedQuery = query.toLowerCase().trim();
    const results = [];

    // Search Customers
    if (typeof DB !== 'undefined') {
      const customers = DB.getCustomers();
      customers.forEach(customer => {
        if (this.matchesQuery(customer, ['name', 'mobile', 'address'], normalizedQuery)) {
          results.push({
            type: 'customer',
            icon: '👥',
            title: customer.name,
            subtitle: customer.mobile,
            page: 'customers',
            data: customer
          });
        }
      });

      // Search Menu Items
      const menuItems = DB.getMenuItems();
      menuItems.forEach(item => {
        if (this.matchesQuery(item, ['name', 'category', 'description'], normalizedQuery)) {
          results.push({
            type: 'menu',
            icon: '🍽️',
            title: item.name,
            subtitle: `${item.category} - ₹${item.price}`,
            page: 'menu',
            data: item
          });
        }
      });

      // Search Daily Extras (by date or notes)
      const extras = DB.getDailyExtras();
      extras.forEach(extra => {
        const customer = DB.getCustomer(extra.customerId);
        const menuItem = DB.getMenuItem(extra.menuItemId);
        
        const searchableExtra = {
          ...extra,
          customerName: customer?.name || '',
          menuItemName: menuItem?.name || ''
        };

        if (this.matchesQuery(searchableExtra, ['date', 'notes', 'customerName', 'menuItemName', 'mealType'], normalizedQuery)) {
          results.push({
            type: 'extra',
            icon: '📝',
            title: `${customer?.name || 'Unknown'} - ${extra.mealType}`,
            subtitle: `${extra.date} - ${menuItem?.name || 'Item'}`,
            page: 'extras',
            data: extra
          });
        }
      });
    }

    // Limit results
    const limitedResults = results.slice(0, this.CONFIG.MAX_RESULTS);
    this.renderResults(limitedResults, query);
  },

  matchesQuery(obj, fields, query) {
    return fields.some(field => {
      const value = obj[field];
      if (value && typeof value === 'string') {
        return value.toLowerCase().includes(query);
      }
      return false;
    });
  },

  // =====================================================
  // Results Rendering
  // =====================================================

  renderResults(results, query) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = `
        <div class="search-no-results">
          <span class="search-no-results-icon">🔍</span>
          <p>No results found for "${this.escapeHtml(query)}"</p>
        </div>
      `;
      container.classList.add('active');
      return;
    }

    const html = results.map(result => `
      <div class="search-result-item" data-page="${result.page}" data-id="${result.data.id}">
        <span class="search-result-icon">${result.icon}</span>
        <div class="search-result-content">
          <div class="search-result-title">${this.highlightMatch(result.title, query)}</div>
          <div class="search-result-subtitle">${this.highlightMatch(result.subtitle, query)}</div>
        </div>
        <span class="search-result-badge">${result.type}</span>
      </div>
    `).join('');

    container.innerHTML = html;
    container.classList.add('active');

    // Add click handlers
    container.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.hideResults();
        document.getElementById('globalSearch').value = '';
        if (typeof App !== 'undefined') {
          App.loadPage(page);
        }
      });
    });
  },

  highlightMatch(text, query) {
    if (!text) return '';
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  hideResults() {
    const container = document.getElementById('searchResults');
    if (container) {
      container.classList.remove('active');
    }
  },

  // =====================================================
  // Keyboard Navigation
  // =====================================================

  handleKeyboard(e) {
    const container = document.getElementById('searchResults');
    if (!container || !container.classList.contains('active')) return;

    const items = container.querySelectorAll('.search-result-item');
    const currentFocus = container.querySelector('.search-result-item.focused');
    let index = Array.from(items).indexOf(currentFocus);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      index = (index + 1) % items.length;
      this.focusItem(items, index);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      index = index <= 0 ? items.length - 1 : index - 1;
      this.focusItem(items, index);
    } else if (e.key === 'Enter' && currentFocus) {
      e.preventDefault();
      currentFocus.click();
    }
  },

  focusItem(items, index) {
    items.forEach(item => item.classList.remove('focused'));
    if (items[index]) {
      items[index].classList.add('focused');
      items[index].scrollIntoView({ block: 'nearest' });
    }
  },

  // =====================================================
  // Voice Search
  // =====================================================

  setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      // Hide voice button if not supported
      const voiceBtn = document.getElementById('voiceSearchBtn');
      if (voiceBtn) {
        voiceBtn.style.display = 'none';
      }
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-IN'; // Indian English

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateVoiceButton(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateVoiceButton(false);
    };

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      const searchInput = document.getElementById('globalSearch');
      if (searchInput) {
        searchInput.value = transcript;
        this.handleSearchInput(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this.updateVoiceButton(false);
      
      if (event.error === 'not-allowed') {
        App?.showToast('Microphone access denied. Please allow microphone access.', 'error');
      }
    };
  },

  toggleVoiceSearch() {
    if (!this.recognition) {
      App?.showToast('Voice search not supported in this browser', 'warning');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
        App?.showToast('Listening... Speak now', 'info', 2000);
      } catch (e) {
        console.error('Failed to start voice recognition:', e);
      }
    }
  },

  updateVoiceButton(isListening) {
    const voiceBtn = document.getElementById('voiceSearchBtn');
    if (voiceBtn) {
      voiceBtn.classList.toggle('listening', isListening);
      if (isListening) {
        voiceBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
      } else {
        voiceBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
      }
    }
  }
};

// =====================================================
// CustomerSearch - Reusable Customer Search Component
// For use in Extras, Invoice, and other sections
// =====================================================

const CustomerSearch = {
  // Active instances tracking
  instances: {},

  /**
   * Create a customer search input with voice support
   * @param {string} containerId - ID of container element
   * @param {function} onSelect - Callback when customer is selected: (customer) => {}
   * @param {string} placeholder - Placeholder text
   * @returns {string} HTML for the search input
   */
  create(containerId, onSelect, placeholder = 'Type customer name or mobile...') {
    // Store callback
    this.instances[containerId] = { onSelect };

    return `
      <div class="customer-search-container" id="${containerId}">
        <div class="customer-search-bar">
          <span class="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="text" 
                 class="customer-search-input form-control" 
                 id="${containerId}Input" 
                 placeholder="${placeholder}" 
                 autocomplete="off"
                 onfocus="CustomerSearch.onFocus('${containerId}')"
                 oninput="CustomerSearch.onInput('${containerId}')"
                 onkeydown="CustomerSearch.onKeydown(event, '${containerId}')" />
          <input type="hidden" id="${containerId}Value" required />
          <button type="button" 
                  class="customer-voice-btn" 
                  id="${containerId}VoiceBtn"
                  onclick="CustomerSearch.startVoice('${containerId}')"
                  title="Voice Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        </div>
        <div class="customer-search-results" id="${containerId}Results"></div>
        <div class="customer-selected" id="${containerId}Selected" style="display: none;">
          <span class="customer-selected-name" id="${containerId}SelectedName"></span>
          <button type="button" class="customer-clear-btn" onclick="CustomerSearch.clear('${containerId}')">✕</button>
        </div>
      </div>
    `;
  },

  /**
   * Initialize after HTML is rendered
   */
  init(containerId) {
    // Check voice support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const voiceBtn = document.getElementById(`${containerId}VoiceBtn`);
      if (voiceBtn) voiceBtn.style.display = 'none';
    }
  },

  onFocus(containerId) {
    const input = document.getElementById(`${containerId}Input`);
    if (input && input.value.length >= 1) {
      this.search(containerId, input.value);
    }
  },

  onInput(containerId) {
    const input = document.getElementById(`${containerId}Input`);
    const query = input?.value || '';
    
    // Clear hidden value when typing
    document.getElementById(`${containerId}Value`).value = '';
    document.getElementById(`${containerId}Selected`).style.display = 'none';
    document.getElementById(`${containerId}Input`).style.display = 'block';
    
    if (query.length >= 1) {
      this.search(containerId, query);
    } else {
      this.hideResults(containerId);
    }
  },

  search(containerId, query) {
    const normalizedQuery = query.toLowerCase().trim();
    const customers = DB.getActiveCustomers();
    
    const results = customers.filter(c => 
      c.name.toLowerCase().includes(normalizedQuery) ||
      c.mobile.includes(normalizedQuery)
    ).slice(0, 8);

    this.renderResults(containerId, results, query);
  },

  renderResults(containerId, results, query) {
    const container = document.getElementById(`${containerId}Results`);
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = `
        <div class="customer-no-results">
          No customers found for "${Search.escapeHtml(query)}"
        </div>
      `;
      container.classList.add('active');
      return;
    }

    container.innerHTML = results.map(c => `
      <div class="customer-result-item" data-id="${c.id}" onclick="CustomerSearch.select('${containerId}', '${c.id}')">
        <div class="customer-result-name">${Search.highlightMatch(c.name, query)}</div>
        <div class="customer-result-mobile">${Search.highlightMatch(c.mobile, query)}</div>
      </div>
    `).join('');

    container.classList.add('active');
  },

  select(containerId, customerId) {
    const customer = DB.getCustomer(customerId);
    if (!customer) return;

    // Hide search, show selected
    document.getElementById(`${containerId}Input`).style.display = 'none';
    document.getElementById(`${containerId}Results`).classList.remove('active');
    document.getElementById(`${containerId}Value`).value = customerId;
    document.getElementById(`${containerId}Selected`).style.display = 'flex';
    document.getElementById(`${containerId}SelectedName`).textContent = `👤 ${customer.name} - ${customer.mobile}`;

    // Call callback
    const instance = this.instances[containerId];
    if (instance?.onSelect) {
      instance.onSelect(customer);
    }
  },

  clear(containerId) {
    document.getElementById(`${containerId}Input`).value = '';
    document.getElementById(`${containerId}Input`).style.display = 'block';
    document.getElementById(`${containerId}Value`).value = '';
    document.getElementById(`${containerId}Selected`).style.display = 'none';
    document.getElementById(`${containerId}Input`).focus();

    // Call callback with null
    const instance = this.instances[containerId];
    if (instance?.onSelect) {
      instance.onSelect(null);
    }
  },

  hideResults(containerId) {
    const container = document.getElementById(`${containerId}Results`);
    if (container) container.classList.remove('active');
  },

  onKeydown(event, containerId) {
    const container = document.getElementById(`${containerId}Results`);
    if (!container || !container.classList.contains('active')) return;

    const items = container.querySelectorAll('.customer-result-item');
    const focused = container.querySelector('.customer-result-item.focused');
    let index = Array.from(items).indexOf(focused);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      index = (index + 1) % items.length;
      items.forEach(i => i.classList.remove('focused'));
      items[index]?.classList.add('focused');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      index = index <= 0 ? items.length - 1 : index - 1;
      items.forEach(i => i.classList.remove('focused'));
      items[index]?.classList.add('focused');
    } else if (event.key === 'Enter' && focused) {
      event.preventDefault();
      focused.click();
    } else if (event.key === 'Escape') {
      this.hideResults(containerId);
    }
  },

  getValue(containerId) {
    return document.getElementById(`${containerId}Value`)?.value || '';
  },

  // Voice search for customer input
  startVoice(containerId) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      App?.showToast('Voice search not supported', 'warning');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    const voiceBtn = document.getElementById(`${containerId}VoiceBtn`);
    const micSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
    const recordingSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
    
    if (voiceBtn) {
      voiceBtn.classList.add('listening');
      voiceBtn.innerHTML = recordingSvg;
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById(`${containerId}Input`);
      if (input) {
        input.value = transcript;
        input.style.display = 'block';
        document.getElementById(`${containerId}Selected`).style.display = 'none';
        this.search(containerId, transcript);
      }
    };

    recognition.onend = () => {
      if (voiceBtn) {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = micSvg;
      }
    };

    recognition.onerror = (event) => {
      console.error('Voice error:', event.error);
      if (voiceBtn) {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = micSvg;
      }
      if (event.error === 'not-allowed') {
        App?.showToast('Microphone access denied', 'error');
      }
    };

    try {
      recognition.start();
      App?.showToast('Listening... Say customer name', 'info', 2000);
    } catch (e) {
      console.error('Voice start error:', e);
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Delay init slightly to ensure other modules load first
  setTimeout(() => Search.init(), 100);
});

// Make available globally
window.Search = Search;
window.CustomerSearch = CustomerSearch;
