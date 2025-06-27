// Admin dashboard functionality
class AdminDashboard {
    constructor() {
        this.currentTab = 'requests';
        this.filters = {
            type: 'all',
            status: 'all',
            urgency: 'all'
        };
        this.data = {
            requests: {},
            offers: {},
            matches: {}
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.setupRealTimeUpdates();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Filter controls
        const filterType = document.getElementById('filter-type');
        const filterStatus = document.getElementById('filter-status');
        const filterUrgency = document.getElementById('filter-urgency');

        if (filterType) {
            filterType.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyFilters();
            });
        }

        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (filterUrgency) {
            filterUrgency.addEventListener('change', (e) => {
                this.filters.urgency = e.target.value;
                this.applyFilters();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-data-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }

        // Run matching button
        const runMatchingBtn = document.getElementById('run-matching-btn');
        if (runMatchingBtn) {
            runMatchingBtn.addEventListener('click', () => this.runMatching());
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');

        this.currentTab = tabName;
        this.renderCurrentTab();
    }

    async loadData() {
        try {
            showLoading('Loading admin data...');

            // Load requests
            const requestsRef = database.ref('help-requests');
            const requestsSnapshot = await requestsRef.once('value');
            this.data.requests = requestsSnapshot.val() || {};

            // Load offers
            const offersRef = database.ref('help-offers');
            const offersSnapshot = await offersRef.once('value');
            this.data.offers = offersSnapshot.val() || {};

            // Load matches
            const matchesRef = database.ref('matches');
            const matchesSnapshot = await matchesRef.once('value');
            this.data.matches = matchesSnapshot.val() || {};

            this.renderCurrentTab();
            
            // Update stats
            if (window.reliefLinkApp) {
                window.reliefLinkApp.loadStats();
            }

            hideLoading();

        } catch (error) {
            console.error('Error loading admin data:', error);
            hideLoading();
            alert('Failed to load data: ' + error.message);
        }
    }

    renderCurrentTab() {
        switch (this.currentTab) {
            case 'requests':
                this.renderRequests();
                break;
            case 'offers':
                this.renderOffers();
                break;
            case 'matches':
                this.renderMatches();
                break;
        }
    }

    renderRequests() {
        const tbody = document.getElementById('requests-tbody');
        if (!tbody) return;

        const requests = Object.values(this.data.requests);
        const filteredRequests = this.filterData(requests, 'request');

        tbody.innerHTML = '';

        if (filteredRequests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No requests found</td>
                </tr>
            `;
            return;
        }

        filteredRequests.forEach(request => {
            const row = this.createRequestRow(request);
            tbody.appendChild(row);
        });
    }

    renderOffers() {
        const tbody = document.getElementById('offers-tbody');
        if (!tbody) return;

        const offers = Object.values(this.data.offers);
        const filteredOffers = this.filterData(offers, 'offer');

        tbody.innerHTML = '';

        if (filteredOffers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No offers found</td>
                </tr>
            `;
            return;
        }

        filteredOffers.forEach(offer => {
            const row = this.createOfferRow(offer);
            tbody.appendChild(row);
        });
    }

    renderMatches() {
        const tbody = document.getElementById('matches-tbody');
        if (!tbody) return;

        const matches = Object.values(this.data.matches);

        tbody.innerHTML = '';

        if (matches.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No matches found</td>
                </tr>
            `;
            return;
        }

        matches.forEach(match => {
            const row = this.createMatchRow(match);
            tbody.appendChild(row);
        });
    }

    createRequestRow(request) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.requesterName}</td>
            <td>${request.helpCategory}</td>
            <td><span class="urgency-badge urgency-${request.urgencyLevel}">${request.urgencyLevel}</span></td>
            <td>${this.truncateText(request.location, 30)}</td>
            <td><span class="status-badge status-${request.status}">${request.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewDetails('request', '${request.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="adminDashboard.updateStatus('request', '${request.id}', 'resolved')">
                    <i class="fas fa-check"></i>
                </button>
            </td>
        `;
        return row;
    }

    createOfferRow(offer) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${offer.id}</td>
            <td>${offer.providerName}</td>
            <td>${offer.providerType}</td>
            <td>${offer.helpTypes.join(', ')}</td>
            <td>${this.truncateText(offer.providerLocation, 30)}</td>
            <td><span class="status-badge status-${offer.status}">${offer.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewDetails('offer', '${offer.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="adminDashboard.updateStatus('offer', '${offer.id}', 'inactive')">
                    <i class="fas fa-pause"></i>
                </button>
            </td>
        `;
        return row;
    }

    createMatchRow(match) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${match.id}</td>
            <td>${match.requestId}</td>
            <td>${match.offerId}</td>
            <td>${match.matchScore}%</td>
            <td><span class="status-badge status-${match.status}">${match.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewDetails('match', '${match.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="adminDashboard.updateStatus('match', '${match.id}', 'completed')">
                    <i class="fas fa-check"></i>
                </button>
            </td>
        `;
        return row;
    }

    filterData(data, type) {
        return data.filter(item => {
            // Filter by type
            if (this.filters.type !== 'all') {
                if (this.filters.type === 'requests' && type !== 'request') return false;
                if (this.filters.type === 'offers' && type !== 'offer') return false;
            }

            // Filter by status
            if (this.filters.status !== 'all' && item.status !== this.filters.status) {
                return false;
            }

            // Filter by urgency (only for requests)
            if (this.filters.urgency !== 'all' && type === 'request' && item.urgencyLevel !== this.filters.urgency) {
                return false;
            }

            return true;
        });
    }

    applyFilters() {
        this.renderCurrentTab();
    }

    async viewDetails(type, id) {
        const modal = document.getElementById('detail-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        if (!modal || !modalTitle || !modalBody) return;

        let item;
        switch (type) {
            case 'request':
                item = this.data.requests[id];
                modalTitle.textContent = 'Request Details';
                modalBody.innerHTML = this.createRequestDetails(item);
                break;
            case 'offer':
                item = this.data.offers[id];
                modalTitle.textContent = 'Offer Details';
                modalBody.innerHTML = this.createOfferDetails(item);
                break;
            case 'match':
                item = this.data.matches[id];
                modalTitle.textContent = 'Match Details';
                modalBody.innerHTML = this.createMatchDetails(item);
                break;
        }

        showModal('detail-modal');
    }

    createRequestDetails(request) {
        return `
            <div class="detail-section">
                <h4>Request Information</h4>
                <p><strong>ID:</strong> ${request.id}</p>
                <p><strong>Name:</strong> ${request.requesterName}</p>
                <p><strong>Phone:</strong> ${request.requesterPhone}</p>
                <p><strong>Category:</strong> ${request.helpCategory}</p>
                <p><strong>Urgency:</strong> <span class="urgency-badge urgency-${request.urgencyLevel}">${request.urgencyLevel}</span></p>
                <p><strong>Location:</strong> ${request.location}</p>
                <p><strong>People Affected:</strong> ${request.peopleCount}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${request.status}">${request.status}</span></p>
                <p><strong>Submitted:</strong> ${new Date(request.timestamp).toLocaleString()}</p>
            </div>
            <div class="detail-section">
                <h4>Description</h4>
                <p>${request.description}</p>
            </div>
        `;
    }

    createOfferDetails(offer) {
        return `
            <div class="detail-section">
                <h4>Offer Information</h4>
                <p><strong>ID:</strong> ${offer.id}</p>
                <p><strong>Provider:</strong> ${offer.providerName}</p>
                <p><strong>Type:</strong> ${offer.providerType}</p>
                <p><strong>Phone:</strong> ${offer.providerPhone}</p>
                <p><strong>Email:</strong> ${offer.providerEmail || 'Not provided'}</p>
                <p><strong>Help Types:</strong> ${offer.helpTypes.join(', ')}</p>
                <p><strong>Location:</strong> ${offer.providerLocation}</p>
                <p><strong>Service Radius:</strong> ${offer.serviceRadius} km</p>
                <p><strong>Availability:</strong> ${offer.availability}</p>
                <p><strong>Capacity:</strong> ${offer.capacity}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${offer.status}">${offer.status}</span></p>
                <p><strong>Submitted:</strong> ${new Date(offer.timestamp).toLocaleString()}</p>
            </div>
            ${offer.additionalInfo ? `
                <div class="detail-section">
                    <h4>Additional Information</h4>
                    <p>${offer.additionalInfo}</p>
                </div>
            ` : ''}
        `;
    }

    createMatchDetails(match) {
        const request = this.data.requests[match.requestId];
        const offer = this.data.offers[match.offerId];

        return `
            <div class="detail-section">
                <h4>Match Information</h4>
                <p><strong>Match ID:</strong> ${match.id}</p>
                <p><strong>Match Score:</strong> ${match.matchScore}%</p>
                <p><strong>Status:</strong> <span class="status-badge status-${match.status}">${match.status}</span></p>
                <p><strong>Created:</strong> ${new Date(match.timestamp).toLocaleString()}</p>
            </div>
            <div class="detail-section">
                <h4>Request Details</h4>
                <p><strong>Requester:</strong> ${request?.requesterName || 'Not found'}</p>
                <p><strong>Category:</strong> ${request?.helpCategory || 'Not found'}</p>
                <p><strong>Urgency:</strong> ${request?.urgencyLevel || 'Not found'}</p>
            </div>
            <div class="detail-section">
                <h4>Offer Details</h4>
                <p><strong>Provider:</strong> ${offer?.providerName || 'Not found'}</p>
                <p><strong>Type:</strong> ${offer?.providerType || 'Not found'}</p>
                <p><strong>Help Types:</strong> ${offer?.helpTypes?.join(', ') || 'Not found'}</p>
            </div>
        `;
    }

    async updateStatus(type, id, newStatus) {
        try {
            showLoading('Updating status...');

            const ref = database.ref(`${type === 'request' ? 'help-requests' : type === 'offer' ? 'help-offers' : 'matches'}/${id}`);
            await ref.update({
                status: newStatus,
                lastUpdated: Date.now()
            });

            // Update local data
            if (type === 'request') {
                this.data.requests[id].status = newStatus;
            } else if (type === 'offer') {
                this.data.offers[id].status = newStatus;
            } else {
                this.data.matches[id].status = newStatus;
            }

            this.renderCurrentTab();
            hideLoading();

        } catch (error) {
            console.error('Error updating status:', error);
            hideLoading();
            alert('Failed to update status: ' + error.message);
        }
    }

    async runMatching() {
        authManager.requireAdmin(async () => {
            try {
                showLoading('Running matching algorithm...');

                if (window.matchingEngine) {
                    const results = await window.matchingEngine.runFullMatching();
                    alert(`Matching completed! Found ${results.length} new matches.`);
                    this.loadData();
                } else {
                    alert('Matching engine not available.');
                }

                hideLoading();

            } catch (error) {
                console.error('Error running matching:', error);
                hideLoading();
                alert('Failed to run matching: ' + error.message);
            }
        });
    }

    setupRealTimeUpdates() {
        // Listen for changes in requests
        database.ref('help-requests').on('value', () => {
            this.loadData();
        });

        // Listen for changes in offers
        database.ref('help-offers').on('value', () => {
            this.loadData();
        });

        // Listen for changes in matches
        database.ref('matches').on('value', () => {
            this.loadData();
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the admin page
    if (document.getElementById('admin-dashboard')) {
        const adminDashboard = new AdminDashboard();
        window.adminDashboard = adminDashboard;
    }
});

console.log('Admin dashboard initialized');
