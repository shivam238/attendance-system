// History management for QR Attendance System

function renderHistory() {
    const container = document.getElementById('history-content');
    if (!container) return;

    db.ref('attendance').orderByKey().startAt(currentUser.username).endAt(currentUser.username + '\uf8ff').once('value', (snapshot) => {
        const data = snapshot.val();

        if (!data) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div>No history yet</div></div>';
            return;
        }

        const grouped = {};

        Object.entries(data).forEach(([key, records]) => {
            const parts = key.split('_');
            if (parts[0] !== currentUser.username) return;

            const date = parts[1];
            const subject = parts.slice(2).join('_');

            if (!grouped[subject]) {
                grouped[subject] = [];
            }

            const recordsArray = Object.values(records);
            grouped[subject].push({ date, count: recordsArray.length, students: recordsArray });
        });

        let html = '';
        Object.entries(grouped).forEach(([subject, entries]) => {
            html += `<h3 style="margin-top: 32px; margin-bottom: 16px; color: var(--primary-color); font-weight: 800; font-size: 22px; text-transform: uppercase; border-bottom: 2px solid var(--primary-color); padding-bottom: 8px;">${subject}</h3>`;

            entries.sort((a, b) => b.date.localeCompare(a.date));

            entries.forEach(entry => {
                let studentsHtml = entry.students.map(s => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                        <div><strong style="color: var(--text-color);">${s.name}</strong> <br> <span style="color: var(--text-muted); font-size: 12px;">Roll: ${s.rollNo}</span></div>
                        <div style="color: #10b981; font-weight: 500;">${s.time}</div>
                    </div>
                `).join('');

                html += `
                    <details style="cursor: pointer; background: var(--card-bg); border: 1px solid var(--border-color); padding: 12px; border-radius: 12px; margin-bottom: 8px; box-shadow: var(--shadow); transition: all 0.2s;">
                        <summary style="display: flex; justify-content: space-between; font-weight: 600; outline: none; list-style: none; color: var(--text-color);">
                            <span>📅 ${entry.date}</span>
                            <span style="color: var(--primary-color); font-size: 13px;">👥 ${entry.count} Present ▾</span>
                        </summary>
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">
                            ${studentsHtml}
                        </div>
                    </details>
                `;
            });
        });

        if (html === '') {
            html = '<div class="empty-state"><div class="empty-icon">📊</div><div>No history yet</div></div>';
        }
        container.innerHTML = html;
    });
}
