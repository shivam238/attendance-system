// Central Firebase Configuration for ATTENDIFY
const firebaseConfig = {
    apiKey: "AIzaSyD1EDACdh01a2n81qKUtYsCPV0m--JfwFU",
    authDomain: "firstfile-c763521e.firebaseapp.com",
    databaseURL: "https://firstfile-c763521e-default-rtdb.firebaseio.com",
    projectId: "firstfile-c763521e",
    storageBucket: "firstfile-c763521e.firebasestorage.app",
    messagingSenderId: "841328143028",
    appId: "1:841328143028:web:caebd6835972138e70c5e1",
    measurementId: "G-RC6MB6YMV9"
};


// Initialize Firebase. Keep the app shell usable even if the CDN SDK is blocked
// or fails to load, otherwise the loading screen can stay up forever.
if (typeof firebase === 'undefined') {
    window.attendifyFirebaseUnavailable = true;
    console.error("Firebase SDK failed to load. Authentication and database features are unavailable.");
} else if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
const db = (typeof firebase !== 'undefined' && firebase.database) ? firebase.database() : null;

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
