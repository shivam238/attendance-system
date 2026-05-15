// Auth management for ATTENDIFY

function signInWithGoogle() {
    const msgDiv = document.getElementById('login-message');
    if (msgDiv) msgDiv.innerHTML = '<div class="message">🔄 Signing in...</div>';

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });

    auth.signInWithPopup(provider).catch((error) => {
        console.error('Google sign-in error:', error);
        if (msgDiv) msgDiv.innerHTML = '<div class="message error">❌ Sign-in failed: ' + error.message + '</div>';
    });
}

function logoutUser() {
    auth.signOut().then(() => {
        window.location.reload();
    }).catch(err => {
        console.error("Logout error:", err);
    });
}

function initiateDeleteAccount() {
    const confirm1 = confirm("⚠️ DANGER: Are you absolutely sure?\n\nThis will permanently delete your profile, all student records, and attendance history. This action cannot be undone.");
    if (!confirm1) return;

    const confirm2 = prompt("Type 'DELETE' to confirm account destruction:");
    if (confirm2 !== 'DELETE') {
        alert("Deletion cancelled. Confirmation text did not match.");
        return;
    }

    // Start Cleanup
    const userId = auth.currentUser.uid;
    const username = currentUser.username;
    
    if (typeof showToast === 'function') showToast("🗑️ Deleting data...");
    
    // 1. Delete Attendance History
    db.ref('attendance').orderByKey().startAt(username).endAt(username + '\uf8ff').once('value', (snapshot) => {
        const updates = {};
        snapshot.forEach((child) => {
            updates[child.key] = null;
        });
        
        db.ref('attendance').update(updates).then(() => {
            // 2. Delete Requests
            return db.ref('requests').orderByKey().startAt(username).endAt(username + '\uf8ff').once('value');
        }).then((reqSnapshot) => {
            const reqUpdates = {};
            reqSnapshot.forEach((child) => {
                reqUpdates[child.key] = null;
            });
            return db.ref('requests').update(reqUpdates);
        }).then(() => {
            // 3. Delete User Profile
            return db.ref('users/' + userId).remove();
        }).then(() => {
            // 4. Delete Auth User
            return auth.currentUser.delete();
        }).then(() => {
            alert("Account successfully deleted. You have been logged out.");
            localStorage.clear();
            window.location.reload();
        }).catch((error) => {
            console.error("Deletion error:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("⚠️ For security, please logout and log back in before deleting your account.");
            } else {
                alert("❌ Error during deletion: " + error.message);
            }
        });
    });
}
