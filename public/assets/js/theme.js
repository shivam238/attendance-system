function applyTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.innerHTML = isDark ? '☀️' : '🌙';
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.innerHTML = isDark ? '☀️' : '🌙';
    }
}

// Run applyTheme on DOMContentLoaded
document.addEventListener('DOMContentLoaded', applyTheme);
