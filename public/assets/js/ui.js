// Native app / PWA detection
(function() {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (window.Capacitor || isPWA) {
        document.documentElement.classList.add('is-native-app');
    }
})();

let isBypassingScrollLock = false;
let shouldShowLandingTopOnLaunch = false;

try {
    const url = new URL(window.location.href);
    shouldShowLandingTopOnLaunch = url.searchParams.get('showLanding') === '1';
    if (shouldShowLandingTopOnLaunch) {
        url.searchParams.delete('showLanding');
        const cleanPath = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState(null, '', cleanPath || url.pathname);
    }
} catch (e) {
    shouldShowLandingTopOnLaunch = false;
}

function consumeLandingTopLaunchRequest() {
    if (!shouldShowLandingTopOnLaunch) {
        return false;
    }

    shouldShowLandingTopOnLaunch = false;
    return true;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        const isNative = !!(window.Capacitor) || isPWA;

        // Handle native-app viewport height locking
        if (screenId === 'app-screen') {
            document.body.classList.remove('native-login-active');
            document.body.classList.add('app-layout-active');
        } else if (screenId === 'login-screen' && isNative) {
            // Lock viewport for login screen too in native app
            document.body.classList.remove('app-layout-active');
            document.body.classList.add('native-login-active');
        } else {
            document.body.classList.remove('app-layout-active');
            document.body.classList.remove('native-login-active');
        }

        const landingPage = document.getElementById('landing-page');
        if (landingPage) {
            landingPage.classList.toggle('is-hidden', screenId !== 'login-screen');
            if (screenId === 'login-screen') {
                const showLandingTop = consumeLandingTopLaunchRequest();
                if ((isNative || localStorage.getItem('attendify_skip_landing') === 'true') && !showLandingTop) {
                    landingPage.classList.add('login-locked');
                } else {
                    document.body.classList.remove('native-login-active');
                    landingPage.classList.remove('login-locked');
                    scheduleLandingReveal();
                    window.addEventListener('scroll', handleLandingScroll, { passive: true });
                }
            } else {
                landingPage.classList.remove('login-locked');
            }
        }
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }
}

function scrollToLogin(event) {
    if (event) event.preventDefault();
    closeLandingMenu();
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
        // Scroll to the login screen, offset by 90px to account for the nav bar (which remains visible)
        const targetTop = loginScreen.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
    }
}

function handleLandingScroll() {
    if (isBypassingScrollLock) {
        return;
    }

    const landingPage = document.getElementById('landing-page');
    if (!landingPage || landingPage.classList.contains('is-hidden') || landingPage.classList.contains('login-locked')) {
        return;
    }

    const loginScreen = document.getElementById('login-screen');
    if (!loginScreen || !loginScreen.classList.contains('active')) {
        return;
    }

    const loginRect = loginScreen.getBoundingClientRect();
    
    // Check if the top of the login screen reached the 90px threshold (nav bar height + gap)
    // or if the user has scrolled close to the bottom of the document
    // On mobile, touch inertia and elastic bounce make a larger tolerance (80px) much more reliable.
    const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;

    if (loginRect.top <= 90 || isAtBottom) {
        window.removeEventListener('scroll', handleLandingScroll);
        
        // Cancel active smooth scroll/inertia instantly to prevent scroll cutoff issues
        window.scrollTo({ top: window.scrollY, behavior: 'auto' });
        
        // Set local storage flag so the user skips the landing page on next visits
        try {
            localStorage.setItem('attendify_skip_landing', 'true');
        } catch (e) {
            console.error('Failed to set skip landing flag:', e);
        }

        landingPage.classList.add('login-locked');

        // Lock viewport for login screen in native/PWA modes
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        const isNative = !!(window.Capacitor) || isPWA;
        if (isNative) {
            document.body.classList.add('native-login-active');
        }

        window.scrollTo(0, 0);
        
        // Double-force scroll reset on subsequent frames to override browser layout re-calculation delay
        requestAnimationFrame(() => {
            window.scrollTo(0, 0);
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 30);
        });
    }
}

function scrollToLandingSection(event, sectionId) {
    if (event) event.preventDefault();
    closeLandingMenu();

    const section = document.getElementById(sectionId);
    if (!section) return;

    isBypassingScrollLock = true;

    const landingPage = document.getElementById('landing-page');
    if (landingPage) {
        if (landingPage.classList.contains('login-locked')) {
            // Remove the locked class to render the landing sections again
            landingPage.classList.remove('login-locked');
            
            // Instantly adjust scroll position to the new position of the login screen to prevent jump
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                const loginTop = loginScreen.getBoundingClientRect().top + window.scrollY;
                window.scrollTo(0, loginTop);
            }

            // Re-bind scroll listener since it was removed when locked
            window.addEventListener('scroll', handleLandingScroll, { passive: true });
        }
    }

    // Always remove body locking class when we navigate to a landing section,
    // to ensure scrolling functions correctly.
    document.body.classList.remove('native-login-active');

    // Scroll smoothly to the target section (offsetting for the fixed nav bar)
    const targetTop = section.getBoundingClientRect().top + window.scrollY - 78;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
    window.history.replaceState(null, '', `#${sectionId}`);

    // Re-enable scroll locking after smooth scroll completes (1000ms)
    setTimeout(() => {
        isBypassingScrollLock = false;
    }, 1000);

    setTimeout(() => replayLandingSectionReveal(section), 260);
    setTimeout(() => replayLandingSectionReveal(section), 620);
}

function toggleLandingMenu(btn) {
    const menu = document.getElementById('landing-mobile-menu');
    if (!menu) return;
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
}

function closeLandingMenu() {
    const menu = document.getElementById('landing-mobile-menu');
    const btn = document.querySelector('.landing-menu-btn');
    if (!menu || !btn) return;
    menu.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', (event) => {
    const menu = document.getElementById('landing-mobile-menu');
    const btn = document.querySelector('.landing-menu-btn');
    if (!menu || !btn || !menu.classList.contains('open')) return;
    if (!menu.contains(event.target) && !btn.contains(event.target)) {
        closeLandingMenu();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const subjects = ['MATHEMATICS', 'PHYSICS', 'DATA STRUCTURES', 'CIRCUITS', 'ENGINEERING MATHS'];
    const chip = document.getElementById('landing-subject-chip');
    const live = document.getElementById('landing-live-count');
    let subjectIndex = 0;

    if (chip) {
        setInterval(() => {
            chip.style.opacity = '0';
            setTimeout(() => {
                subjectIndex = (subjectIndex + 1) % subjects.length;
                chip.textContent = subjects[subjectIndex];
                chip.style.opacity = '1';
            }, 320);
        }, 3200);
    }

    if (live) {
        setInterval(() => {
            live.textContent = String(Math.floor(Math.random() * 10) + 20);
        }, 4000);
    }

    prepareLandingReveal();
    scheduleLandingReveal();
    
    // Bind scroll listener on initial page load
    window.addEventListener('scroll', handleLandingScroll, { passive: true });
});

let landingRevealItems = [];
let landingRevealObserver = null;
let landingRevealStarted = false;
let landingRevealScrollBound = false;

function prepareLandingReveal() {
    const landingPage = document.getElementById('landing-page');
    if (!landingPage) return;
    if (landingRevealItems.length) return;

    const revealGroups = [
        '.landing-hero-copy > *',
        '.landing-qr-visual',
        '.landing-section .landing-eyebrow',
        '.landing-section h2',
        '.landing-section-copy',
        '.landing-steps article',
        '.landing-feature-grid article',
        '.landing-role-grid article',
        '.landing-finale .landing-eyebrow',
        '.landing-finale h2',
        '.landing-finale .landing-section-copy',
        '.landing-flow-panel'
    ];

    landingRevealItems = Array.from(landingPage.querySelectorAll(revealGroups.join(',')));
    if (!landingRevealItems.length) return;

    landingRevealItems.forEach((item, index) => {
        item.classList.add('landing-reveal');
        item.style.transitionDelay = `${Math.min((index % 6) * 70, 280)}ms`;
    });
}

function scheduleLandingReveal() {
    const landingPage = document.getElementById('landing-page');
    if (!landingPage || landingPage.classList.contains('is-hidden')) return;
    prepareLandingReveal();

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen && !loadingScreen.classList.contains('fade-out')) {
        loadingScreen.addEventListener('transitionend', startLandingReveal, { once: true });
        setTimeout(startLandingReveal, 700);
        return;
    }

    requestAnimationFrame(startLandingReveal);
}

function startLandingReveal() {
    if (landingRevealStarted) return;
    landingRevealStarted = true;
    prepareLandingReveal();
    if (!landingRevealItems.length) return;

    bindLandingRevealScroll();
    revealVisibleLandingItems();

    if (!('IntersectionObserver' in window)) {
        return;
    }

    landingRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const item = entry.target;
            item.classList.add('is-visible');
            landingRevealObserver.unobserve(item);

            setTimeout(() => {
                item.style.transitionDelay = '';
            }, 900);
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px'
    });

    landingRevealItems.forEach(item => landingRevealObserver.observe(item));
}

function bindLandingRevealScroll() {
    if (landingRevealScrollBound) return;
    landingRevealScrollBound = true;
    window.addEventListener('scroll', revealVisibleLandingItems, { passive: true });
    window.addEventListener('resize', revealVisibleLandingItems);
}

function revealVisibleLandingItems() {
    if (!landingRevealItems.length) return;

    const revealLine = window.innerHeight * 0.88;
    landingRevealItems.forEach(item => {
        if (item.classList.contains('is-visible')) return;
        const rect = item.getBoundingClientRect();
        if (rect.top <= revealLine && rect.bottom >= 0) {
            item.classList.add('is-visible');
            setTimeout(() => {
                item.style.transitionDelay = '';
            }, 900);
        }
    });
}

function replayLandingSectionReveal(section) {
    const sectionItems = Array.from(section.querySelectorAll([
        '.landing-eyebrow',
        'h2',
        '.landing-section-copy',
        '.landing-steps article',
        '.landing-feature-grid article',
        '.landing-role-grid article',
        '.landing-flow-panel'
    ].join(',')));

    if (!sectionItems.length) return;

    sectionItems.forEach((item, index) => {
        item.classList.add('landing-reveal');
        item.classList.remove('is-visible');
        item.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
    });

    section.offsetHeight;

    requestAnimationFrame(() => {
        sectionItems.forEach(item => item.classList.add('is-visible'));
    });
}

function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    
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
        }, 220); // 220ms hold to start drag
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

    function handleTouchEnd(e) {
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

    function handleDragEnter(e) {
        if (this !== dragSrcEl) this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        this.classList.remove('over');
        tabsContainer.classList.remove('dragging-active');
        saveTabOrder();
        return false;
    }

    function handleDragEnd(e) {
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
        btn.setAttribute('draggable', 'true'); // Ensure draggable attribute is set
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

// Call on load
document.addEventListener('DOMContentLoaded', initDraggableTabs);
