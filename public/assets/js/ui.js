// ── Native app / PWA detection ──────────────────────────────────────────────
(function() {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform()) || isPWA;
    if (isNative) {
        document.documentElement.classList.add('is-native-app');
    }
})();

// ── Screen management ────────────────────────────────────────────────────────
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');

        const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform()) || isPWA;

        // Handle native-app viewport height locking
        if (screenId === 'app-screen') {
            document.body.classList.remove('native-login-active');
            document.body.classList.add('app-layout-active');
        } else if ((screenId === 'login-screen' || screenId === 'workspace-screen') && isNative) {
            document.body.classList.remove('app-layout-active');
            document.body.classList.add('native-login-active');
        } else {
            document.body.classList.remove('app-layout-active');
            document.body.classList.remove('native-login-active');
        }

        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }
}

function showCRLogin() {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform()) || isPWA;

    const card = document.getElementById('ws-card-cr');
    if (card) {
        card.classList.add('ws-selected');
        setTimeout(() => {
            card.classList.remove('ws-selected');
            // Push a history entry so browser back returns to workspace (web only)
            if (!isNative) {
                history.pushState({ attendifyScreen: 'login-screen' }, '', window.location.href);
            }
            showScreen('login-screen');
        }, 220);
    } else {
        if (!isNative) {
            history.pushState({ attendifyScreen: 'login-screen' }, '', window.location.href);
        }
        showScreen('login-screen');
    }
}

// ── Browser back-button guard ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isNativeEnv = !!(window.Capacitor && window.Capacitor.isNativePlatform()) || isPWA;

    if (!isNativeEnv) {
        // Seed the initial history entry so we have something to fall back to
        history.replaceState({ attendifyScreen: 'root' }, '', window.location.href);

        window.addEventListener('popstate', () => {
            const activeScreen = document.querySelector('.screen.active');
            // Only intercept if user is currently on the CR login screen
            if (activeScreen && activeScreen.id === 'login-screen') {
                history.pushState({ attendifyScreen: 'root' }, '', window.location.href);
                showScreen('workspace-screen');
            }
        });
    }
});

// ── Toast notifications ──────────────────────────────────────────────────────
function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ── QR helpers ───────────────────────────────────────────────────────────────
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

// ── Modals ───────────────────────────────────────────────────────────────────
function openGuideModal() {
    const modal = document.getElementById('guide-modal');
    if (modal) modal.classList.add('active');
}

function closeGuideModal() {
    const modal = document.getElementById('guide-modal');
    if (modal) modal.classList.remove('active');
}

// ── Navigation drawer ────────────────────────────────────────────────────────
function toggleNavDrawer() {
    const drawer = document.getElementById('nav-drawer');
    const overlay = document.getElementById('nav-drawer-overlay');
    const buttons = document.querySelectorAll('.hamburger-btn');
    if (drawer && overlay) {
        const isOpen = drawer.classList.toggle('open');
        overlay.classList.toggle('open', isOpen);
        buttons.forEach(btn => btn.classList.toggle('open', isOpen));
    }
}

// ── Misc UI ───────────────────────────────────────────────────────────────────
function contactDeveloper() {
    window.open('https://www.instagram.com/theattendify/', '_blank');
}

function openLogoPopup() {
    const popup = document.getElementById('logo-popup');
    if (popup) popup.classList.add('active');
}

function closeLogoPopup() {
    const popup = document.getElementById('logo-popup');
    if (popup) popup.classList.remove('active');
}

// ── Draggable dashboard tabs ─────────────────────────────────────────────────
function initDraggableTabs() {
    const tabsContainer = document.getElementById('main-app-tabs');
    if (!tabsContainer) return;

    let dragSrcEl = null;

    // Restore order from localStorage
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

    // Touch support variables
    let touchStartTimer = null;
    let touchDraggedActive = false;
    let touchSrcEl = null;

    function handleTouchStart(e) {
        const targetBtn = e.currentTarget;
        touchSrcEl = targetBtn;
        touchDraggedActive = false;

        touchStartTimer = setTimeout(() => {
            touchDraggedActive = true;
            targetBtn.classList.add('dragging');
            tabsContainer.classList.add('dragging-active');
            if (navigator.vibrate) navigator.vibrate(50);
        }, 220);
    }

    function handleTouchMove(e) {
        if (!touchSrcEl) return;

        if (!touchDraggedActive) {
            clearTimeout(touchStartTimer);
            return;
        }

        e.preventDefault(); // Lock page scroll

        const touch = e.touches[0];
        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!elem) return;

        const targetBtn = elem.closest('.tab-btn');
        if (targetBtn && targetBtn !== touchSrcEl && targetBtn.parentNode === tabsContainer) {
            const rect = targetBtn.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;

            if (touch.clientX < midX) {
                tabsContainer.insertBefore(touchSrcEl, targetBtn);
            } else {
                tabsContainer.insertBefore(touchSrcEl, targetBtn.nextSibling);
            }
        }
    }

    function handleTouchEnd() {
        clearTimeout(touchStartTimer);
        if (touchSrcEl) {
            touchSrcEl.classList.remove('dragging');
            touchSrcEl = null;
        }
        if (touchDraggedActive) {
            tabsContainer.classList.remove('dragging-active');
            touchDraggedActive = false;
            saveTabOrder();
        }
    }

    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);

        setTimeout(() => {
            this.classList.add('dragging');
            tabsContainer.classList.add('dragging-active');
        }, 10);

        if (navigator.vibrate) navigator.vibrate(50);
    }

    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (this !== dragSrcEl) {
            const rect = this.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;

            if (e.clientX < midX) {
                this.parentNode.insertBefore(dragSrcEl, this);
            } else {
                this.parentNode.insertBefore(dragSrcEl, this.nextSibling);
            }
        }
        return false;
    }

    function handleDragEnter() {
        if (this !== dragSrcEl) this.classList.add('over');
    }

    function handleDragLeave() {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        this.classList.remove('over');
        tabsContainer.classList.remove('dragging-active');
        saveTabOrder();
        return false;
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        tabsContainer.classList.remove('dragging-active');
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
        btn.setAttribute('draggable', 'true');
        btn.addEventListener('dragstart', handleDragStart, false);
        btn.addEventListener('dragenter', handleDragEnter, false);
        btn.addEventListener('dragover', handleDragOver, false);
        btn.addEventListener('dragleave', handleDragLeave, false);
        btn.addEventListener('drop', handleDrop, false);
        btn.addEventListener('dragend', handleDragEnd, false);

        // Touch events
        btn.addEventListener('touchstart', handleTouchStart, { passive: true });
        btn.addEventListener('touchmove', handleTouchMove, { passive: false });
        btn.addEventListener('touchend', handleTouchEnd, { passive: true });
        btn.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    });
}

document.addEventListener('DOMContentLoaded', initDraggableTabs);
