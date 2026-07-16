// History management for AttenMo with Calendar View

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
    const styleId = 'attenmo-calendar-styles';
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
            margin-bottom: 0;
            box-shadow: var(--shadow, 0 8px 32px 0 rgba(0, 0, 0, 0.2));
        }
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .calendar-header h4 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: var(--text-color, #fff);
        }
        .calendar-nav-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-color, #fff);
            width: 32px;
            height: 32px;
            border-radius: 8px;
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
        }
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            text-align: center;
        }
        .calendar-weekday {
            font-weight: 700;
            font-size: 10px;
            color: var(--text-muted, #94a3b8);
            text-transform: uppercase;
            padding-bottom: 6px;
        }
        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-color, #fff);
            cursor: pointer;
            position: relative;
            transition: all 0.15s ease;
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
            bottom: 3px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: #6366f1;
            box-shadow: 0 0 5px #6366f1;
        }
        .calendar-day.selected {
            background: var(--primary-color, #6366f1) !important;
            color: #fff !important;
            border-color: var(--primary-color, #6366f1) !important;
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
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
        .details-badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            margin-right: 6px;
        }
        .details-badge.present { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .details-badge.absent  { background: rgba(239,68,68,0.1);  color: #ef4444; border: 1px solid rgba(239,68,68,0.2);  }
        .details-badge.verification { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }

        /* ===== RESPONSIVE HISTORY LAYOUT ===== */
        .history-layout {
            display: flex;
            gap: 16px;
            align-items: flex-start;
            width: 100%;
        }
        .history-calendar-col {
            flex: 0 0 270px;
            min-width: 0;
        }
        .history-calendar-col .calendar-wrapper {
            position: sticky;
            top: 16px;
        }
        .history-details-col {
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }
        @media (max-width: 820px) {
            .history-layout { flex-direction: column; }
            .history-calendar-col { flex: none; width: 100%; }
            .history-calendar-col .calendar-wrapper { position: static; }
            .history-details-col { width: 100%; }
        }

        /* ===== HISTORY TABLE — FIXED COLUMNS, NO HORIZONTAL SCROLL ===== */
        .history-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .history-table th {
            padding: 8px 8px;
            font-size: 10px;
            color: var(--text-muted, #94a3b8);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
        }
        .history-table td {
            padding: 8px 8px;
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .history-table th:nth-child(1), .history-table td:nth-child(1) { width: 32%; font-weight: 600; color: var(--text-color); }
        .history-table th:nth-child(2), .history-table td:nth-child(2) { width: 25%; color: var(--text-muted); }
        .history-table th:nth-child(3), .history-table td:nth-child(3) { width: 22%; color: var(--text-muted); }
        .history-table th:nth-child(4), .history-table td:nth-child(4) { width: 21%; text-align: right; }
        @media (max-width: 480px) {
            .history-table th:nth-child(3), .history-table td:nth-child(3) { display: none; }
            .history-table th:nth-child(1), .history-table td:nth-child(1) { width: 40%; }
            .history-table th:nth-child(2), .history-table td:nth-child(2) { width: 30%; }
            .history-table th:nth-child(4), .history-table td:nth-child(4) { width: 30%; }
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

        // Setup container layout — side-by-side on desktop, stacked on mobile
        container.innerHTML = `
            <div class="history-layout">
                <div class="history-calendar-col">
                    <div class="calendar-wrapper">
                        <div class="calendar-header">
                            <button class="calendar-nav-btn" onclick="changeCalendarMonth(-1)">‹</button>
                            <h4 id="calendar-month-year-label"></h4>
                            <button class="calendar-nav-btn" onclick="changeCalendarMonth(1)">›</button>
                        </div>
                        <div class="calendar-grid" id="calendar-days-grid"></div>
                    </div>
                </div>
                <div class="history-details-col">
                    <div id="calendar-date-details" class="date-details-wrapper">
                        <div class="empty-state" style="padding: 20px;">
                            <div class="empty-icon">📅</div>
                            <div>Select a date from the calendar to view attendance details</div>
                        </div>
                    </div>
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

    // --- 1. Filter sessions from cached data (SYNCHRONOUS, no loading spinner) ---
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
                records: records ? Object.values(records) : []
            });
        });
    }

    // Sort sessions by subject name
    dateSessions.sort((a, b) => a.subject.localeCompare(b.subject));

    if (dateSessions.length === 0) {
        detailsContainer.innerHTML = `
            <div style="text-align: center; padding: 32px 20px; color: var(--text-muted);">
                <div style="font-size: 36px; margin-bottom: 12px;">📅</div>
                <div style="font-size: 15px; font-weight: 600; color: var(--text-color);">${dateStr}</div>
                <div style="font-size: 13px; margin-top: 6px;">No attendance sessions recorded on this date.</div>
            </div>`;
        return;
    }

    const totalStudents = currentUser.students ? currentUser.students.length : 0;

    // --- 2. Helper to build the full HTML (called immediately, and again after verification fetch) ---
    function buildHTML(verData) {
        const dateLabel = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        let html = `
            <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                <div style="font-size: 16px; font-weight: 800; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                    📅 ${dateLabel}
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">${dateSessions.length} subject(s) recorded</div>
            </div>`;

        dateSessions.forEach(session => {
            const presentCount = session.records.length;
            const absentCount = Math.max(0, totalStudents - presentCount);
            const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

            // Aggregate verification records from all verification rounds of this session
            let verRecords = [];
            if (verData) {
                Object.entries(verData).forEach(([vKey, vVal]) => {
                    if (vKey === session.key + '_verify' || vKey.startsWith(session.key + '_verify_')) {
                        if (vVal) {
                            verRecords = verRecords.concat(Object.values(vVal));
                        }
                    }
                });
            }

            const verifiedCount = verRecords.length;
            const notVerifiedCount = Math.max(0, presentCount - verifiedCount);
            const hasVerification = verifiedCount > 0;

            const presentRolls = new Map();
            session.records.forEach(r => {
                if (r.rollNo) presentRolls.set(r.rollNo.toUpperCase(), r);
            });
            const verifiedRolls = new Set(verRecords.map(r => r.rollNo ? r.rollNo.toUpperCase() : ''));

            // Build per-student table rows
            const allStudents = currentUser.students || [];
            const tableRows = allStudents.map(s => {
                const sRoll = (s.rollNo || '').toUpperCase();
                const record = presentRolls.get(sRoll);
                const isPresent = !!record;
                const isVerified = verifiedRolls.has(sRoll);

                let statusBadge, timeStr;
                if (!isPresent) {
                    statusBadge = `<span style="background: rgba(239,68,68,0.1); color: #ef4444; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid rgba(239,68,68,0.2);">Absent</span>`;
                    timeStr = '—';
                } else if (hasVerification && isVerified) {
                    statusBadge = `<span style="background: rgba(16,185,129,0.1); color: #10b981; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid rgba(16,185,129,0.2);">✓ Verified</span>`;
                    timeStr = record.time ? (typeof formatTime === 'function' ? formatTime(record.time) : record.time) : '—';
                } else if (hasVerification && !isVerified) {
                    statusBadge = `<span style="background: rgba(245,158,11,0.1); color: #f59e0b; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid rgba(245,158,11,0.2);">⚠ Proxy?</span>`;
                    timeStr = record.time ? (typeof formatTime === 'function' ? formatTime(record.time) : record.time) : '—';
                } else {
                    statusBadge = `<span style="background: rgba(99,102,241,0.1); color: var(--primary-color); padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid rgba(99,102,241,0.2);">Present</span>`;
                    timeStr = record.time ? (typeof formatTime === 'function' ? formatTime(record.time) : record.time) : '—';
                }

                return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                        <td style="font-weight: 600; color: var(--text-color);">${historyEscapeHtml(s.name)}</td>
                        <td style="color: var(--text-muted);">${historyEscapeHtml(s.rollNo)}</td>
                        <td style="color: var(--text-muted);">${timeStr}</td>
                        <td style="text-align: right;">${statusBadge}</td>
                    </tr>`;
            }).join('');

            const percentColor = percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

            html += `
                <div style="background: var(--tab-bg); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px; margin-bottom: 16px; overflow: hidden;">
                    <!-- Subject Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <div style="font-size: 15px; font-weight: 800; color: var(--primary-color);">📘 ${historyEscapeHtml(session.subject)}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Class: ${historyEscapeHtml(currentUser.branch || '')} Sec-${historyEscapeHtml(currentUser.section || '')}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 22px; font-weight: 900; color: ${percentColor};">${percentage}%</div>
                            <div style="font-size: 10px; color: var(--text-muted);">${presentCount}/${totalStudents} present</div>
                        </div>
                    </div>

                    <!-- Stats Badges -->
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                        <span style="background: rgba(99,102,241,0.1); color: var(--primary-color); padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid rgba(99,102,241,0.2);">👥 Present: ${presentCount}</span>
                        <span style="background: rgba(239,68,68,0.1); color: #ef4444; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid rgba(239,68,68,0.2);">❌ Absent: ${absentCount}</span>
                        ${hasVerification ? `
                        <span style="background: rgba(16,185,129,0.1); color: #10b981; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid rgba(16,185,129,0.2);">🛡️ Verified: ${verifiedCount}</span>
                        <span style="background: rgba(245,158,11,0.1); color: #f59e0b; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid rgba(245,158,11,0.2);">⚠️ Proxy Risk: ${notVerifiedCount}</span>
                        ` : ''}
                    </div>

                    <!-- Organised Table (no horizontal scroll) -->
                    <div style="border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); overflow: hidden;">
                        <table class="history-table">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.04);">
                                    <th>Student</th>
                                    <th>Roll No</th>
                                    <th>Time</th>
                                    <th style="text-align:right;">Status</th>
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                </div>`;
        });

        return html;
    }

    // --- 3. Render immediately with no verification data ---
    detailsContainer.innerHTML = buildHTML(null);

    // --- 4. Fetch verification data async and re-render if available ---
    try {
        db.ref('verification')
            .orderByKey()
            .startAt(`${currentUser.username}_${dateStr}`)
            .endAt(`${currentUser.username}_${dateStr}\uf8ff`)
            .once('value', (verSnapshot) => {
                const verData = verSnapshot.val();
                if (verData) {
                    // Re-render with verification data
                    detailsContainer.innerHTML = buildHTML(verData);
                }
            });
    } catch(e) {
        // Verification fetch failed — already rendered without it, no issue
    }
}


