let usersDB = [];
let currentUser = null;
let isLoginMode = true;

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavigation();
});

function initAuth() {
    const savedDB = localStorage.getItem('splitsmart_users_db');
    if (savedDB) usersDB = JSON.parse(savedDB);

    const savedUser = localStorage.getItem('splitsmart_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI(true);
    } else {
        updateUserUI(false);
        switchToView('auth-view');
        document.querySelectorAll('.nav-links li').forEach(nav => nav.classList.remove('active'));
    }

    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const submitBtn = document.getElementById('auth-submit-btn');

    if(tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            isLoginMode = true;
            tabLogin.classList.add('active');
            tabLogin.style.background = 'var(--gradient-primary)';
            tabLogin.style.border = 'none';
            tabRegister.classList.remove('active');
            tabRegister.style.background = 'var(--glass-bg)';
            tabRegister.style.border = '1px solid var(--glass-border)';
            submitBtn.textContent = 'Login';
        });

        tabRegister.addEventListener('click', () => {
            isLoginMode = false;
            tabRegister.classList.add('active');
            tabRegister.style.background = 'var(--gradient-primary)';
            tabRegister.style.border = 'none';
            tabLogin.classList.remove('active');
            tabLogin.style.background = 'var(--glass-bg)';
            tabLogin.style.border = '1px solid var(--glass-border)';
            submitBtn.textContent = 'Register';
        });
        
        // Init styles visually based on active class
        tabLogin.style.background = 'var(--gradient-primary)';
        tabLogin.style.border = 'none';
    }
    
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('auth-name').value.trim();
            const pass = document.getElementById('auth-pass').value.trim();
            
            if (name && pass) {
                if (isLoginMode) {
                    const userAccount = usersDB.find(u => u.name.toLowerCase() === name.toLowerCase() && u.pass === pass);
                    if (userAccount) {
                        finalizeLogin(userAccount.name);
                    } else {
                        alert("Invalid name or password. Try registering first!");
                    }
                } else {
                    // Registration
                    if (usersDB.find(u => u.name.toLowerCase() === name.toLowerCase())) {
                        alert("Username already exists!");
                    } else {
                        usersDB.push({ name, pass });
                        localStorage.setItem('splitsmart_users_db', JSON.stringify(usersDB));
                        finalizeLogin(name);
                    }
                }
            }
        });
    }

    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('splitsmart_user');
            currentUser = null;
            updateUserUI(false);
            switchToView('auth-view');
            document.querySelectorAll('.nav-links li').forEach(nav => nav.classList.remove('active'));
        });
    }

    const loginBtn = document.getElementById('nav-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            switchToView('auth-view');
            document.querySelectorAll('.nav-links li').forEach(nav => nav.classList.remove('active'));
        });
    }
}

function finalizeLogin(name) {
    currentUser = { name, id: Date.now() };
    localStorage.setItem('splitsmart_user', JSON.stringify(currentUser));
    updateUserUI(true);
    switchToView('splitter-view');
    document.querySelectorAll('.nav-links li').forEach(nav => {
        if(nav.dataset.target === 'splitter-view') nav.classList.add('active');
        else nav.classList.remove('active');
    });
    
    // reset form naturally
    document.getElementById('auth-form').reset();
}

function updateUserUI(isLoggedIn) {
    const loginBtn = document.getElementById('nav-login-btn');
    const userInfo = document.getElementById('logged-in-user-info');
    const displayNames = document.querySelectorAll('#user-display-name, .user-name');
    
    if (isLoggedIn && currentUser) {
        if(loginBtn) loginBtn.style.display = 'none';
        if(userInfo) userInfo.style.display = 'flex';
        displayNames.forEach(el => el.textContent = currentUser.name);
    } else {
        if(loginBtn) loginBtn.style.display = 'block';
        if(userInfo) userInfo.style.display = 'none';
        displayNames.forEach(el => el.textContent = 'Guest');
    }
}

function switchToView(targetId) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetId) {
            section.classList.add('active');
        }
    });

    const navItem = document.querySelector(`.nav-links li[data-target="${targetId}"]`);
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    if (navItem) {
        if (pageTitle) pageTitle.textContent = navItem.dataset.title;
        if (pageSubtitle) pageSubtitle.textContent = navItem.dataset.subtitle;
    } else if (targetId === 'auth-view') {
        if (pageTitle) pageTitle.textContent = 'Authentication';
        if (pageSubtitle) pageSubtitle.textContent = 'Create an account or log in.';
    }
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-links li');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (!currentUser && item.dataset.target !== 'auth-view') {
                alert("Please login to access SplitSmart features.");
                switchToView('auth-view');
                return;
            }

            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            switchToView(item.dataset.target);
            
            if(item.dataset.target === 'saved-deals-view' && typeof window.renderSavedDeals === 'function') {
               window.renderSavedDeals();
            }
        });
    });
}
