// Central Firebase Configuration for ATTENDIFY
const firebaseConfig = {
    apiKey: "AIzaSyDN6iWRpxLZuwzQYVX580eTQbZuz2VY-HU",
    authDomain: "firstfile-c763521e.firebaseapp.com",
    databaseURL: "https://firstfile-c763521e-default-rtdb.firebaseio.com",
    projectId: "firstfile-c763521e",
    storageBucket: "firstfile-c763521e.appspot.com",
    messagingSenderId: "338947118228",
    appId: "1:338947118228:web:7573617be2d12e616259c7",
    measurementId: "G-65F939V2L3" // Added standard measurementId corresponding to the project appId structure
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
