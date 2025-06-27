// Main application logic
class ReliefLinkApp {
    constructor() {
        this.stats = {
            totalRequests: 0,
            totalOffers: 0,
            totalMatches: 0,
            pendingRequests: 0
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStats();
        this.loadRecentActivity();
        this.checkDemoMode();
        
        // Real-time updates
        this.setupRealTimeUpdates();
    }
    
    checkDemoMode() {
        if (window.isDemoMode) {
            const demoBanner = document.getElementById('demo-banner');
            if (demoBanner) {
                demoBanner.classList.remove('hidden');
            }
        }
    }

    setupEventListeners() {
        // Navigation helpers
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-navigate]')) {
                const url = e.target.getAttribute('data-navigate');
                navigateTo(url);
            }
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-stats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadStats());
        }
    }

    async loadStats() {
        try {
            showLoading('Loading statistics...');
            
            // Set a timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database connection timeout')), 5000)
            );

            // Load data with timeout
            const dataPromise = Promise.all([
                database.ref('help-requests').once('value'),
                database.ref('help-offers').once('value'),
                database.ref('matches').once('value')
            ]);

            const [requestsSnapshot, offersSnapshot, matchesSnapshot] = await Promise.race([
                dataPromise,
                timeoutPromise
            ]);

            const requests = requestsSnapshot.val() || {};
            const offers = offersSnapshot.val() || {};
            const matches = matchesSnapshot.val() || {};
            
            // Calculate stats
            this.stats.totalRequests = Object.keys(requests).length;
            this.stats.totalOffers = Object.keys(offers).length;
            this.stats.totalMatches = Object.keys(matches).length;
            this.stats.pendingRequests = Object.values(requests).filter(r => r.status === 'pending').length;
            
            this.updateStatsDisplay();
            hideLoading();
            
        } catch (error) {
            console.warn('Database not ready:', error.message);
            hideLoading();
            
            // Show default stats
            this.stats.totalRequests = 0;
            this.stats.totalOffers = 0;
            this.stats.totalMatches = 0;
            this.stats.pendingRequests = 0;
            
            this.updateStatsDisplay();
            this.showDatabaseSetupMessage();
        }
    }
    
    showDatabaseSetupMessage() {
        // Create a temporary message banner
        const messageDiv = document.createElement('div');
        messageDiv.className = 'database-setup-message';
        messageDiv.innerHTML = `
            <div class="setup-message-content">
                <i class="fas fa-database"></i>
                <span>Database setup required. Please create a Realtime Database in your Firebase console.</span>
                <button onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
            </div>
        `;
        
        // Add styles
        messageDiv.style.cssText = `
            background: linear-gradient(135deg, #3498db, #2980b9);
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
        
        document.body.insertBefore(messageDiv, document.body.firstChild);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.style.display = 'none';
            }
        }, 10000);
    }

    updateStatsDisplay() {
        // Update stats on homepage
        const totalRequestsEl = document.getElementById('total-requests');
        const totalOffersEl = document.getElementById('total-offers');
        const totalMatchesEl = document.getElementById('total-matches');
        
        if (totalRequestsEl) {
            this.animateNumber(totalRequestsEl, this.stats.totalRequests);
        }
        if (totalOffersEl) {
            this.animateNumber(totalOffersEl, this.stats.totalOffers);
        }
        if (totalMatchesEl) {
            this.animateNumber(totalMatchesEl, this.stats.totalMatches);
        }

        // Update admin stats if on admin page
        const totalRequestsStatEl = document.getElementById('total-requests-stat');
        const totalOffersStatEl = document.getElementById('total-offers-stat');
        const totalMatchesStatEl = document.getElementById('total-matches-stat');
        const pendingRequestsStatEl = document.getElementById('pending-requests-stat');
        
        if (totalRequestsStatEl) totalRequestsStatEl.textContent = this.stats.totalRequests;
        if (totalOffersStatEl) totalOffersStatEl.textContent = this.stats.totalOffers;
        if (totalMatchesStatEl) totalMatchesStatEl.textContent = this.stats.totalMatches;
        if (pendingRequestsStatEl) pendingRequestsStatEl.textContent = this.stats.pendingRequests;
    }

    animateNumber(element, targetNumber) {
        const currentNumber = parseInt(element.textContent) || 0;
        const increment = Math.ceil((targetNumber - currentNumber) / 10);
        
        if (currentNumber < targetNumber) {
            element.textContent = currentNumber + increment;
            setTimeout(() => this.animateNumber(element, targetNumber), 50);
        } else {
            element.textContent = targetNumber;
        }
    }

    async loadRecentActivity() {
        try {
            const activityFeed = document.getElementById('activity-feed');
            if (!activityFeed) return;

            // Load recent requests and offers
            const recentRequests = await this.getRecentRequests(3);
            const recentOffers = await this.getRecentOffers(3);
            const recentMatches = await this.getRecentMatches(3);

            // Combine and sort by timestamp
            const allActivity = [
                ...recentRequests.map(r => ({...r, type: 'request'})),
                ...recentOffers.map(o => ({...o, type: 'offer'})),
                ...recentMatches.map(m => ({...m, type: 'match'}))
            ].sort((a, b) => b.timestamp - a.timestamp);

            // Update activity feed
            activityFeed.innerHTML = '';
            
            if (allActivity.length === 0) {
                activityFeed.innerHTML = `
                    <div class="activity-item">
                        <i class="fas fa-info-circle"></i>
                        <span>No recent activity. Be the first to request or offer help!</span>
                    </div>
                `;
                return;
            }

            allActivity.slice(0, 5).forEach(activity => {
                const activityItem = this.createActivityItem(activity);
                activityFeed.appendChild(activityItem);
            });

        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    createActivityItem(activity) {
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        let icon, message;
        const timeAgo = this.getTimeAgo(activity.timestamp);
        
        switch (activity.type) {
            case 'request':
                icon = 'fas fa-hand-paper';
                message = `New help request for ${activity.helpCategory} in ${activity.location}`;
                break;
            case 'offer':
                icon = 'fas fa-heart';
                message = `New help offer from ${activity.providerName} in ${activity.providerLocation}`;
                break;
            case 'match':
                icon = 'fas fa-handshake';
                message = `Successful match made for ${activity.category} assistance`;
                break;
        }
        
        item.innerHTML = `
            <i class="${icon}"></i>
            <div>
                <span>${message}</span>
                <small class="text-muted"> - ${timeAgo}</small>
            </div>
        `;
        
        return item;
    }

    async getRecentRequests(limit = 5) {
        try {
            const requestsRef = database.ref('help-requests').limitToLast(limit);
            const snapshot = await requestsRef.once('value');
            return Object.values(snapshot.val() || {});
        } catch (error) {
            console.error('Error getting recent requests:', error);
            return [];
        }
    }

    async getRecentOffers(limit = 5) {
        try {
            const offersRef = database.ref('help-offers').limitToLast(limit);
            const snapshot = await offersRef.once('value');
            return Object.values(snapshot.val() || {});
        } catch (error) {
            console.error('Error getting recent offers:', error);
            return [];
        }
    }

    async getRecentMatches(limit = 5) {
        try {
            const matchesRef = database.ref('matches').limitToLast(limit);
            const snapshot = await matchesRef.once('value');
            return Object.values(snapshot.val() || {});
        } catch (error) {
            console.error('Error getting recent matches:', error);
            return [];
        }
    }

    setupRealTimeUpdates() {
        // Listen for new requests
        database.ref('help-requests').on('child_added', () => {
            this.loadStats();
            this.loadRecentActivity();
        });

        // Listen for new offers
        database.ref('help-offers').on('child_added', () => {
            this.loadStats();
            this.loadRecentActivity();
        });

        // Listen for new matches
        database.ref('matches').on('child_added', () => {
            this.loadStats();
            this.loadRecentActivity();
        });
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new ReliefLinkApp();
    window.reliefLinkApp = app;
});

// Utility functions for modal management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    } else {
        // Close all modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));
    }
    document.body.style.overflow = '';
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Demo banner management
function closeDemoBanner() {
    const demoBanner = document.getElementById('demo-banner');
    if (demoBanner) {
        demoBanner.classList.add('hidden');
        localStorage.setItem('demoBannerClosed', 'true');
    }
}

// Check if demo banner was previously closed
if (localStorage.getItem('demoBannerClosed') === 'true') {
    const demoBanner = document.getElementById('demo-banner');
    if (demoBanner) {
        demoBanner.classList.add('hidden');
    }
}

console.log('Main app initialized');
