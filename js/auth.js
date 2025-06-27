// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.init();
    }

    init() {
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateUI();
            this.checkAdminStatus();
        });

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Admin login button
        const adminLoginBtn = document.getElementById('admin-login-btn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => this.login());
        }
    }

    async login() {
        try {
            showLoading();
            const result = await auth.signInWithPopup(googleProvider);
            console.log('User signed in:', result.user.email);
            hideLoading();
        } catch (error) {
            console.error('Login error:', error);
            hideLoading();
            alert('Login failed: ' + error.message);
        }
    }

    async logout() {
        try {
            await auth.signOut();
            console.log('User signed out');
            this.currentUser = null;
            this.isAdmin = false;
            
            // Redirect to home if on admin page
            if (window.location.pathname.includes('admin.html')) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed: ' + error.message);
        }
    }

    updateUI() {
        const authSection = document.getElementById('auth-section');
        const loginBtn = document.getElementById('login-btn');
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');

        if (!authSection) return;

        if (this.currentUser) {
            // User is logged in
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userInfo) userInfo.classList.remove('hidden');
            if (userName) userName.textContent = this.currentUser.displayName || this.currentUser.email;
        } else {
            // User is not logged in
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');
        }
    }

    async checkAdminStatus() {
        if (!this.currentUser) {
            this.isAdmin = false;
            this.updateAdminUI();
            return;
        }

        try {
            // Check if user is in admin list
            const adminRef = database.ref('admins/' + this.currentUser.uid);
            const snapshot = await adminRef.once('value');
            this.isAdmin = snapshot.exists();
            
            // If no admin exists, make the first user an admin
            if (!this.isAdmin) {
                const allAdminsRef = database.ref('admins');
                const allAdminsSnapshot = await allAdminsRef.once('value');
                const admins = allAdminsSnapshot.val();
                
                if (!admins || Object.keys(admins).length === 0) {
                    // First user becomes admin
                    await adminRef.set({
                        email: this.currentUser.email,
                        name: this.currentUser.displayName || this.currentUser.email,
                        createdAt: Date.now(),
                        role: 'super-admin'
                    });
                    this.isAdmin = true;
                    console.log('First user granted admin access');
                }
            }
            
            this.updateAdminUI();
        } catch (error) {
            console.error('Error checking admin status:', error);
            this.isAdmin = false;
            this.updateAdminUI();
        }
    }

    updateAdminUI() {
        const adminAuthCheck = document.getElementById('admin-auth-check');
        const adminDashboard = document.getElementById('admin-dashboard');

        if (adminAuthCheck && adminDashboard) {
            if (this.currentUser && this.isAdmin) {
                adminAuthCheck.classList.add('hidden');
                adminDashboard.classList.remove('hidden');
            } else {
                adminAuthCheck.classList.remove('hidden');
                adminDashboard.classList.add('hidden');
            }
        }
    }

    // Utility method to get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Utility method to check if user is admin
    isUserAdmin() {
        return this.isAdmin;
    }

    // Require authentication for certain actions
    requireAuth(callback) {
        if (this.currentUser) {
            callback();
        } else {
            alert('Please log in to perform this action.');
            this.login();
        }
    }

    // Require admin access for certain actions
    requireAdmin(callback) {
        if (this.currentUser && this.isAdmin) {
            callback();
        } else if (this.currentUser) {
            alert('Admin access required for this action.');
        } else {
            alert('Please log in with admin credentials.');
            this.login();
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Make auth manager available globally
window.authManager = authManager;

// Utility functions for loading states
function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        const loadingText = overlay.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Utility function for navigation
function navigateTo(url) {
    window.location.href = url;
}

console.log('Auth manager initialized');
