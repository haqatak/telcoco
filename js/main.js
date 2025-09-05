document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    const path = window.location.pathname.split('/').pop();

    // If on login page or root, no special logic needed here.
    if (path === 'index.html' || path === '') {
        return;
    }

    // For all other pages, a user must be logged in.
    if (!loggedInUser) {
        window.location.href = 'index.html';
        return;
    }

    // Fetch data and initialize the page
    fetch('data/mock_data.json')
        .then(response => response.json())
        .then(data => {
            const user = data.users.find(u => u.username === loggedInUser);
            if (!user) {
                alert('User data not found. Logging out.');
                logout();
                return;
            }

            const appData = { user, products: data.products, allUsers: data.users };
            loadHeaderAndNav(user);
            route(path, appData);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function loadHeaderAndNav(user) {
    const header = document.querySelector('header');
    if (!header) return;

    const pageTitle = document.title.split(' - ')[0];

    header.innerHTML = `
        <div class="container">
            <div class="header-content">
                <h1>Telco Dashboard</h1>
                <div class="user-info">
                    Welcome, ${user.name}!
                    <button id="logout-btn" class="btn btn-secondary">Logout</button>
                </div>
            </div>
            <nav>
                <ul>
                    <li><a href="dashboard.html" class="${pageTitle === 'My Page' ? 'active' : ''}">Dashboard</a></li>
                    <li><a href="billing.html" class="${pageTitle === 'Billing' ? 'active' : ''}">Billing</a></li>
                    <li><a href="shop.html" class="${pageTitle === 'Shop' ? 'active' : ''}">Shop</a></li>
                    <li><a href="profile.html" class="${pageTitle === 'Profile' ? 'active' : ''}">Profile</a></li>
                </ul>
            </nav>
        </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', logout);
}

function route(path, appData) {
    switch(path) {
        case 'dashboard.html':
            initDashboard(appData);
            break;
        case 'subscriber_details.html':
            initSubscriberDetails(appData);
            break;
        case 'billing.html':
            initBillingPage(appData);
            break;
        case 'shop.html':
            initShopPage(appData);
            break;
        case 'profile.html':
            initProfilePage(appData);
            break;
        // Cases for other pages will be added in subsequent steps
    }
}

function initProfilePage({ user }) {
    const mainContent = document.querySelector('main.container');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <h2>My Profile</h2>
        <div class="card">
            <form id="profile-form">
                <div class="form-group">
                    <label for="profile-name">Full Name</label>
                    <input type="text" id="profile-name" value="${user.name}" readonly>
                </div>
                <div class="form-group">
                    <label for="profile-username">Username</label>
                    <input type="text" id="profile-username" value="${user.username}" readonly>
                </div>
                <div class="form-group">
                    <label for="profile-address">Address</label>
                    <textarea id="profile-address" rows="3">${user.address}</textarea>
                </div>
                <fieldset class="form-group">
                    <legend>Contact Preferences</legend>
                    <div class="checkbox-group">
                        <input type="checkbox" id="pref-email" ${user.contact_prefs.email ? 'checked' : ''}>
                        <label for="pref-email">Receive email notifications</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="pref-sms" ${user.contact_prefs.sms ? 'checked' : ''}>
                        <label for="pref-sms">Receive SMS notifications</label>
                    </div>
                </fieldset>
                <button type="submit" class="btn">Update Profile</button>
            </form>
        </div>
    `;

    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Profile updated successfully! (Prototype)');
    });
}

function initShopPage({ products }) {
    const mainContent = document.querySelector('main.container');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <h2>Shop / Add-ons</h2>
        <p>Enhance your plan with our latest products and services.</p>
        <div id="product-list" class="grid-container">
            ${products.map(product => `
                <div class="card product-card">
                    <h4>${product.name}</h4>
                    <p>${product.description}</p>
                    <div class="product-price">$${product.price.toFixed(2)} / month</div>
                    <button class="btn">Add to Plan</button>
                </div>
            `).join('')}
        </div>
    `;
}

function initBillingPage({ user }) {
    const mainContent = document.querySelector('main.container');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <h2>Billing & Invoices</h2>
        <div class="card">
            <h4>Invoice History</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Invoice ID</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${user.billing_history.map(invoice => `
                        <tr>
                            <td>${invoice.id}</td>
                            <td>${invoice.date}</td>
                            <td>$${invoice.amount.toFixed(2)}</td>
                            <td><span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span></td>
                            <td><a href="#" class="btn btn-small" download>Download</a></td>
                        </tr>
                    `).join('') || '<tr><td colspan="5">No billing history found.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function initSubscriberDetails({ user }) {
    const subscriberId = sessionStorage.getItem('selectedSubscriberId');
    const mainContent = document.querySelector('main.container');

    if (!subscriberId || !mainContent) {
        window.location.href = 'dashboard.html';
        return;
    }

    const subscriber = user.subscribers.find(s => s.id == subscriberId);

    if (!subscriber) {
        alert('Subscriber not found.');
        window.location.href = 'dashboard.html';
        return;
    }

    const dataPercentage = (subscriber.data_usage.used / subscriber.data_usage.total) * 100;
    const callPercentage = (subscriber.call_usage.used / subscriber.call_usage.total) * 100;
    const smsPercentage = (subscriber.sms_usage.used / subscriber.sms_usage.total) * 100;

    mainContent.innerHTML = `
        <a href="dashboard.html" class="back-link">&larr; Back to Dashboard</a>
        <h2>Subscriber Details</h2>
        <div class="grid-container details-grid">
            <div class="card">
                <h4>${subscriber.name}</h4>
                <p><strong>MSISDN:</strong> ${subscriber.msisdn}</p>
                <p><strong>Plan:</strong> ${subscriber.plan}</p>
                <div class="usage-section">
                    <h5>Usage</h5>
                    <div class="usage-bar-container">
                        <span>Data: ${subscriber.data_usage.used}/${subscriber.data_usage.total} ${subscriber.data_usage.unit}</span>
                        <div class="usage-bar"><div class="usage-bar-fill" style="width: ${dataPercentage}%;"></div></div>
                    </div>
                    <div class="usage-bar-container">
                        <span>Calls: ${subscriber.call_usage.used}/${subscriber.call_usage.total} ${subscriber.call_usage.unit}</span>
                        <div class="usage-bar"><div class="usage-bar-fill" style="width: ${callPercentage}%;"></div></div>
                    </div>
                    <div class="usage-bar-container">
                        <span>SMS: ${subscriber.sms_usage.used}/${subscriber.sms_usage.total} ${subscriber.sms_usage.unit}</span>
                        <div class="usage-bar"><div class="usage-bar-fill" style="width: ${smsPercentage}%;"></div></div>
                    </div>
                </div>
            </div>
            <div class="card">
                <h4>Call History</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>To Number</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subscriber.call_history.map(call => `
                            <tr>
                                <td>${call.date}</td>
                                <td>${call.to}</td>
                                <td>${call.duration}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="3">No call history found.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function initDashboard({ user }) {
    const subscribersList = document.getElementById('subscribers-list');
    if (!subscribersList) return;

    subscribersList.innerHTML = ''; // Clear existing content
    user.subscribers.forEach(subscriber => {
        const card = document.createElement('div');
        card.className = 'card clickable'; // Add 'clickable' class
        card.dataset.subscriberId = subscriber.id;

        const dataPercentage = (subscriber.data_usage.used / subscriber.data_usage.total) * 100;
        const callPercentage = (subscriber.call_usage.used / subscriber.call_usage.total) * 100;
        const smsPercentage = (subscriber.sms_usage.used / subscriber.sms_usage.total) * 100;

        card.innerHTML = `
            <h4>${subscriber.name}</h4>
            <p><strong>MSISDN:</strong> ${subscriber.msisdn}</p>
            <p><strong>Plan:</strong> ${subscriber.plan}</p>
            <div class="usage-section">
                <h5>Usage</h5>
                <div class="usage-bar-container">
                    <span>Data: ${subscriber.data_usage.used}/${subscriber.data_usage.total} ${subscriber.data_usage.unit}</span>
                    <div class="usage-bar"><div class="usage-bar-fill" style="width: ${dataPercentage}%;"></div></div>
                </div>
                <div class="usage-bar-container">
                    <span>Calls: ${subscriber.call_usage.used}/${subscriber.call_usage.total} ${subscriber.call_usage.unit}</span>
                    <div class="usage-bar"><div class="usage-bar-fill" style="width: ${callPercentage}%;"></div></div>
                </div>
                <div class="usage-bar-container">
                    <span>SMS: ${subscriber.sms_usage.used}/${subscriber.sms_usage.total} ${subscriber.sms_usage.unit}</span>
                    <div class="usage-bar"><div class="usage-bar-fill" style="width: ${smsPercentage}%;"></div></div>
                </div>
            </div>
            <div class="products-section">
                <h5>Products</h5>
                <ul>
                    ${subscriber.products.map(p => `<li>${p}</li>`).join('') || '<li>No products</li>'}
                </ul>
            </div>
        `;
        subscribersList.appendChild(card);
    });

    subscribersList.addEventListener('click', (event) => {
        const card = event.target.closest('.card.clickable');
        if (card) {
            const subscriberId = card.dataset.subscriberId;
            sessionStorage.setItem('selectedSubscriberId', subscriberId);
            window.location.href = 'subscriber_details.html';
        }
    });
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}
