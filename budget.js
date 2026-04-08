let budgetState = {
    budget: 0,
    expenses: []
};

document.addEventListener('DOMContentLoaded', () => {
    initBudget();
});

function initBudget() {
    // Load from local storage
    const savedState = localStorage.getItem('smartsaver_budget');
    if (savedState) {
        budgetState = JSON.parse(savedState);
    }
    
    updateBudgetUI();
    
    const setBudgetBtn = document.getElementById('set-budget-btn');
    if(setBudgetBtn) {
        setBudgetBtn.addEventListener('click', () => {
            const newBudget = prompt("Enter your monthly budget limit (₹):", budgetState.budget || 0);
            if (newBudget !== null && !isNaN(newBudget) && newBudget > 0) {
                budgetState.budget = parseFloat(newBudget);
                saveBudgetState();
                updateBudgetUI();
            }
        });
    }

    const expenseForm = document.getElementById('expense-form');
    if(expenseForm) {
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const descInput = document.getElementById('expense-desc').value;
            const amountInput = parseFloat(document.getElementById('expense-amount').value);
            
            if (descInput && amountInput > 0) {
                budgetState.expenses.push({
                    id: Date.now(),
                    desc: descInput,
                    amount: amountInput,
                    date: new Date().toLocaleDateString()
                });
                
                document.getElementById('expense-form').reset();
                saveBudgetState();
                updateBudgetUI();
            }
        });
    }
}

function saveBudgetState() {
    localStorage.setItem('smartsaver_budget', JSON.stringify(budgetState));
}

function updateBudgetUI() {
    const totalSpent = budgetState.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budgetState.budget - totalSpent;
    
    document.getElementById('total-budget-display').textContent = `₹${budgetState.budget.toFixed(2)}`;
    document.getElementById('total-spent-display').textContent = `₹${totalSpent.toFixed(2)}`;
    
    const remainingEl = document.getElementById('remaining-budget-display');
    remainingEl.textContent = remaining >= 0 ? `₹${remaining.toFixed(2)}` : `-₹${Math.abs(remaining).toFixed(2)}`;
    
    if (remaining < 0) {
        remainingEl.style.color = 'var(--accent-red)';
    } else {
        remainingEl.style.color = 'var(--text-primary)';
    }
    
    const progressFill = document.getElementById('budget-progress-fill');
    let percent = budgetState.budget > 0 ? (totalSpent / budgetState.budget) * 100 : 0;
    if (percent > 100) percent = 100;
    
    progressFill.style.width = `${percent}%`;
    if (percent > 90) {
        progressFill.style.background = 'var(--gradient-danger)';
    } else if (percent > 75) {
        progressFill.style.background = 'var(--gradient-warning)';
    } else {
        progressFill.style.background = 'var(--gradient-primary)';
    }
    
    renderExpenses();
}

function renderExpenses() {
    const list = document.getElementById('budget-expenses-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (budgetState.expenses.length === 0) {
        list.innerHTML = '<p class="empty-state">No expenses yet. Add one above!</p>';
        return;
    }
    
    // Sort array descending (newest first)
    const sorted = [...budgetState.expenses].sort((a,b) => b.id - a.id);
    
    sorted.forEach(exp => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        // Give varying icons just for aesthetics based on description content
        let iconClass = 'fa-receipt';
        let iconColor = 'var(--accent-purple)';
        let bgStyle = 'rgba(139, 92, 246, 0.1)';
        
        const descLower = exp.desc.toLowerCase();
        if(descLower.includes('food') || descLower.includes('burger') || descLower.includes('grocery')) {
            iconClass = 'fa-burger'; iconColor = 'var(--accent-orange)'; bgStyle = 'rgba(245, 158, 11, 0.1)';
        } else if(descLower.includes('car') || descLower.includes('gas') || descLower.includes('uber')) {
            iconClass = 'fa-car'; iconColor = 'var(--accent-blue)'; bgStyle = 'rgba(59, 130, 246, 0.1)';
        } else if(descLower.includes('game') || descLower.includes('movie') || descLower.includes('fun')) {
            iconClass = 'fa-gamepad'; iconColor = 'var(--accent-pink)'; bgStyle = 'rgba(236, 72, 153, 0.1)';
        }

        item.innerHTML = `
            <div class="expense-info">
                <div class="expense-icon" style="color: ${iconColor}; background: ${bgStyle};">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <div>
                    <div class="expense-desc">${exp.desc}</div>
                    <div class="expense-date">${exp.date}</div>
                </div>
            </div>
            <div class="expense-amount-val">-₹${exp.amount.toFixed(2)}</div>
        `;
        list.appendChild(item);
    });
}
