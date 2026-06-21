export default `
# ATTENDIFY AI Customer Support Knowledge Base

Generated from the repository code only. Use this as source material for an AI customer support chatbot. If a behavior is not present in the code, do not claim it exists.

## Creator & Developer Information

- **Creator & Developer**: **Shivam Kumar Mahto**
- **Creator Role**: Sole Creator, Developer, and Maintainer of the ATTENDIFY application.
- **Creator Details**: Shivam Kumar Mahto is the visionary developer who created ATTENDIFY to digitize and automate student attendance tracking using QR codes and geofencing. He designed, implemented, and built the entire application using HTML5, CSS3, vanilla JavaScript, and Google Firebase.
- **Contact Channels**:
  - **Email**: sm3165599@gmail.com
  - **Instagram**: https://www.instagram.com/heheshivam/ (@heheshivam)
  - **LinkedIn**: https://www.linkedin.com/in/shivam-kumar-mahto-046228361/
- **Crucial Rule**: When asked "who created this app?", "who built this?", "developer contact", or "owner details", you MUST proudly mention **Shivam Kumar Mahto** and provide his contact details (email, Instagram, and LinkedIn).

## Product Overview

ATTENDIFY is a Firebase-powered web application for QR-based student attendance. A class representative or educator logs in, configures a class, creates subject-specific QR attendance sessions, monitors submissions in real time, reviews exceptions, and exports reports.

Students do not need to install a native app. They scan a QR code or open a shared attendance link, enter their roll number or name, optionally allow browser location access, and receive a status page showing whether attendance was marked or sent for CR approval.

The app is hosted as a static Firebase Hosting site at \`https://qr-smart-attendance.web.app\`. The front end is written in HTML, CSS, and vanilla JavaScript. Firebase Auth is used for sign-in, Firebase Realtime Database stores users, attendance records, QR sessions, requests, and feedback, and Firebase Analytics is used for event logging when available.

Primary source files:
- \`index.html\`: main login, setup, CR dashboard, student QR submission handler, requests, geofencing, QR sessions, student management, anti-proxy system, notifications.
- \`manage-subjects.html\`: subject add, rename, delete, reorder page.
- \`track.html\`: student attendance tracking portal.
- \`attendance-success.html\`: student result/status page.
- \`assets/js/auth.js\`: Google/phone auth, linked login methods, account deletion.
- \`assets/js/export.js\`: Export Hub, Excel download, manual present/absent edits.
- \`assets/js/history.js\`: attendance history rendering.
- \`assets/js/ui.js\`: shared UI helpers.
- \`firebase-config.js\`, \`database.rules.json\`, \`firebase.json\`, \`service-worker.js\`, \`manifest.json\`: platform configuration.

## Key Terms

- **CR**: The class representative or educator using the dashboard to manage class attendance.
- **Class ID / Username**: Generated during setup as \`year + college + branch + section\`, for example \`29DTUCSE5\`.
- **QR session**: A subject-specific attendance session stored at \`qr_sessions/{classId}_{date}_{subject}\`.
- **Attendance record**: A present mark stored under \`attendance/{classId}_{date}_{subject}\`.
- **Request**: A pending attendance submission that needs CR review, stored under \`requests/{classId}_{date}_{subject}\`.
- **Geofencing**: Optional location verification against a classroom/campus radius.
- **Device ID**: A persistent browser fingerprint stored in localStorage/sessionStorage/cookie used to detect proxy submissions.
- **Suspicious/Proxy**: An attendance record flagged because the same device submitted for multiple different roll numbers.

## User Roles

### CR / Educator
Can:
- Sign in with Google.
- Attempt phone login or phone linking if Firebase phone auth/test phone credentials are configured.
- Complete class setup.
- Add subjects and students.
- Generate QR attendance sessions.
- Configure optional geofencing.
- View live present counts and attendance feed.
- Receive browser native notifications and audio chimes for each attendance submission.
- See suspicious/proxy-flagged submissions highlighted in red on the dashboard.
- Review pending requests.
- Import students from Google Classroom (requires teacher role in that Classroom).
- Import attendance from Google Meet participant list (paste-and-match).
- Edit attendance from the Export Hub.
- Export attendance to Excel.
- View history.
- Link Google/phone login methods.
- Delete their account and associated class data.

### Student
Can:
- Scan or open a QR attendance link.
- Submit attendance by roll number or exact full name.
- Allow location verification if required.
- See a success, duplicate, late, out-of-range, or GPS-denied status page.
- Open the student portal to track subject-wise attendance.
- Export the student portal dashboard as PDF through browser print.
- Submit feedback from the status page.

## Authentication and Account Setup

### Google Login
Google login is implemented with Firebase Auth popup sign-in. The app requests account selection with \`prompt: select_account\`. If sign-in fails, the login screen displays the Firebase error message.

### Phone Login
The UI includes phone login using Firebase Phone Auth and invisible reCAPTCHA. The app validates Indian 10-digit numbers, formats them as \`+91\`, sends an OTP, then verifies a 6-digit code.

Important limitation from the UI:
- The login screen says real SMS OTP delivery is currently offline.
- It recommends Google login or registered test phone credentials.

### First-Time Setup
After sign-in, if the user has no complete profile, the setup screen appears.

Required fields:
- Passout year: exactly 2 digits.
- College: converted to uppercase.
- Branch: converted to uppercase.
- Section.
- CR mobile number: exactly 10 digits.
- Subjects: one per line.
- Students: one per line in \`NAME - ROLLNO\` format.

The username/Class ID is generated as:
\`\`\`text
year + college + branch + section
\`\`\`
Example: \`29DTUCSE5\`

### Student List Format
Students must be entered one per line:
\`\`\`text
JOHN DOE - 25/B09/001
JANE SMITH - 25/B09/002
\`\`\`
If a line does not contain exactly \`space-dash-space\`, setup fails with an invalid format message.
The setup page includes a "Copy ChatGPT Prompt" button that copies formatting instructions for preparing student lists.

## Anti-Proxy / Device Fingerprinting System

ATTENDIFY includes a built-in anti-proxy system to prevent students from marking attendance for other students who are not physically present.

### How Device Fingerprinting Works
When a student submits attendance, the app generates a persistent **Device ID** using a three-layer strategy:
1. **localStorage** (primary)
2. **sessionStorage** (secondary fallback)
3. **document.cookie** (tertiary fallback)

The Device ID is a UUID stored under the key \`attendify_device_id\`. It persists across page reloads and multiple tabs. Even if a student clears one storage mechanism, the ID is recovered from another.

### Proxy Detection Logic
Before saving attendance, the app runs \`checkProxySession()\`:
- It queries all existing attendance records and pending requests for the current QR session.
- It checks if the same Device ID has already been used by a **different roll number** in the same session.
- If a conflict is found, the attendance is still saved (the student is not blocked), but the record is flagged with:
  - \`suspicious: true\`
  - \`suspiciousReason: "Device shared with [Other Roll No]"\`

### Silent Flagging Principle
The system silently flags suspicious submissions without alerting the student. This prevents the student from knowing they have been detected and trying a different method. The CR is alerted instead.

### CR Dashboard Highlighting
Suspicious attendance records are displayed with:
- A **dashed red border**
- A **⚠️ Suspicious** badge
- The suspicious reason text

Suspicious pending requests are also highlighted with a warning border and badge in the Requests tab.

### Attendance Record Fields (with Anti-Proxy)
In addition to standard fields, attendance records may contain:
- \`deviceId\`: the Device ID of the submitting device
- \`suspicious\`: boolean, true if proxy detected
- \`suspiciousReason\`: text describing the conflict

## Native Browser & Mobile App Notifications & Audio Chimes

When the CR is logged in and has a QR session active, ATTENDIFY sends real-time alerts for every student attendance submission.

### Permission Request & Platform Logic
When the CR logs into the dashboard:
- **Web App:** The app calls \`Notification.requestPermission()\` automatically. If the CR grants permission, they will receive native OS-level browser notifications.
- **Mobile App (Android APK):** The app uses the \`@capacitor/local-notifications\` plugin. It requests native Android notification permissions on the first dashboard load.

### Notification Behavior
For each attendance submission:
- A **toast notification** is shown inside the app.
- A **native push/local notification** (OS-level popup, visible even when the app is in the background or minimized) is sent:
  - **On Web:** Standard browser native notifications are triggered.
  - **On Mobile:** Capacitor Native Local Notifications are fired directly to the Android system tray.
  - The notification includes the student's name, roll number, subject, and whether the submission is suspicious/proxy.
  - Clicking the notification focuses the app window.

For suspicious/proxy submissions:
- Title: **⚠️ Suspicious Attendance!**
- Body: includes the suspicious reason

For normal submissions:
- Title: **✅ Attendance Marked**

### Audio Chimes
The app uses the Web Audio API (no external audio files required, works offline):
- **Success chime**: High-pitched double tone (A5 → E6) for normal attendance.
- **Warning chime**: Lower triangle-wave swoop for suspicious/proxy attendance.

### Limitation & Smart Mobile Bypass
- **Web Limitations:** Browser notifications require HTTPS and require the tab/browser to remain open (minimized is fine). True background push is not supported.
- **Mobile Integration:** The Android app is optimized for native speed and features **⚡ Smart Landing Bypass** where the marketing landing page is skipped, taking the CR directly to the login screen immediately upon launch. Location permissions and native notification requests are managed cleanly by the Capacitor shell.

## Google Meet Attendance Import

The CR can import attendance from an online/virtual class held on Google Meet without any API or integration — by pasting the participants list.

### How to Use
1. In Google Meet, click the **People** (participants) icon.
2. Select all participant names and copy them (Ctrl+A → Ctrl+C).
3. In ATTENDIFY dashboard, click the **🟢 MEET IMPORT** button (next to Export Hub).
4. Paste the list in the text area and click **Process & Match Names**.

### Smart Name Matching
The system performs multi-layer matching to handle students joining with personal/family Google accounts:

**Priority 1 — Alias Memory (Remembered Links)**
If a participant name was previously linked to a student, the system auto-matches using stored aliases from \`localStorage\` (key: \`meet_aliases_{uid}\`).

**Priority 2 — Exact Name Match**
If the participant's name exactly matches a student's name in the roster.

**Priority 3 — Number/Roll Matching**
If the participant name contains a number (e.g. "Amit 15"), the system tries to match it against roll numbers ending in that number.

**Priority 4 — Fuzzy/Partial Match**
If any word in the participant name matches any word in a student's name.

### Conflict Handling
- **Single match**: Auto-checked with a green label.
- **Multiple matches** (same name conflict): Shows all matching students with individual checkboxes. CR selects which student(s) were actually present.
- **Unmatched** (e.g. "Sunita Devi" — parent's account): Shown in red. CR selects from a dropdown to link the name to the correct student.

### Alias Memory (Smart Learning)
When the CR manually links an unmatched name to a student, the system saves this mapping permanently in localStorage. Next time the same name appears, it is automatically matched without any manual step.

### Saving Attendance
After reviewing the match list, the CR clicks **Save Checked Attendance**. The system:
- Checks which students are already marked present for that session.
- Adds attendance records only for students not already marked.
- Records \`deviceId: "GOOGLE_MEET_IMPORT"\` to distinguish meet-imported records.

### Limitation
- Requires a subject to be selected before opening Meet Import.
- Only works for the current day's session.
- Name matching is best-effort; manual linking is required for accounts with completely different names.

## Google Classroom Import

The CR can import their student roster from Google Classroom.

### How It Works
1. In the Students tab, click **Classroom Import**.
2. Click **Authorize Google Classroom** — a small Google consent popup appears (does NOT trigger a full sign-in page).
3. After authorization, select a course from the dropdown.
4. Click **Fetch Students**.
5. Fill in roll numbers for each imported student.
6. Click **Confirm Import**.

### Technical Implementation
The app uses **Google Identity Services (GIS)** — Google's modern OAuth2 token library — to request only the Classroom scopes (\`classroom.courses.readonly\`, \`classroom.rosters.readonly\`) without disturbing the existing Firebase phone/email auth session.

### Important Limitation
The Google Classroom API only returns the full student list to users who are **Teachers or Co-Teachers** of the course. If the CR is only enrolled as a student in the Classroom, the API will only return the CR's own profile (1 student), not the full class roster.

**Workaround if CR is not the teacher**:
- Ask the actual teacher to export the student list.
- Use the "Copy ChatGPT Prompt" feature to format the student list manually.
- Add students one by one using the "+ Add Student" button.

### Token Persistence
After authorization, the access token is saved in \`localStorage\` with a 55-minute expiry. On next visit, the token is restored automatically and the courses are loaded without requiring re-authorization.

## Main CR Dashboard

Dashboard tabs:
- **CR**: generate QR, configure geofence, view live session feed, open Export Hub, open Meet Import.
- **Today**: view daily attendance overview and pending request count.
- **Students**: add, edit, delete, reorder students, import from Google Classroom.
- **History**: view past attendance grouped by subject and date; open Export Hub.
- **Requests**: approve or reject pending attendance submissions.

## Attendance Workflow: CR

1. Log in.
2. Complete setup if first time.
3. Open the CR tab.
4. Select a subject.
5. Optionally enable or configure geofencing.
6. Click "Generate QR Code."
7. Show the QR code, open fullscreen, or copy the link.
8. Watch the live attendance feed and counts (with native notifications and audio chimes).
9. Review suspicious/proxy-flagged entries highlighted in red.
10. Review pending requests if students are late, out of range, or deny GPS.
11. For online classes, use **Meet Import** to mark attendance from Google Meet participant list.
12. Export reports from Export Hub when needed.

### QR Session Behavior
When a CR generates a QR:
- The session key is \`{classId}_{YYYY-MM-DD}_{subject}\`.
- A \`qr_sessions\` record is saved with \`generatedAt\`, \`expiryTime\`, \`subject\`, \`username\`, optional \`location\`.
- Default expiry is 5 minutes; timer can be extended by 1 minute.
- A real-time listener shows toast + native notification + audio chime when students are added.

### Active Session Recovery
If a CR reloads while a QR session is still active, the app checks \`qr_sessions/{code}\` and restores the QR code, countdown, and listener if \`expiryTime > Date.now()\`.

## Attendance Workflow: Student QR Submission

1. Student scans the QR or opens the link.
2. The URL contains \`?code={classId}_{date}_{subject}\`.
3. Student enters roll number or full name.
4. App finds the class and student.
5. If already marked, redirects to "Already Marked" page.
6. App checks \`qr_sessions/{code}\` for active session.
7. If geofencing is enabled, browser asks for location.
8. Anti-proxy check runs before saving.
9. Depending on time and location:
   - Within time and within range: attendance marked present.
   - Late: request created for CR approval.
   - Out of range: request created for CR approval.
   - GPS denied/unavailable: request created for CR approval.
10. Student redirected to \`attendance-success.html\`.

## Geofencing

Geofencing is optional. When enabled, the CR can open a map modal to choose a center point and radius (10m to 2000m). Uses Leaflet map with OpenStreetMap tiles. Distance is calculated with the Haversine formula.

## Requests Workflow

Requests are created for late, out-of-range, and GPS-denied submissions. The Requests tab shows today's pending requests grouped by subject. Each card may show name, roll number, time, distance, GPS status, late minutes, Approve, and Reject buttons.

Suspicious requests are highlighted with a warning border and ⚠️ badge.

## Student Management

Students tab: add, edit, delete, drag-to-reorder students. Duplicate roll numbers are blocked.

## Subject Management

\`manage-subjects.html\`: add, rename, delete, drag-to-reorder subjects.

## Export Hub

Uses SheetJS (\`xlsx\`) to generate \`.xlsx\` files.
Modes: Today, Date Range, Subject-wise, Student Report.
Formats: List view (configurable columns) and Register/matrix view (P/A per date).
Manual present/absent edits available from list preview.

## Student Portal (\`track.html\`)

Students log in with Class ID and Roll Number (no Firebase Auth needed). Shows overall and subject-wise attendance percentage, detailed log, filters, and PDF export. Statuses: Present, Absent, Pending Approval.

## PWA and Offline Behavior

Service worker caches static pages and assets. Live attendance, login, QR submission, and database features require network access to Firebase.

## Data Model

### \`attendance/{classId}_{date}_{subject}\`
- \`rollNo\`, \`name\`, \`time\`, \`timestamp\`
- optional \`lateApproval\`
- optional \`deviceId\`
- optional \`suspicious\`
- optional \`suspiciousReason\`

### \`requests/{classId}_{date}_{subject}\`
- \`rollNo\`, \`name\`, \`subject\`, \`requestTime\`, \`timestamp\`, \`status\`
- optional \`lateBy\`, \`outOfRange\`, \`gpsDenied\`, \`distance\`, \`radiusLimit\`
- optional \`suspicious\`, \`suspiciousReason\`
- optional \`approvedAt\`, \`rejectedAt\`

### \`qr_sessions/{classId}_{date}_{subject}\`
- \`generatedAt\`, \`expiryTime\`, \`subject\`, \`username\`
- optional \`location.lat\`, \`location.lng\`, \`location.radius\`

## Troubleshooting & Help Guide

1. **QR Code Issues**
   - Expired: CR must generate a new QR or extend by 1 minute.
   - Invalid: session was cleared by CR; generate a new one.
   - Location mismatch: move closer or ask CR to approve from Requests tab.
   - GPS denied: allow location in browser settings; request sent to CR.

2. **Setup Errors**
   - Invalid format: must be \`NAME - ROLLNO\` with exactly one space before and after the dash.

3. **Login Issues**
   - SMS OTP offline: use Google login.

4. **Suspicious/Proxy Flag**
   - Appears when same device submits attendance for multiple roll numbers.
   - CR sees a ⚠️ badge and red border on the flagged entry.
   - Student is not notified (silent flagging).

5. **Meet Import Issues**
   - Only 1 student showing: paste the full participants list, not just one name.
   - Name not matching: use the dropdown to manually link the name to the correct student; it will be remembered next time.
   - Same name conflict: select which student was actually present using the checkboxes.

6. **Classroom Import Issues**
   - Only 1 student showing: the CR is enrolled as a student, not a teacher, in that Google Classroom. Teachers can see all students; students can only see themselves.
   - Full sign-in page appearing: this is fixed in the latest version using GIS. Refresh the page.

7. **Notifications Not Showing**
   - Check if browser notifications are allowed for \`qr-smart-attendance.web.app\`.
   - Notifications only work while the browser is open (even if minimized).

8. **Student Portal Issues**
   - Cannot log in: verify exact Class ID and Roll Number.
   - Wrong percentage: sessions without QR records are not counted.

9. **Export Hub Issues**
   - Missing students: ensure all students are in the Students tab roster.

## Limitations and Known Issues

1. Phone OTP real SMS delivery is marked "currently offline" in the UI.
2. Google Classroom Import only returns full roster if the CR is a Teacher in that Classroom; students only see themselves.
3. Native browser push notifications when browser is fully closed are not supported (requires Push API server).
4. Meet Import name matching is best-effort; names with no resemblance to roster names must be manually linked.
5. Alias memory for Meet Import is stored in localStorage; clearing browser data will reset aliases.
6. Deleting or renaming a subject does not migrate existing attendance history keys.
7. Deleting a student removes them from the class list but does not delete historical attendance records.
8. Requests tab only displays today's pending requests.
9. Database rules are broad for attendance, requests, and QR sessions.
10. Geolocation depends on browser/device support, permission, GPS accuracy, and HTTPS.
`;

