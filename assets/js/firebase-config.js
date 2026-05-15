// Central Firebase Configuration for QR Attendance System
const firebaseConfig = {
    apiKey: "AIzaSyDN6iWRpxLZuwzQYVX580eTQbZuz2VY-HU",
    authDomain: "firstfile-c763521e.firebaseapp.com",
    databaseURL: "https://firstfile-c763521e-default-rtdb.firebaseio.com",
    projectId: "firstfile-c763521e",
    storageBucket: "firstfile-c763521e.appspot.com",
    messagingSenderId: "338947118228",
    appId: "1:338947118228:web:7573617be2d12e616259c7"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();
