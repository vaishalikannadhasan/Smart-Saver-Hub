let savedDealsState = {
    deals: [] // array of { id, dateSaved }
};

const mockDeals = [
    {
        id: 1,
        title: "Apple iPhone 15 Pro (256GB)",
        category: "electronics",
        store: "Amazon",
        price: 115000,
        oldPrice: 134900,
        rating: 4.8,
        deliveryDays: 1,
        icon: "fa-mobile",
        iconColor: "var(--accent-purple)"
    },
    {
        id: 2,
        title: "Sony WH-1000XM5 Headphones",
        category: "electronics",
        store: "Flipkart",
        price: 26990,
        oldPrice: 34990,
        rating: 4.6,
        deliveryDays: 2,
        icon: "fa-headphones",
        iconColor: "var(--accent-blue)"
    },
    {
        id: 3,
        title: "Organic Basmati Rice (5kg)",
        category: "groceries",
        store: "Blinkit",
        price: 450,
        oldPrice: 650,
        rating: 4.5,
        deliveryDays: 0.5,
        icon: "fa-bowl-rice",
        iconColor: "var(--accent-teal)"
    },
    {
        id: 4,
        title: "Nike Air Max 270",
        category: "footwear",
        store: "Myntra",
        price: 7995,
        oldPrice: 12995,
        rating: 4.7,
        deliveryDays: 3,
        icon: "fa-shoe-prints",
        iconColor: "var(--accent-orange)"
    },
    {
        id: 5,
        title: "Fresh Farm Milk (1L)",
        category: "groceries",
        store: "Zepto",
        price: 75,
        oldPrice: 90,
        rating: 4.2,
        deliveryDays: 0.1, // very fast
        icon: "fa-jug-detergent", 
        iconColor: "white"
    },
    {
        id: 6,
        title: "Puma Running Shoes",
        category: "footwear",
        store: "Amazon",
        price: 2499,
        oldPrice: 4999,
        rating: 4.3,
        deliveryDays: 2,
        icon: "fa-shoe-prints",
        iconColor: "var(--accent-pink)"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initDeals();
});

function initDeals() {
    // Load saved deals and handle migrations
    const saved = localStorage.getItem('splitsmart_saved_deals');
    if (saved) {
        let parsed = JSON.parse(saved);
        if (parsed.ids) {
            // Migrate array of ids to array of objects
            savedDealsState.deals = parsed.ids.map(id => ({ id, dateSaved: new Date().toLocaleDateString() }));
            localStorage.setItem('splitsmart_saved_deals', JSON.stringify(savedDealsState));
        } else {
            savedDealsState = parsed;
        }
    }
    
    // Sort and calculate AI Score
    mockDeals.forEach(deal => {
        const discountPercent = ((deal.oldPrice - deal.price) / deal.oldPrice) * 100;
        deal.discountStr = `${Math.round(discountPercent)}% OFF`;
        
        const ratingScore = (deal.rating / 5) * 40; // max 40
        const discountScore = Math.min(discountPercent, 60) * 0.8; // max ~48
        const deliveryScore = Math.max((5 - deal.deliveryDays) * 4, 0); // max 20
        deal.aiScore = ratingScore + discountScore + deliveryScore;
    });
    
    renderDeals('all');
    
    window.renderSavedDeals = function() {
        const grid = document.getElementById('saved-deals-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        const savedIds = savedDealsState.deals.map(d => d.id);
        const savedDealsData = mockDeals.filter(d => savedIds.includes(d.id)).map(deal => {
            const savedItem = savedDealsState.deals.find(d => d.id === deal.id);
            return { ...deal, dateSaved: savedItem.dateSaved };
        });
        
        if (savedDealsData.length === 0) {
            grid.innerHTML = '<p class="empty-state" style="grid-column: 1 / -1; margin-top:20px;">No saved deals yet. Find something you like and click the heart icon!</p>';
            return;
        }
        
        savedDealsData.forEach(deal => {
            const card = document.createElement('div');
            card.className = 'deal-card';
            card.innerHTML = `
                <div class="deal-img-wrapper">
                    <i class="fa-solid ${deal.icon}" style="color: ${deal.iconColor}"></i>
                    <div class="deal-discount">${deal.discountStr}</div>
                </div>
                <div class="deal-info">
                    <div class="deal-title">${deal.title}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">
                        <i class="fa-solid fa-clock"></i> Saved on ${deal.dateSaved}
                    </div>
                    <div class="deal-store" style="display:flex; justify-content:space-between;">
                        <span><i class="fa-solid fa-store"></i> ${deal.store}</span>
                        <span style="color:var(--text-secondary);"><i class="fa-solid fa-star" style="color:var(--accent-orange)"></i> ${deal.rating}</span>
                    </div>
                    <div class="deal-price-wrapper">
                        <span class="deal-price">₹${deal.price.toLocaleString('en-IN')}</span>
                        <span class="deal-old-price">₹${deal.oldPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <button class="btn secondary-btn deal-btn" onclick="toggleSaveDeal(${deal.id})">Remove Saved</button>
                </div>
            `;
            grid.appendChild(card);
        });
    };
    
    window.renderSavedDeals(); // initial call
    
    // Filter logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderDeals(btn.dataset.filter);
        });
    });
}

window.toggleSaveDeal = function(dealId) {
    if(typeof currentUser === 'undefined' || !currentUser) {
        alert("Please login to save deals."); 
        return;
    }
    
    const existingIndex = savedDealsState.deals.findIndex(d => d.id === dealId);
    if(existingIndex > -1) {
        savedDealsState.deals.splice(existingIndex, 1);
    } else {
        savedDealsState.deals.push({ id: dealId, dateSaved: new Date().toLocaleDateString() });
    }
    localStorage.setItem('splitsmart_saved_deals', JSON.stringify(savedDealsState));
    
    // Re-render
    const activeFilter = document.querySelector('.filter-btn.active');
    if(activeFilter) renderDeals(activeFilter.dataset.filter);
    else renderDeals('all');
    
    if(typeof window.renderSavedDeals === 'function') {
        window.renderSavedDeals();
    }
}

function renderDeals(category) {
    const grid = document.getElementById('deals-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    let filteredDeals = category === 'all' 
        ? [...mockDeals] 
        : mockDeals.filter(d => d.category === category);
        
    let bestDeal = null;
    let highestScore = -1;
    filteredDeals.forEach(d => {
        if(d.aiScore > highestScore) {
            highestScore = d.aiScore;
            bestDeal = d;
        }
    });
        
    filteredDeals.forEach(deal => {
        const isSaved = savedDealsState.deals.some(d => d.id === deal.id);
        const isBestDeal = (deal === bestDeal);
        
        const card = document.createElement('div');
        card.className = 'deal-card';
        if (isBestDeal) {
            card.style.borderColor = 'var(--accent-purple)';
            card.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.2)';
        }
        
        card.innerHTML = `
            <div class="deal-img-wrapper" style="${isBestDeal ? 'background: rgba(139, 92, 246, 0.05);' : ''}">
                <i class="fa-solid ${deal.icon}" style="color: ${deal.iconColor}"></i>
                <div class="deal-discount">${deal.discountStr}</div>
                ${isBestDeal ? '<div style="position:absolute; top:12px; left:12px; background:var(--accent-purple); color:white; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-sparkles"></i> AI Top Pick</div>' : ''}
            </div>
            <div class="deal-info">
                <div class="deal-title">${deal.title}</div>
                ${isBestDeal ? '<div style="font-size:0.8rem; color:var(--accent-purple); margin-bottom:8px; font-weight:600;">"Best balance of price, quality & delivery"</div>' : ''}
                <div class="deal-store" style="display:flex; justify-content:space-between;">
                    <span><i class="fa-solid fa-store"></i> ${deal.store}</span>
                    <span style="color:var(--text-secondary);"><i class="fa-solid fa-star" style="color:var(--accent-orange)"></i> ${deal.rating}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px;"><i class="fa-solid fa-truck-fast"></i> Delivers in ${deal.deliveryDays} day(s)</div>
                <div class="deal-price-wrapper">
                    <span class="deal-price">₹${deal.price.toLocaleString('en-IN')}</span>
                    <span class="deal-old-price">₹${deal.oldPrice.toLocaleString('en-IN')}</span>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn secondary-btn deal-btn" style="flex:1;">Buy Now</button>
                    <button class="btn icon-btn" onclick="toggleSaveDeal(${deal.id})" style="color: ${isSaved ? 'var(--accent-pink)' : 'var(--text-primary)'}">
                        <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}
