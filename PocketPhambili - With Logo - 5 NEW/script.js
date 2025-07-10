const currentUser = JSON.parse(localStorage.getItem('currentUser'));

let totalIncome = 0;
let totalExpenses = 0;
let expenses = [];
let history = [];
let goals = [];
let chart = null;

// Initialize the app
window.onload = () => {
  initDarkMode();
  loadGoals();
  loadData();
  
  document.getElementById("income").addEventListener("change", function() {
    const newIncome = parseFloat(this.value);
    if (!isNaN(newIncome)) {
      totalIncome = newIncome;
      updateUI();
      showRecommendations();
    }
  });
};

// Dark Mode Functions
function initDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  
  const darkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) {
    body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️ Light Mode';
  }

  darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    darkModeToggle.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    if (chart) updateChart();
  });
}

// Expense Functions
function addExpense() {
  const incomeInput = document.getElementById("income");
  const category = document.getElementById("category").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const expenseList = document.getElementById("expenses");

  const incomeVal = parseFloat(incomeInput.value);
  if (!validateInput(incomeVal, 1, null, "Monthly income")) return;
  totalIncome = incomeVal;

  if (!category || !validateInput(amount, 1, totalIncome, "Expense amount")) {
    return;
  }

  const existingExpense = expenses.find(e => e.category.toLowerCase() === category.toLowerCase());
  if (existingExpense) {
    if (!confirm(`${category} already exists. Add to existing amount?`)) return;
    existingExpense.amount += amount;
  } else {
    expenses.push({ category, amount });
  }

  totalExpenses += amount;

  const li = document.createElement("li");
  li.className = "list-group-item";
  li.innerHTML = `<span>${category}</span><span>R ${amount.toFixed(2)}</span>`;
  expenseList.appendChild(li);

  updateUI();
  updateChart();
  showRecommendations();
  document.getElementById("category").value = "";
  document.getElementById("amount").value = "";
}

function updateUI() {
  const currentIncome = parseFloat(document.getElementById("income").value) || 0;
  totalIncome = currentIncome;
  
  document.getElementById("total-income").textContent = `R ${totalIncome.toFixed(2)}`;
  document.getElementById("total-expenses").textContent = `R ${totalExpenses.toFixed(2)}`;
  document.getElementById("balance").textContent = `R ${(totalIncome - totalExpenses).toFixed(2)}`;
  
  const annualIncome = totalIncome * 12;
  const annualTax = calculateTax(annualIncome);
  const monthlyTax = annualTax / 12;
  document.getElementById("tax").textContent = `R ${monthlyTax.toFixed(2)}`;
}

function calculateTax(annualIncome) {
  const brackets = [
    { min: 0, max: 237100, rate: 0.18 },
    { min: 237101, max: 370500, rate: 0.26 },
    { min: 370501, max: 512800, rate: 0.31 },
    { min: 512801, max: 673000, rate: 0.36 },
    { min: 673001, max: 857900, rate: 0.39 },
    { min: 857901, max: 1817000, rate: 0.41 },
    { min: 1817001, max: Infinity, rate: 0.45 }
  ];
  
  let tax = 0;
  for (const bracket of brackets) {
    if (annualIncome > bracket.min) {
      const taxable = Math.min(annualIncome, bracket.max) - bracket.min;
      tax += taxable * bracket.rate;
    }
  }
  return tax;
}

// Chart Functions
function updateChart() {
  // Ensure Chart.js is available globally
  if (typeof window.Chart === "undefined") {
    showToast("Chart.js library is not loaded. Please include Chart.js via a <script> tag.");
    return;
  }
  const ctx = document.getElementById("expenseChart").getContext("2d");
  const labels = [...new Set(expenses.map(e => e.category))];
  const data = labels.map(label =>
    expenses.filter(e => e.category === label).reduce((sum, e) => sum + e.amount, 0)
  );

  const isDarkMode = document.body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#f8f9fa' : '#666';
  const type = document.getElementById("chartType")?.value || "pie";

  if (chart) chart.destroy();
  chart = new window.Chart(ctx, {
    type: type,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ["#00796b", "#f44336", "#2196f3", "#ff9800", "#9c27b0", "#4caf50"],
      }],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      }
    }
  });
}

// Data Management
function saveData() {
  if (!currentUser) return;
  
  const date = new Date().toISOString().slice(0, 7);
  const monthData = {
    date,
    income: parseFloat(document.getElementById("income").value) || 0,
    expenses: [...expenses],
    total: totalExpenses
  };

  // Save monthData to the current user's budgets in localStorage
  const users = JSON.parse(localStorage.getItem('budgetUsers')) || [];
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  if (userIndex !== -1) {
    if (!Array.isArray(users[userIndex].budgets)) {
      users[userIndex].budgets = [];
    }
    users[userIndex].budgets.push(monthData);
    localStorage.setItem('budgetUsers', JSON.stringify(users));
    showToast("Budget data saved successfully");
  }
}

// Expose functions to global scope for HTML event handlers and to avoid "never read" warnings
window.loadData = loadData;
window.clearData = clearData;
window.loadGoals = loadGoals;
window.addGoal = addGoal;
window.addToGoal = addToGoal;
window.deleteGoal = deleteGoal;
window.importBudgetData = importBudgetData;
window.downloadTemplate = downloadTemplate;
window.exportCSV = exportCSV;
window.validateInput = validateInput;
window.updateHistory = updateHistory;
window.addExpense = addExpense;
window.showToast = showToast;

function loadData() {
  if (!currentUser) return;
  
  const users = JSON.parse(localStorage.getItem('budgetUsers')) || [];
  const user = users.find(u => u.id === currentUser.id);
  
  if (!user || user.budgets.length === 0) {
    showToast("No saved data found");
    return;
  }
  
  // Load most recent budget
  const mostRecentBudget = user.budgets[user.budgets.length - 1];
  
  totalIncome = mostRecentBudget.income || 0;
  expenses = mostRecentBudget.expenses || [];
  totalExpenses = mostRecentBudget.total || 0;

  document.getElementById("income").value = totalIncome;
  document.getElementById("expenses").innerHTML = "";
  
  expenses.forEach(expense => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `<span>${expense.category}</span><span>R ${expense.amount.toFixed(2)}</span>`;
    document.getElementById("expenses").appendChild(li);
  });

  updateUI();
  updateChart();
  showRecommendations();
  showToast("Data loaded successfully");
}

function clearData() {
  if (confirm("Clear all data?")) {
    totalIncome = 0;
    totalExpenses = 0;
    expenses = [];
    goals = [];
    document.getElementById("income").value = "";
    document.getElementById("category").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("expenses").innerHTML = "";
    document.getElementById("goals-container").innerHTML = '<p class="text-muted">No goals added yet</p>';
    document.getElementById("advice").innerHTML = "";
    updateUI();
    if (chart) chart.destroy();
    localStorage.removeItem("budgetData");
    localStorage.removeItem("budgetGoals");
    showToast("All data cleared");
  }
}

// Goals Functions
function loadGoals() {
  const savedGoals = localStorage.getItem('budgetGoals');
  if (savedGoals) {
    goals = JSON.parse(savedGoals);
    renderGoals();
  }
}

function saveGoals() {
  localStorage.setItem('budgetGoals', JSON.stringify(goals));
}

function addGoal() {
  const nameInput = document.getElementById('goalName');
  const amountInput = document.getElementById('goalAmount');
  const name = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);
  
  if (!name || isNaN(amount)) {
    showToast('Please enter valid goal details');
    return;
  }
  
  const goal = {
    id: Date.now(),
    name,
    target: amount,
    saved: 0
  };
  
  goals.push(goal);
  saveGoals();
  renderGoals();
  nameInput.value = '';
  amountInput.value = '';
  showToast('Goal added successfully!');
}

function addToGoal(goalId) {
  const input = document.getElementById(`add-${goalId}`);
  const amount = parseFloat(input.value);
  
  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid amount');
    return;
  }
  
  const goal = goals.find(g => g.id === goalId);
  if (goal) {
    goal.saved += amount;
    saveGoals();
    renderGoals();
    input.value = '';
    showToast(`Added R${amount.toFixed(2)} to ${goal.name}`);
  }
}

function deleteGoal(goalId) {
  if (confirm('Are you sure you want to delete this goal?')) {
    goals = goals.filter(goal => goal.id !== goalId);
    saveGoals();
    renderGoals();
    showToast('Goal deleted successfully');
  }
}

function renderGoals() {
  const container = document.getElementById('goals-container');
  container.innerHTML = '';
  
  if (goals.length === 0) {
    container.innerHTML = '<p class="text-muted">No goals added yet</p>';
    return;
  }
  
  goals.forEach(goal => {
    const progress = Math.min((goal.saved / goal.target) * 100, 100);
    const card = document.createElement('div');
    card.className = 'card mb-3';
    card.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <h5 class="card-title">${goal.name}</h5>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteGoal(${goal.id})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
        <p class="card-text">
          R${goal.saved.toFixed(2)} saved of R${goal.target.toFixed(2)}
          (${progress.toFixed(1)}%)
        </p>
        <div class="progress mb-3">
          <div class="progress-bar" role="progressbar" style="width: ${progress}%"></div>
        </div>
        <div class="input-group">
          <input type="number" id="add-${goal.id}" class="form-control" placeholder="Amount to add" min="0">
          <button class="btn btn-success" onclick="addToGoal(${goal.id})">Add</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Import/Export Functions
function importBudgetData() {
  const fileInput = document.getElementById('excelFile');
  const file = fileInput.files[0];
  
  if (!file) {
    showToast('Please select a file first');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = e.target.result;
    if (file.name.endsWith('.csv')) {
      // ArrayBuffer to string for CSV
      const decoder = new TextDecoder("utf-8");
      const csvText = decoder.decode(data);
      processCSVData(csvText);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // XLSX can accept ArrayBuffer directly
      processExcelData(data);
    } else {
      showToast('Unsupported file format');
    }
  };

  // Use readAsArrayBuffer for both CSV and Excel files
  reader.readAsArrayBuffer(file);
}

function processCSVData(csvData) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  if (!headers.includes('Category') || !headers.includes('Amount')) {
    showToast('Invalid CSV format. Please use the template.');
    return;
  }
  
  expenses = [];
  document.getElementById('expenses').innerHTML = '';
  totalExpenses = 0;
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const values = lines[i].split(',');
    const category = values[0].trim();
    const amount = parseFloat(values[1].trim());
    
    if (category && !isNaN(amount)) {
      expenses.push({ category, amount });
      totalExpenses += amount;
      
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.innerHTML = `<span>${category}</span><span>R ${amount.toFixed(2)}</span>`;
      document.getElementById('expenses').appendChild(li);
    }
  }
  
  updateUI();
  updateChart();
  showToast(`Imported ${expenses.length} expenses from CSV`);
}

// Excel processing function moved outside processCSVData
function processExcelData(excelData) {
  try {
    const workbook = XLSX.read(excelData, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    expenses = [];
    document.getElementById('expenses').innerHTML = '';
    totalExpenses = 0;
    
    jsonData.forEach(row => {
      if (row.Category && !isNaN(row.Amount)) {
        expenses.push({ 
          category: row.Category.toString().trim(), 
          amount: parseFloat(row.Amount) 
        });
        totalExpenses += parseFloat(row.Amount);
        
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `<span>${row.Category}</span><span>R ${parseFloat(row.Amount).toFixed(2)}</span>`;
        document.getElementById('expenses').appendChild(li);
      }
    });
    
    updateUI();
    updateChart();
    showToast(`Imported ${expenses.length} expenses from Excel`);
  } catch (error) {
    showToast('Error processing Excel file: ' + error.message);
  }
}

function downloadTemplate() {
  const csvContent = "Category,Amount\nRent,5000\nGroceries,2000\nTransport,800\nUtilities,1200";
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Budget_Template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function exportCSV() {
  let csv = "Category,Amount(ZAR)\n";
  expenses.forEach(e => {
    csv += `${e.category},${e.amount}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "budget_data.csv";
  link.click();
}

// Helper Functions
function showToast(message) {
  const toast = new bootstrap.Toast(document.getElementById('liveToast'));
  const toastBody = document.querySelector('.toast-body');
  toastBody.textContent = message;
  toast.show();
}

function validateInput(value, min, max, fieldName) {
  if (isNaN(value) || value < min) {
    alert(`${fieldName} must be at least ${min}`);
    return false;
  }
  if (max && value > max) {
    alert(`${fieldName} must be less than ${max}`);
    return false;
  }
  return true;
}

function showRecommendations() {
  const savings = totalIncome - totalExpenses;
  const savingsPercentage = (savings / totalIncome) * 100;
  
  let recommendation = "";
  if (savingsPercentage < 10) {
    recommendation = "⚠️ Your savings are low. Consider reducing expenses.";
  } else if (savingsPercentage > 20) {
    recommendation = "✅ Good savings rate!";
  } else {
    recommendation = "🆗 Your budget looks balanced.";
  }
  
  document.getElementById("advice").innerHTML = `
    <strong>Budget Advice:</strong> ${recommendation}<br>
    <small>Savings: R${savings.toFixed(2)} (${savingsPercentage.toFixed(1)}% of income)</small>
  `;
}

function updateHistory() {
  const historyList = document.getElementById("history");
  historyList.innerHTML = "";
  history.forEach(entry => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${entry.date}: Income R${entry.income.toFixed(2)}, Expenses R${entry.total.toFixed(2)}`;
    historyList.appendChild(li);
  });
}
