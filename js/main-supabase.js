// Main Application Logic for ReliefLink Lite with Supabase
// Kenyan Humanitarian Aid App - Replaces Firebase with Supabase

class ReliefLinkApp {
    constructor() {
        this.stats = {
            totalRequests: 0,
            totalOffers: 0,
            totalMatches: 0,
            activeRequests: 0
        };
        this.init();
    }

    async init() {
        try {
            // Wait for Supabase to be ready
            await this.waitForSupabase();
            
            this.setupEventListeners();
            await this.loadStats();
            await this.loadRecentActivity();
            this.setupRealTimeUpdates();
            
            console.log('ReliefLink Lite initialized with Supabase');
        } catch (error) {
            console.error('App initialization error:', error);
            this.showError('Failed to initialize app. Please refresh the page.');
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

    setupEventListeners() {
        // Navigation links
        const helpRequestBtn = document.getElementById('request-help-btn');
        if (helpRequestBtn) {
            helpRequestBtn.addEventListener('click', () => {
                window.location.href = 'request-help.html';
            });
        }

        const offerHelpBtn = document.getElementById('offer-help-btn');
        if (offerHelpBtn) {
            offerHelpBtn.addEventListener('click', () => {
                window.location.href = 'offer-help.html';
            });
        }

        const viewMapBtn = document.getElementById('view-map-btn');
        if (viewMapBtn) {
            viewMapBtn.addEventListener('click', () => {
                window.location.href = 'map.html';
            });
        }

        const adminBtn = document.querySelector('.btn-admin');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                if (window.authManager && window.authManager.isUserAdmin()) {
                    window.location.href = 'admin.html';
                } else {
                    alert('Admin access required');
                }
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-stats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadStats());
        }
    }

    async loadStats() {
        try {
            showLoading('Loading statistics...');
            
            // Load data from Supabase
            const [requests, offers] = await Promise.all([
                window.database.getHelpRequests(),
                window.database.getHelpOffers()
            ]);
            
            // Calculate stats
            this.stats.totalRequests = requests.length;
            this.stats.totalOffers = offers.length;
            this.stats.activeRequests = requests.filter(r => r.status === 'active').length;
            
            // Get matches count (if matches exist)
            try {
                const { data: matches } = await window.supabase
                    .from('matches')
                    .select('id');
                this.stats.totalMatches = matches ? matches.length : 0;
            } catch (error) {
                console.warn('Could not load matches:', error);
                this.stats.totalMatches = 0;
            }
            
            this.updateStatsDisplay();
            hideLoading();
            
        } catch (error) {
            console.error('Error loading stats:', error);
            hideLoading();
            
            // Show default stats on error
            this.stats = {
                totalRequests: 0,
                totalOffers: 0,
                totalMatches: 0,
                activeRequests: 0
            };
            this.updateStatsDisplay();
        }
    }

    updateStatsDisplay() {
        // Update DOM elements with stats
        const elements = {
            'total-requests': this.stats.totalRequests,
            'total-offers': this.stats.totalOffers,
            'total-matches': this.stats.totalMatches,
            'active-requests': this.stats.activeRequests
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, value);
            }
        });
    }

    animateNumber(element, targetNumber) {
        const startNumber = parseInt(element.textContent) || 0;
        const duration = 1000; // 1 second
        const steps = 30;
        const increment = (targetNumber - startNumber) / steps;
        let current = startNumber;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;
            
            if (step >= steps) {
                element.textContent = targetNumber;
                clearInterval(timer);
            } else {
                element.textContent = Math.round(current);
            }
        }, duration / steps);
    }

    async loadRecentActivity() {
        try {
            const activityFeed = document.getElementById('activity-feed');
            if (!activityFeed) return;

            // Clear existing activity
            activityFeed.innerHTML = '<div class="activity-item"><i class="fas fa-info-circle"></i><span>Loading recent activity...</span></div>';

            // Load recent requests and offers
            const [recentRequests, recentOffers] = await Promise.all([
                this.getRecentRequests(3),
                this.getRecentOffers(3)
            ]);

            // Combine and sort by date
            const activities = [
                ...recentRequests.map(r => ({
                    type: 'request',
                    data: r,
                    timestamp: new Date(r.created_at)
                })),
                ...recentOffers.map(o => ({
                    type: 'offer',
                    data: o,
                    timestamp: new Date(o.created_at)
                }))
            ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

            // Update activity feed
            if (activities.length === 0) {
                activityFeed.innerHTML = '<div class="activity-item"><i class="fas fa-info-circle"></i><span>No recent activity. Be the first to help!</span></div>';
            } else {
                activityFeed.innerHTML = activities.map(activity => 
                    this.createActivityItem(activity)
                ).join('');
            }

        } catch (error) {
            console.error('Error loading recent activity:', error);
            const activityFeed = document.getElementById('activity-feed');
            if (activityFeed) {
                activityFeed.innerHTML = '<div class="activity-item"><i class="fas fa-exclamation-triangle"></i><span>Unable to load recent activity</span></div>';
            }
        }
    }

    createActivityItem(activity) {
        const { type, data, timestamp } = activity;
        const timeAgo = this.getTimeAgo(timestamp);
        
        if (type === 'request') {
            const urgencyIcon = this.getUrgencyIcon(data.urgency_level);
            return `
                <div class="activity-item">
                    <i class="fas fa-hand-paper text-danger"></i>
                    <div class="activity-content">
                        <span><strong>${data.requester_name}</strong> needs ${data.help_category} help in ${data.location}</span>
                        <small class="activity-time">${timeAgo} • ${urgencyIcon} ${data.urgency_level}</small>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="activity-item">
                    <i class="fas fa-hands-helping text-success"></i>
                    <div class="activity-content">
                        <span><strong>${data.provider_name}</strong> offers ${data.help_types.join(', ')} help in ${data.provider_location}</span>
                        <small class="activity-time">${timeAgo} • ${data.provider_type}</small>
                    </div>
                </div>
            `;
        }
    }

    getUrgencyIcon(urgency) {
        const icons = {
            low: '🟢',
            medium: '🟡',
            high: '🟠',
            critical: '🔴'
        };
        return icons[urgency] || '⚪';
    }

    async getRecentRequests(limit = 5) {
        try {
            const { data, error } = await window.supabase
                .from('help_requests')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting recent requests:', error);
            return [];
        }
    }

    async getRecentOffers(limit = 5) {
        try {
            const { data, error } = await window.supabase
                .from('help_offers')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting recent offers:', error);
            return [];
        }
    }

    setupRealTimeUpdates() {
        if (!window.database) return;

        // Subscribe to help requests changes
        const requestsSubscription = window.database.subscribeToRequests((payload) => {
            console.log('Help requests updated:', payload);
            this.loadStats();
            this.loadRecentActivity();
        });

        // Subscribe to help offers changes
        const offersSubscription = window.database.subscribeToOffers((payload) => {
            console.log('Help offers updated:', payload);
            this.loadStats();
            this.loadRecentActivity();
        });

        // Store subscriptions for cleanup
        this.subscriptions = [requestsSubscription, offersSubscription];
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - timestamp) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
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
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Cleanup subscriptions when page unloads
    cleanup() {
        if (this.subscriptions) {
            this.subscriptions.forEach(subscription => {
                if (subscription && subscription.unsubscribe) {
                    subscription.unsubscribe();
                }
            });
        }
    }
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId = null) {
    if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    } else {
        // Close all modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
}

// Loading functions
function showLoading(message = 'Loading...') {
    let loadingDiv = document.getElementById('loading-overlay');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
        `;
        document.body.appendChild(loadingDiv);
    } else {
        loadingDiv.querySelector('p').textContent = message;
        loadingDiv.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.reliefLinkApp) {
        window.reliefLinkApp.cleanup();
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reliefLinkApp = new ReliefLinkApp();
});

console.log('ReliefLink Lite main app ready with Supabase backend');