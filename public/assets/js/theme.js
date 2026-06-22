function applyTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Update subpage theme toggle button (manual.html style)
    const subpageBtn = document.getElementById('theme-toggle-btn');
    if (subpageBtn) {
        // Only update innerHTML if it's a text-label style button (not a CSS toggle)
        if (subpageBtn.dataset.style === 'text') {
            subpageBtn.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
        // CSS-only toggle buttons use ::after pseudo-element — no innerHTML needed
    }
    
    // Update main dashboard & student portal theme buttons
    const appBtns = document.querySelectorAll('.theme-btn');
    appBtns.forEach(btn => {
        // Only update if the button has explicit text content to manage
        if (btn.dataset.style === 'text') {
            btn.innerHTML = isDark ? '☀️' : '🌙';
        }
    });
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
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
