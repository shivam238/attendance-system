export default `
# ATTENDIFY AI Customer Support Knowledge Base

Generated from the repository code only. Use this as source material for an AI customer support chatbot. If a behavior is not present in the code, do not claim it exists.

## Creator & Developer Information

- **Creator & Developer**: **Shivam Kumar Mahto**
- **Creator Role**: Sole Creator, Developer, and Maintainer of the ATTENDIFY application.
- **Creator Details**: Shivam Kumar Mahto is the developer who created ATTENDIFY to digitize and automate student attendance tracking using QR codes and geofencing. He designed, implemented, and built the entire application using HTML5, CSS3, vanilla JavaScript, and Google Firebase.
- **Contact Channels**:
  - **Email**: sm3165599@gmail.com
  - **WhatsApp Community**: https://chat.whatsapp.com/GDOjvKK7nxGFvQ7NSrQNiG
  - **Instagram**: https://www.instagram.com/theattendify/ (@theattendify)
  - **LinkedIn**: https://www.linkedin.com/in/shivam-kumar-mahto-046228361/
- **Crucial Rule**: When asked "who created this app?", "who built this?", "developer contact", or "owner details", you MUST proudly mention **Shivam Kumar Mahto** and provide his contact details (email, WhatsApp Community, Instagram, and LinkedIn).

## Product Overview

ATTENDIFY is a Firebase-powered web application for QR-based student attendance. A class representative or educator (CR) logs in, configures a class, creates subject-specific QR attendance sessions, monitors submissions in real time, reviews exceptions, and exports reports.

Students open the QR attendance link, authenticate using Google sign-in (mandatory), and submit their attendance. Once signed in, their Google UID is permanently bound to their roll number for that class (First-Scan Binding), preventing them from signing in with multiple accounts or submitting for others.

The app is hosted as a static Firebase Hosting site at \`https://qr-smart-attendance.web.app\`. The front end is written in HTML, CSS, and vanilla JavaScript. Firebase Auth is used for sign-in, Firebase Realtime Database stores users, attendance records, QR sessions, requests, and feedback, and Firebase Analytics is used for event logging.

Primary source files:
- \`index.html\`: main login, setup, CR dashboard, student QR submission handler, requests, geofencing, QR sessions, student management, anti-proxy system, notifications, Google Sheets sync, smart geofencing.
- \`manage-subjects.html\`: subject add, rename, delete, reorder page.
- \`track.html\`: student attendance tracking portal.
- \`attendance-success.html\`: student result/status page.
- \`assets/js/auth.js\`: Google/phone auth, linked login methods, account deletion.
- \`assets/js/export.js\`: Export Hub, Excel download, manual present/absent edits, auto-export closed session.
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
- **Smart Geofence Auto-Approval**: If a student is slightly outside the radius (up to 1.8x of standard radius or standard + 60m, whichever is smaller), the system automatically approves and marks them Present with a \`geofenceRelaxed: true\` flag, preventing false location mismatch rejections in concrete classrooms.
- **MockLocationChecker**: Android APK native plugin that checks and blocks fake GPS / Mock Location apps.
- **First-Scan Binding**: Permament coupling of student's Google account UID and roll number in \`class_student_links\` and \`google_user_links\` to prevent proxy/account sharing.
- **Device ID**: A persistent browser fingerprint stored in localStorage/sessionStorage/cookie used to detect proxy submissions.
- **Suspicious/Proxy**: An attendance record flagged because the same device submitted for multiple different roll numbers, or an ID proxy was attempted.

## User Roles

### CR / Educator
Can:
- Sign in with Google.
- Complete class setup.
- Add subjects and students.
- Generate QR attendance sessions.
- Configure optional geofencing.
- View live present counts and attendance feed.
- Receive browser native notifications and audio chimes for each attendance submission.
- See suspicious/proxy-flagged entries highlighted in red on the dashboard.
- Review pending requests.
- Import students from Google Classroom or **sync roster live with Google Sheets (CSV link)**.
- Import attendance from Google Meet participant list (paste-and-match).
- Edit attendance from the Export Hub.
- Export attendance to Excel manually, or get an **Auto-Export share/download prompt** immediately upon QR session closure.
- View history.
- Delete their account and associated class data.

### Student
Can:
- Scan or open a QR attendance link.
- Authenticate with their Google account (Mandatory).
- Submit attendance by roll number (locked via First-Scan Binding).
- Allow location verification if required.
- See a success, duplicate, late, out-of-range, or GPS-denied status page.
- Open the student portal to track subject-wise attendance.
- Submit feedback.

## Authentication and Roster Setup

### Mandatory Student Google Auth
Students must sign in with their Google Account before submitting attendance. The system binds the Google UID to the student's Roll Number in the database. If a different Google account attempts to submit for a bound roll number, the submission is rejected and flagged as suspicious.

### Google Sheets Sync
CRs can sync their student roster directly from a published Google Sheet CSV URL:
1. In Google Sheets: File -> Share -> Publish to Web -> Choose CSV format.
2. Paste the link into the Google Sheets Sync Modal in the Students tab.
3. The system fetches and parses the roster dynamically (auto-detecting Name and Roll Number columns).
4. Update the roster in Firebase with one click.

### Phone Login
The CR dashboard includes phone login using Firebase Phone Auth, but real SMS OTP is marked "offline" in the UI in favor of Google login or test phone credentials.

## Anti-Proxy & Android APK Security

ATTENDIFY uses two robust layers of anti-cheat security:
1. **MockLocationChecker (Native Android APK):** Active on the Android native app. If a student uses a GPS Spoofing or Mock Location application, the app blocks the submission and alerts the CR.
2. **First-Scan Binding:** Ensures 1 student = 1 Google Account. Account swapping to mark attendance for absent friends is fully prevented.
3. **Device Fingerprinting:** Flags if multiple roll numbers are submitted from the same physical device ID in the same session.

## QR Sessions, Expiry, and Export Automation

### Timer Controls (Extend/Decrease)
- **Extend (+1 Min)**: Increases the session validity by 1 minute.
- **Decrease (-1 Min)**: Subtracts 1 minute from the session duration (cannot go below 1 minute).
Both controls update the database in real-time.

### Auto-Expiry Cleanup
When the QR timer hits \`00:00\`, the CR dashboard client automatically deletes the session record from Firebase (\`qr_sessions/{code}\`). Students scanning after this point immediately receive an "invalid or expired session" error.

### Auto-Export on Close
Immediately when a session expires or is manually cleared:
- The dashboard compiles the session's attendance records.
- It displays a popup: **Download Excel** or **Share Report** (uses native share menu on mobile to send via WhatsApp, Email, etc.).

## Student Portal (\`track.html\`)

Students log in with Class ID and Roll Number. Shows overall and subject-wise attendance percentage, detailed log, filters, and PDF export.

## Limitations and Known Issues

1. Phone OTP real SMS delivery is marked "currently offline" in the UI.
2. Google Classroom Import only returns full roster if the CR is a Teacher in that Classroom.
3. Google Sheets sync URL must be published as "Comma-separated values (.csv)", not Web Page.
4. Alias memory for Meet Import is stored in localStorage.
5. Deleting or renaming a subject does not migrate existing attendance history keys.
`;

