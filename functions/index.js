const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const AUTH_SESSION_TTL_MS = 120 * 1000;
const SESSION_KEY_PATTERN = /^sk_[A-F0-9]{32}$/;

exports.createMobileAuthSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Google sign-in is required before creating a mobile auth session.'
        );
    }

    const sk = data && data.sk;
    if (!sk || typeof sk !== 'string' || !SESSION_KEY_PATTERN.test(sk)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid session key format.');
    }

    const uid = context.auth.uid;
    const sessionRef = admin.database().ref('student_auth_sessions/' + sk);
    const existing = await sessionRef.once('value');

    if (existing.exists()) {
        throw new functions.https.HttpsError('already-exists', 'Auth session already exists.');
    }

    const customToken = await admin.auth().createCustomToken(uid);
    const sessionData = {
        uid: uid,
        customToken: customToken,
        createdAt: Date.now(),
        used: false
    };

    await sessionRef.set(sessionData);

    functions.logger.info('Mobile auth session created', { sk: sk, uid: uid });

    return { ok: true, uid: uid };
});
