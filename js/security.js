/**
 * Inas Cafe - Security Settings Module
 * Handles security settings page UI and credential management
 */

const Security = {
  // =====================================================
  // Render Security Settings Page
  // =====================================================

  render() {
    const pageContent = document.getElementById('pageContent');
    const adminEmail = Auth.getMaskedEmail();
    const logs = Auth.getCredentialLogs();
    
    pageContent.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🔐 Security Settings</h1>
      </div>
      
      <!-- Change Email Section -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📧 Change Email Address</h3>
        </div>
        
        <form id="changeEmailForm" onsubmit="Security.handleChangeEmail(event)">
          <div class="form-group">
            <label class="form-label">Current Email</label>
            <input type="text" class="form-control" value="${adminEmail}" disabled 
                   style="background: var(--cream);">
            <span class="form-text">Your current login email (masked for security)</span>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">New Email</label>
              <input type="email" class="form-control" id="newEmail" 
                     placeholder="Enter new email address" required>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Confirm New Email</label>
              <input type="email" class="form-control" id="confirmEmail" 
                     placeholder="Confirm new email" required
                     oninput="Security.validateEmailMatch()">
              <span class="form-error" id="emailMatchError" style="display: none;">
                Emails do not match
              </span>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label required">Current Password</label>
            <input type="password" class="form-control" id="emailPassword" 
                   placeholder="Enter current password to confirm" required>
            <span class="form-text">Required to verify your identity</span>
          </div>
          
          <div id="emailChangeMessage" class="mb-4"></div>
          
          <button type="submit" class="btn btn-primary btn-lg" id="changeEmailBtn">
            💾 Update Email
          </button>
        </form>
      </div>
      
      <!-- Change Password Section -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">🔑 Change Password</h3>
        </div>
        
        <form id="changePasswordForm" onsubmit="Security.handleChangePassword(event)">
          <div class="form-group">
            <label class="form-label required">Current Password</label>
            <input type="password" class="form-control" id="currentPassword" 
                   placeholder="Enter current password" required>
          </div>
          
          <div class="form-group">
            <label class="form-label required">New Password</label>
            <input type="password" class="form-control" id="newPassword" 
                   placeholder="Enter new password" required
                   oninput="Security.updatePasswordStrength()">
            
            <!-- Password Strength Indicator -->
            <div class="password-strength" id="passwordStrength" style="display: none;">
              <div class="strength-bar">
                <div class="strength-fill" id="strengthFill"></div>
              </div>
              <span class="strength-text" id="strengthText">Weak</span>
            </div>
            
            <!-- Password Requirements -->
            <div class="password-requirements" id="passwordRequirements">
              <p class="form-text mb-2">Password must have:</p>
              <ul class="requirements-list">
                <li id="req-length">At least 8 characters</li>
                <li id="req-upper">One uppercase letter (A-Z)</li>
                <li id="req-lower">One lowercase letter (a-z)</li>
                <li id="req-number">One number (0-9)</li>
                <li id="req-special">One special character (!@#$%^&*)</li>
              </ul>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label required">Confirm New Password</label>
            <input type="password" class="form-control" id="confirmPassword" 
                   placeholder="Confirm new password" required
                   oninput="Security.validatePasswordMatch()">
            <span class="form-error" id="passwordMatchError" style="display: none;">
              Passwords do not match
            </span>
          </div>
          
          <div id="passwordChangeMessage" class="mb-4"></div>
          
          <button type="submit" class="btn btn-primary btn-lg" id="changePasswordBtn">
            💾 Update Password
          </button>
        </form>
      </div>
      
      <!-- Recent Activity Log -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📋 Recent Security Activity</h3>
        </div>
        
        ${logs.length === 0 ? `
          <div class="empty-state" style="padding: var(--space-6);">
            <p class="text-muted">No recent security changes</p>
          </div>
        ` : `
          <ul class="list">
            ${logs.reverse().map(log => `
              <li class="list-item">
                <div class="list-item-content">
                  <div class="list-item-title">
                    ${log.type === 'email' ? '📧 Email Changed' : '🔑 Password Changed'}
                  </div>
                  <div class="list-item-subtitle">
                    ${new Date(log.timestamp).toLocaleString('en-IN')}
                  </div>
                </div>
              </li>
            `).join('')}
          </ul>
        `}
      </div>
      
      <!-- Security Tips -->
      <div class="card" style="background: var(--primary-light); border: 1px solid var(--primary);">
        <h4 style="color: var(--primary); margin-bottom: var(--space-4);">💡 Security Tips</h4>
        <ul style="color: var(--neutral-700); padding-left: var(--space-5);">
          <li>Change your password regularly (every 3 months)</li>
          <li>Never share your login credentials</li>
          <li>Use a strong, unique password</li>
          <li>Log out when using shared devices</li>
        </ul>
      </div>
    `;

    // Add password strength styles
    this.addStyles();
  },

  // =====================================================
  // Add custom styles for this page
  // =====================================================

  addStyles() {
    if (document.getElementById('security-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'security-styles';
    styles.textContent = `
      .password-strength {
        margin-top: var(--space-3);
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      
      .strength-bar {
        flex: 1;
        height: 8px;
        background: var(--neutral-200);
        border-radius: var(--radius-full);
        overflow: hidden;
      }
      
      .strength-fill {
        height: 100%;
        width: 0%;
        border-radius: var(--radius-full);
        transition: all 0.3s ease;
      }
      
      .strength-fill.weak { width: 25%; background: var(--danger); }
      .strength-fill.fair { width: 50%; background: var(--warning); }
      .strength-fill.good { width: 75%; background: #22c55e; }
      .strength-fill.strong { width: 100%; background: var(--success); }
      
      .strength-text {
        font-size: var(--font-size-sm);
        font-weight: 600;
        min-width: 60px;
      }
      
      .strength-text.weak { color: var(--danger); }
      .strength-text.fair { color: var(--warning); }
      .strength-text.good { color: #22c55e; }
      .strength-text.strong { color: var(--success); }
      
      .password-requirements {
        margin-top: var(--space-3);
        padding: var(--space-4);
        background: var(--cream);
        border-radius: var(--radius-lg);
      }
      
      .requirements-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: var(--space-2);
      }
      
      .requirements-list li {
        font-size: var(--font-size-sm);
        color: var(--neutral-500);
        padding-left: var(--space-6);
        position: relative;
      }
      
      .requirements-list li::before {
        content: '○';
        position: absolute;
        left: 0;
        color: var(--neutral-400);
      }
      
      .requirements-list li.valid {
        color: var(--success);
      }
      
      .requirements-list li.valid::before {
        content: '✓';
        color: var(--success);
      }
      
      .message-box {
        padding: var(--space-4);
        border-radius: var(--radius-lg);
        font-size: var(--font-size-sm);
      }
      
      .message-box.success {
        background: var(--success-light);
        color: var(--success);
      }
      
      .message-box.error {
        background: var(--danger-light);
        color: var(--danger);
      }
    `;
    document.head.appendChild(styles);
  },

  // =====================================================
  // Validation Functions
  // =====================================================

  validateEmailMatch() {
    const newEmail = document.getElementById('newEmail').value;
    const confirmEmail = document.getElementById('confirmEmail').value;
    const errorEl = document.getElementById('emailMatchError');
    
    if (confirmEmail && newEmail !== confirmEmail) {
      errorEl.style.display = 'block';
      return false;
    } else {
      errorEl.style.display = 'none';
      return true;
    }
  },

  validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorEl = document.getElementById('passwordMatchError');
    
    if (confirmPassword && newPassword !== confirmPassword) {
      errorEl.style.display = 'block';
      return false;
    } else {
      errorEl.style.display = 'none';
      return true;
    }
  },

  updatePasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthContainer = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!password) {
      strengthContainer.style.display = 'none';
      return;
    }
    
    strengthContainer.style.display = 'flex';
    
    const score = Auth.getPasswordStrength(password);
    const labels = ['weak', 'fair', 'good', 'strong'];
    const texts = ['Weak', 'Fair', 'Good', 'Strong'];
    
    const level = Math.max(0, Math.min(score - 1, 3));
    
    strengthFill.className = 'strength-fill ' + labels[level];
    strengthText.className = 'strength-text ' + labels[level];
    strengthText.textContent = texts[level];
    
    // Update requirements list
    this.updateRequirements(password);
  },

  updateRequirements(password) {
    const requirements = [
      { id: 'req-length', test: password.length >= 8 },
      { id: 'req-upper', test: /[A-Z]/.test(password) },
      { id: 'req-lower', test: /[a-z]/.test(password) },
      { id: 'req-number', test: /[0-9]/.test(password) },
      { id: 'req-special', test: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
    ];
    
    requirements.forEach(req => {
      const el = document.getElementById(req.id);
      if (el) {
        el.classList.toggle('valid', req.test);
      }
    });
  },

  // =====================================================
  // Form Handlers
  // =====================================================

  async handleChangeEmail(e) {
    e.preventDefault();
    
    const newEmail = document.getElementById('newEmail').value.trim();
    const confirmEmail = document.getElementById('confirmEmail').value.trim();
    const password = document.getElementById('emailPassword').value;
    const messageEl = document.getElementById('emailChangeMessage');
    const btn = document.getElementById('changeEmailBtn');
    
    // Validate email match
    if (newEmail !== confirmEmail) {
      this.showMessage(messageEl, 'Emails do not match.', 'error');
      return;
    }
    
    // Show confirmation
    if (!await App.confirm('Are you sure you want to change your email? You will be logged out and need to login with the new email.')) {
      return;
    }
    
    // Disable button
    btn.disabled = true;
    btn.textContent = 'Updating...';
    
    try {
      const result = await Auth.changeEmail(newEmail, password);
      
      if (result.success) {
        this.showMessage(messageEl, result.message, 'success');
        
        // Force logout after 2 seconds
        setTimeout(() => {
          Auth.forceLogout('Email changed successfully. Please login with your new email.');
        }, 2000);
      } else {
        this.showMessage(messageEl, result.message, 'error');
        btn.disabled = false;
        btn.textContent = '💾 Update Email';
      }
    } catch (error) {
      this.showMessage(messageEl, 'An error occurred. Please try again.', 'error');
      btn.disabled = false;
      btn.textContent = '💾 Update Email';
    }
  },

  async handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageEl = document.getElementById('passwordChangeMessage');
    const btn = document.getElementById('changePasswordBtn');
    
    // Validate password match
    if (newPassword !== confirmPassword) {
      this.showMessage(messageEl, 'Passwords do not match.', 'error');
      return;
    }
    
    // Validate password strength
    const validation = Auth.validatePasswordStrength(newPassword);
    if (!validation.valid) {
      this.showMessage(messageEl, validation.message, 'error');
      return;
    }
    
    // Show confirmation
    if (!await App.confirm('Are you sure you want to change your password? You will be logged out and need to login with the new password.')) {
      return;
    }
    
    // Disable button
    btn.disabled = true;
    btn.textContent = 'Updating...';
    
    try {
      const result = await Auth.changePassword(currentPassword, newPassword);
      
      if (result.success) {
        this.showMessage(messageEl, result.message, 'success');
        
        // Force logout after 2 seconds
        setTimeout(() => {
          Auth.forceLogout('Password changed successfully. Please login with your new password.');
        }, 2000);
      } else {
        this.showMessage(messageEl, result.message, 'error');
        btn.disabled = false;
        btn.textContent = '💾 Update Password';
      }
    } catch (error) {
      this.showMessage(messageEl, 'An error occurred. Please try again.', 'error');
      btn.disabled = false;
      btn.textContent = '💾 Update Password';
    }
  },

  showMessage(element, message, type) {
    element.innerHTML = `
      <div class="message-box ${type}">
        ${type === 'success' ? '✓' : '❌'} ${message}
      </div>
    `;
  }
};

// Make Security available globally
window.Security = Security;
