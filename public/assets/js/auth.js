// Auth management for ATTENDIFY

let pendingAuthTimeoutId = null;

function signInWithGoogleOAuthCredential(googleOAuthIdToken) {
    if (!googleOAuthIdToken) {
        return Promise.reject(new Error('Google OAuth ID token is required'));
    }
    const credential = firebase.auth.GoogleAuthProvider.credential(googleOAuthIdToken);
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.isAnonymous) {
        return auth.signOut().then(function () { return auth.signInWithCredential(credential); });
    }
    return auth.signInWithCredential(credential);
}

function startCapacitorGoogleLogin(options) {
    options = options || {};

    if (options.openModal === 'cr') {
        openCapacitorLoginModal();
    } else if (typeof options.openModal === 'function') {
        options.openModal();
    }

    openBrowserLoginPage({ studentFlow: !!options.studentFlow });

    const msgDiv = options.messageEl
        || document.getElementById(options.messageElId || 'capacitor-login-message');
    if (msgDiv) {
        msgDiv.innerHTML = '<span style="color: var(--text-color);">🔄 Waiting for Google Sign-In...</span>';
    }

    if (pendingAuthTimeoutId) {
        clearTimeout(pendingAuthTimeoutId);
    }

    pendingAuthTimeoutId = setTimeout(function () {
        pendingAuthTimeoutId = null;
        if (msgDiv) {
            msgDiv.innerHTML = '<span style="color: #ef4444;">❌ Sign-in timed out. Please try again.</span>';
        }
        if (options.openModal === 'cr') {
            closeCapacitorLoginModal();
        } else if (typeof options.onTimeout === 'function') {
            options.onTimeout();
        }
    }, 5 * 60 * 1000);
}

function signInWithGoogle() {
    if (window.Capacitor) {
        startCapacitorGoogleLogin({ openModal: 'cr' });
        return;
    }

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

// Capacitor Auth Bridge Functions
function openCapacitorLoginModal() {
    const modal = document.getElementById('capacitor-login-modal');
    if (modal) {
        toggleCapacitorManualLogin(false);
        modal.classList.add('active');
    } else {
        alert("Mobile sign-in modal not found in HTML.");
    }
}

function toggleCapacitorManualLogin(show) {
    const loadingState = document.getElementById('capacitor-login-loading-state');
    const manualState = document.getElementById('capacitor-login-manual-state');
    if (loadingState && manualState) {
        if (show) {
            loadingState.style.display = 'none';
            manualState.style.display = 'block';
        } else {
            loadingState.style.display = 'block';
            manualState.style.display = 'none';
        }
    }
}

function closeCapacitorLoginModal() {
    const modal = document.getElementById('capacitor-login-modal');
    if (modal) modal.classList.remove('active');
    
    const tokenInput = document.getElementById('capacitor-token-input');
    if (tokenInput) tokenInput.value = '';
    
    const msgDiv = document.getElementById('capacitor-login-message');
    if (msgDiv) msgDiv.innerHTML = '';
}

function openBrowserLoginPage(options) {
    options = options || {};
    const domain = (typeof firebaseConfig !== 'undefined' && firebaseConfig.authDomain)
        ? firebaseConfig.authDomain
        : 'firstfile-c763521e.firebaseapp.com';
    let url = 'https://' + domain + '/login-app.html';
    if (options.studentFlow) {
        url += '?flow=student';
    }
    console.log('[Auth] Opening browser with URL:', url);
    window.open(url, '_system');
}

function verifyCapacitorLoginToken() {
    const tokenInput = document.getElementById('capacitor-token-input');
    const token = tokenInput ? tokenInput.value.trim() : '';
    const msgDiv = document.getElementById('capacitor-login-message');

    if (!token) {
        if (msgDiv) msgDiv.innerHTML = '<span style="color: #ef4444;">❌ Please paste the login code!</span>';
        return;
    }

    if (msgDiv) msgDiv.innerHTML = '<span style="color: var(--text-color);">🔄 Authenticating...</span>';

    signInWithGoogleOAuthCredential(token)
        .then((result) => {
            if (msgDiv) msgDiv.innerHTML = '<span style="color: #10b981;">✅ Signed in successfully!</span>';
            setTimeout(() => {
                closeCapacitorLoginModal();
            }, 1200);
        })
        .catch((error) => {
            console.error("Token sign-in error:", error);
            if (msgDiv) msgDiv.innerHTML = '<span style="color: #ef4444;">❌ Invalid or expired login code. Please try again.</span>';
        });
}

function logoutUser() {
    if (!confirm('Are you sure you want to logout?')) return;
    window.attendifyIntentionalLogout = true;

    // Clear user profile cache to prevent instant-on page restoration
    if (auth.currentUser) {
        localStorage.removeItem('user_profile_' + auth.currentUser.uid);
    }
    
    // Cleanup active Firebase listeners to prevent Permission Denied errors
    if (typeof cleanupFirebaseListeners === 'function') {
        cleanupFirebaseListeners();
    }
    if (typeof hideCRAIFAB === 'function') {
        hideCRAIFAB();
    }

    let logoutFinished = false;
    auth.signOut().catch(err => {
        console.error("Logout error:", err);
    }).then(() => {
        logoutFinished = true;
        window.location.reload();
    });

    // Fallback: Force reload only if sign-out hangs.
    setTimeout(() => {
        if (!logoutFinished) {
            window.location.reload();
        }
    }, 1200);
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

// Phone Login and Linking functions

function toggleLoginMode(mode) {
    const googleContainer = document.querySelector('.google-login-container');
    const phoneContainer = document.getElementById('phone-login-container');
    const msgDiv = document.getElementById('login-message');
    if (msgDiv) msgDiv.innerHTML = '';

    const googleTab = document.getElementById('login-tab-google');
    const phoneTab = document.getElementById('login-tab-phone');

    if (mode === 'phone') {
        googleContainer.style.display = 'none';
        phoneContainer.style.display = 'block';
        if (googleTab) googleTab.classList.remove('active');
        if (phoneTab) phoneTab.classList.add('active');
    } else {
        googleContainer.style.display = 'block';
        phoneContainer.style.display = 'none';
        if (googleTab) googleTab.classList.add('active');
        if (phoneTab) phoneTab.classList.remove('active');
    }
}

function sendPhoneLoginOTP() {
    const phoneInput = document.getElementById('phone-login-input');
    const phone = phoneInput.value.trim();
    const msgDiv = document.getElementById('login-message');

    if (!phone || phone.length !== 10 || isNaN(phone)) {
        if (msgDiv) msgDiv.innerHTML = '<div class="message error">❌ Please enter a valid 10-digit phone number</div>';
        return;
    }

    if (msgDiv) msgDiv.innerHTML = '<div class="message">🔄 Sending OTP...</div>';

    const formattedPhone = "+91" + phone;

    try {
        if (!window.phoneLoginRecaptchaVerifier) {
            window.phoneLoginRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // Recaptcha resolved
                }
            });
        }

        auth.signInWithPhoneNumber(formattedPhone, window.phoneLoginRecaptchaVerifier)
            .then((confirmationResult) => {
                window.phoneLoginConfirmationResult = confirmationResult;
                document.getElementById('phone-input-section').style.display = 'none';
                document.getElementById('otp-input-section').style.display = 'block';
                if (msgDiv) msgDiv.innerHTML = '<div class="message success">📩 OTP sent successfully!</div>';
            })
            .catch((error) => {
                console.error("Phone sign-in error:", error);
                if (msgDiv) msgDiv.innerHTML = '<div class="message error">❌ Failed to send OTP: ' + error.message + '</div>';
                if (window.phoneLoginRecaptchaVerifier) {
                    window.phoneLoginRecaptchaVerifier.clear();
                    window.phoneLoginRecaptchaVerifier = null;
                }
            });
    } catch (e) {
        console.error("Verifier error:", e);
        if (msgDiv) msgDiv.innerHTML = '<div class="message error">❌ Error initializing verification: ' + e.message + '</div>';
    }
}

function verifyPhoneLoginOTP() {
    const otpInput = document.getElementById('otp-login-input');
    const code = otpInput.value.trim();
    const msgDiv = document.getElementById('login-message');

    if (!code || code.length !== 6 || isNaN(code)) {
        if (msgDiv) msgDiv.innerHTML = '<div class="message error">❌ Please enter a valid 6-digit OTP</div>';
        return;
    }

    if (msgDiv) msgDiv.innerHTML = '<div class="message">🔄 Verifying OTP...</div>';

    window.phoneLoginConfirmationResult.confirm(code)
        .then((result) => {
            if (msgDiv) msgDiv.innerHTML = '<div class="message success">✅ Verification successful! Logging in...</div>';
        })
        .catch((error) => {
            console.error("OTP Verification error:", error);
            if (msgDiv) msgDiv.innerHTML = '<div class="message error">❌ Invalid OTP: ' + error.message + '</div>';
        });
}

function resetPhoneLoginUI() {
    document.getElementById('phone-input-section').style.display = 'block';
    document.getElementById('otp-input-section').style.display = 'none';
    document.getElementById('phone-login-input').value = '';
    document.getElementById('otp-login-input').value = '';
    const msgDiv = document.getElementById('login-message');
    if (msgDiv) msgDiv.innerHTML = '';
}

// Modal Functions
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    
    modal.classList.add('active');
    
    if (currentUser) {
        document.getElementById('settings-username').textContent = currentUser.username || 'N/A';
        document.getElementById('settings-class-details').textContent = 
            `Passout 20${currentUser.year} - ${currentUser.college} ${currentUser.branch} Section ${currentUser.section}`;
            
        const user = auth.currentUser;
        if (user) {
            let isGoogleLinked = false;
            let googleEmail = "Not Linked";
            let isPhoneLinked = false;
            let phoneNumber = "Not Linked";
            
            user.providerData.forEach((profile) => {
                if (profile.providerId === 'google.com') {
                    isGoogleLinked = true;
                    googleEmail = profile.email || user.email || "Linked";
                }
                if (profile.providerId === 'phone') {
                    isPhoneLinked = true;
                    phoneNumber = profile.phoneNumber || user.phoneNumber || "Linked";
                }
            });
            
            document.getElementById('google-email').textContent = googleEmail;
            const googleActionContainer = document.getElementById('google-action-btn-container');
            if (isGoogleLinked) {
                googleActionContainer.innerHTML = '<span style="color: #10b981; font-weight: 600;">✅ Linked</span>';
                document.getElementById('google-linking-form').style.display = 'none';
            } else {
                googleActionContainer.innerHTML = '<button class="btn btn-small btn-primary" onclick="showGoogleLinkingForm()" style="margin: 0;">Link Google</button>';
            }
            
            document.getElementById('phone-display').textContent = phoneNumber;
            const phoneActionContainer = document.getElementById('phone-action-btn-container');
            if (isPhoneLinked) {
                phoneActionContainer.innerHTML = '<span style="color: #10b981; font-weight: 600;">✅ Linked</span>';
                document.getElementById('phone-linking-form').style.display = 'none';
            } else {
                phoneActionContainer.innerHTML = '<button class="btn btn-small btn-primary" onclick="showPhoneLinkingForm()" style="margin: 0;">Link Phone</button>';
            }
        }
    }

    // Populate QR Timer Settings if inputs exist
    const attnMinEl = document.getElementById('settings-attn-min');
    if (attnMinEl) {
        attnMinEl.value = localStorage.getItem('attendanceQRMinutes') || '2';
        const attnSecEl = document.getElementById('settings-attn-sec');
        if (attnSecEl) attnSecEl.value = localStorage.getItem('attendanceQRSeconds') || '0';
        const verMinEl = document.getElementById('settings-ver-min');
        if (verMinEl) verMinEl.value = localStorage.getItem('verificationQRMinutes') || '1';
        const verSecEl = document.getElementById('settings-ver-sec');
        if (verSecEl) verSecEl.value = localStorage.getItem('verificationQRSeconds') || '0';
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.remove('active');
    
    document.getElementById('phone-linking-form').style.display = 'none';
    document.getElementById('google-linking-form').style.display = 'none';
    document.getElementById('link-phone-input').value = '';
    document.getElementById('link-otp-input').value = '';
    document.getElementById('link-otp-container').style.display = 'none';
    document.getElementById('btn-send-link-otp').style.display = 'block';
    const msgLink = document.getElementById('link-phone-message');
    if (msgLink) msgLink.innerHTML = '';
}

function showPhoneLinkingForm() {
    document.getElementById('phone-linking-form').style.display = 'block';
    document.getElementById('google-linking-form').style.display = 'none';
}

function showGoogleLinkingForm() {
    document.getElementById('google-linking-form').style.display = 'block';
    document.getElementById('phone-linking-form').style.display = 'none';
}

function sendLinkPhoneOTP() {
    const phoneInput = document.getElementById('link-phone-input');
    const phone = phoneInput.value.trim();
    const msgDiv = document.getElementById('link-phone-message');
    
    if (!phone || phone.length !== 10 || isNaN(phone)) {
        if (msgDiv) msgDiv.innerHTML = '<div style="color: #ef4444; font-weight: 600; font-size: 13px; margin-top: 8px;">❌ Enter a valid 10-digit number</div>';
        return;
    }
    
    if (msgDiv) msgDiv.innerHTML = '<div style="color: var(--text-color); margin-top: 8px;">🔄 Sending OTP...</div>';
    
    const formattedPhone = "+91" + phone;
    
    try {
        if (!window.linkPhoneRecaptchaVerifier) {
            window.linkPhoneRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('link-recaptcha-container', {
                'size': 'invisible'
            });
        }
        
        const provider = new firebase.auth.PhoneAuthProvider();
        provider.verifyPhoneNumber(formattedPhone, window.linkPhoneRecaptchaVerifier)
            .then((verificationId) => {
                window.phoneLinkVerificationId = verificationId;
                document.getElementById('link-otp-container').style.display = 'block';
                document.getElementById('btn-send-link-otp').style.display = 'none';
                if (msgDiv) msgDiv.innerHTML = '<div style="color: #10b981; font-weight: 600; font-size: 13px; margin-top: 8px;">📩 OTP sent successfully!</div>';
            })
            .catch((error) => {
                console.error("Phone linking send error:", error);
                if (msgDiv) msgDiv.innerHTML = '<div style="color: #ef4444; font-weight: 600; font-size: 13px; margin-top: 8px;">❌ Failed to send OTP: ' + error.message + '</div>';
                if (window.linkPhoneRecaptchaVerifier) {
                    window.linkPhoneRecaptchaVerifier.clear();
                    window.linkPhoneRecaptchaVerifier = null;
                }
            });
    } catch (e) {
        console.error("Phone linking verifier error:", e);
        if (msgDiv) msgDiv.innerHTML = '<div style="color: #ef4444; font-weight: 600; font-size: 13px; margin-top: 8px;">❌ Initialisation error: ' + e.message + '</div>';
    }
}

function verifyLinkPhoneOTP() {
    const otpInput = document.getElementById('link-otp-input');
    const code = otpInput.value.trim();
    const phoneInput = document.getElementById('link-phone-input');
    const phone = phoneInput.value.trim();
    const msgDiv = document.getElementById('link-phone-message');
    
    if (!code || code.length !== 6 || isNaN(code)) {
        if (msgDiv) msgDiv.innerHTML = '<div style="color: #ef4444; font-weight: 600; font-size: 13px; margin-top: 8px;">❌ Enter a valid 6-digit OTP</div>';
        return;
    }
    
    if (msgDiv) msgDiv.innerHTML = '<div style="color: var(--text-color); margin-top: 8px;">🔄 Linking account...</div>';
    
    const credential = firebase.auth.PhoneAuthProvider.credential(
        window.phoneLinkVerificationId,
        code
    );
    
    const user = auth.currentUser;
    if (!user) {
        if (msgDiv) msgDiv.innerHTML = '<div style="color: #ef4444; font-weight: 600; font-size: 13px; margin-top: 8px;">❌ Not logged in</div>';
        return;
    }
    
    user.linkWithCredential(credential)
        .then((userCredential) => {
            const formattedPhone = "+91" + phone;
            return db.ref('users/' + user.uid).update({ phone: formattedPhone });
        })
        .then(() => {
            alert("✅ Phone number linked successfully!");
            closeProfileModal();
            handleUserSignedIn(auth.currentUser);
        })
        .catch((error) => {
            console.error("OTP Link confirm error:", error);
            if (error.code === 'auth/credential-already-in-use') {
                if (msgDiv) msgDiv.innerHTML = '<div style="color: #ef4444; font-weight: 600; font-size: 13px; margin-top: 8px;">❌ This phone number is already linked to another account!</div>';
            } else {
                if (msgDiv) msgDiv.innerHTML = '<div style="color: #ef4444; font-weight: 600; font-size: 13px; margin-top: 8px;">❌ Linking failed: ' + error.message + '</div>';
            }
        });
}

function linkGoogleAccount() {
    const msgDiv = document.getElementById('link-google-message');
    if (msgDiv) msgDiv.innerHTML = '<div style="color: var(--text-color); margin-top: 8px;">🔄 Redirecting to Google...</div>';
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    
    const user = auth.currentUser;
    if (!user) return;
    
    user.linkWithPopup(provider)
        .then((result) => {
            const linkedUser = result.user;
            return db.ref('users/' + user.uid).update({
                email: linkedUser.email || user.email || "",
                displayName: linkedUser.displayName || user.displayName || ""
            });
        })
        .then(() => {
            alert("✅ Google account linked successfully!");
            closeProfileModal();
            handleUserSignedIn(auth.currentUser);
        })
        .catch((error) => {
            console.error("Google linking error:", error);
            if (error.code === 'auth/credential-already-in-use') {
                if (msgDiv) msgDiv.innerHTML = '<div style="color: #ef4444; font-weight: 600; font-size: 13px; margin-top: 8px;">❌ This Google account is already linked to another user!</div>';
            } else {
                if (msgDiv) msgDiv.innerHTML = '<div style="color: #ef4444; font-weight: 600; font-size: 13px; margin-top: 8px;">❌ Linking failed: ' + error.message + '</div>';
            }
        });
}

// Track the last processed token to prevent loop/replay of old launch URLs in Capacitor
let lastProcessedToken = null;

// Google OAuth ID token from deep link → signInWithCredential
function loginWithToken(googleOAuthIdToken, options) {
    options = options || {};
    console.log('[Auth] loginWithToken, length:', googleOAuthIdToken ? googleOAuthIdToken.length : 0);
    if (!googleOAuthIdToken) {
        console.error('[Auth] loginWithToken called with empty token');
        return;
    }
    if (googleOAuthIdToken === lastProcessedToken) {
        console.log('[Auth] Token already processed, skipping duplicate authentication.');
        return;
    }
    lastProcessedToken = googleOAuthIdToken;

    if (pendingAuthTimeoutId) {
        clearTimeout(pendingAuthTimeoutId);
        pendingAuthTimeoutId = null;
    }

    const isStudentFlow = !!options.studentFlow;

    const onSuccess = function (result, msgDiv, onDone) {
        console.log('[Auth] signInWithCredential succeeded, user:', result.user.email || result.user.uid);
        if (msgDiv) msgDiv.innerHTML = '<span style="color: #10b981;">✅ Signed in successfully!</span>';
        setTimeout(onDone, isStudentFlow ? 1000 : 1200);
    };

    const onError = function (error, msgDiv) {
        console.error('[Auth] signInWithCredential failed:', error.code, error.message);
        if (msgDiv) {
            msgDiv.innerHTML = '<span style="color: #ef4444;">❌ Invalid or expired login code. Please try again.</span>';
        }
    };

    if (isStudentFlow) {
        const studentCapModal = document.getElementById('student-capacitor-login-modal');
        const studentCapMsg = document.getElementById('student-cap-message');
        if (studentCapMsg) studentCapMsg.innerHTML = '<span style="color: var(--text-color);">🔄 Authenticating from browser...</span>';
        signInWithGoogleOAuthCredential(googleOAuthIdToken)
            .then(function (result) { onSuccess(result, studentCapMsg, function () {
                if (studentCapModal) studentCapModal.classList.remove('active');
                if (typeof updateStudentAuthUI === 'function') updateStudentAuthUI(result.user);
            }); })
            .catch(function (error) { onError(error, studentCapMsg); });
        return;
    }

    const msgDiv = document.getElementById('capacitor-login-message') || document.getElementById('login-message');
    if (msgDiv) msgDiv.innerHTML = '<span style="color: var(--text-color);">🔄 Authenticating from browser...</span>';
    openCapacitorLoginModal();
    signInWithGoogleOAuthCredential(googleOAuthIdToken)
        .then(function (result) { onSuccess(result, msgDiv, function () { closeCapacitorLoginModal(); }); })
        .catch(function (error) { onError(error, msgDiv); });
}

function handleLoginDeepLink(urlObj) {
    const token = urlObj.searchParams.get('token');
    if (token) {
        console.log('[Auth] Received deep-link token:', token.substring(0, 80));
        const studentFlow = urlObj.searchParams.get('flow') === 'student';
        loginWithToken(token, { studentFlow: studentFlow });
    }
}

// Register deep link listener for Capacitor environment (once only)
if (window.Capacitor && !window._attendifyAuthDeepLinkRegistered) {
    window._attendifyAuthDeepLinkRegistered = true;
    document.addEventListener('DOMContentLoaded', () => {
        const checkDeepLink = (url) => {
            try {
                if (url && url.includes('attendify://')) {
                    const urlObj = new URL(url.replace('attendify://', 'https://dummy-domain/'));
                    const role = urlObj.searchParams.get('role');

                    if (url.includes('classroom') || role) {
                        // Classroom auth flow - still uses token for now (separate system)
                        const token = urlObj.searchParams.get('token');
                        if (token && role === 'teacher') {
                            if (typeof saveClassroomToken === 'function') {
                                saveClassroomToken(token);
                                const msgDiv = document.getElementById('classroom-message');
                                if (msgDiv) msgDiv.innerHTML = '<div class="message success">✅ Authorized from browser! Loading courses...</div>';
                                const authSec = document.getElementById('classroom-auth-section');
                                if (authSec) authSec.style.display = 'none';
                                if (typeof loadClassroomCourses === 'function') {
                                    loadClassroomCourses();
                                }
                                if (typeof showToast === 'function') showToast("Classroom connected!");
                            }
                        }
                    } else {
                        handleLoginDeepLink(urlObj);
                    }
                }
            } catch (e) {
                console.error("Failed to parse deep link URL:", e);
            }
        };

        if (window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            console.log('[Auth] Capacitor App plugin available, setting up deep link listeners');
            window.Capacitor.Plugins.App.addListener('appUrlOpen', (data) => {
                console.log('[Auth] appUrlOpen event fired, URL:', data.url);
                checkDeepLink(data.url);
            });

            window.Capacitor.Plugins.App.getLaunchUrl().then(function (launchUrl) {
                if (launchUrl && launchUrl.url) {
                    console.log('[Auth] getLaunchUrl returned, URL:', launchUrl.url);
                    checkDeepLink(launchUrl.url);
                } else {
                    console.log('[Auth] getLaunchUrl returned no URL');
                }
            }).catch(function (err) {
                console.error('[Auth] getLaunchUrl error:', err);
            });
        } else {
            console.error('[Auth] Capacitor App plugin not available');
        }
    });
}
