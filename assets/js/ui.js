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

function openGuideModal() {
    const modal = document.getElementById('guide-modal');
    if (modal) modal.classList.add('active');
}

function closeGuideModal() {
    const modal = document.getElementById('guide-modal');
    if (modal) modal.classList.remove('active');
}

function contactDeveloper() {
    window.open('https://www.instagram.com/heheshivam/', '_blank');
}

function openLogoPopup() {
    const popup = document.getElementById('logo-popup');
    if (popup) popup.classList.add('active');
}

function closeLogoPopup() {
    const popup = document.getElementById('logo-popup');
    if (popup) popup.classList.remove('active');
}
function initDraggableTabs() {
    const tabsContainer = document.getElementById('main-app-tabs');
    if (!tabsContainer) return;

    let dragSrcEl = null;

    // Restore Order from LocalStorage
    const savedOrder = localStorage.getItem('tabOrder');
    if (savedOrder) {
        const orderArr = JSON.parse(savedOrder);
        const tabsMap = {};
        const buttons = Array.from(tabsContainer.querySelectorAll('.tab-btn'));
        buttons.forEach(btn => tabsMap[btn.textContent.trim()] = btn);
        
        tabsContainer.innerHTML = '';
        orderArr.forEach(name => {
            if (tabsMap[name]) tabsContainer.appendChild(tabsMap[name]);
        });
        // Append any new tabs that weren't in saved order
        buttons.forEach(btn => {
            if (!orderArr.includes(btn.textContent.trim())) tabsContainer.appendChild(btn);
        });
    }

    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);

        // Let the browser take its native snapshot of the SOLID button
        // Then we make the original button a placeholder after a tiny delay
        setTimeout(() => {
            this.classList.add('dragging');
        }, 10);

        if (navigator.vibrate) navigator.vibrate(50);
    }

    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (this !== dragSrcEl) {
            const rect = this.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            
            // Move in DOM instantly for "App-style" slide
            if (e.clientX < midX) {
                this.parentNode.insertBefore(dragSrcEl, this);
            } else {
                this.parentNode.insertBefore(dragSrcEl, this.nextSibling);
            }
        }
        return false;
    }

    function handleDragEnter(e) {
        if (this !== dragSrcEl) this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        this.classList.remove('over');
        saveTabOrder();
        return false;
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        btns.forEach(btn => btn.classList.remove('over'));
    }

    function saveTabOrder() {
        const order = Array.from(tabsContainer.querySelectorAll('.tab-btn')).map(btn => btn.textContent.trim());
        localStorage.setItem('tabOrder', JSON.stringify(order));
        
        // Push to Firebase for cross-device sync
        if (window.syncSettingToCloud) {
            window.syncSettingToCloud('tabOrder', order);
        }
    }

    const btns = tabsContainer.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        btn.addEventListener('dragstart', handleDragStart, false);
        btn.addEventListener('dragenter', handleDragEnter, false);
        btn.addEventListener('dragover', handleDragOver, false);
        btn.addEventListener('dragleave', handleDragLeave, false);
        btn.addEventListener('drop', handleDrop, false);
        btn.addEventListener('dragend', handleDragEnd, false);
    });
}

// Call on load
document.addEventListener('DOMContentLoaded', initDraggableTabs);
