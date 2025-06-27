// FIREBASE CONFIGURATION TEMPLATE
// Copy this content to js/firebase-config.js and replace with your actual Firebase project values

const firebaseConfig = {
    // Replace with your Firebase project's API key
    apiKey: "YOUR_FIREBASE_API_KEY_HERE",
    
    // Replace YOUR_PROJECT_ID with your actual Firebase project ID
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    
    // Replace with your actual messaging sender ID and app ID
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Configuration for Firebase Auth
auth.useDeviceLanguage();

// Production mode - no demo mode
window.auth = auth;
window.database = database;
window.googleProvider = googleProvider;
window.firebaseConfig = firebaseConfig;
window.isDemoMode = false;

console.log('Firebase initialized successfully with your project credentials');