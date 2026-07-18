function applyTheme() {
    // Suppress transitions during theme change to eliminate repaint lag
    document.body.classList.add('theme-switching');
    requestAnimationFrame(() => requestAnimationFrame(() => {
        document.body.classList.remove('theme-switching');
    }));

    const pref = localStorage.getItem('themePreference') || 'default';
    let isDark = false;

    if (pref === 'dark') {
        isDark = true;
    } else if (pref === 'light') {
        isDark = false;
    } else { // 'default' — follow OS
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // Update theme select element if it exists in UI
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = pref;
    }

    // Update subpage theme toggle button (manual.html text-style btn)
    const subpageBtn = document.getElementById('theme-toggle-btn');
    if (subpageBtn) {
        if (subpageBtn.dataset.style === 'text') {
            subpageBtn.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }

    // Update all .theme-btn icon buttons (login-screen, setup-screen, track.html)
    const appBtns = document.querySelectorAll('.theme-btn');
    appBtns.forEach(btn => {
        btn.innerHTML = isDark ? '☀️' : '🌙';
    });
}

// Pending sync queue — stores the last theme pref that couldn't be synced yet
// because syncSettingToCloud wasn't available (auth not ready)
var _pendingThemeSync = null;

function syncThemePreference(value) {
    if (window.syncSettingToCloud) {
        window.syncSettingToCloud('themePreference', value);
        _pendingThemeSync = null;
    } else if (window.parent && window.parent.syncSettingToCloud && window.parent !== window) {
        window.parent.syncSettingToCloud('themePreference', value);
        _pendingThemeSync = null;
    } else {
        // Auth not ready yet — queue it for when syncSettingToCloud becomes available
        _pendingThemeSync = value;
    }
}

// Called by index.html once syncSettingToCloud is ready (post sign-in)
window.flushPendingThemeSync = function () {
    if (_pendingThemeSync !== null && window.syncSettingToCloud) {
        window.syncSettingToCloud('themePreference', _pendingThemeSync);
        _pendingThemeSync = null;
    }
};

function toggleDarkMode() {
    const currentPref = localStorage.getItem('themePreference') || 'default';
    let nextPref;
    if (currentPref === 'default') {
        const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        // Toggle away from current system appearance
        nextPref = systemDark ? 'light' : 'dark';
    } else {
        nextPref = currentPref === 'dark' ? 'light' : 'dark';
    }

    localStorage.setItem('themePreference', nextPref);
    // Keep legacy darkMode key in sync (for backward compat with old components)
    localStorage.setItem('darkMode', nextPref === 'dark' ? 'true' : 'false');

    applyTheme();
    syncThemePreference(nextPref);
}

function applyThemeSetting(value) {
    localStorage.setItem('themePreference', value);

    if (value === 'default') {
        // For 'default', remove the legacy darkMode key entirely so other
        // devices don't pick it up and override back to a fixed mode
        localStorage.removeItem('darkMode');
    } else {
        // Keep legacy key synced for dark/light explicit choices
        localStorage.setItem('darkMode', value === 'dark' ? 'true' : 'false');
    }

    applyTheme();
    syncThemePreference(value);
}

// Listen to OS prefers-color-scheme changes (only matters when pref is 'default')
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const pref = localStorage.getItem('themePreference') || 'default';
        if (pref === 'default') {
            applyTheme();
        }
    });
}

// Expose functions globally
window.applyTheme = applyTheme;
window.toggleDarkMode = toggleDarkMode;
window.applyThemeSetting = applyThemeSetting;

// Run applyTheme on DOMContentLoaded to ensure elements (theme-select, etc.) are ready
document.addEventListener('DOMContentLoaded', applyTheme);
