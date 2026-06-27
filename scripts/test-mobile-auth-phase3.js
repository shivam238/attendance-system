#!/usr/bin/env node
/**
 * Session-relay mobile auth checks
 * Run: node scripts/test-mobile-auth-phase3.js
 */

const fs = require('fs');
const path = require('path');

const authJsPath = path.join(__dirname, '../public/assets/js/auth.js');
const loginAppPath = path.join(__dirname, '../public/login-app.html');
const indexHtmlPath = path.join(__dirname, '../public/index.html');
const rulesPath = path.join(__dirname, '../database.rules.json');

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
const rules = fs.readFileSync(rulesPath, 'utf8');

const oauthCredDefCount = (authJs.match(/function signInWithGoogleOAuthCredential/g) || []).length;
if (oauthCredDefCount !== 1) {
    fail('auth.js must define signInWithGoogleOAuthCredential exactly once (found ' + oauthCredDefCount + ')');
} else {
    pass('auth.js has single signInWithGoogleOAuthCredential definition');
}

const authScriptTags = indexHtml.match(/assets\/js\/auth\.js/g) || [];
if (authScriptTags.length !== 1) {
    fail('index.html must load auth.js exactly once (found ' + authScriptTags.length + ')');
} else {
    pass('index.html loads auth.js once');
}

if (authJs.includes('access_token') || loginApp.includes('access_token')) {
    fail('OAuth access_token must not appear in mobile auth flow');
} else {
    pass('No OAuth access_token in mobile auth flow');
}

if (loginApp.match(/attendify:\/\/[^"']*[?&]token=/)) {
    fail('login-app.html must not put OAuth tokens in deep link URL');
} else {
    pass('login-app.html deep link contains no OAuth token param');
}

if (!loginApp.includes('createdAt') || !loginApp.includes('used: false')) {
    fail('login-app.html must write createdAt and used:false on session');
} else {
    pass('login-app.html writes createdAt + used:false session');
}

if (/\.getIdToken\s*\(/.test(loginApp)) {
    fail('login-app.html must not call user.getIdToken()');
} else {
    pass('login-app.html does not call user.getIdToken()');
}

if (!authJs.includes('claimAuthSession')) {
    fail('auth.js must atomically claim sessions');
} else {
    pass('auth.js implements claimAuthSession transaction');
}

if (!authJs.includes('AUTH_SESSION_TTL_MS')) {
    fail('auth.js must define AUTH_SESSION_TTL_MS');
} else {
    pass('auth.js defines session TTL');
}

if (!authJs.includes('getRandomValues')) {
    fail('auth.js must use crypto random session keys');
} else {
    pass('auth.js uses crypto random session keys');
}

if (!authJs.includes('_attendifyAuthDeepLinkRegistered')) {
    fail('auth.js must guard against duplicate deep-link registration');
} else {
    pass('auth.js prevents duplicate deep-link listener registration');
}

if (!rules.includes('used') || !rules.includes('createdAt')) {
    fail('database.rules.json must enforce used + createdAt on sessions');
} else {
    pass('database.rules.json enforces session expiry and used flag');
}

if (failures > 0) {
    console.error(`\n${failures} test(s) failed.`);
    process.exit(1);
}

console.log('\nAll session-relay mobile auth checks passed.');
