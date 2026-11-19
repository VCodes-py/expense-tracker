# 🎯 Trackr — Expense Tracker Application

> A full-stack **Single Page Application (SPA)** for personal expense management with authentication, analytics, smart alerts, and multi-currency support.

---

## 📌 Project Overview

| Attribute | Detail |
|---|---|
| **App Name** | Trackr |
| **Type** | Full-Stack SPA |
| **Frontend** | HTML5 + Vanilla JS + CSS3 + Chart.js |
| **Backend** | PHP 7+ REST API |
| **Database** | MySQL (via PDO) |
| **Server** | XAMPP (Apache + MySQL) |
| **Auth** | Session-based (bcrypt hashing) |

---

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph "Browser (Client)"
        UI["index.html<br/>Single Page App"]
        JS["app.js<br/>832 lines — SPA Logic"]
        CSS["styles.css<br/>Theming & Layout"]
        CJ["Chart.js<br/>Data Visualization"]
    end

    subgraph "XAMPP Server"
        subgraph "REST API (PHP)"
            AUTH["Auth API<br/>login / register / me / logout"]
            EXP["Expenses API<br/>CRUD + Insights"]
            CAT["Categories API<br/>read / create"]
        end
        CFG["database.php<br/>PDO Connection"]
    end

    DB[("MySQL<br/>expense_tracker DB")]

    UI --> JS
    JS --> CSS
    JS --> CJ
    JS -- "fetch() JSON" --> AUTH
    JS -- "fetch() JSON" --> EXP
    JS -- "fetch() JSON" --> CAT
    AUTH --> CFG
    EXP --> CFG
    CAT --> CFG
    CFG --> DB
```

---

## 📂 File Structure

```mermaid
graph LR
    ROOT["expense_tracker/"] --> IDX["index.html"]
    ROOT --> DBSQL["database.sql"]
    ROOT --> CSSDIR["css/"]
    ROOT --> JSDIR["js/"]
    ROOT --> APIDIR["api/"]

    CSSDIR --> STY["styles.css"]
    JSDIR --> APP["app.js"]

    APIDIR --> CFGDIR["config/"]
    APIDIR --> AUTHDIR["auth/"]
    APIDIR --> EXPDIR["expenses/"]
    APIDIR --> CATDIR["categories/"]

    CFGDIR --> DBPHP["database.php"]
    AUTHDIR --> LOGIN["login.php"]
    AUTHDIR --> REG["register.php"]
    AUTHDIR --> ME["me.php"]
    AUTHDIR --> LOGOUT["logout.php"]
    EXPDIR --> ECREATE["create.php"]
    EXPDIR --> EREAD["read.php"]
    EXPDIR --> EUPDATE["update.php"]
    EXPDIR --> EDELETE["delete.php"]
    EXPDIR --> EINSIGHT["insights.php"]
    CATDIR --> CCREATE["create.php"]
    CATDIR --> CREAD["read.php"]
```

---

## 🗃️ Database Schema (ER Diagram)

```mermaid
erDiagram
    USERS {
        INT id PK
        VARCHAR username UK
        VARCHAR email UK
        VARCHAR password_hash
        TIMESTAMP created_at
    }
    CATEGORIES {
        INT id PK
        INT user_id FK
        VARCHAR name
        VARCHAR color
        VARCHAR icon
    }
    EXPENSES {
        INT id PK
        INT user_id FK
        DECIMAL amount
        DATE date
        VARCHAR description
        INT category_id FK
        TIMESTAMP created_at
    }

    USERS ||--o{ EXPENSES : "has many"
    USERS ||--o{ CATEGORIES : "owns custom"
    CATEGORIES ||--o{ EXPENSES : "classifies"
```

> **Key Points:**
> - `categories.user_id` can be `NULL` → shared default categories (Housing, Food, Transport, etc.)
> - User-created categories are private (`user_id = owner`)
> - All expenses are scoped to `user_id` for multi-user isolation
> - Cascade deletes ensure cleanup when a user is removed

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Frontend (app.js)
    participant A as Auth API (PHP)
    participant S as PHP Session
    participant D as MySQL

    Note over U,D: === Page Load ===
    U->>F: Opens app
    F->>A: GET /auth/me.php
    A->>S: Check $_SESSION['user_id']
    alt Session exists
        S-->>A: user_id found
        A-->>F: {authenticated: true, user: {...}}
        F->>U: Show Dashboard
    else No session
        S-->>A: No user_id
        A-->>F: {authenticated: false}
        F->>U: Show Login Screen
    end

    Note over U,D: === Login ===
    U->>F: Submit email + password
    F->>A: POST /auth/login.php {email, password}
    A->>D: SELECT user WHERE email = ?
    D-->>A: User row
    A->>A: password_verify(input, hash)
    alt Password match
        A->>S: Store user_id, username, email
        A-->>F: 200 {user: {...}}
        F->>U: Show Dashboard + load data
    else Wrong password
        A-->>F: 401 {message: "Incorrect"}
        F->>U: Show error
    end

    Note over U,D: === Register ===
    U->>F: Submit username + email + password
    F->>A: POST /auth/register.php
    A->>D: Check duplicate email/username
    A->>D: INSERT user (bcrypt hash)
    A->>S: Auto-login via session
    A-->>F: 201 {user: {...}}
    F->>U: Show Dashboard
```

---

## 🧭 SPA Navigation Flow

```mermaid
stateDiagram-v2
    [*] --> AuthScreen: Page Load

    AuthScreen --> Dashboard: Login/Register Success
    Dashboard --> Transactions: Click "Transactions"
    Dashboard --> Analytics: Click "Analytics"
    Dashboard --> Settings: Click "Settings"

    Transactions --> Dashboard: Click "Dashboard"
    Transactions --> Analytics: Click "Analytics"
    Transactions --> Settings: Click "Settings"

    Analytics --> Dashboard: Click "Dashboard"
    Analytics --> Transactions: Click "Transactions"
    Analytics --> Settings: Click "Settings"

    Settings --> Dashboard: Click "Dashboard"
    Settings --> Transactions: Click "Transactions"
    Settings --> Analytics: Click "Analytics"

    Dashboard --> AuthScreen: Logout
    Transactions --> AuthScreen: Logout
    Analytics --> AuthScreen: Logout
    Settings --> AuthScreen: Logout
```

> Navigation works by toggling `display: none/block` on `view-section` divs — no page reloads.

---

## 🔌 REST API Endpoints

| Method | Endpoint | Auth? | Purpose |
|--------|----------|-------|---------|
| `POST` | `/api/auth/register.php` | ❌ | Create new user account |
| `POST` | `/api/auth/login.php` | ❌ | Authenticate & start session |
| `GET` | `/api/auth/me.php` | ✅ | Check current session |
| `POST` | `/api/auth/logout.php` | ✅ | Destroy session |
| `GET` | `/api/categories/read.php` | ✅ | List all categories |
| `POST` | `/api/categories/create.php` | ✅ | Add custom category |
| `POST` | `/api/expenses/create.php` | ✅ | Add new expense |
| `GET` | `/api/expenses/read.php` | ✅ | List user expenses |
| `POST` | `/api/expenses/update.php` | ✅ | Edit existing expense |
| `POST` | `/api/expenses/delete.php` | ✅ | Remove expense |
| `GET` | `/api/expenses/insights.php` | ✅ | Analytics & aggregations |

---

## 📊 Expense CRUD Flow

```mermaid
flowchart TD
    A["User clicks 'Add Expense'"] --> B["Modal opens"]
    B --> C["Fill: Amount, Category, Date, Description"]
    C --> D{"Has expense ID?"}
    D -- No --> E["POST /expenses/create.php"]
    D -- Yes --> F["POST /expenses/update.php"]
    E --> G["Server validates & inserts"]
    F --> H["Server validates & updates"]
    G --> I["refreshDashboard()"]
    H --> I
    I --> J["Fetch insights + transactions"]
    J --> K["Re-render charts, cards, lists"]

    L["User clicks Delete 🗑️"] --> M["confirm() dialog"]
    M -- Yes --> N["POST /expenses/delete.php"]
    N --> I
    M -- No --> O["Cancel"]
```

---

## 📈 Insights Engine (insights.php)

The insights endpoint aggregates **5 data points** in a single call:

```mermaid
flowchart LR
    subgraph "insights.php"
        Q1["Total This Month<br/>SUM where month=current"]
        Q2["Category Breakdown<br/>SUM grouped by category"]
        Q3["Daily Trend<br/>SUM per day, last 30 days"]
        Q4["Largest Expense<br/>ORDER BY amount DESC LIMIT 1"]
        Q5["Sub-Distribution<br/>GROUP BY category + description"]
    end

    Q1 --> R["JSON Response"]
    Q2 --> R
    Q3 --> R
    Q4 --> R
    Q5 --> R

    R --> C1["Summary Cards"]
    R --> C2["Line Chart (trend)"]
    R --> C3["Doughnut Chart (categories)"]
    R --> C4["Bar Chart (analytics)"]
    R --> C5["Deep Dive List"]
    R --> C6["Smart Notifications"]
```

---

## 🎨 Key Features Summary

### 1. Split-Screen Authentication
- Premium SaaS-style login/register with visual branding panel
- Form toggle animation between Login ↔ Register

### 2. Dashboard View
- **Summary Cards**: Total monthly expenses, average daily spend
- **Trend Chart**: Line chart of last 30 days (gradient fill)
- **Category Doughnut**: Proportional spending breakdown
- **Recent Transactions**: Last 5 entries with edit/delete

### 3. Transactions View
- Complete scrollable list of all user expenses
- Each row shows category icon, color, amount, date, description
- Inline edit & delete actions

### 4. Analytics View
- Largest single expense highlight
- Top spending category card
- Bar chart comparing all categories
- **Category Deep Dive**: Sub-distribution showing individual items within each category

### 5. Settings View
- Add custom categories (name + color + Material Icon)
- Currency override (USD, EUR, GBP, INR, AUD, CAD)
- Auto-detect currency by timezone

### 6. Smart Notifications 🔔
- Auto-generated alerts based on spending data
- Monthly total tracker, largest expense warning, top category insight

### 7. Dark Mode 🌙
- One-click toggle with `data-theme` attribute
- Persisted in `localStorage`
- Charts re-render with theme-appropriate colors

---

## 🔒 Security Features

| Feature | Implementation |
|---|---|
| Password Hashing | `password_hash()` with `PASSWORD_BCRYPT` |
| Password Verification | `password_verify()` |
| SQL Injection Prevention | PDO Prepared Statements with `bindParam` |
| XSS Prevention | `htmlspecialchars(strip_tags())` on inputs |
| Session-based Auth | `$_SESSION` with server-side validation |
| Data Isolation | All queries filtered by `user_id` |
| Cascade Deletes | FK constraints with `ON DELETE CASCADE` |

---

## 🔄 Application Lifecycle

```mermaid
flowchart TD
    START["Page Load"] --> INIT["init()"]
    INIT --> TH["initTheme()"]
    INIT --> CUR["initCurrency()"]
    INIT --> NAV["initNavigation()"]
    INIT --> SET["initSettings()"]
    INIT --> NOT["initNotifications()"]
    INIT --> AU["initAuth()"]
    INIT --> CHK{"checkAuth()"}

    CHK -- "Authenticated" --> SHOW["showApp(user)"]
    CHK -- "Not Auth" --> LOGIN["showAuth()"]

    SHOW --> FETCH["fetchCategories()"]
    FETCH --> DASH["refreshDashboard()"]
    DASH --> INS["fetchInsights()"]
    DASH --> TXN["fetchTransactions()"]

    INS --> CARDS["Update Summary Cards"]
    INS --> CHARTS["Render 3 Charts"]
    INS --> ALERTS["Generate Smart Alerts"]
    INS --> DEEP["Render Deep Dive"]

    TXN --> RECENT["Render Recent List"]
    TXN --> ALLLIST["Render All Transactions"]
```

---

## 🛠️ Tech Stack Diagram

```mermaid
graph TB
    subgraph "Presentation Layer"
        HTML["HTML5<br/>Semantic structure"]
        CSS3["CSS3<br/>Custom properties, dark mode"]
        ICONS["Material Icons<br/>Google Fonts"]
        INTER["Inter Font<br/>Google Fonts"]
    end

    subgraph "Logic Layer"
        VANJS["Vanilla JavaScript<br/>ES6+ async/await"]
        CHARTJS["Chart.js<br/>Line, Doughnut, Bar charts"]
        INTL["Intl API<br/>Currency formatting"]
        LS["localStorage<br/>Theme & currency prefs"]
    end

    subgraph "Server Layer"
        PHP["PHP 7+<br/>REST API endpoints"]
        PDO["PDO<br/>Database abstraction"]
        SESSION["PHP Sessions<br/>Authentication state"]
    end

    subgraph "Data Layer"
        MYSQL["MySQL<br/>3 tables: users, categories, expenses"]
    end

    HTML --> VANJS
    CSS3 --> HTML
    ICONS --> HTML
    INTER --> HTML
    VANJS --> CHARTJS
    VANJS --> INTL
    VANJS --> LS
    VANJS -- "fetch() API" --> PHP
    PHP --> PDO
    PHP --> SESSION
    PDO --> MYSQL
```

---

## 🚀 How to Run

1. **Start XAMPP** → Enable Apache + MySQL
2. **Import Database** → Run `database.sql` in phpMyAdmin
3. **Open Browser** → Navigate to `http://localhost/expense_tracker/`
4. **Register** → Create an account and start tracking!

---

> **Total Codebase**: ~17 files | Frontend SPA (~17K HTML + ~33K JS + ~19K CSS) | Backend REST API (11 PHP files) | 1 SQL schema
