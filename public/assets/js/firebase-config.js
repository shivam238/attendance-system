// Central Firebase Configuration for ATTENDIFY
const firebaseConfig = {
    apiKey: "AIzaSyBzeR_s64wa6GV9EWd3n3z4hlmF1JP9Agk",
    authDomain: "attendify-staging.firebaseapp.com",
    databaseURL: "https://attendify-staging-default-rtdb.firebaseio.com",
    projectId: "attendify-staging",
    storageBucket: "attendify-staging.firebasestorage.app",
    messagingSenderId: "626082005024",
    appId: "1:626082005024:web:e943edc4831ffbd6a5fc45",
    measurementId: "G-FH7TW0S84N"
};


// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

// Safe global helper for logging analytics events
let analytics = null;
try {
    if (typeof firebase !== 'undefined' && firebase.analytics) {
        analytics = firebase.analytics();
    }
} catch (e) {
    console.warn("Firebase Analytics initialization failed:", e);
}

function logAnalyticsEvent(eventName, params = {}) {
    try {
        if (analytics) {
            analytics.logEvent(eventName, params);
        } else {
            console.log("[Analytics Dummy]", eventName, params);
        }
    } catch (e) {
        console.warn("Failed to log analytics event:", e);
    }
}

// Background Anonymous Authentication for unauthenticated public student pages (track.html, feedback.html)
if (typeof firebase !== 'undefined' && firebase.auth) {
    const isPublicPage = window.location.pathname.includes('track.html') || 
                         window.location.pathname.includes('feedback.html');
    if (isPublicPage) {
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                firebase.auth().signInAnonymously().catch((error) => {
                    console.error("Firebase background Anonymous Auth failed:", error);
                });
            }
        });
    }
}

