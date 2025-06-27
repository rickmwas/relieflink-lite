// Admin Dashboard for ReliefLink Lite with Supabase
// Kenyan Humanitarian Aid App Admin Interface

class AdminDashboard {
    constructor() {
        this.currentTab = 'requests';
        this.data = {
            requests: [],
            offers: [],
            matches: []
        };
        this.filters = {
            status: 'all',
            urgency: 'all',
            category: 'all',
            providerType: 'all'
        };
        this.init();
    }

    async init() {
        try {
            // Wait for Supabase and auth to be ready
            await this.waitForSupabase();
            await this.checkAdminAccess();
            
            this.setupEventListeners();
            await this.loadData();
            this.setupRealTimeUpdates();
            
            console.log('Admin dashboard initialized with Supabase');
        } catch (error) {
            console.error('Admin initialization error:', error);
            this.showError('Failed to initialize admin dashboard');
        }
    }

    async waitForSupabase() {
        let attempts = 0;
        while (!window.database && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (!window.database) {
            throw new Error('Supabase database not available');
        }
    }

    async checkAdminAccess() {
        if (!window.authManager || !window.authManager.getCurrentUser()) {
            alert('Please sign in to access the admin dashboard');
            window.location.href = 'index.html';
            return;
        }

        if (!window.authManager.isUserAdmin()) {
            alert('Admin access required');
            window.location.href = 'index.html';
            return;
        }
    }

    setupEventListeners() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Filter controls
        const filterControls = document.querySelectorAll('.filter-control');
        filterControls.forEach(control => {
            control.addEventListener('change', () => this.applyFilters());
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }

        // Run matching button
        const matchingBtn = document.getElementById('run-matching');
        if (matchingBtn) {
            matchingBtn.addEventListener('click', () => this.runMatching());
        }

        // Export data button
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content
        this.renderCurrentTab();
    }

    async loadData() {
        try {
            showLoading('Loading admin data...');
            
            // Load all data from Supabase
            const [requests, offers] = await Promise.all([
                window.database.getHelpRequests(),
                window.database.getHelpOffers()
            ]);

            // Load matches
            let matches = [];
            try {
                const { data: matchData, error } = await window.supabase
                    .from('matches')
                    .select(`
                        *,
                        help_requests!inner(requester_name, help_category, urgency_level, location),
                        help_offers!inner(provider_name, provider_type, provider_location)
                    `);
                
                if (error) throw error;
                matches = matchData || [];
            } catch (error) {
                console.warn('Could not load matches:', error);
            }

            this.data = { requests, offers, matches };
            this.renderCurrentTab();
            hideLoading();
            
        } catch (error) {
            hideLoading();
            console.error('Error loading admin data:', error);
            this.showError('Failed to load admin data');
        }
    }

    renderCurrentTab() {
        const content = document.getElementById('admin-content');
        if (!content) return;

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
            default:
                this.renderRequests();
        }
    }

    renderRequests() {
        const content = document.getElementById('admin-content');
        const filteredRequests = this.filterData(this.data.requests, 'request');
        
        if (filteredRequests.length === 0) {
            content.innerHTML = '<div class="no-data"><i class="fas fa-inbox"></i><p>No help requests found</p></div>';
            return;
        }

        const html = `
            <div class="data-table">
                <div class="table-header">
                    <div class="table-title">Help Requests (${filteredRequests.length})</div>
                    <div class="table-actions">
                        <select class="filter-control" data-filter="urgency">
                            <option value="all">All Urgency</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        <select class="filter-control" data-filter="category">
                            <option value="all">All Categories</option>
                            <option value="medical">Medical</option>
                            <option value="food">Food</option>
                            <option value="shelter">Shelter</option>
                            <option value="transportation">Transportation</option>
                            <option value="other">Other</option>
                        </select>
                        <select class="filter-control" data-filter="status">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="matched">Matched</option>
                            <option value="fulfilled">Fulfilled</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <div class="table-body">
                    ${filteredRequests.map(request => this.createRequestRow(request)).join('')}
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        this.setupRowActions();
    }

    renderOffers() {
        const content = document.getElementById('admin-content');
        const filteredOffers = this.filterData(this.data.offers, 'offer');
        
        if (filteredOffers.length === 0) {
            content.innerHTML = '<div class="no-data"><i class="fas fa-inbox"></i><p>No help offers found</p></div>';
            return;
        }

        const html = `
            <div class="data-table">
                <div class="table-header">
                    <div class="table-title">Help Offers (${filteredOffers.length})</div>
                    <div class="table-actions">
                        <select class="filter-control" data-filter="providerType">
                            <option value="all">All Provider Types</option>
                            <option value="individual">Individual</option>
                            <option value="ngo">NGO</option>
                            <option value="government">Government</option>
                            <option value="business">Business</option>
                            <option value="religious">Religious</option>
                        </select>
                        <select class="filter-control" data-filter="status">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="busy">Busy</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                <div class="table-body">
                    ${filteredOffers.map(offer => this.createOfferRow(offer)).join('')}
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        this.setupRowActions();
    }

    renderMatches() {
        const content = document.getElementById('admin-content');
        const filteredMatches = this.filterData(this.data.matches, 'match');
        
        if (filteredMatches.length === 0) {
            content.innerHTML = '<div class="no-data"><i class="fas fa-inbox"></i><p>No matches found</p></div>';
            return;
        }

        const html = `
            <div class="data-table">
                <div class="table-header">
                    <div class="table-title">Matches (${filteredMatches.length})</div>
                    <div class="table-actions">
                        <button class="btn btn-primary" id="run-matching">
                            <i class="fas fa-sync"></i> Run Matching
                        </button>
                    </div>
                </div>
                <div class="table-body">
                    ${filteredMatches.map(match => this.createMatchRow(match)).join('')}
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        this.setupRowActions();
    }

    createRequestRow(request) {
        const urgencyColors = {
            low: '#27ae60',
            medium: '#f39c12',
            high: '#e67e22',
            critical: '#e74c3c'
        };

        const statusBadges = {
            active: 'badge-primary',
            matched: 'badge-warning',
            fulfilled: 'badge-success',
            cancelled: 'badge-danger'
        };

        return `
            <div class="table-row" data-id="${request.id}">
                <div class="row-main">
                    <div class="row-info">
                        <div class="row-title">${request.requester_name}</div>
                        <div class="row-subtitle">${request.help_category} • ${request.location}</div>
                        <div class="row-description">${this.truncateText(request.description, 100)}</div>
                    </div>
                    <div class="row-meta">
                        <span class="badge ${statusBadges[request.status] || 'badge-secondary'}">${request.status}</span>
                        <span class="urgency-badge" style="background-color: ${urgencyColors[request.urgency_level]}">
                            ${request.urgency_level}
                        </span>
                        <span class="people-count">${request.people_count} people</span>
                        <span class="timestamp">${this.formatDate(request.created_at)}</span>
                    </div>
                </div>
                <div class="row-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewDetails('request', '${request.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.updateStatus('request', '${request.id}', 'fulfilled')">
                        <i class="fas fa-check"></i> Fulfill
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.updateStatus('request', '${request.id}', 'cancelled')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
    }

    createOfferRow(offer) {
        const statusBadges = {
            active: 'badge-success',
            busy: 'badge-warning',
            inactive: 'badge-secondary'
        };

        const typeColors = {
            individual: '#3498db',
            ngo: '#9b59b6',
            government: '#e74c3c',
            business: '#f39c12',
            religious: '#27ae60'
        };

        return `
            <div class="table-row" data-id="${offer.id}">
                <div class="row-main">
                    <div class="row-info">
                        <div class="row-title">${offer.provider_name}</div>
                        <div class="row-subtitle">${offer.help_types.join(', ')} • ${offer.provider_location}</div>
                        <div class="row-description">${this.truncateText(offer.description, 100)}</div>
                    </div>
                    <div class="row-meta">
                        <span class="badge ${statusBadges[offer.status] || 'badge-secondary'}">${offer.status}</span>
                        <span class="provider-type" style="color: ${typeColors[offer.provider_type]}">
                            ${offer.provider_type}
                        </span>
                        <span class="capacity">Capacity: ${offer.capacity}</span>
                        <span class="radius">${offer.service_radius}km radius</span>
                        <span class="timestamp">${this.formatDate(offer.created_at)}</span>
                    </div>
                </div>
                <div class="row-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewDetails('offer', '${offer.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="adminDashboard.updateStatus('offer', '${offer.id}', 'busy')">
                        <i class="fas fa-pause"></i> Set Busy
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.updateStatus('offer', '${offer.id}', 'inactive')">
                        <i class="fas fa-stop"></i> Deactivate
                    </button>
                </div>
            </div>
        `;
    }

    createMatchRow(match) {
        const statusBadges = {
            pending: 'badge-warning',
            accepted: 'badge-primary',
            declined: 'badge-secondary',
            completed: 'badge-success'
        };

        return `
            <div class="table-row" data-id="${match.id}">
                <div class="row-main">
                    <div class="row-info">
                        <div class="row-title">Match Score: ${match.match_score || 'N/A'}</div>
                        <div class="row-subtitle">
                            ${match.help_requests?.requester_name} ↔ ${match.help_offers?.provider_name}
                        </div>
                        <div class="row-description">
                            ${match.help_requests?.help_category} in ${match.help_requests?.location}
                            → ${match.help_offers?.provider_type} from ${match.help_offers?.provider_location}
                        </div>
                    </div>
                    <div class="row-meta">
                        <span class="badge ${statusBadges[match.status] || 'badge-secondary'}">${match.status}</span>
                        <span class="urgency">${match.help_requests?.urgency_level}</span>
                        <span class="timestamp">${this.formatDate(match.created_at)}</span>
                    </div>
                </div>
                <div class="row-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewDetails('match', '${match.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-success" onclick="adminDashboard.updateStatus('match', '${match.id}', 'completed')">
                        <i class="fas fa-check"></i> Complete
                    </button>
                </div>
            </div>
        `;
    }

    setupRowActions() {
        // Re-attach event listeners for filter controls
        const filterControls = document.querySelectorAll('.filter-control');
        filterControls.forEach(control => {
            control.addEventListener('change', () => this.applyFilters());
        });

        // Run matching button
        const matchingBtn = document.getElementById('run-matching');
        if (matchingBtn) {
            matchingBtn.addEventListener('click', () => this.runMatching());
        }
    }

    filterData(data, type) {
        return data.filter(item => {
            if (this.filters.status !== 'all' && item.status !== this.filters.status) {
                return false;
            }
            
            if (type === 'request') {
                if (this.filters.urgency !== 'all' && item.urgency_level !== this.filters.urgency) {
                    return false;
                }
                if (this.filters.category !== 'all' && item.help_category !== this.filters.category) {
                    return false;
                }
            }
            
            if (type === 'offer') {
                if (this.filters.providerType !== 'all' && item.provider_type !== this.filters.providerType) {
                    return false;
                }
            }
            
            return true;
        });
    }

    applyFilters() {
        // Update filter values
        document.querySelectorAll('.filter-control').forEach(control => {
            const filterType = control.dataset.filter;
            this.filters[filterType] = control.value;
        });
        
        // Re-render current tab
        this.renderCurrentTab();
    }

    async viewDetails(type, id) {
        try {
            let item;
            
            switch (type) {
                case 'request':
                    item = this.data.requests.find(r => r.id === id);
                    break;
                case 'offer':
                    item = this.data.offers.find(o => o.id === id);
                    break;
                case 'match':
                    item = this.data.matches.find(m => m.id === id);
                    break;
            }
            
            if (!item) {
                alert('Item not found');
                return;
            }
            
            this.showDetailsModal(type, item);
            
        } catch (error) {
            console.error('Error viewing details:', error);
            alert('Failed to view details');
        }
    }

    showDetailsModal(type, item) {
        const modal = document.createElement('div');
        modal.className = 'modal details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                ${this.createDetailsContent(type, item)}
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.appendChild(modal);
    }

    createDetailsContent(type, item) {
        if (type === 'request') {
            return `
                <h3>Help Request Details</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Name:</strong> ${item.requester_name}
                    </div>
                    <div class="detail-item">
                        <strong>Phone:</strong> ${item.phone_number}
                    </div>
                    <div class="detail-item">
                        <strong>Category:</strong> ${item.help_category}
                    </div>
                    <div class="detail-item">
                        <strong>Urgency:</strong> ${item.urgency_level}
                    </div>
                    <div class="detail-item">
                        <strong>Location:</strong> ${item.location}
                    </div>
                    <div class="detail-item">
                        <strong>People Count:</strong> ${item.people_count}
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong> ${item.status}
                    </div>
                    <div class="detail-item">
                        <strong>Created:</strong> ${this.formatDate(item.created_at)}
                    </div>
                    <div class="detail-item full-width">
                        <strong>Description:</strong><br>
                        ${item.description}
                    </div>
                </div>
            `;
        } else if (type === 'offer') {
            return `
                <h3>Help Offer Details</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Provider:</strong> ${item.provider_name}
                    </div>
                    <div class="detail-item">
                        <strong>Phone:</strong> ${item.phone_number}
                    </div>
                    <div class="detail-item">
                        <strong>Type:</strong> ${item.provider_type}
                    </div>
                    <div class="detail-item">
                        <strong>Help Types:</strong> ${item.help_types.join(', ')}
                    </div>
                    <div class="detail-item">
                        <strong>Location:</strong> ${item.provider_location}
                    </div>
                    <div class="detail-item">
                        <strong>Capacity:</strong> ${item.capacity}
                    </div>
                    <div class="detail-item">
                        <strong>Service Radius:</strong> ${item.service_radius}km
                    </div>
                    <div class="detail-item">
                        <strong>Availability:</strong> ${item.availability}
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong> ${item.status}
                    </div>
                    <div class="detail-item">
                        <strong>Created:</strong> ${this.formatDate(item.created_at)}
                    </div>
                    <div class="detail-item full-width">
                        <strong>Description:</strong><br>
                        ${item.description || 'No description provided'}
                    </div>
                </div>
            `;
        } else {
            return `
                <h3>Match Details</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Match Score:</strong> ${item.match_score || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong> ${item.status}
                    </div>
                    <div class="detail-item">
                        <strong>Created:</strong> ${this.formatDate(item.created_at)}
                    </div>
                    <div class="detail-item full-width">
                        <strong>Request:</strong> ${item.help_requests?.requester_name} - ${item.help_requests?.help_category}
                    </div>
                    <div class="detail-item full-width">
                        <strong>Offer:</strong> ${item.help_offers?.provider_name} - ${item.help_offers?.provider_type}
                    </div>
                </div>
            `;
        }
    }

    async updateStatus(type, id, newStatus) {
        try {
            showLoading('Updating status...');
            
            if (type === 'request') {
                await window.database.updateRequestStatus(id, newStatus);
            } else if (type === 'offer') {
                await window.database.updateOfferStatus(id, newStatus);
            } else if (type === 'match') {
                await window.supabase
                    .from('matches')
                    .update({ status: newStatus })
                    .eq('id', id);
            }
            
            await this.loadData();
            hideLoading();
            
        } catch (error) {
            hideLoading();
            console.error('Error updating status:', error);
            alert('Failed to update status: ' + error.message);
        }
    }

    async runMatching() {
        try {
            showLoading('Running matching algorithm...');
            
            // Get active requests and offers
            const activeRequests = this.data.requests.filter(r => r.status === 'active');
            const activeOffers = this.data.offers.filter(o => o.status === 'active');
            
            let newMatches = 0;
            
            for (const request of activeRequests) {
                const matchingOffers = await window.database.findMatchingOffers(request);
                
                for (const offer of matchingOffers) {
                    // Check if match already exists
                    const existingMatch = this.data.matches.find(m => 
                        m.request_id === request.id && m.offer_id === offer.id
                    );
                    
                    if (!existingMatch) {
                        // Create new match
                        await window.supabase
                            .from('matches')
                            .insert([{
                                request_id: request.id,
                                offer_id: offer.id,
                                match_score: this.calculateMatchScore(request, offer),
                                match_reasons: this.getMatchReasons(request, offer)
                            }]);
                        
                        newMatches++;
                    }
                }
            }
            
            await this.loadData();
            hideLoading();
            
            alert(`Matching complete! Created ${newMatches} new matches.`);
            
        } catch (error) {
            hideLoading();
            console.error('Error running matching:', error);
            alert('Failed to run matching: ' + error.message);
        }
    }

    calculateMatchScore(request, offer) {
        let score = 0;
        
        // Category match
        if (offer.help_types.includes(request.help_category)) {
            score += 40;
        }
        
        // Urgency priority
        const urgencyScores = { critical: 30, high: 20, medium: 10, low: 5 };
        score += urgencyScores[request.urgency_level] || 0;
        
        // Provider type scoring
        const providerScores = { 
            ngo: 15, 
            government: 12, 
            business: 10, 
            religious: 8, 
            individual: 5 
        };
        score += providerScores[offer.provider_type] || 0;
        
        // Capacity vs need
        if (offer.capacity >= request.people_count) {
            score += 10;
        }
        
        // Availability
        const availabilityScores = { 
            immediate: 15, 
            within_hours: 10, 
            within_days: 5 
        };
        score += availabilityScores[offer.availability] || 0;
        
        return Math.min(score, 100);
    }

    getMatchReasons(request, offer) {
        const reasons = [];
        
        if (offer.help_types.includes(request.help_category)) {
            reasons.push('Category match');
        }
        
        if (request.urgency_level === 'critical') {
            reasons.push('Critical urgency');
        }
        
        if (offer.provider_type === 'ngo' || offer.provider_type === 'government') {
            reasons.push('Professional provider');
        }
        
        if (offer.capacity >= request.people_count) {
            reasons.push('Sufficient capacity');
        }
        
        if (offer.availability === 'immediate') {
            reasons.push('Immediate availability');
        }
        
        return reasons;
    }

    setupRealTimeUpdates() {
        if (!window.database) return;

        // Subscribe to data changes
        window.database.subscribeToRequests(() => {
            console.log('Requests updated');
            this.loadData();
        });

        window.database.subscribeToOffers(() => {
            console.log('Offers updated');
            this.loadData();
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-banner';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        errorDiv.style.cssText = `
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 1rem;
            text-align: center;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        document.body.insertBefore(errorDiv, document.body.firstChild);
        
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    async exportData() {
        try {
            const exportData = {
                requests: this.data.requests,
                offers: this.data.offers,
                matches: this.data.matches,
                exported_at: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relieflink-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data');
        }
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

console.log('Supabase Admin Dashboard ready for ReliefLink Lite');