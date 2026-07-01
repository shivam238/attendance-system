function applyTheme() {
    const saved = localStorage.getItem('darkMode');
    let isDark;

    if (saved !== null) {
        // User has a saved preference — always respect it
        isDark = saved === 'true';
    } else {
        // No saved preference — default to device preference
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        // Save device preference so it's consistent across navigations
        localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    }

    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // Update subpage theme toggle button (manual.html style)
    const subpageBtn = document.getElementById('theme-toggle-btn');
    if (subpageBtn) {
        if (subpageBtn.dataset.style === 'text') {
            subpageBtn.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }

    // Update main dashboard & student portal theme buttons
    const appBtns = document.querySelectorAll('.theme-btn');
    appBtns.forEach(btn => {
        if (btn.dataset.style === 'text') {
            btn.innerHTML = isDark ? '☀️' : '🌙';
        }
    });
}

function toggleDarkMode() {
    // Suppress all CSS transitions for 2 frames — eliminates repaint lag on theme switch
    document.body.classList.add('theme-switching');
    requestAnimationFrame(() => requestAnimationFrame(() => {
        document.body.classList.remove('theme-switching');
    }));

    const isDark = document.body.classList.toggle('dark-mode');
    // Save user's explicit manual choice
    localStorage.setItem('darkMode', isDark);

    // Update subpage button state
    const subpageBtn = document.getElementById('theme-toggle-btn');
    if (subpageBtn) {
        if (subpageBtn.dataset.style === 'text') {
            subpageBtn.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }

    // Update app/portal buttons state
    const appBtns = document.querySelectorAll('.theme-btn');
    appBtns.forEach(btn => {
        if (btn.dataset.style === 'text') {
            btn.innerHTML = isDark ? '☀️' : '🌙';
        }
    });

    // Cloud Sync if present on dashboard
    if (window.syncSettingToCloud) {
        window.syncSettingToCloud('darkMode', isDark);
    }
}

// Run applyTheme on DOMContentLoaded to ensure elements are available
document.addEventListener('DOMContentLoaded', applyTheme);
