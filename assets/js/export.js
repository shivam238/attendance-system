// ====================================================
// EXPORT HUB - Smart Attendance Export System
// ====================================================

let selectedLayout = 'today';
let exportAttendanceData = null;

function openExportModal() {
    document.getElementById('export-modal').classList.add('active');
    loadExportData(); // pre-fetch data for preview
    setExportLayout('today', document.getElementById('layout-today'));
}

function closeExportModal() {
    document.getElementById('export-modal').classList.remove('active');
}

// Pre-fetch attendance data
function loadExportData() {
    db.ref('attendance')
        .orderByKey()
        .startAt(currentUser.username)
        .endAt(currentUser.username + '\uf8ff')
        .once('value', (snap) => {
            exportAttendanceData = snap.val();
            populateSubjectDropdown();
            populateDateDropdown();
            updateExportPreview();
        });
}

// Populate subject dropdown from fetched data
function populateSubjectDropdown() {
    const select = document.getElementById('export-subject-select');
    if (!select || !exportAttendanceData) return;

    const subjects = new Set();
    Object.keys(exportAttendanceData).forEach(key => {
        const parts = key.split('_');
        if (parts[0] === currentUser.username) {
            subjects.add(parts.slice(2).join('_'));
        }
    });

    select.innerHTML = '<option value="all">📚 All Subjects</option>';
    subjects.forEach(sub => {
        select.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
}

// Populate date dropdown from fetched data
function populateDateDropdown() {
    const select = document.getElementById('export-date-select');
    if (!select || !exportAttendanceData) return;

    const dates = new Set();
    Object.keys(exportAttendanceData).forEach(key => {
        const parts = key.split('_');
        if (parts[0] === currentUser.username) dates.add(parts[1]);
    });

    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    select.innerHTML = '<option value="all">📅 All Dates</option>';
    sorted.forEach(d => {
        select.innerHTML += `<option value="${d}">${d}</option>`;
    });

    // Set today as default if exists
    const today = new Date().toISOString().split('T')[0];
    if (dates.has(today)) select.value = today;
}

// Switch layout and show/hide relevant filters
function setExportLayout(layout, el) {
    selectedLayout = layout;

    // Update card highlights
    document.querySelectorAll('.export-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');

    // Show/hide filter rows
    const subjectRow = document.getElementById('filter-subject-row');
    const dateRow = document.getElementById('filter-date-row');

    subjectRow.style.display = (layout === 'subject' || layout === 'full') ? 'flex' : 'none';
    dateRow.style.display = (layout === 'daily' || layout === 'today') ? 'flex' : 'none';

    // Set smart defaults
    if (layout === 'today') {
        const today = new Date().toISOString().split('T')[0];
        const dateSelect = document.getElementById('export-date-select');
        if (dateSelect) dateSelect.value = today;
    }

    updateExportPreview();
}

// Build filtered data rows based on current selections
function buildExportRows() {
    if (!exportAttendanceData) return [];

    const layout = selectedLayout;
    const subjectFilter = document.getElementById('export-subject-select')?.value || 'all';
    const dateFilter = document.getElementById('export-date-select')?.value || 'all';
    const inclRoll = document.getElementById('export-roll')?.checked ?? true;
    const inclTime = document.getElementById('export-time')?.checked ?? true;
    const inclStatus = document.getElementById('export-status')?.checked ?? true;
    const inclDate = document.getElementById('export-date-col')?.checked ?? true;
    const inclSubject = document.getElementById('export-subject-col')?.checked ?? true;

    const today = new Date().toISOString().split('T')[0];
    const rows = [];

    Object.entries(exportAttendanceData).forEach(([key, records]) => {
        const parts = key.split('_');
        if (parts[0] !== currentUser.username) return;

        const date = parts[1];
        const subject = parts.slice(2).join('_');

        // Apply filters based on layout
        if (layout === 'today' && date !== today) return;
        if (layout === 'subject' && subjectFilter !== 'all' && subject !== subjectFilter) return;
        if (layout === 'daily' && dateFilter !== 'all' && date !== dateFilter) return;
        if (layout === 'full') {
            if (subjectFilter !== 'all' && subject !== subjectFilter) return;
        }

        const recordsArr = currentUser.students
            ? currentUser.students.map(s => {
                const found = Object.values(records).find(r => r.rollNo === s.rollNo);
                return { name: s.name, rollNo: s.rollNo, status: found ? 'Present' : 'Absent', time: found?.time || '-', date, subject };
            })
            : Object.values(records).map(r => ({ name: r.name, rollNo: r.rollNo, status: 'Present', time: r.time, date, subject }));

        recordsArr.forEach(r => {
            const row = { 'Name': r.name };
            if (inclRoll) row['Roll No'] = r.rollNo;
            if (inclDate) row['Date'] = r.date;
            if (inclSubject) row['Subject'] = r.subject;
            if (inclStatus) row['Status'] = r.status;
            if (inclTime) row['Time'] = r.time;
            rows.push(row);
        });
    });

    return rows;
}

// Update the live preview table
function updateExportPreview() {
    const previewEl = document.getElementById('export-preview');
    if (!previewEl) return;

    if (!exportAttendanceData) {
        previewEl.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:12px;">⏳ Loading data...</div>';
        return;
    }

    const rows = buildExportRows();

    if (rows.length === 0) {
        previewEl.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px;">📭 No records match current filters</div>';
        return;
    }

    const headers = Object.keys(rows[0]);
    const previewRows = rows.slice(0, 5);

    let html = `<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Showing ${Math.min(5, rows.length)} of ${rows.length} records</div>`;
    html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;">';
    
    // Header row
    html += '<tr>';
    headers.forEach(h => {
        html += `<th style="padding:6px 8px;background:var(--primary-color);color:#fff;text-align:left;white-space:nowrap;">${h}</th>`;
    });
    html += '</tr>';

    // Data rows
    previewRows.forEach((row, i) => {
        const bg = i % 2 === 0 ? 'var(--tab-bg)' : 'transparent';
        html += `<tr style="background:${bg}">`;
        headers.forEach(h => {
            const val = row[h];
            let color = 'var(--text-color)';
            if (val === 'Present') color = '#10b981';
            if (val === 'Absent') color = '#ef4444';
            html += `<td style="padding:6px 8px;color:${color};white-space:nowrap;border-bottom:1px solid var(--border-color);">${val}</td>`;
        });
        html += '</tr>';
    });

    html += '</table></div>';
    previewEl.innerHTML = html;
}

// Download the Excel file
function downloadExport() {
    if (typeof XLSX === 'undefined') {
        showToast('❌ Excel library not loaded');
        return;
    }

    const rows = buildExportRows();

    if (rows.length === 0) {
        showToast('⚠️ No data matches your filters');
        return;
    }

    const wb = XLSX.utils.book_new();

    if (selectedLayout === 'subject' || selectedLayout === 'full') {
        // Group by subject — one sheet per subject
        const grouped = {};
        rows.forEach(r => {
            const sub = r['Subject'] || 'Sheet1';
            if (!grouped[sub]) grouped[sub] = [];
            grouped[sub].push(r);
        });
        Object.entries(grouped).forEach(([sub, data]) => {
            const ws = XLSX.utils.json_to_sheet(data);
            autoWidth(ws, data);
            XLSX.utils.book_append_sheet(wb, ws, sub.substring(0, 31).replace(/[:\\/?*\[\]]/g, ''));
        });
    } else {
        const ws = XLSX.utils.json_to_sheet(rows);
        autoWidth(ws, rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    }

    const today = new Date().toISOString().split('T')[0];
    const layoutNames = { today: 'Today', full: 'Full_History', subject: 'By_Subject', daily: 'Daily_Summary' };
    XLSX.writeFile(wb, `Attendance_${layoutNames[selectedLayout]}_${today}.xlsx`);
    showToast(`✅ Downloaded! ${rows.length} records exported`);
    closeExportModal();
}

function autoWidth(ws, data) {
    if (!data.length) return;
    const cols = Object.keys(data[0]).map(k => ({
        wch: Math.max(k.length, ...data.map(r => String(r[k] || '').length)) + 2
    }));
    ws['!cols'] = cols;
}
