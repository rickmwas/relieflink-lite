// Supabase Authentication Manager for ReliefLink Lite
// Replaces Firebase Auth with Supabase Auth for Kenyan humanitarian aid app

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.init();
    }

    async init() {
        try {
            // Wait for Supabase to be available
            await this.waitForSupabase();
            
            // Get current user session
            await this.getCurrentUser();
            
            // Set up auth state listener
            this.setupAuthListener();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Auth manager initialized with Supabase');
        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }

    async waitForSupabase() {
        let attempts = 0;
        while (!window.auth && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (!window.auth) {
            throw new Error('Supabase auth not available');
        }
    }

    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Registration form submission
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    setupAuthListener() {
        if (window.auth) {
            window.auth.onAuthStateChange(async (user) => {
                this.currentUser = user;
                
                if (user) {
                    // Check admin status
                    this.isAdmin = await window.database.checkAdminStatus(user.id);
                    console.log('User signed in:', user.email);
                } else {
                    this.isAdmin = false;
                    console.log('User signed out');
                }
                
                this.updateUI();
                this.updateAdminUI();
            });
        }
    }

    async getCurrentUser() {
        if (window.auth) {
            this.currentUser = await window.auth.getCurrentUser();
            if (this.currentUser) {
                this.isAdmin = await window.database.checkAdminStatus(this.currentUser.id);
            }
            this.updateUI();
            this.updateAdminUI();
        }
    }

    showLoginModal() {
        const loginModal = document.getElementById('login-modal');
        if (!loginModal) {
            this.createLoginModal();
        } else {
            loginModal.style.display = 'flex';
        }
    }

    createLoginModal() {
        const modalHTML = `
            <div id="login-modal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
                    <h2>Sign In to ReliefLink</h2>
                    
                    <div class="auth-tabs">
                        <button class="tab-btn active" onclick="showAuthTab('login')">Sign In</button>
                        <button class="tab-btn" onclick="showAuthTab('register')">Register</button>
                    </div>

                    <!-- Login Form -->
                    <form id="login-form" class="auth-form active">
                        <div class="form-group">
                            <label for="login-email">Email:</label>
                            <input type="email" id="login-email" required>
                        </div>
                        <div class="form-group">
                            <label for="login-password">Password:</label>
                            <input type="password" id="login-password" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Sign In</button>
                    </form>

                    <!-- Registration Form -->
                    <form id="register-form" class="auth-form">
                        <div class="form-group">
                            <label for="register-name">Full Name:</label>
                            <input type="text" id="register-name" required>
                        </div>
                        <div class="form-group">
                            <label for="register-email">Email:</label>
                            <input type="email" id="register-email" required>
                        </div>
                        <div class="form-group">
                            <label for="register-phone">Phone Number:</label>
                            <input type="tel" id="register-phone" required>
                        </div>
                        <div class="form-group">
                            <label for="register-location">Location:</label>
                            <input type="text" id="register-location" placeholder="City, County" required>
                        </div>
                        <div class="form-group">
                            <label for="register-password">Password:</label>
                            <input type="password" id="register-password" minlength="6" required>
                        </div>
                        <div class="form-group">
                            <label for="register-confirm">Confirm Password:</label>
                            <input type="password" id="register-confirm" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Register</button>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add styles for modal
        this.addModalStyles();
        
        // Setup event listeners for new form
        this.setupEventListeners();
        
        // Show modal
        document.getElementById('login-modal').style.display = 'flex';
    }

    addModalStyles() {
        const styles = `
            <style>
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    justify-content: center;
                    align-items: center;
                }
                
                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 400px;
                    position: relative;
                }
                
                .close {
                    position: absolute;
                    right: 1rem;
                    top: 1rem;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                
                .auth-tabs {
                    display: flex;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #ddd;
                }
                
                .tab-btn {
                    flex: 1;
                    padding: 0.5rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                }
                
                .tab-btn.active {
                    border-bottom-color: #3498db;
                    font-weight: bold;
                }
                
                .auth-form {
                    display: none;
                }
                
                .auth-form.active {
                    display: block;
                }
                
                .form-group {
                    margin-bottom: 1rem;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                }
                
                .form-group input {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
            </style>
        `;
        
        if (!document.getElementById('auth-modal-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            showLoading('Signing in...');
            await window.auth.signIn(email, password);
            
            // Close modal
            document.getElementById('login-modal').style.display = 'none';
            hideLoading();
            
            console.log('Login successful');
        } catch (error) {
            hideLoading();
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const location = document.getElementById('register-location').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            showLoading('Creating account...');
            
            await window.auth.signUp(email, password, {
                full_name: name,
                phone_number: phone,
                location: location
            });
            
            // Close modal
            document.getElementById('login-modal').style.display = 'none';
            hideLoading();
            
            alert('Registration successful! Please check your email to verify your account.');
        } catch (error) {
            hideLoading();
            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);
        }
    }

    async logout() {
        try {
            await window.auth.signOut();
            
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
            if (userName) {
                userName.textContent = this.currentUser.user_metadata?.full_name || this.currentUser.email;
            }
        } else {
            // User is not logged in
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');
        }
    }

    updateAdminUI() {
        const adminLink = document.getElementById('admin-link');
        if (adminLink) {
            if (this.isAdmin) {
                adminLink.classList.remove('hidden');
            } else {
                adminLink.classList.add('hidden');
            }
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAdmin() {
        return this.isAdmin;
    }

    requireAuth(callback) {
        if (this.currentUser) {
            callback();
        } else {
            this.showLoginModal();
        }
    }

    requireAdmin(callback) {
        if (this.currentUser && this.isAdmin) {
            callback();
        } else if (this.currentUser) {
            alert('Admin access required');
        } else {
            this.showLoginModal();
        }
    }
}

// Global functions for auth tabs
function showAuthTab(tabName) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active from all tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected form and tab
    if (tabName === 'login') {
        document.getElementById('login-form').classList.add('active');
        document.querySelector('.tab-btn:first-child').classList.add('active');
    } else {
        document.getElementById('register-form').classList.add('active');
        document.querySelector('.tab-btn:last-child').classList.add('active');
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

function navigateTo(url) {
    window.location.href = url;
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

console.log('Supabase Auth system ready for ReliefLink Lite');