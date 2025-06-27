// Firebase Configuration - Using actual environment variables
const firebaseConfig = {
    apiKey: "AIzaSyAl4Q3eGzUfCEa0VyTOGb6PjDXpQgWtpRA",
    authDomain: "relief-link-ade81.firebaseapp.com", 
    databaseURL: "https://relief-link-ade81-default-rtdb.firebaseio.com/",
    projectId: "relief-link-ade81",
    storageBucket: "relief-link-ade81.appspot.com",
    messagingSenderId: "502080516031",
    appId: "1:502080516031:web:30c20b1bcdb1aea0a6a04c"
};

// Initialize Firebase with error handling
try {
    firebase.initializeApp(firebaseConfig);
    
    // Get Firebase services
    const auth = firebase.auth();
    const database = firebase.database();
    
    // Google Auth Provider
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    
    // Export for use in other files
    window.auth = auth;
    window.database = database;
    window.googleProvider = googleProvider;
    
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    
    // Create fallback objects to prevent app crashes
    window.auth = {
        onAuthStateChanged: (callback) => callback(null),
        signInWithPopup: () => Promise.reject(new Error('Firebase connection failed')),
        signOut: () => Promise.resolve()
    };
    
    window.database = {
        ref: (path) => ({
            once: () => Promise.resolve({ val: () => ({}) }),
            on: () => {},
            set: () => Promise.resolve(),
            update: () => Promise.resolve()
        })
    };
    
    window.googleProvider = {};
}

// Export configuration
window.firebaseConfig = firebaseConfig;
window.isDemoMode = false;
