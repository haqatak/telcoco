let translations = {};
let currentLang = 'en';

document.addEventListener('DOMContentLoaded', initApp);

// --- Core App Initialization ---

async function initApp() {
    const path = window.location.pathname.split('/').pop();

    try {
        const response = await fetch('lang/translations.json');
        translations = await response.json();
    } catch (error) {
        console.error('Could not load translations:', error);
        return;
    }

    currentLang = getLanguage();

    if (path === 'index.html' || path === '') {
        initLoginPage();
    } else {
        initAuthenticatedPage(path);
    }
}

async function initAuthenticatedPage(path) {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch('data/mock_data.json');
        const data = await response.json();
        const user = data.users.find(u => u.username === loggedInUser);

        if (!user) {
            alert(t('genericError'));
            logout();
            return;
        }

        const appData = { user, products: data.products };
        loadHeaderAndNav(user);
        route(path, appData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// --- Internationalization (i18n) ---

function getLanguage() {
    return localStorage.getItem('lang') || 'en';
}

function setLanguage(lang) {
    localStorage.setItem('lang', lang);
    window.location.reload();
}

function t(key, replacements = {}) {
    let translation = translations[currentLang]?.[key] || key;
    for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return translation;
}

// --- Page Routing ---

function route(path, appData) {
    const pageKey = path.split('.')[0].replace('_details', 'Details');
    document.title = t(pageKey + 'Title') + ' - ' + t('dashboardName');

    switch(path) {
        case 'dashboard.html': initDashboard(appData); break;
        case 'subscriber_details.html': initSubscriberDetails(appData); break;
        case 'billing.html': initBillingPage(appData); break;
        case 'shop.html': initShopPage(appData); break;
        case 'profile.html': initProfilePage(appData); break;
    }
}

// --- Page Initializers ---

function initLoginPage() {
    document.title = t('loginTitle') + ' - ' + t('dashboardName');
    document.querySelector('.login-container h2').textContent = t('loginTitle');
    document.querySelector('.login-container p').textContent = t('loginWelcome');
    document.querySelector('label[for="username"]').textContent = t('usernameLabel');
    document.querySelector('label[for="password"]').textContent = t('passwordLabel');
    document.querySelector('button[type="submit"]').textContent = t('loginButton');

    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const errorMessage = document.getElementById('error-message');
            try {
                const response = await fetch('data/mock_data.json');
                const data = await response.json();
                const user = data.users.find(u => u.username === username);
                if (user) {
                    sessionStorage.setItem('loggedInUser', username);
                    window.location.href = 'dashboard.html';
                } else {
                    errorMessage.textContent = t('invalidUsernameError');
                }
            } catch (error) {
                errorMessage.textContent = t('genericError');
            }
        });
    }
}

function loadHeaderAndNav(user) {
    const header = document.querySelector('header');
    if (!header) return;

    header.innerHTML = `
        <div class="container">
            <div class="header-content">
                <h1>${t('dashboardName')}</h1>
                <div class="user-info">
                     <div class="lang-selector">
                        <select id="lang-select">
                            <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
                            <option value="no" ${currentLang === 'no' ? 'selected' : ''}>Norsk</option>
                        </select>
                    </div>
                    <span>${t('welcomeUser', {name: user.name})}</span>
                    <button id="logout-btn" class="btn btn-secondary">${t('logoutButton')}</button>
                </div>
            </div>
            <nav>
                <ul>
                    <li><a href="dashboard.html" class="${document.title.includes(t('myPageTitle')) ? 'active' : ''}">${t('navDashboard')}</a></li>
                    <li><a href="billing.html" class="${document.title.includes(t('billingTitle')) ? 'active' : ''}">${t('navBilling')}</a></li>
                    <li><a href="shop.html" class="${document.title.includes(t('shopTitle')) ? 'active' : ''}">${t('navShop')}</a></li>
                    <li><a href="profile.html" class="${document.title.includes(t('profileTitle')) ? 'active' : ''}">${t('navProfile')}</a></li>
                </ul>
            </nav>
        </div>
    `;
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('lang-select').addEventListener('change', function() {
        setLanguage(this.value);
    });
}

function initDashboard({ user }) {
    const mainContent = document.querySelector('main.container');
    mainContent.innerHTML = `<h2>${t('myPageTitle')}</h2><div id="subscribers-section"><h3>${t('subscribersHeader')}</h3><div id="subscribers-list" class="grid-container"></div></div>`;
    const subscribersList = document.getElementById('subscribers-list');
    user.subscribers.forEach(s => {
        const card = document.createElement('div');
        card.className = 'card clickable';
        card.dataset.subscriberId = s.id;
        const dataP = (s.data_usage.used / s.data_usage.total) * 100;
        const callP = (s.call_usage.used / s.call_usage.total) * 100;
        const smsP = (s.sms_usage.used / s.sms_usage.total) * 100;
        card.innerHTML = `<h4>${s.name}</h4><p><strong>${t('msisdnLabel')}</strong> ${s.msisdn}</p><p><strong>${t('planLabel')}</strong> ${s.plan}</p>
            <div class="usage-section"><h5>${t('usageHeader')}</h5>
                <div class="usage-bar-container"><span>${t('dataLabel')} ${s.data_usage.used}/${s.data_usage.total} ${s.data_usage.unit}</span><div class="usage-bar"><div class="usage-bar-fill" style="width: ${dataP}%;"></div></div></div>
                <div class="usage-bar-container"><span>${t('callsLabel')} ${s.call_usage.used}/${s.call_usage.total} ${s.call_usage.unit}</span><div class="usage-bar"><div class="usage-bar-fill" style="width: ${callP}%;"></div></div></div>
                <div class="usage-bar-container"><span>${t('smsLabel')} ${s.sms_usage.used}/${s.sms_usage.total} ${s.sms_usage.unit}</span><div class="usage-bar"><div class="usage-bar-fill" style="width: ${smsP}%;"></div></div></div>
            </div>
            <div class="products-section"><h5>${t('productsHeader')}</h5><ul>${s.products.map(p => `<li>${p}</li>`).join('') || `<li>${t('noProducts')}</li>`}</ul></div>`;
        subscribersList.appendChild(card);
    });
    subscribersList.addEventListener('click', (e) => {
        const card = e.target.closest('.card.clickable');
        if (card) {
            sessionStorage.setItem('selectedSubscriberId', card.dataset.subscriberId);
            window.location.href = 'subscriber_details.html';
        }
    });
}

function initSubscriberDetails({ user }) {
    const subscriberId = sessionStorage.getItem('selectedSubscriberId');
    const mainContent = document.querySelector('main.container');
    if (!subscriberId || !mainContent) { window.location.href = 'dashboard.html'; return; }
    const subscriber = user.subscribers.find(s => s.id == subscriberId);
    if (!subscriber) { alert('Subscriber not found.'); window.location.href = 'dashboard.html'; return; }
    const dataP = (subscriber.data_usage.used / subscriber.data_usage.total) * 100;
    const callP = (subscriber.call_usage.used / subscriber.call_usage.total) * 100;
    const smsP = (subscriber.sms_usage.used / subscriber.sms_usage.total) * 100;
    mainContent.innerHTML = `<a href="dashboard.html" class="back-link">${t('backToDashboardLink')}</a><h2>${t('subscriberDetailsTitle')}</h2>
        <div class="grid-container details-grid">
            <div class="card"><h4>${subscriber.name}</h4><p><strong>${t('msisdnLabel')}</strong> ${subscriber.msisdn}</p><p><strong>${t('planLabel')}</strong> ${subscriber.plan}</p>
                <div class="usage-section"><h5>${t('usageHeader')}</h5>
                    <div class="usage-bar-container"><span>${t('dataLabel')} ${subscriber.data_usage.used}/${subscriber.data_usage.total} ${subscriber.data_usage.unit}</span><div class="usage-bar"><div class="usage-bar-fill" style="width: ${dataP}%;"></div></div></div>
                    <div class="usage-bar-container"><span>${t('callsLabel')} ${subscriber.call_usage.used}/${subscriber.call_usage.total} ${subscriber.call_usage.unit}</span><div class="usage-bar"><div class="usage-bar-fill" style="width: ${callP}%;"></div></div></div>
                    <div class="usage-bar-container"><span>${t('smsLabel')} ${subscriber.sms_usage.used}/${subscriber.sms_usage.total} ${subscriber.sms_usage.unit}</span><div class="usage-bar"><div class="usage-bar-fill" style="width: ${smsP}%;"></div></div></div>
                </div>
            </div>
            <div class="card"><h4>${t('callHistoryHeader')}</h4><table class="data-table"><thead><tr><th>${t('dateHeader')}</th><th>${t('toNumberHeader')}</th><th>${t('durationHeader')}</th></tr></thead>
                <tbody>${subscriber.call_history.map(c => `<tr><td>${c.date}</td><td>${c.to}</td><td>${c.duration}</td></tr>`).join('') || `<tr><td colspan="3">${t('noCallHistory')}</td></tr>`}</tbody>
            </table></div>
        </div>`;
}

function initBillingPage({ user }) {
    const mainContent = document.querySelector('main.container');
    if (!mainContent) return;
    mainContent.innerHTML = `<h2>${t('billingTitle')}</h2><div class="card"><h4>${t('invoiceHistoryHeader')}</h4>
        <table class="data-table"><thead><tr><th>${t('invoiceIdHeader')}</th><th>${t('dateHeader')}</th><th>${t('amountHeader')}</th><th>${t('statusHeader')}</th><th>${t('actionHeader')}</th></tr></thead>
            <tbody>${user.billing_history.map(i => `<tr><td>${i.id}</td><td>${i.date}</td><td>$${i.amount.toFixed(2)}</td><td><span class="status-badge status-${i.status.toLowerCase()}">${t('status' + i.status)}</span></td><td><a href="#" class="btn btn-small" download>${t('downloadButton')}</a></td></tr>`).join('') || `<tr><td colspan="5">${t('noBillingHistory')}</td></tr>`}</tbody>
        </table></div>`;
}

function initShopPage({ products }) {
    const mainContent = document.querySelector('main.container');
    if (!mainContent) return;
    mainContent.innerHTML = `<h2>${t('shopTitle')}</h2><p>${t('shopSubtitle')}</p>
        <div id="product-list" class="grid-container">
            ${products.map(p => `<div class="card product-card"><h4>${p.name}</h4><p>${p.description}</p><div class="product-price">$${p.price.toFixed(2)} ${t('perMonth')}</div><button class="btn">${t('addToPlanButton')}</button></div>`).join('')}
        </div>`;
}

function initProfilePage({ user }) {
    const mainContent = document.querySelector('main.container');
    if (!mainContent) return;
    mainContent.innerHTML = `<h2>${t('profileTitle')}</h2><div class="card"><form id="profile-form">
                <div class="form-group"><label for="profile-name">${t('fullNameLabel')}</label><input type="text" id="profile-name" value="${user.name}" readonly></div>
                <div class="form-group"><label for="profile-username">${t('usernameLabel')}</label><input type="text" id="profile-username" value="${user.username}" readonly></div>
                <div class="form-group"><label for="profile-address">${t('addressLabel')}</label><textarea id="profile-address" rows="3">${user.address}</textarea></div>
                <fieldset class="form-group"><legend>${t('contactPrefsHeader')}</legend>
                    <div class="checkbox-group"><input type="checkbox" id="pref-email" ${user.contact_prefs.email ? 'checked' : ''}><label for="pref-email">${t('emailPrefLabel')}</label></div>
                    <div class="checkbox-group"><input type="checkbox" id="pref-sms" ${user.contact_prefs.sms ? 'checked' : ''}><label for="pref-sms">${t('smsPrefLabel')}</label></div>
                </fieldset>
                <button type="submit" class="btn">${t('updateProfileButton')}</button>
            </form></div>`;
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert(t('profileUpdateSuccess'));
    });
}

// --- Helper Functions ---

function logout() {
    sessionStorage.clear();
    localStorage.removeItem('lang'); // Also clear lang on logout
    window.location.href = 'index.html';
}
