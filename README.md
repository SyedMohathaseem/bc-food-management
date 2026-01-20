# Inas Cafe Management

A complete, commercial-ready web application for daily food subscription billing and extra item invoicing.

## 🌟 Features

### Admin Panel
- **Dashboard** - Overview stats, quick actions, today's summary
- **Customer Management** - Add, edit, delete customers with subscription details
- **Menu & Extras** - Manage food items by category (Breakfast, Lunch, Dinner)
- **Daily Extras Entry** - Record daily extra items with auto-price fill
- **Invoice Generation** - Monthly invoices with date-wise breakdown
- **Security Settings** - Change email/password with secure authentication

### Security Features
- Secure password hashing (SHA-256 + salt)
- Session-based authentication
- Auto-logout after 15 minutes of inactivity
- Login attempt tracking with lockout
- Protected admin routes

## 🚀 Getting Started

### Default Login Credentials
- **Email**: admin@inascafe.com
- **Password**: Admin@123

> ⚠️ Change these immediately after first login!

### How to Use
1. Open `login.html` in your browser
2. Login with the default credentials
3. Start managing your food subscription business!

## 📁 Project Structure

```
BC Maintanence/
├── index.html          # Main admin panel
├── login.html          # Admin login page
├── css/
│   └── styles.css      # Complete design system
└── js/
    ├── auth.js         # Authentication module
    ├── database.js     # LocalStorage data layer
    ├── app.js          # Main application logic
    ├── customers.js    # Customer management
    ├── menu.js         # Menu items management
    ├── extras.js       # Daily extras entry
    ├── invoice.js      # Invoice generation
    └── security.js     # Security settings
```

## 🎨 UI/UX

- **Mobile-first** responsive design
- **Orange (#FA8112) & White** premium color theme
- Clean sidebar navigation
- Large touch targets for mobile
- Toast notifications for feedback
- Confirmation dialogs for critical actions

## 💾 Data Storage

This app uses **localStorage** for data persistence. All data is stored locally in the browser:
- Customer records
- Menu items
- Daily extra entries
- Admin credentials (hashed)
- Session data

## 🔒 Security Notes

- Passwords are hashed using SHA-256 with random salt
- Sessions expire after 15 minutes of inactivity
- Failed login attempts are tracked (5 max before lockout)
- All admin routes are protected

## 📝 License

This project is for commercial use by Inas Cafe Services.

---

Built with ❤️ using Vanilla HTML, CSS, and JavaScript
