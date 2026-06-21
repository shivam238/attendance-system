// ====================================================
// EXPORT HUB PRO - Advanced Attendance Export
// ====================================================

let selectedLayout = 'today';
let exportFormat = 'list'; // 'list' or 'matrix'
let exportAttendanceData = null;
let xlsxLoadPromise = null;

function getLocalDateKey(date = new Date()) {
    return date.toLocaleDateString('en-CA');
}

function parseLocalDateKey(value) {
    const [year, month, day] = String(value || '').split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

function buildInlineCall(name, args) {
    return escapeAttribute(`${name}(${args.map(arg => JSON.stringify(String(arg ?? ''))).join(', ')})`);
}

function loadXlsxLibrary() {
    if (typeof XLSX !== 'undefined') {
        return Promise.resolve();
    }

    if (xlsxLoadPromise) {
        return xlsxLoadPromise;
    }

    xlsxLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Excel library failed to load'));
        document.head.appendChild(script);
    });

    return xlsxLoadPromise;
}

// Universal Time Formatter: Normalizes any time string (12h/24h) to user preference
function formatTime(timeStr, format) {
    if (!timeStr || timeStr === '-') return '-';
    
    // Parse the input time string
    let hours, minutes, seconds;
    const isAM = timeStr.toLowerCase().includes('am');
    const isPM = timeStr.toLowerCase().includes('pm');
    
    // Clean string from letters and split
    const cleanTime = timeStr.replace(/[a-zA-Z\s]/g, '');
    const parts = cleanTime.split(':');
    hours = parseInt(parts[0]);
    minutes = parts[1] || '00';
    seconds = parts[2] || '00';
    
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    
    if (format === '24h') {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        const h12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'pm' : 'am';
        return `${h12}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
    }
}

function openExportModal() {
    document.getElementById('export-modal').classList.add('active');
    loadExportData();
    // Reset filters
    const today = getLocalDateKey();
    document.getElementById('export-date-from').value = today;
    document.getElementById('export-date-to').value = today;
    setExportLayout('today', document.getElementById('layout-today'));
}

function closeExportModal() {
    document.getElementById('export-modal').classList.remove('active');
}

function loadExportData() {
    db.ref('attendance')
        .orderByKey()
        .startAt(currentUser.username)
        .endAt(currentUser.username + '\uf8ff')
        .once('value', (snap) => {
            exportAttendanceData = snap.val() || {};
            populateSubjectDropdown();
            updateExportPreview();
        });
}

function populateSubjectDropdown() {
    const list = document.getElementById('export-subjects-list');
    if (!list || !exportAttendanceData) return;

    const subjects = new Set();

    // Start with subjects from user profile
    if (currentUser && currentUser.subjects) {
        currentUser.subjects.forEach(sub => subjects.add(sub));
    }

    // Also add any subjects found in attendance records
    Object.keys(exportAttendanceData).forEach(key => {
        const match = key.match(/^(.+)_(\d{4}-\d{2}-\d{2})_(.+)$/);
        if (match && match[1] === currentUser.username) {
            subjects.add(match[3]);
        }
    });

    list.innerHTML = '';
    if (subjects.size === 0) {
        list.innerHTML = '<div style="font-size:12px; color:var(--text-muted); grid-column:span 2;">No subjects found</div>';
        return;
    }

    subjects.forEach(sub => {
        list.innerHTML += `
            <label style="display:flex; align-items:center; gap:8px; font-size:12px; cursor:pointer;">
                <input type="checkbox" class="export-subject-checkbox" value="${escapeAttribute(sub)}" checked onchange="updateExportPreview()">
                ${escapeHtml(sub)}
            </label>
        `;
    });
}

function toggleAllSubjects(select) {
    document.querySelectorAll('.export-subject-checkbox').forEach(cb => cb.checked = select);
    updateExportPreview();
}

function setExportLayout(layout, el) {
    selectedLayout = layout;
    document.querySelectorAll('.export-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');

    // Toggle filter visibility
    document.getElementById('filter-date-range').style.display = (layout === 'range' || layout === 'student') ? 'block' : 'none';
    document.getElementById('filter-student-row').style.display = (layout === 'student') ? 'flex' : 'none';

    updateExportPreview();
}

function setExportFormat(format) {
    exportFormat = format;
    const listBtn = document.getElementById('format-list');
    const matrixBtn = document.getElementById('format-matrix');
    const matrixOpts = document.getElementById('matrix-options');

    if (format === 'list') {
        listBtn.style.background = 'var(--primary-color)';
        listBtn.style.color = '#fff';
        matrixBtn.style.background = 'transparent';
        matrixBtn.style.color = 'var(--text-color)';
        if(matrixOpts) matrixOpts.style.display = 'none';
    } else {
        matrixBtn.style.background = 'var(--primary-color)';
        matrixBtn.style.color = '#fff';
        listBtn.style.background = 'transparent';
        listBtn.style.color = 'var(--text-color)';
        if(matrixOpts) matrixOpts.style.display = 'flex';
    }
    updateExportPreview();
}

// THE ENGINE: Build the data set based on ALL current filters
function processAttendanceData() {
    if (!exportAttendanceData) return [];

    const fromDate = document.getElementById('export-date-from').value;
    const toDate = document.getElementById('export-date-to').value;
    
    // Get all selected subjects
    const subjectListEl = document.querySelectorAll('.export-subject-checkbox:checked');
    const selectedSubjects = Array.from(subjectListEl).map(cb => cb.value);
    
    const studentSearch = document.getElementById('export-student-search').value.toLowerCase();
    
    // Use Local Date instead of ISO (Avoid timezone shifts)
    const today = getLocalDateKey();

    const recordsList = [];

    const timeFormat = document.getElementById('export-time-format').value;

    Object.entries(exportAttendanceData).forEach(([key, dayData]) => {
        // Super Robust Regex: Find the date anchor (YYYY-MM-DD)
        // Groups: [1]: username, [2]: date, [3]: subject
        const match = key.match(/^(.+)_(\d{4}-\d{2}-\d{2})_(.+)$/);
        if (!match) return;
        
        const username = match[1];
        const date = match[2];
        const subject = match[3].trim(); // Normalize subject

        if (username !== currentUser.username) return;

        // Apply Layout Filters
        if (selectedLayout === 'today' && date !== today) return;
        if (selectedLayout === 'range' || selectedLayout === 'student') {
            if (fromDate && date < fromDate) return;
            if (toDate && date > toDate) return;
        }
        
        // Apply Multi-Subject Filter
        if (selectedSubjects.length > 0 && !selectedSubjects.map(s => s.trim()).includes(subject)) return;

        // Process each student (if class is setup)
        if (currentUser.students && currentUser.students.length > 0) {
            currentUser.students.forEach(student => {
                const record = Object.values(dayData).find(r => r.rollNo === student.rollNo);
                
                // Student Search Filter
                if (selectedLayout === 'student' && studentSearch) {
                    if (!student.name.toLowerCase().includes(studentSearch) && 
                        !student.rollNo.toLowerCase().includes(studentSearch)) return;
                }

                recordsList.push({
                    name: student.name,
                    rollNo: student.rollNo,
                    status: record ? 'Present' : 'Absent',
                    time: record ? formatTime(record.time, timeFormat) : '-',
                    date: date,
                    subject: subject
                });
            });
        } else {
            // FALLBACK: If no students setup, just show raw records from database
            Object.values(dayData).forEach(record => {
                // Raw Record Search Filter
                if (selectedLayout === 'student' && studentSearch) {
                    if (!record.name.toLowerCase().includes(studentSearch) && 
                        !record.rollNo.toLowerCase().includes(studentSearch)) return;
                }

                recordsList.push({
                    name: record.name,
                    rollNo: record.rollNo,
                    status: 'Present',
                    time: formatTime(record.time, timeFormat),
                    date: date,
                    subject: subject
                });
            });
        }
    });

    return recordsList;
}

function updateExportPreview() {
    const previewEl = document.getElementById('export-preview');
    const data = processAttendanceData();

    if (data.length === 0) {
        previewEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">No records found matching these filters.</div>';
        return;
    }

    if (exportFormat === 'matrix') {
        renderMatrixPreview(previewEl, data);
    } else {
        renderListPreview(previewEl, data);
    }
}

function renderListPreview(el, data) {
    const inclSno = document.getElementById('export-sno').checked;
    const inclRoll = document.getElementById('export-roll').checked;
    const inclDate = document.getElementById('export-date-col').checked;
    const inclSubject = document.getElementById('export-subject-col').checked;
    const inclStatus = document.getElementById('export-status').checked;
    const inclTime = document.getElementById('export-time').checked;

    let html = '<table style="width:100%;font-size:12px;border-collapse:collapse;"><thead><tr style="background:var(--tab-bg);">';
    if (inclSno) html += '<th style="padding:8px;text-align:left;">S.No</th>';
    html += '<th style="padding:8px;text-align:left;">Name</th>';
    if (inclRoll) html += '<th style="padding:8px;text-align:left;">Roll No</th>';
    if (inclDate) html += '<th style="padding:8px;text-align:left;">Date</th>';
    if (inclSubject) html += '<th style="padding:8px;text-align:left;">Subject</th>';
    if (inclStatus) html += '<th style="padding:8px;text-align:left;">Status</th>';
    if (inclTime) html += '<th style="padding:8px;text-align:left;">Time</th>';
    html += '</tr></thead><tbody>';

    data.slice(0, 15).forEach((r, i) => {
        const markPresentCall = buildInlineCall('quickMarkPresent', [r.rollNo, r.name, r.date, r.subject]);
        const markAbsentCall = buildInlineCall('quickMarkAbsent', [r.rollNo, r.name, r.date, r.subject]);

        html += `<tr style="border-bottom:1px solid var(--border-color);">`;
        if (inclSno) html += `<td style="padding:8px;">${i+1}</td>`;
        html += `<td style="padding:8px;font-weight:600;">${escapeHtml(r.name)}</td>`;
        if (inclRoll) html += `<td style="padding:8px;">${escapeHtml(r.rollNo)}</td>`;
        if (inclDate) html += `<td style="padding:8px;">${escapeHtml(r.date)}</td>`;
        if (inclSubject) html += `<td style="padding:8px;">${escapeHtml(r.subject)}</td>`;
        if (inclStatus) html += `<td style="padding:8px;color:${r.status === 'Present' ? '#10b981' : '#ef4444'}">${escapeHtml(r.status)}</td>`;
        
        // Time cell with Quick-Actions
        if (inclTime) {
            let timeHtml = r.time;
            if (r.status === 'Absent') {
                timeHtml = `<div style="display:flex;align-items:center;gap:6px;">
                    <span>-</span>
                    <button onclick="${markPresentCall}" 
                            style="background:#10b981;color:#fff;border:none;width:18px;height:18px;border-radius:4px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;" 
                            title="Mark Present">+</button>
                </div>`;
            } else {
                timeHtml = `<div style="display:flex;align-items:center;gap:6px;">
                    <span>${escapeHtml(r.time)}</span>
                    <button onclick="${markAbsentCall}" 
                            style="background:#ef4444;color:#fff;border:none;width:18px;height:18px;border-radius:4px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;" 
                            title="Mark Absent">-</button>
                </div>`;
            }
            html += `<td style="padding:8px;">${timeHtml}</td>`;
        }
        html += '</tr>';
    });

    html += '</tbody></table>';
    if (data.length > 15) html += `<div style="text-align:center;font-size:11px;color:var(--text-muted);padding:10px;">Showing 15 of ${data.length} records</div>`;
    el.innerHTML = html;
}

// Function to manually mark attendance from the Export Hub
function quickMarkPresent(rollNo, name, date, subject) {
    // Standardize to 24h HH:mm:ss to match QR scanning
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const attendanceKey = `${currentUser.username}_${date}_${subject}`;
    const studentUid = rollNo.replace(/\//g, '_'); // sanitize key

    db.ref(`attendance/${attendanceKey}/${studentUid}`).set({
        name: name,
        rollNo: rollNo,
        time: time,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        showToast(`✅ ${name} marked present!`);
        loadExportData(); // Refresh preview
    }).catch(err => alert('Error: ' + err.message));
}

// Function to manually remove attendance from the Export Hub
function quickMarkAbsent(rollNo, name, date, subject) {
    const attendanceKey = `${currentUser.username}_${date}_${subject}`;
    const studentUid = rollNo.replace(/\//g, '_'); // sanitize key

    if (!confirm(`Mark ${name} (${rollNo}) as Absent? This will remove their record.`)) return;

    db.ref(`attendance/${attendanceKey}/${studentUid}`).remove()
        .then(() => {
            showToast(`🗑️ ${name} marked absent!`);
            loadExportData(); // Refresh preview
        }).catch(err => alert('Error: ' + err.message));
}

function renderMatrixPreview(el, data) {
    const inclSno = document.getElementById('export-sno').checked;
    const inclRoll = document.getElementById('export-roll').checked;
    const cellType = document.getElementById('matrix-cell-type').value;

    const fromDate = document.getElementById('export-date-from').value;
    const toDate = document.getElementById('export-date-to').value;
    
    // Generate all dates in range
    let dates = [];
    if (selectedLayout === 'range' || selectedLayout === 'student') {
        let current = parseLocalDateKey(fromDate);
        const end = parseLocalDateKey(toDate);
        if (!current || !end) return;
        while (current <= end) {
            dates.push(getLocalDateKey(current));
            current.setDate(current.getDate() + 1);
        }
    } else {
        dates = [...new Set(data.map(r => r.date))].sort();
    }

    const studentRolls = [...new Set(data.map(r => r.rollNo))];
    const students = studentRolls.map(roll => data.find(r => r.rollNo === roll));

    let html = '<div style="border:1px solid var(--border-color); border-radius:8px; overflow-x:auto;">';
    html += '<table style="width:100%;font-size:10px;border-collapse:collapse;background:var(--card-bg);">';
    html += '<thead><tr style="background:var(--tab-bg); border-bottom:2px solid var(--border-color);">';
    
    if (inclSno) html += '<th style="padding:8px;text-align:center;border-right:1px solid var(--border-color);width:30px;">#</th>';
    html += '<th style="padding:8px;text-align:left;border-right:1px solid var(--border-color);min-width:100px;">Student Name</th>';
    if (inclRoll) html += '<th style="padding:8px;text-align:left;border-right:1px solid var(--border-color);min-width:80px;">Roll No</th>';
    
    dates.forEach(d => {
        const shortDate = d.split('-').slice(1).reverse().join('/');
        html += `<th style="padding:8px;text-align:center;border-right:1px solid var(--border-color);background:rgba(102, 126, 234, 0.05);">${shortDate}</th>`;
    });
    html += '</tr></thead><tbody>';

    students.slice(0, 15).forEach((student, i) => {
        html += `<tr style="border-bottom:1px solid var(--border-color);">`;
        if (inclSno) html += `<td style="padding:6px;text-align:center;border-right:1px solid var(--border-color);opacity:0.6;">${i+1}</td>`;
        html += `<td style="padding:6px;font-weight:700;border-right:1px solid var(--border-color);">${escapeHtml(student.name)}</td>`;
        if (inclRoll) html += `<td style="padding:6px;border-right:1px solid var(--border-color);opacity:0.7;">${escapeHtml(student.rollNo)}</td>`;
        
        dates.forEach(date => {
            const record = data.find(r => r.rollNo === student.rollNo && r.date === date);
            const isPresent = record && record.status === 'Present';
            const color = isPresent ? '#10b981' : '#ef4444';
            
            let displayVal = isPresent ? 'P' : 'A';
            if (cellType === 'full') displayVal = isPresent ? 'Present' : 'Absent';

            html += `<td style="padding:6px;text-align:center;border-right:1px solid var(--border-color);color:${color};font-weight:800;background:${isPresent ? 'rgba(16, 185, 129, 0.02)' : 'transparent'}">
                ${escapeHtml(displayVal)}
            </td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    if (students.length > 15) html += `<div style="text-align:center;font-size:11px;color:var(--text-muted);padding-top:10px;">Preview: 15 of ${students.length} students</div>`;
    el.innerHTML = html;
}

async function downloadExport() {
    const data = processAttendanceData();
    if (data.length === 0) {
        showToast('⚠️ No data to export');
        return;
    }

    try {
        showToast('Preparing Excel export...');
        await loadXlsxLibrary();
    } catch (error) {
        showToast('❌ Excel library could not load');
        return;
    }

    const wb = XLSX.utils.book_new();
    const inclSno = document.getElementById('export-sno').checked;
    const inclRoll = document.getElementById('export-roll').checked;
    const cellType = document.getElementById('matrix-cell-type').value;

    if (exportFormat === 'matrix') {
        const fromDate = document.getElementById('export-date-from').value;
        const toDate = document.getElementById('export-date-to').value;
        
        let dates = [];
        if (selectedLayout === 'range' || selectedLayout === 'student') {
            let current = parseLocalDateKey(fromDate);
            const end = parseLocalDateKey(toDate);
            if (!current || !end) return;
            while (current <= end) {
                dates.push(getLocalDateKey(current));
                current.setDate(current.getDate() + 1);
            }
        } else {
            dates = [...new Set(data.map(r => r.date))].sort();
        }

        const studentRolls = [...new Set(data.map(r => r.rollNo))];
        
        const matrixData = studentRolls.map((roll, idx) => {
            const studentInfo = data.find(r => r.rollNo === roll);
            const row = {};
            if (inclSno) row['S.No'] = idx + 1;
            row['Student Name'] = studentInfo.name;
            if (inclRoll) row['Roll No'] = roll;
            
            dates.forEach(date => {
                const record = data.find(r => r.rollNo === roll && r.date === date);
                const isPresent = record && record.status === 'Present';
                row[date] = (cellType === 'full') ? (isPresent ? 'Present' : 'Absent') : (isPresent ? 'P' : 'A');
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(matrixData);
        XLSX.utils.book_append_sheet(wb, ws, "Attendance_Register");
    } else {
        // LIST EXCEL
        const exportRows = data.map((r, i) => {
            const row = {};
            if (inclSno) row['S.No'] = i + 1;
            row['Name'] = r.name;
            if (inclRoll) row['Roll No'] = r.rollNo;
            if (document.getElementById('export-date-col').checked) row['Date'] = r.date;
            if (document.getElementById('export-subject-col').checked) row['Subject'] = r.subject;
            if (document.getElementById('export-status').checked) row['Status'] = r.status;
            if (document.getElementById('export-time').checked) row['Time'] = r.time;
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(exportRows);
        XLSX.utils.book_append_sheet(wb, ws, "Attendance_List");
    }

    const fileName = `Attendance_${exportFormat}_${getLocalDateKey()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    // Log Analytics Event
    if (typeof logAnalyticsEvent !== 'undefined') {
        logAnalyticsEvent("excel_export", {
            mode: selectedLayout,
            format: exportFormat
        });
    }

    showToast('✅ Excel Downloaded!');
    closeExportModal();
}
