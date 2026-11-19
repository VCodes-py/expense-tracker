# Trackr - Personal Expense Tracker & Insights

A modern, responsive personal finance and expense tracking web application built with PHP, MySQL, Vanilla JavaScript, and Chart.js. Features a sleek split-screen authentication UI, interactive analytics, budget breakdown, and multi-user support.

---

## ✨ Features

- **Split-Screen Authentication**: Modern, responsive login and registration interface with real-time feedback and secure password hashing (`PASSWORD_BCRYPT`).
- **Personal Dashboard**: User-isolated tracking—each registered user sees only their own financial data and categories.
- **Expense Management**: Add, view, edit, and delete daily expenses with date, category, payment method, and notes.
- **Smart Analytics & Insights**: Interactive visual charts powered by Chart.js (expense distribution, monthly trends, spending breakdowns).
- **Custom Categories**: Organize transactions with default and personalized spending categories.
- **Dark Mode Support**: Seamless toggle between light and dark themes.

---

## 🛠️ Tech Stack

- **Backend**: PHP (REST-like API endpoints, PDO database abstraction, Session-based auth)
- **Database**: MySQL / MariaDB
- **Frontend**: HTML5, CSS3 (Modern Flexbox & CSS Grid, responsive design), Vanilla JavaScript (SPA architecture)
- **Libraries**: [Chart.js](https://www.chartjs.org/) for data visualization, Google Fonts & Material Icons

---

## 🚀 Getting Started

### Prerequisites

- [XAMPP](https://www.apachefriends.org/) (Apache + MySQL/MariaDB + PHP 7.4 or higher)
- A modern web browser

### Installation & Setup

1. **Clone or copy the project into XAMPP `htdocs`**:
   ```bash
   # If cloning into C:\xampp\htdocs\expense_tracker
   cd C:\xampp\htdocs
   git clone https://github.com/VCodes-py/expense-tracker.git expense_tracker
   ```

2. **Start Services in XAMPP Control Panel**:
   - Start **Apache**
   - Start **MySQL**

3. **Import Database**:
   - Open your browser and go to `http://localhost/phpmyadmin/`
   - Create a new database named `expense_tracker`
   - Click on the **Import** tab and choose the `database.sql` file provided in this repository
   - Click **Go** to run the schema import

4. **Verify Database Configuration**:
   - Check `api/config/database.php` to ensure MySQL host, database name, username (`root`), and password match your local environment.

5. **Launch the App**:
   - Visit [http://localhost/expense_tracker/](http://localhost/expense_tracker/) in your browser.
   - Register a new account and start tracking your finances!

---

## 📁 Project Structure

```text
expense_tracker/
├── api/
│   ├── auth/          # Login, Register, Logout, and Session endpoints
│   ├── categories/    # Category CRUD endpoints
│   ├── config/        # Database connection configuration (PDO)
│   └── expenses/      # Expense CRUD and Analytics endpoints
├── css/
│   └── styles.css     # Responsive UI styling & dark/light theme definitions
├── js/
│   └── app.js         # Single Page Application (SPA) frontend controller
├── database.sql       # MySQL schema and initial setup data
├── index.html         # Main application and authentication interface
└── README.md          # Project documentation
```

---

## 🔒 Security Highlights

- **Bcrypt Password Hashing**: Passwords are never stored in plain text.
- **Prepared Statements**: Uses PDO parameterized queries throughout the API to prevent SQL Injection.
- **Session-Based Isolation**: Access controls verify authenticated sessions before serving user-specific financial data.
