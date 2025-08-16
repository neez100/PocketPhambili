// ==================== GLOBAL VARIABLES ====================
let currentUser = localStorage.getItem("currentUser");
let expenses = [];
let savingsGoals = [];
let income = 0;
let expenseChartInstance = null;

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", () => {
    loadUserData();
    setupEventListeners();
    applySavedTheme();
});

function setupEventListeners() {
    // Expense related
    document.getElementById("addExpenseBtn")?.addEventListener("click", addExpense);
    document.getElementById("income")?.addEventListener("change", updateIncome);

    // Goals related
    document.getElementById("addGoalBtn")?.addEventListener("click", addGoal);

    // Data operations
    document.getElementById("saveDataBtn")?.addEventListener("click", saveData);
    document.getElementById("loadDataBtn")?.addEventListener("click", loadData);
    document.getElementById("exportCSVBtn")?.addEventListener("click", exportCSV);
    document.getElementById("clearDataBtn")?.addEventListener("click", clearData);

    // Import/Export
    document.getElementById("importDataBtn")?.addEventListener("click", importBudgetData);
    document.getElementById("downloadTemplateBtn")?.addEventListener("click", downloadTemplate);
    document.getElementById("excelFile")?.addEventListener("change", handleFileImport);

    // Chart
    document.getElementById("chartType")?.addEventListener("change", updateChart);

    // Dark mode
    document.getElementById("darkModeToggle")?.addEventListener("click", toggleDarkMode);
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastHeader = toastEl?.querySelector('.toast-header');
    const toastBody = toastEl?.querySelector('.toast-body');

    if (!toastEl || !toastBody) {
        alert(message);
        return;
    }

    // Set message
    toastBody.textContent = message;

    // Set appropriate colors based on type
    const typeColors = {
        success: { bg: 'bg-success', text: 'text-white' },
        error: { bg: 'bg-danger', text: 'text-white' },
        warning: { bg: 'bg-warning', text: 'text-dark' },
        info: { bg: 'bg-info', text: 'text-white' }
    };

    // Reset classes
    toastHeader.classList.remove(
        'bg-success', 'bg-danger', 'bg-warning', 'bg-info',
        'text-white', 'text-dark'
    );

    // Add new classes
    if (typeColors[type]) {
        toastHeader.classList.add(typeColors[type].bg, typeColors[type].text);
    }

    // Show toast
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// ==================== DARK MODE ====================
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateDarkModeButton();

    // Force redraw of toasts when mode changes
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
        toastEl.style.display = 'none';
        setTimeout(() => {
            toastEl.style.display = 'block';
        }, 10);
    }
}

function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        document.body.classList.remove("light-mode");
    } else {
        document.body.classList.add("light-mode");
        document.body.classList.remove("dark-mode");
    }
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
    updateDarkModeButton();
}

function updateDarkModeButton() {
    const btn = document.getElementById("darkModeToggle");
    if (!btn) return;
    btn.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
}


// ==================== DATA MANAGEMENT ====================
function loadUserData() {
    if (!currentUser) return;
    const data = JSON.parse(localStorage.getItem(`budgetData_${currentUser}`)) || {};
    expenses = data.expenses || [];
    savingsGoals = data.savingsGoals || [];
    income = data.income || 0;
    updateUI();
}

function saveUserData() {
    if (!currentUser) return;
    const data = { expenses, savingsGoals, income };
    localStorage.setItem(`budgetData_${currentUser}`, JSON.stringify(data));
    showToast("Data saved successfully");
}

// ==================== EXPENSE FUNCTIONS ====================
function addExpense() {
    const category = document.getElementById("category").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);

    if (!category || isNaN(amount)) {
        showToast("Please fill in all expense fields");
        return;
    }

    expenses.push({
        date: new Date().toLocaleDateString(),
        name: category,
        amount: amount,
        category: category
    });

    saveUserData();
    updateUI();
    document.getElementById("category").value = "";
    document.getElementById("amount").value = "";
}

function updateIncome() {
    income = parseFloat(document.getElementById("income").value) || 0;
    saveUserData();
    updateUI();
}

// ==================== GOAL FUNCTIONS ====================
function addGoal() {
    const name = document.getElementById("goalName").value.trim();
    const amount = parseFloat(document.getElementById("goalAmount").value);

    if (!name || isNaN(amount)) {
        showToast("Please fill in goal details");
        return;
    }

    savingsGoals.push({ name, amount, current: 0 });
    saveUserData();
    updateUI();
    document.getElementById("goalName").value = "";
    document.getElementById("goalAmount").value = "";
}

// ==================== UI UPDATES ====================
function updateUI() {
    renderExpenses();
    renderGoals();
    updateTotals();
    updateChart();
    generateAdvice();
}

function renderExpenses() {
    const list = document.getElementById("expenses");
    if (!list) return;

    list.innerHTML = expenses.map(exp => `
        <li class="list-group-item">
            <span>${exp.date} - ${exp.name}</span>
            <span class="badge bg-danger rounded-pill">R${exp.amount.toFixed(2)}</span>
        </li>
    `).join("");
}

function renderGoals() {
    const container = document.getElementById("goals-container");
    if (!container) return;

    container.innerHTML = savingsGoals.map(goal => `
        <div class="card mb-2">
            <div class="card-body">
                <h5 class="card-title">${goal.name}</h5>
                <p>Target: R${goal.amount.toFixed(2)}</p>
                <div class="progress">
                    <div class="progress-bar" role="progressbar"
                         style="width: ${(goal.current / goal.amount * 100)}%">
                    </div>
                </div>
            </div>
        </div>
    `).join("");
}

function updateTotals() {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const balance = income - totalExpenses;
    const tax = calculateTax(income);

    document.getElementById("total-income").textContent = `R${income.toFixed(2)}`;
    document.getElementById("total-expenses").textContent = `R${totalExpenses.toFixed(2)}`;
    document.getElementById("balance").textContent = `R${balance.toFixed(2)}`;
    document.getElementById("tax").textContent = `R${tax.toFixed(2)}`;
}

function calculateTax(income) {
    // Simplified tax calculation for South Africa
    if (income <= 205900) return income * 0.18;
    if (income <= 321600) return 37062 + (income - 205900) * 0.26;
    if (income <= 445100) return 67144 + (income - 321600) * 0.31;
    if (income <= 584200) return 105429 + (income - 445100) * 0.36;
    if (income <= 744800) return 155505 + (income - 584200) * 0.39;
    if (income <= 1577300) return 218139 + (income - 744800) * 0.41;
    return 559464 + (income - 1577300) * 0.45;
}

// ==================== CHART FUNCTIONS ====================
function updateChart() {
    const ctx = document.getElementById("expenseChart");
    if (!ctx) return;

    const categories = {};
    expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });

    const chartType = document.getElementById("chartType")?.value || "pie";

    if (expenseChartInstance) {
        expenseChartInstance.destroy();
    }

    expenseChartInstance = new Chart(ctx, {
        type: chartType,
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#8AC24A', '#F06292'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ==================== IMPORT/EXPORT ====================
function importBudgetData() {
    const fileInput = document.getElementById("excelFile");
    if (fileInput.files.length === 0) {
        showToast("Please select a file first");
        return;
    }
    handleFileImport({ target: fileInput });
}

function handleFileImport(e) {
    const file = e.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length > 0 && confirm(`Import ${jsonData.length} records?`)) {
            expenses = jsonData.map(item => ({
                date: item.Date || new Date().toLocaleDateString(),
                name: item.Category || "Unknown",
                amount: parseFloat(item.Amount) || 0,
                category: item.Category || "General"
            }));

            saveUserData();
            updateUI();
            showToast(`${jsonData.length} expenses imported`);
        }
    };

    reader.readAsArrayBuffer(file);
}

function exportCSV() {
    if (expenses.length === 0) {
        showToast("No expenses to export");
        return;
    }

    const csvContent = [
        ["Date", "Category", "Amount"],
        ...expenses.map(exp => [exp.date, exp.category, exp.amount])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    showToast("CSV exported successfully");
}

function downloadTemplate() {
    const template = "Date,Category,Amount\n2023-01-01,Rent,5000\n2023-01-02,Groceries,1200";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Budget_Template.csv";
    link.click();
    showToast("Template downloaded");
}

// ==================== DATA OPERATIONS ====================
function saveData() {
    saveUserData();
}

function loadData() {
    loadUserData();
    showToast("Data loaded");
}

function clearData() {
    if (confirm("Are you sure you want to clear all data?")) {
        expenses = [];
        savingsGoals = [];
        income = 0;
        saveUserData();
        updateUI();
        showToast("All data cleared");
    }
}

// ==================== DARK MODE ====================
function toggleDarkMode() {
    const newTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    updateDarkModeButton();
}

function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        document.body.classList.remove("light-mode");
    } else {
        document.body.classList.add("light-mode");
        document.body.classList.remove("dark-mode");
    }
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
    updateDarkModeButton();
}

function updateDarkModeButton() {
    const btn = document.getElementById("darkModeToggle");
    if (!btn) return;
    btn.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// ==================== BUDGET ADVICE ====================
function generateAdvice() {
    const adviceEl = document.getElementById("advice");
    if (!adviceEl) return;

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const balance = income - totalExpenses;

    let advice = "";

    if (balance < 0) {
        advice = "⚠️ You're overspending! Consider reducing expenses in non-essential categories.";
    } else if (balance > income * 0.2) {
        advice = "✅ Great job! You're saving more than 20% of your income.";
    } else {
        advice = "💡 You're within budget. Consider increasing savings if possible.";
    }

    adviceEl.innerHTML = advice;
}

// ==================== UTILITIES ====================
function showToast(message) {
    const toastEl = document.getElementById("liveToast");
    const toastBody = toastEl.querySelector(".toast-body");
    if (toastEl && toastBody) {
        toastBody.textContent = message;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    } else {
        alert(message);
    }
}