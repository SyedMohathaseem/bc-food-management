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
      voiceBtn.innerHTML = isListening ? '🔴' : '🎤';
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Delay init slightly to ensure other modules load first
  setTimeout(() => Search.init(), 100);
});

// Make Search available globally
window.Search = Search;
