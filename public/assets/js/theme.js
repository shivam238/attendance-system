function applyTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Update subpage theme toggle button
    const subpageBtn = document.getElementById('theme-toggle-btn');
    if (subpageBtn) {
        subpageBtn.innerHTML = '';
    }
    
    // Update main dashboard & student portal theme buttons
    const appBtns = document.querySelectorAll('.theme-btn');
    appBtns.forEach(btn => {
        btn.innerHTML = '';
    });
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    // Update subpage button state
    const subpageBtn = document.getElementById('theme-toggle-btn');
    if (subpageBtn) {
        subpageBtn.innerHTML = '';
    }
    
    // Update app/portal buttons state
    const appBtns = document.querySelectorAll('.theme-btn');
    appBtns.forEach(btn => {
        btn.innerHTML = '';
    });

    // Cloud Sync if present on dashboard
    if (window.syncSettingToCloud) {
        window.syncSettingToCloud('darkMode', isDark);
    }
}

// Run applyTheme on DOMContentLoaded to ensure elements are available
document.addEventListener('DOMContentLoaded', applyTheme);
