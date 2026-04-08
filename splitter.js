let splitState = {
    transactions: []
};

document.addEventListener('DOMContentLoaded', () => {
    initSplitter();
});

function initSplitter() {
    const saved = localStorage.getItem('splitsmart_splits');
    if (saved) {
        splitState = JSON.parse(saved);
    }
    
    updateSplitterUI();
    
    const form = document.getElementById('split-form');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const desc = document.getElementById('split-desc').value.trim();
            const amount = parseFloat(document.getElementById('split-amount').value);
            const payer = document.getElementById('split-payer').value.trim();
            const participantsStr = document.getElementById('split-participants').value;
            
            let participants = participantsStr.split(',').map(p => p.trim()).filter(p => p !== '');
            
            if (desc && amount > 0 && payer && participants.length > 0) {
                const splitAmount = amount / participants.length;
                
                let transaction = {
                    id: Date.now(),
                    desc,
                    total: amount,
                    payer: payer,
                    participants,
                    splitAmount,
                    date: new Date().toLocaleDateString(),
                    isPayment: false
                };
                
                splitState.transactions.push(transaction);
                saveSplitState();
                updateSplitterUI();
                form.reset();
                if (typeof currentUser !== 'undefined' && currentUser) {
                    document.getElementById('split-payer').value = currentUser.name;
                    document.getElementById('split-participants').value = currentUser.name + ', ';
                }
            } else {
                alert("Please ensure all fields are filled out correctly.");
            }
        });
    }

    setTimeout(() => {
        if (typeof currentUser !== 'undefined' && currentUser) {
            const payerInput = document.getElementById('split-payer');
            const partsInput = document.getElementById('split-participants');
            if (payerInput && !payerInput.value) payerInput.value = currentUser.name;
            if (partsInput && !partsInput.value) partsInput.value = currentUser.name + ', ';
        }
    }, 500);
}

window.markAsPaid = function(from, to, amount) {
    if(!confirm(`Mark ₹${amount.toFixed(2)} as paid from ${from} to ${to}?`)) return;
    
    splitState.transactions.push({
        id: Date.now(),
        desc: "Debt Settlement",
        total: amount,
        payer: from,
        participants: [to],
        splitAmount: amount, // 'to' owes 'from' the split amount, balancing it out
        date: new Date().toLocaleDateString(),
        isPayment: true
    });
    
    saveSplitState();
    updateSplitterUI();
}

function saveSplitState() {
    localStorage.setItem('splitsmart_splits', JSON.stringify(splitState));
}

function updateSplitterUI() {
    renderSettlements();
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('split-history-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (splitState.transactions.length === 0) {
        list.innerHTML = '<p class="empty-state">No recorded expenses.</p>';
        return;
    }
    
    const sorted = [...splitState.transactions].sort((a,b) => b.id - a.id);
    
    sorted.forEach(exp => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        item.style.marginBottom = '8px';
        
        let iconClass = exp.isPayment ? 'fa-money-bill-transfer' : 'fa-receipt';
        let bgStyle = exp.isPayment ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)';
        let colorStyle = exp.isPayment ? 'var(--accent-teal)' : 'var(--accent-purple)';
        
        let actionsHtml = exp.isPayment 
            ? `<div class="expense-amount-val" style="font-size: 0.9rem; color: var(--accent-teal);">Settled</div>`
            : `<div class="expense-amount-val" style="font-size: 0.9rem; color: var(--text-secondary);">Split ${exp.participants.length} ways</div>`;

        item.innerHTML = `
            <div class="expense-info">
                <div class="expense-icon" style="color: ${colorStyle}; background: ${bgStyle};">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <div>
                    <div class="expense-desc">${exp.desc}</div>
                    <div class="expense-date">${exp.payer} paid ₹${exp.total.toFixed(2)} on ${exp.date}</div>
                </div>
            </div>
            ${actionsHtml}
        `;
        list.appendChild(item);
    });
}

function renderSettlements() {
    let balances = {}; 
    
    splitState.transactions.forEach(t => {
        balances[t.payer] = (balances[t.payer] || 0) + t.total;
        
        t.participants.forEach(p => {
            balances[p] = (balances[p] || 0) - t.splitAmount;
        });
    });
    
    let debtors = [];
    let creditors = [];
    
    for (const [person, amount] of Object.entries(balances)) {
        if (amount < -0.01) debtors.push({ person, amount: Math.abs(amount) });
        else if (amount > 0.01) creditors.push({ person, amount: amount });
    }
    
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    let settlements = [];
    let i = 0, j = 0;
    
    while (i < debtors.length && j < creditors.length) {
        let debtor = debtors[i];
        let creditor = creditors[j];
        
        let min = Math.min(debtor.amount, creditor.amount);
        
        settlements.push({
            from: debtor.person,
            to: creditor.person,
            amount: min
        });
        
        debtor.amount -= min;
        creditor.amount -= min;
        
        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }
    
    const list = document.getElementById('split-balances-list');
    if (!list) return;
    
    if (settlements.length === 0) {
        list.innerHTML = '<p class="empty-state">All settled up! No outstanding debts.</p>';
        return;
    }
    
    let html = '';
    settlements.forEach(s => {
        const isFromMe = (typeof currentUser !== 'undefined' && currentUser && s.from === currentUser.name);
        const typeClass = isFromMe ? 'you-owe' : 'owes-you';
        
        html += `
            <div class="balance-item ${typeClass}" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div class="balance-info">
                    <div class="person">${s.from} <i class="fa-solid fa-arrow-right" style="color:var(--text-secondary); margin:0 6px; font-size:0.9rem;"></i> ${s.to}</div>
                    <div class="status" style="color: var(--accent-orange);">Pending Settlement</div>
                </div>
                <div style="display:flex; align-items:center; gap: 12px;">
                    <div class="balance-amount">₹${s.amount.toFixed(2)}</div>
                    <button class="btn secondary-btn" style="padding: 6px 12px; font-size: 0.8rem; background: var(--accent-teal); border: none; color: white;" onclick="markAsPaid('${s.from}', '${s.to}', ${s.amount})">Mark Paid</button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}
