// UI and Utility functions for QR Attendance System

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }
}

function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function copyQRLink() {
    if (!currentQRCode) {
        showToast("❌ No QR generated yet");
        return;
    }
    const link = `https://qr-smart-attendance.web.app/attendance.html?id=${currentQRCode}`;
    navigator.clipboard.writeText(link).then(() => {
        showToast("📋 Link copied to clipboard!");
    });
}
