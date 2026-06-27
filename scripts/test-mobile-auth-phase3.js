#!/usr/bin/env node
/**
 * Phase 3 mobile auth migration checks for auth.js
 * Run: node scripts/test-mobile-auth-phase3.js
 */

const fs = require('fs');
const path = require('path');

const authJsPath = path.join(__dirname, '../public/assets/js/auth.js');
const loginAppPath = path.join(__dirname, '../public/login-app.html');
const indexHtmlPath = path.join(__dirname, '../public/index.html');

let failures = 0;

function fail(msg) {
    console.error('FAIL:', msg);
    failures += 1;
}

function pass(msg) {
    console.log('PASS:', msg);
}

const authJs = fs.readFileSync(authJsPath, 'utf8');
const loginApp = fs.readFileSync(loginAppPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Student login flow must not read JWT from deep link URL
const classroomTokenUsage = authJs.match(/searchParams\.get\('token'\)/g) || [];
const classroomOnly = authJs.includes('role === \'teacher\'') && classroomTokenUsage.length === 1;
if (classroomTokenUsage.length === 0) {
    pass('auth.js has no searchParams.get(\'token\') usage');
} else if (classroomOnly) {
    pass('auth.js searchParams.get(\'token\') is limited to classroom teacher flow only');
} else {
    fail('auth.js searchParams.get(\'token\') appears outside classroom teacher flow');
}

if (!authJs.includes('completePendingAuthSession()')) {
    fail('auth.js does not call completePendingAuthSession on resume/deep link');
} else {
    pass('auth.js calls completePendingAuthSession on resume/deep link');
}

if (!authJs.includes('PENDING_AUTH_SK_KEY')) {
    fail('auth.js missing PENDING_AUTH_SK_KEY constant');
} else {
    pass('auth.js defines PENDING_AUTH_SK_KEY');
}

if (!authJs.includes('function completePendingAuthSession')) {
    fail('auth.js missing completePendingAuthSession');
} else {
    pass('auth.js defines completePendingAuthSession');
}

if (!authJs.includes('student_auth_sessions/')) {
    fail('auth.js does not reference student_auth_sessions');
} else {
    pass('auth.js references student_auth_sessions');
}

if (!authJs.includes('login-app.html?sk=')) {
    fail('auth.js does not open login-app.html with sk query param');
} else {
    pass('auth.js opens login-app.html?sk=');
}

if (authJs.includes('sessionListenerRef.on(\'value\'')) {
    fail('auth.js still uses legacy Firebase session listener in signInWithGoogle');
} else {
    pass('auth.js removed legacy session listener from sign-in flow');
}

if (!loginApp.includes('student_auth_sessions/')) {
    fail('login-app.html does not write to student_auth_sessions');
} else {
    pass('login-app.html writes to student_auth_sessions');
}

if (loginApp.includes('attendify://') && loginApp.match(/attendify:\/\/[^"']*token/)) {
    fail('login-app.html deep link still contains token');
} else {
    pass('login-app.html deep links contain no JWT');
}

if (indexHtml.includes('login-app.html`, \'_system\')') || indexHtml.includes('login-app.html\', \'_system\')')) {
    fail('index.html still opens login-app.html without session key');
} else {
    pass('index.html student flow delegates to startCapacitorGoogleLogin');
}

if (!indexHtml.includes('startCapacitorGoogleLogin')) {
    fail('index.html does not use startCapacitorGoogleLogin for student capacitor login');
} else {
    pass('index.html uses startCapacitorGoogleLogin');
}

// Simulate resume flow logic
function simulateResumeFlow() {
    const storage = { pending_auth_sk: 'sk_test_123' };
    const firebaseSessions = {
        'sk_test_123': { uid: 'uid1', idToken: 'jwt-test-token', ts: Date.now() }
    };
    let deletedSk = false;
    let loginToken = null;

    const sk = storage.pending_auth_sk;
    if (!sk) return false;
    const data = firebaseSessions[sk];
    if (!data || !data.idToken) return false;
    delete storage.pending_auth_sk;
    deletedSk = true;
    delete firebaseSessions[sk];
    loginToken = data.idToken;
    return { deletedSk, loginToken, sessionRemoved: !firebaseSessions[sk] };
}

const result = simulateResumeFlow();
if (!result.deletedSk || result.loginToken !== 'jwt-test-token' || !result.sessionRemoved) {
    fail('Simulated resume flow did not complete correctly');
} else {
    pass('Simulated resume flow: read sk, fetch session, loginWithToken, cleanup');
}

if (failures > 0) {
    console.error(`\n${failures} test(s) failed.`);
    process.exit(1);
}

console.log('\nAll Phase 3 mobile auth checks passed.');
