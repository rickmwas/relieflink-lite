// Local Storage Database Alternative
// This replaces Firebase for a completely free solution

class LocalStorageDB {
    constructor() {
        this.prefix = 'relieflink_';
        this.init();
    }

    init() {
        // Initialize default data structure if not exists
        if (!this.getData('help-requests')) {
            this.setData('help-requests', {});
        }
        if (!this.getData('help-offers')) {
            this.setData('help-offers', {});
        }
        if (!this.getData('matches')) {
            this.setData('matches', {});
        }
        if (!this.getData('admins')) {
            this.setData('admins', {});
        }
    }

    getData(path) {
        const data = localStorage.getItem(this.prefix + path);
        return data ? JSON.parse(data) : null;
    }

    setData(path, data) {
        localStorage.setItem(this.prefix + path, JSON.stringify(data));
        this.triggerListeners(path, data);
    }

    updateData(path, updates) {
        const currentData = this.getData(path) || {};
        const newData = { ...currentData, ...updates };
        this.setData(path, newData);
    }

    deleteData(path) {
        localStorage.removeItem(this.prefix + path);
        this.triggerListeners(path, null);
    }

    // Simulate Firebase ref structure
    ref(path) {
        return {
            once: (eventType) => {
                return Promise.resolve({
                    val: () => this.getData(path)
                });
            },
            
            set: (data) => {
                this.setData(path, data);
                return Promise.resolve();
            },
            
            update: (updates) => {
                this.updateData(path, updates);
                return Promise.resolve();
            },
            
            push: (data) => {
                const id = this.generateId();
                const currentData = this.getData(path) || {};
                currentData[id] = { ...data, id };
                this.setData(path, currentData);
                return Promise.resolve({ key: id });
            },
            
            on: (eventType, callback) => {
                // Simple listener simulation
                this.addListener(path, callback);
            },
            
            off: (eventType, callback) => {
                this.removeListener(path, callback);
            }
        };
    }

    // Event listener simulation
    listeners = {};

    addListener(path, callback) {
        if (!this.listeners[path]) {
            this.listeners[path] = [];
        }
        this.listeners[path].push(callback);
    }

    removeListener(path, callback) {
        if (this.listeners[path]) {
            this.listeners[path] = this.listeners[path].filter(cb => cb !== callback);
        }
    }

    triggerListeners(path, data) {
        if (this.listeners[path]) {
            this.listeners[path].forEach(callback => {
                callback({ val: () => data });
            });
        }
    }

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Clear all data (for testing)
    clearAll() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
        this.init();
    }
}

// Create mock authentication system
class MockAuth {
    constructor() {
        this.currentUser = null;
        this.listeners = [];
        this.init();
    }

    init() {
        // Check if user was previously logged in
        const savedUser = localStorage.getItem('relieflink_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    onAuthStateChanged(callback) {
        this.listeners.push(callback);
        // Immediately call with current state
        callback(this.currentUser);
    }

    signInWithPopup(provider) {
        return new Promise((resolve) => {
            // Simulate user selection
            const userEmail = prompt('Enter your email for demo login:');
            if (userEmail) {
                const user = {
                    uid: 'demo_' + Date.now(),
                    email: userEmail,
                    displayName: userEmail.split('@')[0],
                    photoURL: `https://ui-avatars.com/api/?name=${userEmail}&background=3498db&color=fff`
                };
                
                this.currentUser = user;
                localStorage.setItem('relieflink_user', JSON.stringify(user));
                
                // Notify listeners
                this.listeners.forEach(callback => callback(user));
                
                resolve({ user });
            } else {
                throw new Error('Login cancelled');
            }
        });
    }

    signOut() {
        this.currentUser = null;
        localStorage.removeItem('relieflink_user');
        this.listeners.forEach(callback => callback(null));
        return Promise.resolve();
    }
}

// Initialize and export
const localDB = new LocalStorageDB();
const mockAuth = new MockAuth();

// Replace Firebase objects with local alternatives
window.database = localDB;
window.auth = mockAuth;
window.googleProvider = {}; // Not needed for mock auth

console.log('Local storage database initialized - no Firebase required!');