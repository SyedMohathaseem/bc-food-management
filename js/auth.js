/**
 * BC Food Subscription App - Authentication Module
 * Handles admin login, session management, and security
 */

const Auth = {
  // Storage keys
  KEYS: {
    ADMIN: 'bc_admin_credentials',
    SESSION: 'bc_admin_session',
    LOGIN_ATTEMPTS: 'bc_login_attempts',
    CREDENTIAL_LOG: 'bc_credential_log'
  },

  // Configuration
  CONFIG: {
    SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes in ms
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes lockout
    SALT_ROUNDS: 10
  },

  // Activity timer
  activityTimer: null,

  // =====================================================
  // Initialization
  // =====================================================

  /**
   * Initialize auth - create default admin if not exists
   */
  async init() {
    // Create default admin if first time
    if (!this.getAdminCredentials()) {
      await this.createDefaultAdmin();
    }

    // Start activity tracking if logged in
    if (this.isLoggedIn()) {
      this.startActivityTimer();
      this.updateLastActivity();
    }
  },

  /**
   * Create default admin credentials
   */
  async createDefaultAdmin() {
    const defaultEmail = 'admin@bcfood.com';
    const defaultPassword = 'Admin@123';
    
    // Hash the password
    const hashedPassword = await this.hashPassword(defaultPassword);
    
    const admin = {
      email: defaultEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(this.KEYS.ADMIN, JSON.stringify(admin));
    console.log('Default admin created. Email: admin@bcfood.com, Password: Admin@123');
  },

  // =====================================================
  // Password Hashing (using simple hash for localStorage)
  // In production, use bcryptjs with proper backend
  // =====================================================

  /**
   * Hash password using SHA-256 + salt
   * Note: For production, use bcryptjs on a server
   */
  async hashPassword(password) {
    const salt = this.generateSalt();
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return salt + ':' + hashHex;
  },

  /**
   * Verify password against hash
   */
  async verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hash === hashHex;
  },

  /**
   * Generate random salt
   */
  generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  },

  // =====================================================
  // Login / Logout
  // =====================================================

  /**
   * Attempt to login
   * @returns {Object} { success: boolean, message: string }
   */
  async login(email, password) {
    // Check lockout
    const lockoutStatus = this.checkLockout();
    if (lockoutStatus.locked) {
      return {
        success: false,
        message: `Too many failed attempts. Try again in ${lockoutStatus.remainingMinutes} minutes.`
      };
    }

    // Get admin credentials
    const admin = this.getAdminCredentials();
    if (!admin) {
      return { success: false, message: 'System error. Please contact support.' };
    }

    // Verify email
    if (email.toLowerCase() !== admin.email.toLowerCase()) {
      this.recordFailedAttempt();
      return { success: false, message: 'Invalid email or password.' };
    }

    // Verify password
    const passwordValid = await this.verifyPassword(password, admin.password);
    if (!passwordValid) {
      this.recordFailedAttempt();
      const attempts = this.getLoginAttempts();
      const remaining = this.CONFIG.MAX_LOGIN_ATTEMPTS - attempts.count;
      
      if (remaining > 0) {
        return { 
          success: false, 
          message: `Invalid email or password. ${remaining} attempts remaining.` 
        };
      } else {
        return { 
          success: false, 
          message: 'Too many failed attempts. Please try again in 15 minutes.' 
        };
      }
    }

    // Success - create session
    this.clearLoginAttempts();
    this.createSession(email);
    this.startActivityTimer();
    
    return { success: true, message: 'Welcome back!' };
  },

  /**
   * Logout current session
   */
  logout() {
    this.clearSession();
    this.stopActivityTimer();
    window.location.href = 'login.html';
  },

  /**
   * Force logout (after credential change)
   */
  forceLogout(message = 'Your session has expired. Please login again.') {
    this.clearSession();
    this.stopActivityTimer();
    sessionStorage.setItem('bc_logout_message', message);
    window.location.href = 'login.html';
  },

  // =====================================================
  // Session Management
  // =====================================================

  /**
   * Create new session
   */
  createSession(email) {
    const session = {
      email: email,
      token: this.generateSessionToken(),
      createdAt: new Date().toISOString(),
      lastActivity: Date.now()
    };
    localStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
  },

  /**
   * Get current session
   */
  getSession() {
    try {
      const session = localStorage.getItem(this.KEYS.SESSION);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  },

  /**
   * Clear session
   */
  clearSession() {
    localStorage.removeItem(this.KEYS.SESSION);
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    const session = this.getSession();
    if (!session) return false;

    // Check if session expired
    const lastActivity = session.lastActivity || 0;
    const now = Date.now();
    
    if (now - lastActivity > this.CONFIG.SESSION_TIMEOUT) {
      this.clearSession();
      return false;
    }

    return true;
  },

  /**
   * Update last activity timestamp
   */
  updateLastActivity() {
    const session = this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      localStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
    }
  },

  /**
   * Generate session token
   */
  generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  },

  // =====================================================
  // Activity Timer (Auto-logout)
  // =====================================================

  /**
   * Start activity timer for auto-logout
   */
  startActivityTimer() {
    this.stopActivityTimer();
    
    // Check every minute
    this.activityTimer = setInterval(() => {
      if (!this.isLoggedIn()) {
        this.forceLogout('Your session has expired due to inactivity.');
      }
    }, 60000);

    // Track user activity
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => this.updateLastActivity(), { passive: true });
    });
  },

  /**
   * Stop activity timer
   */
  stopActivityTimer() {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  },

  // =====================================================
  // Login Attempts Tracking
  // =====================================================

  /**
   * Get login attempts data
   */
  getLoginAttempts() {
    try {
      const data = localStorage.getItem(this.KEYS.LOGIN_ATTEMPTS);
      return data ? JSON.parse(data) : { count: 0, lastAttempt: 0, lockedUntil: 0 };
    } catch {
      return { count: 0, lastAttempt: 0, lockedUntil: 0 };
    }
  },

  /**
   * Record failed login attempt
   */
  recordFailedAttempt() {
    const attempts = this.getLoginAttempts();
    attempts.count++;
    attempts.lastAttempt = Date.now();

    if (attempts.count >= this.CONFIG.MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + this.CONFIG.LOCKOUT_DURATION;
    }

    localStorage.setItem(this.KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
  },

  /**
   * Clear login attempts
   */
  clearLoginAttempts() {
    localStorage.removeItem(this.KEYS.LOGIN_ATTEMPTS);
  },

  /**
   * Check if account is locked out
   */
  checkLockout() {
    const attempts = this.getLoginAttempts();
    
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      return { locked: true, remainingMinutes: remaining };
    }

    // Reset if lockout expired
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      this.clearLoginAttempts();
    }

    return { locked: false };
  },

  // =====================================================
  // Credential Management
  // =====================================================

  /**
   * Get admin credentials
   */
  getAdminCredentials() {
    try {
      const data = localStorage.getItem(this.KEYS.ADMIN);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get admin email (for display)
   */
  getAdminEmail() {
    const admin = this.getAdminCredentials();
    return admin ? admin.email : '';
  },

  /**
   * Get masked email for display
   */
  getMaskedEmail() {
    const email = this.getAdminEmail();
    if (!email) return '';
    
    const [local, domain] = email.split('@');
    const maskedLocal = local.substring(0, 2) + '***';
    return maskedLocal + '@' + domain;
  },

  /**
   * Change admin email
   * @param {string} newEmail 
   * @param {string} currentPassword - For verification
   */
  async changeEmail(newEmail, currentPassword) {
    const admin = this.getAdminCredentials();
    if (!admin) {
      return { success: false, message: 'System error. Please try again.' };
    }

    // Verify current password
    const passwordValid = await this.verifyPassword(currentPassword, admin.password);
    if (!passwordValid) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    // Validate new email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    // Update email
    admin.email = newEmail.toLowerCase();
    admin.lastUpdated = new Date().toISOString();
    localStorage.setItem(this.KEYS.ADMIN, JSON.stringify(admin));

    // Log the change
    this.logCredentialChange('email');

    return { 
      success: true, 
      message: 'Email updated successfully! Please login with your new email.' 
    };
  },

  /**
   * Change admin password
   * @param {string} currentPassword 
   * @param {string} newPassword 
   */
  async changePassword(currentPassword, newPassword) {
    const admin = this.getAdminCredentials();
    if (!admin) {
      return { success: false, message: 'System error. Please try again.' };
    }

    // Verify current password
    const passwordValid = await this.verifyPassword(currentPassword, admin.password);
    if (!passwordValid) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    // Validate new password strength
    const validation = this.validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    // Hash and update password
    const hashedPassword = await this.hashPassword(newPassword);
    admin.password = hashedPassword;
    admin.lastUpdated = new Date().toISOString();
    localStorage.setItem(this.KEYS.ADMIN, JSON.stringify(admin));

    // Log the change
    this.logCredentialChange('password');

    return { 
      success: true, 
      message: 'Password changed successfully! Please login with your new password.' 
    };
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number.' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character.' };
    }
    return { valid: true };
  },

  /**
   * Calculate password strength score (0-4)
   */
  getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    return Math.min(score, 4);
  },

  /**
   * Log credential changes
   */
  logCredentialChange(type) {
    const logs = this.getCredentialLogs();
    logs.push({
      type: type,
      timestamp: new Date().toISOString(),
      session: this.getSession()?.token?.substring(0, 8) || 'unknown'
    });
    
    // Keep only last 10 logs
    const recentLogs = logs.slice(-10);
    localStorage.setItem(this.KEYS.CREDENTIAL_LOG, JSON.stringify(recentLogs));
  },

  /**
   * Get credential change logs
   */
  getCredentialLogs() {
    try {
      const data = localStorage.getItem(this.KEYS.CREDENTIAL_LOG);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // =====================================================
  // Route Protection
  // =====================================================

  /**
   * Check if current page requires auth and redirect if needed
   */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  /**
   * Redirect to dashboard if already logged in (for login page)
   */
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = 'index.html';
      return true;
    }
    return false;
  }
};

// Make Auth available globally
window.Auth = Auth;
