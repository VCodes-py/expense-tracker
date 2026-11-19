document.addEventListener('DOMContentLoaded', () => {
    // API Base URL
    const API_BASE = 'http://localhost/expense_tracker/api';

    // Elements
    const addModal = document.getElementById('addExpenseModal');
    const openAddModalBtn = document.getElementById('openAddModalBtn');
    const closeAddModalBtn = document.getElementById('closeAddModalBtn');
    const cancelAddBtn = document.getElementById('cancelAddBtn');
    const addExpenseForm = document.getElementById('addExpenseForm');
    const categorySelect = document.getElementById('category');
    
    // SPA Elements
    const navLinks = document.querySelectorAll('.nav-link');
    const viewSections = document.querySelectorAll('.view-section');

    // Settings Elements
    const addCategoryForm = document.getElementById('addCategoryForm');
    const currencyOverrideSelect = document.getElementById('currencyOverride');

    // Auth Elements
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const userAvatar = document.getElementById('userAvatar');

    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();

    // Chart instances
    let trendChartInstance = null;
    let categoryChartInstance = null;
    let barChartInstance = null;

    // State
    let categories = [];
    let currencyCode = 'USD'; // Will be overridden on init

    // --- Initialization ---
    init();

    async function init() {
        initTheme();
        initCurrency();
        initNavigation();
        initSettings();
        initNotifications();
        initAuth();
        
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
            await fetchCategories();
            refreshDashboard();
        }
    }

    // --- Auth Logic ---
    function initAuth() {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
            loginError.textContent = '';
            registerError.textContent = '';
        });

        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
            loginError.textContent = '';
            registerError.textContent = '';
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            loginError.textContent = '';

            try {
                const response = await fetch(`${API_BASE}/auth/login.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (response.ok) {
                    await handleLoginSuccess();
                } else {
                    loginError.textContent = data.message || 'Login failed';
                }
            } catch (error) {
                loginError.textContent = 'Network error occurred';
            }
        });

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            registerError.textContent = '';

            try {
                const response = await fetch(`${API_BASE}/auth/register.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await response.json();

                if (response.ok) {
                    await handleLoginSuccess();
                } else {
                    registerError.textContent = data.message || 'Registration failed';
                }
            } catch (error) {
                registerError.textContent = 'Network error occurred';
            }
        });

        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`${API_BASE}/auth/logout.php`, { method: 'POST' });
                handleLogout();
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }

    async function checkAuth() {
        try {
            const response = await fetch(`${API_BASE}/auth/me.php`);
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    showApp(data.user);
                    return true;
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
        showAuth();
        return false;
    }

    async function handleLoginSuccess() {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
            await fetchCategories();
            refreshDashboard();
        }
    }

    function handleLogout() {
        showAuth();
        // Clear forms
        loginForm.reset();
        registerForm.reset();
    }

    function showApp(user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        sidebarUserName.textContent = user.username;
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0D8ABC&color=fff`;
    }

    function showAuth() {
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }

    // --- Notifications Logic ---
    function initNotifications() {
        const notifBtn = document.getElementById('notificationBtn');
        const notifDropdown = document.getElementById('notificationsDropdown');
        const clearBtn = document.getElementById('clearNotificationsBtn');
        const badge = document.getElementById('notificationBadge');

        if (notifBtn && notifDropdown) {
            notifBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notifDropdown.classList.toggle('active');
                if (notifDropdown.classList.contains('active')) {
                    badge.style.display = 'none'; // mark as read
                }
            });

            document.addEventListener('click', (e) => {
                if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
                    notifDropdown.classList.remove('active');
                }
            });

            clearBtn.addEventListener('click', () => {
                const listEl = document.getElementById('notificationsList');
                listEl.innerHTML = '<div class="empty-state" style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 14px;">No new notifications</div>';
                badge.style.display = 'none';
            });
        }
    }

    function generateSmartAlerts(data) {
        const alerts = [];
        const todayStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        if (data.total_this_month && parseFloat(data.total_this_month) > 0) {
            alerts.push({
                icon: 'insights',
                text: `You've tracked ${formatCurrency(data.total_this_month)} in expenses so far this month.`,
                time: todayStr
            });
        }

        if (data.largest_expense && data.largest_expense.amount) {
            alerts.push({
                icon: 'warning',
                text: `Heads up! Your largest single expense was ${formatCurrency(data.largest_expense.amount)} for ${data.largest_expense.description || 'an item'}.`,
                time: todayStr
            });
        }

        if (data.category_breakdown && data.category_breakdown.length > 0) {
            alerts.push({
                icon: 'pie_chart',
                text: `Your top spending category is currently ${data.category_breakdown[0].category}.`,
                time: todayStr
            });
        }

        const listEl = document.getElementById('notificationsList');
        const badge = document.getElementById('notificationBadge');
        if(!listEl || !badge) return;

        if (alerts.length === 0) {
            listEl.innerHTML = '<div class="empty-state" style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 14px;">No new notifications</div>';
            return;
        }

        listEl.innerHTML = '';
        alerts.forEach(alert => {
            listEl.innerHTML += `
                <div class="notification-item">
                    <div class="icon"><span class="material-icons">${alert.icon}</span></div>
                    <div class="content">
                        <p>${alert.text}</p>
                        <span>${alert.time}</span>
                    </div>
                </div>
            `;
        });

        // Show badge
        badge.textContent = alerts.length;
        badge.style.display = 'block';
    }

    // --- Theme Logic ---
    function initTheme() {
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const themeIcon = document.getElementById('themeIcon');
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                setTheme(newTheme);
                refreshDashboard(); // Recreate charts
            });
        }
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        }
    }

    // --- Currency by Region / Settings ---
    function getLocalCurrency() {
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            if (timeZone.includes('Kolkata') || timeZone.includes('Calcutta') || timeZone.includes('Colombo')) return 'INR';
            if (timeZone.includes('London')) return 'GBP';
            if (timeZone.includes('Europe') && !timeZone.includes('London')) return 'EUR';
            if (timeZone.includes('Sydney') || timeZone.includes('Melbourne') || timeZone.includes('Australia')) return 'AUD';
            if (timeZone.includes('Toronto') || timeZone.includes('Vancouver')) return 'CAD';
        } catch (e) {}
        return 'USD'; // default
    }

    function initCurrency() {
        const savedCurrency = localStorage.getItem('currencyOverride');
        if (savedCurrency && savedCurrency !== 'AUTO') {
            currencyCode = savedCurrency;
            currencyOverrideSelect.value = savedCurrency;
        } else {
            currencyCode = getLocalCurrency();
            currencyOverrideSelect.value = 'AUTO';
        }
    }

    function initSettings() {
        currencyOverrideSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            localStorage.setItem('currencyOverride', val);
            initCurrency();
            refreshDashboard(); // Re-render with new currency
        });

        addCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('saveCategoryBtn');
            btn.innerHTML = 'Saving...';
            btn.disabled = true;

            const formData = new FormData(addCategoryForm);
            const data = {
                name: formData.get('name'),
                color: formData.get('color'),
                icon: formData.get('icon')
            };

            try {
                const response = await fetch(`${API_BASE}/categories/create.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    addCategoryForm.reset();
                    await fetchCategories(); // Refresh list
                    alert('Category added successfully!');
                } else {
                    alert('Failed to add category.');
                }
            } catch (error) {
                console.error(error);
                alert('Server error.');
            } finally {
                btn.innerHTML = 'Save Category';
                btn.disabled = false;
            }
        });
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode
        }).format(amount);
    }

    // --- Navigation ---
    function initNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                
                // Update active link
                navLinks.forEach(nav => nav.classList.remove('active'));
                link.classList.add('active');

                // Update active section
                viewSections.forEach(section => {
                    section.classList.remove('active');
                    section.style.display = 'none'; // reset inline if any
                });
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    targetSection.style.display = 'block'; // Or let CSS handle it
                }
            });
        });
    }

    // --- Modal Logic ---
    function openModal(isEdit = false) {
        addModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const title = document.getElementById('expenseModalTitle');
        const submitBtn = document.getElementById('saveExpenseBtn');
        if (isEdit) {
            if(title) title.textContent = 'Edit Expense';
            if(submitBtn) submitBtn.textContent = 'Update Expense';
        } else {
            if(title) title.textContent = 'Add New Expense';
            if(submitBtn) submitBtn.textContent = 'Save Expense';
            addExpenseForm.reset();
            const idField = document.getElementById('expenseId');
            if(idField) idField.value = '';
            document.getElementById('date').valueAsDate = new Date();
        }
    }

    function closeModal() {
        addModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    openAddModalBtn.addEventListener('click', () => openModal(false));
    closeAddModalBtn.addEventListener('click', closeModal);
    cancelAddBtn.addEventListener('click', closeModal);
    
    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) closeModal();
    });

    // --- Form Submission ---
    addExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addExpenseForm);
        const expenseId = formData.get('id');
        const data = {
            amount: formData.get('amount'),
            category_id: formData.get('category_id'),
            date: formData.get('date'),
            description: formData.get('description')
        };
        
        const url = expenseId ? `${API_BASE}/expenses/update.php` : `${API_BASE}/expenses/create.php`;
        if (expenseId) data.id = expenseId;

        try {
            const btn = document.getElementById('saveExpenseBtn');
            btn.innerHTML = 'Saving...';
            btn.disabled = true;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                closeModal();
                refreshDashboard();
            } else {
                alert('Failed to save expense.');
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Error connecting to the server.');
        } finally {
            const btn = document.getElementById('saveExpenseBtn');
            btn.innerHTML = document.getElementById('expenseId') && document.getElementById('expenseId').value ? 'Update Expense' : 'Save Expense';
            btn.disabled = false;
        }
    });

    // --- Data Fetching & Rendering ---
    async function fetchCategories() {
        try {
            const response = await fetch(`${API_BASE}/categories/read.php`);
            if (response.status === 401) { handleLogout(); return; }
            if (response.ok) {
                const data = await response.json();
                categories = data.records || [];
                populateCategoryDropdown();
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }

    function populateCategoryDropdown() {
        categorySelect.innerHTML = '<option value="" disabled selected>Select a category</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    }

    async function refreshDashboard() {
        fetchInsights();
        fetchTransactions();
    }

    async function fetchInsights() {
        try {
            const response = await fetch(`${API_BASE}/expenses/insights.php`);
            if (response.status === 401) { handleLogout(); return; }
            if (response.ok) {
                const data = await response.json();
                updateSummaryCards(data);
                renderTrendChart(data.daily_trend);
                renderCategoryChart(data.category_breakdown);
                renderBarChart(data.category_breakdown);
                
                // Deep dive metrics
                updateAnalyticsMetrics(data);
                renderDeepDive(data.sub_distribution);
                
                // Smart Alerts
                generateSmartAlerts(data);
            }
        } catch (error) {
            console.error('Error fetching insights:', error);
        }
    }

    function updateSummaryCards(data) {
        const totalAmount = parseFloat(data.total_this_month || 0);
        document.getElementById('totalMonthAmount').textContent = formatCurrency(totalAmount);
        
        const today = new Date();
        const daysElapsed = today.getDate() || 1;
        const avgDaily = totalAmount / daysElapsed;
        document.getElementById('avgDailyAmount').textContent = formatCurrency(avgDaily);
    }

    function updateAnalyticsMetrics(data) {
        const largestExp = data.largest_expense;
        const largestAmtEl = document.getElementById('largestExpenseAmount');
        const largestDescEl = document.getElementById('largestExpenseDesc');
        
        if (largestExp && largestExp.amount) {
            largestAmtEl.textContent = formatCurrency(parseFloat(largestExp.amount));
            const date = new Date(largestExp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            largestDescEl.textContent = `${largestExp.description || 'General'} • ${date}`;
        } else {
            largestAmtEl.textContent = '$0.00';
            largestDescEl.textContent = 'No expenses yet';
        }

        const topCatNameEl = document.getElementById('topCategoryName');
        const topCatAmtEl = document.getElementById('topCategoryAmount');
        
        if (data.category_breakdown && data.category_breakdown.length > 0) {
            const topCat = data.category_breakdown[0]; // Already sorted by total DESC
            topCatNameEl.textContent = topCat.category;
            topCatAmtEl.textContent = formatCurrency(parseFloat(topCat.total));
        } else {
            topCatNameEl.textContent = 'N/A';
            topCatAmtEl.textContent = '$0.00';
        }
    }

    function renderDeepDive(subDist) {
        const listEl = document.getElementById('deepDiveList');
        if (!subDist || Object.keys(subDist).length === 0) {
            listEl.innerHTML = '<div class="loading-state">No category data available.</div>';
            return;
        }

        listEl.innerHTML = '';
        for (const [category, items] of Object.entries(subDist)) {
            const catTotal = items.reduce((sum, item) => sum + parseFloat(item.total), 0);
            
            let itemsHtml = '';
            items.forEach(item => {
                itemsHtml += `
                    <div class="deep-dive-item">
                        <span class="item-desc">${item.description}</span>
                        <span>${formatCurrency(parseFloat(item.total))}</span>
                    </div>
                `;
            });

            const catEl = document.createElement('div');
            catEl.className = 'deep-dive-category';
            catEl.innerHTML = `
                <div class="deep-dive-header">
                    <span>${category}</span>
                    <span>${formatCurrency(catTotal)}</span>
                </div>
                ${itemsHtml}
            `;
            listEl.appendChild(catEl);
        }
    }

    async function fetchTransactions() {
        const recentListEl = document.getElementById('recentTransactionsList');
        const allListEl = document.getElementById('allTransactionsList');
        
        try {
            const response = await fetch(`${API_BASE}/expenses/read.php`);
            if (response.status === 401) { handleLogout(); return; }
            if (response.ok) {
                const data = await response.json();
                const records = data.records || [];
                
                if (records.length === 0) {
                    recentListEl.innerHTML = '<div class="loading-state">No transactions found.</div>';
                    if (allListEl) allListEl.innerHTML = '<div class="loading-state">No transactions found.</div>';
                    return;
                }

                recentListEl.innerHTML = '';
                if (allListEl) allListEl.innerHTML = '';
                
                records.forEach((exp, index) => {
                    if (index < 5) recentListEl.appendChild(createTransactionElement(exp));
                    if (allListEl) allListEl.appendChild(createTransactionElement(exp));
                });
            } else {
                recentListEl.innerHTML = '<div class="loading-state">Failed to load transactions.</div>';
                if (allListEl) allListEl.innerHTML = '<div class="loading-state">Failed to load transactions.</div>';
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            recentListEl.innerHTML = '<div class="loading-state">Error connecting to server.</div>';
        }
    }

    function createTransactionElement(exp) {
        const dateObj = new Date(exp.date);
        const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        
        const el = document.createElement('div');
        el.className = 'transaction-item';
        el.innerHTML = `
            <div class="tx-left">
                <div class="tx-icon" style="background-color: ${exp.category.color}">
                    <span class="material-icons">${exp.category.icon || 'category'}</span>
                </div>
                <div class="tx-details">
                    <h4>${exp.category.name}</h4>
                    <p>${exp.description ? exp.description + ' • ' : ''}${formattedDate}</p>
                </div>
            </div>
            <div class="tx-right">
                <div class="tx-amount">-${formatCurrency(parseFloat(exp.amount))}</div>
                <div class="transaction-actions">
                    <button class="action-btn edit" title="Edit"><span class="material-icons" style="font-size: 18px;">edit</span></button>
                    <button class="action-btn delete" title="Delete"><span class="material-icons" style="font-size: 18px;">delete</span></button>
                </div>
            </div>
        `;

        const editBtn = el.querySelector('.edit');
        const deleteBtn = el.querySelector('.delete');
        if (editBtn) editBtn.addEventListener('click', () => editTransaction(exp));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deleteTransaction(exp.id));

        return el;
    }

    function editTransaction(exp) {
        openModal(true);
        document.getElementById('expenseId').value = exp.id;
        document.getElementById('amount').value = parseFloat(exp.amount);
        document.getElementById('category').value = exp.category.id || exp.category_id; // handle nested or flat depending on response
        // Ensure date is yyyy-mm-dd
        const d = new Date(exp.date);
        document.getElementById('date').value = d.toISOString().split('T')[0];
        document.getElementById('description').value = exp.description || '';
    }

    async function deleteTransaction(id) {
        if (!confirm("Are you sure you want to permanently delete this expense?")) return;
        
        try {
            const response = await fetch(`${API_BASE}/expenses/delete.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });

            if (response.ok) {
                refreshDashboard();
            } else {
                alert('Failed to delete expense.');
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Error connecting to the server.');
        }
    }

    // --- Chart Rendering ---
    
    function renderTrendChart(trendData) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#9CA3AF' : '#6B7280';
        const gridColor = isDark ? '#374151' : '#E5E7EB';
        const tooltipBg = isDark ? '#1F2937' : '#111827';
        
        const ctx = document.getElementById('trendChart').getContext('2d');
        if (trendChartInstance) trendChartInstance.destroy();

        const labels = trendData.map(item => {
            const d = new Date(item.date);
            return `${d.getMonth()+1}/${d.getDate()}`;
        });
        const data = trendData.map(item => parseFloat(item.total));

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
        gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

        trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Expenses',
                    data: data,
                    borderColor: '#4F46E5',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#4F46E5',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        padding: 12,
                        titleFont: { family: 'Inter', size: 13 },
                        bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                        displayColors: false,
                        callbacks: { label: function(c) { return formatCurrency(c.parsed.y); } }
                    }
                },
                scales: {
                    x: { grid: { display: false, drawBorder: false }, ticks: { font: { family: 'Inter', size: 12 }, color: textColor } },
                    y: { grid: { color: gridColor, drawBorder: false, borderDash: [5, 5] }, ticks: { font: { family: 'Inter', size: 12 }, color: textColor, callback: function(v) { return formatCurrency(v); } }, beginAtZero: true }
                }
            }
        });
    }

    function renderCategoryChart(categoryData) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const tooltipBg = isDark ? '#1F2937' : '#111827';
        const textColor = isDark ? '#F9FAFB' : '#111827';

        const ctx = document.getElementById('categoryChart').getContext('2d');
        if (categoryChartInstance) categoryChartInstance.destroy();

        if (!categoryData || categoryData.length === 0) return;

        const labels = categoryData.map(item => item.category);
        const data = categoryData.map(item => parseFloat(item.total));
        const colors = categoryData.map(item => item.color);

        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 13 }, color: textColor } },
                    tooltip: { backgroundColor: tooltipBg, padding: 12, bodyFont: { family: 'Inter', size: 14 }, callbacks: { label: function(c) { return ' ' + formatCurrency(c.parsed); } } }
                }
            }
        });
    }

    function renderBarChart(categoryData) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#9CA3AF' : '#6B7280';
        const gridColor = isDark ? '#374151' : '#E5E7EB';
        const tooltipBg = isDark ? '#1F2937' : '#111827';

        const barCanvas = document.getElementById('barChart');
        if(!barCanvas) return;
        const ctx = barCanvas.getContext('2d');
        
        if (barChartInstance) barChartInstance.destroy();
        if (!categoryData || categoryData.length === 0) return;

        const labels = categoryData.map(item => item.category);
        const data = categoryData.map(item => parseFloat(item.total));
        const colors = categoryData.map(item => item.color);

        barChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Spent',
                    data: data,
                    backgroundColor: colors,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: tooltipBg, padding: 12, bodyFont: { family: 'Inter', size: 14 }, callbacks: { label: function(c) { return ' ' + formatCurrency(c.parsed.y); } } }
                },
                scales: {
                    x: { grid: { display: false, drawBorder: false }, ticks: { font: { family: 'Inter', size: 12 }, color: textColor } },
                    y: { grid: { color: gridColor, drawBorder: false, borderDash: [5, 5] }, ticks: { font: { family: 'Inter', size: 12 }, color: textColor, callback: function(v) { return formatCurrency(v); } }, beginAtZero: true }
                }
            }
        });
    }
});
