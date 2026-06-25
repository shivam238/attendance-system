// History management for ATTENDIFY with Calendar View

function historyEscapeHtml(value) {
    if (typeof escapeHtml === 'function') {
        return escapeHtml(value);
    }
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

// Global calendar state
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let selectedCalendarDateStr = null;
let attendanceHistoryData = null;

// Add styles dynamically on load
(function injectCalendarStyles() {
    const styleId = 'attendify-calendar-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .calendar-wrapper {
            background: var(--tab-bg, rgba(30, 41, 59, 0.4));
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--border-color, rgba(255,255,255,0.08));
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 24px;
            box-shadow: var(--shadow, 0 8px 32px 0 rgba(0, 0, 0, 0.2));
        }
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .calendar-header h4 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: var(--text-color, #fff);
        }
        .calendar-nav-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-color, #fff);
            width: 36px;
            height: 36px;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            transition: all 0.2s ease;
        }
        .calendar-nav-btn:hover {
            background: var(--primary-color, #6366f1);
            border-color: var(--primary-color, #6366f1);
            transform: translateY(-1px);
        }
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
            text-align: center;
        }
        .calendar-weekday {
            font-weight: 700;
            font-size: 11px;
            color: var(--text-muted, #94a3b8);
            text-transform: uppercase;
            padding-bottom: 8px;
        }
        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-color, #fff);
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
            border: 1px solid transparent;
            background: rgba(255, 255, 255, 0.02);
        }
        .calendar-day:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
        }
        .calendar-day.empty {
            cursor: default;
            background: transparent !important;
            border-color: transparent !important;
        }
        .calendar-day.has-attendance {
            background: rgba(99, 102, 241, 0.15);
            border-color: rgba(99, 102, 241, 0.35);
        }
        .calendar-day.has-attendance::after {
            content: '';
            position: absolute;
            bottom: 6px;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background-color: #6366f1;
            box-shadow: 0 0 6px #6366f1;
        }
        .calendar-day.selected {
            background: var(--primary-color, #6366f1) !important;
            color: #fff !important;
            border-color: var(--primary-color, #6366f1) !important;
            box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
        }
        .calendar-day.selected::after {
            background-color: #fff !important;
            box-shadow: none;
        }
        .date-details-wrapper {
            background: var(--tab-bg, rgba(30, 41, 59, 0.4));
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--border-color, rgba(255,255,255,0.08));
            border-radius: 20px;
            padding: 20px;
            box-shadow: var(--shadow, 0 8px 32px 0 rgba(0, 0, 0, 0.2));
        }
        .progress-bar-container {
            background: rgba(255, 255, 255, 0.06);
            border-radius: 8px;
            height: 7px;
            overflow: hidden;
            margin: 10px 0;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .progress-bar-fill {
            height: 100%;
            border-radius: 8px;
            background: linear-gradient(90deg, #6366f1, #a855f7);
            transition: width 0.3s ease;
        }
        .details-subject-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 12px;
        }
        .details-subject-card:last-child {
            margin-bottom: 0;
        }
        .details-badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            margin-right: 6px;
        }
        .details-badge.present {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .details-badge.absent {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .details-badge.verification {
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.2);
        }
    `;
    document.head.appendChild(style);
})();

function renderHistory() {
    const container = document.getElementById('history-content');
    if (!container) return;

    // Show initial loading
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔄</div><div>Loading history...</div></div>';

    db.ref('attendance').orderByKey().startAt(currentUser.username).endAt(currentUser.username + '\uf8ff').once('value', (snapshot) => {
        const data = snapshot.val();
        attendanceHistoryData = data || {};

        // Parse grouped by date
        const groupedDates = {};
        Object.entries(attendanceHistoryData).forEach(([key, records]) => {
            const parts = key.split('_');
            if (parts[0] !== currentUser.username) return;
            const dateStr = parts[1];
            groupedDates[dateStr] = true;
        });

        // Setup container layout
        container.innerHTML = `
            <div class="calendar-wrapper">
                <div class="calendar-header">
                    <button class="calendar-nav-btn" onclick="changeCalendarMonth(-1)">‹</button>
                    <h4 id="calendar-month-year-label"></h4>
                    <button class="calendar-nav-btn" onclick="changeCalendarMonth(1)">›</button>
                </div>
                <div class="calendar-grid" id="calendar-days-grid"></div>
            </div>
            <div id="calendar-date-details" class="date-details-wrapper">
                <div class="empty-state" style="padding: 20px;">
                    <div class="empty-icon">📅</div>
                    <div>Select a date from the calendar to view attendance details</div>
                </div>
            </div>
        `;

        drawCalendar(groupedDates);
    });
}

function drawCalendar(groupedDates) {
    const monthLabel = document.getElementById('calendar-month-year-label');
    const daysGrid = document.getElementById('calendar-days-grid');
    if (!monthLabel || !daysGrid) return;

    // Month Names
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    monthLabel.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    daysGrid.innerHTML = '';

    // Weekdays headers
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekdays.forEach(wd => {
        const el = document.createElement('div');
        el.className = 'calendar-weekday';
        el.textContent = wd;
        daysGrid.appendChild(el);
    });

    // Calculate details for rendering grid
    const firstDayIndex = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
    const totalDays = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();

    // Render empty spaces for previous month alignment
    for (let i = 0; i < firstDayIndex; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-day empty';
        daysGrid.appendChild(el);
    }

    // Render days of the month
    for (let day = 1; day <= totalDays; day++) {
        const el = document.createElement('div');
        el.className = 'calendar-day';
        el.textContent = day;

        // Form YYYY-MM-DD
        const mStr = String(currentCalendarMonth + 1).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        const dateStr = `${currentCalendarYear}-${mStr}-${dStr}`;

        if (groupedDates[dateStr]) {
            el.classList.add('has-attendance');
        }

        if (selectedCalendarDateStr === dateStr) {
            el.classList.add('selected');
        }

        el.onclick = () => {
            // Toggle selection
            const previouslySelected = daysGrid.querySelector('.calendar-day.selected');
            if (previouslySelected) previouslySelected.classList.remove('selected');
            el.classList.add('selected');
            selectedCalendarDateStr = dateStr;
            showDateDetails(dateStr);
        };

        daysGrid.appendChild(el);
    }
}

function changeCalendarMonth(offset) {
    currentCalendarMonth += offset;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear -= 1;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear += 1;
    }

    // Redraw calendar
    const groupedDates = {};
    if (attendanceHistoryData) {
        Object.keys(attendanceHistoryData).forEach(key => {
            const parts = key.split('_');
            if (parts[0] !== currentUser.username) return;
            groupedDates[parts[1]] = true;
        });
    }
    drawCalendar(groupedDates);
}

function showDateDetails(dateStr) {
    const detailsContainer = document.getElementById('calendar-date-details');
    if (!detailsContainer) return;

    detailsContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
            <span>🔄 Loading date details...</span>
        </div>
    `;

    // Filter sessions matching selected date
    const dateSessions = [];
    if (attendanceHistoryData) {
        Object.entries(attendanceHistoryData).forEach(([key, records]) => {
            const parts = key.split('_');
            if (parts[0] !== currentUser.username) return;
            if (parts[1] !== dateStr) return;

            const subject = parts.slice(2).join('_');
            dateSessions.push({
                key,
                subject,
                records: Object.values(records)
            });
        });
    }

    if (dateSessions.length === 0) {
        detailsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                <h4>📅 ${dateStr}</h4>
                <p style="margin-top: 8px; font-size: 14px;">No attendance sessions were recorded on this date.</p>
            </div>
        `;
        return;
    }

    // Let's fetch verification data for this date
    db.ref('verification').orderByKey().startAt(`${currentUser.username}_${dateStr}`).endAt(`${currentUser.username}_${dateStr}\uf8ff`).once('value', (verSnapshot) => {
        const verData = verSnapshot.val() || {};
        
        let html = `<h4 style="margin: 0 0 16px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>📅</span> Date Details: ${dateStr}
        </h4>`;

        const totalStudents = currentUser.students ? currentUser.students.length : 0;

        dateSessions.forEach(session => {
            const presentCount = session.records.length;
            const absentCount = Math.max(0, totalStudents - presentCount);
            const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

            // Check if verification records exist for this session
            const verRecords = verData[session.key] ? Object.values(verData[session.key]) : [];
            const verifiedCount = verRecords.length;
            const notVerifiedCount = Math.max(0, presentCount - verifiedCount);
            const hasVerification = verifiedCount > 0;

            // Generate Lists of student roll numbers
            const presentRolls = new Set(session.records.map(r => r.rollNo.toUpperCase()));
            const verifiedRolls = new Set(verRecords.map(r => r.rollNo.toUpperCase()));
            
            // Absent list
            const absentStudents = (currentUser.students || []).filter(s => !presentRolls.has(s.rollNo.toUpperCase()));

            let studentStatusRows = (currentUser.students || []).map(s => {
                const sRoll = s.rollNo.toUpperCase();
                let statusLabel = `<span style="color: #ef4444; font-weight: bold;">Absent</span>`;
                let timeStr = '-';

                if (presentRolls.has(sRoll)) {
                    const record = session.records.find(r => r.rollNo.toUpperCase() === sRoll);
                    timeStr = record && record.time ? (typeof formatTime === 'function' ? formatTime(record.time) : record.time) : 'Present';
                    
                    if (hasVerification) {
                        if (verifiedRolls.has(sRoll)) {
                            statusLabel = `<span style="color: #10b981; font-weight: bold;">Verified Present</span>`;
                        } else {
                            statusLabel = `<span style="color: #f59e0b; font-weight: bold;">Not Verified (Proxy)</span>`;
                        }
                    } else {
                        statusLabel = `<span style="color: #10b981; font-weight: bold;">Present</span>`;
                    }
                }

                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px;">
                        <div>
                            <strong style="color: var(--text-color);">${historyEscapeHtml(s.name)}</strong>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">Roll: ${historyEscapeHtml(s.rollNo)}</div>
                        </div>
                        <div style="text-align: right;">
                            <div>${statusLabel}</div>
                            <div style="font-size: 10px; color: var(--text-muted); margin-top: 1px;">${timeStr}</div>
                        </div>
                    </div>
                `;
            }).join('');

            html += `
                <div class="details-subject-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h5 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--primary-color);">${historyEscapeHtml(session.subject)}</h5>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                                🧑‍🏫 Teacher: ${historyEscapeHtml(currentUser.displayName || 'Class CR')} | 🏫 Class: ${historyEscapeHtml(currentUser.branch || 'Class')} ${historyEscapeHtml(currentUser.section || 'A')}
                            </div>
                        </div>
                        <div style="font-size: 18px; font-weight: 800; color: var(--text-color);">${percentage}%</div>
                    </div>

                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
                    </div>

                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0;">
                        <span class="details-badge present">👥 Present: ${presentCount}</span>
                        <span class="details-badge absent">❌ Absent: ${absentCount}</span>
                        ${hasVerification ? `
                            <span class="details-badge verification">🛡️ Verified: ${verifiedCount}</span>
                            <span class="details-badge absent" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2);">⚠️ Unverified: ${notVerifiedCount}</span>
                        ` : ''}
                    </div>

                    <details style="margin-top: 10px; cursor: pointer;">
                        <summary style="font-size: 12px; color: var(--primary-color); outline: none; font-weight: 600;">👥 Student List (${totalStudents}) ▾</summary>
                        <div style="margin-top: 8px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
                            ${studentStatusRows}
                        </div>
                    </details>
                </div>
            `;
        });

        detailsContainer.innerHTML = html;
    });
}
