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

## Product & System Overview

ATTENDIFY is a high-performance, Firebase-powered web and mobile application for QR-based student attendance.
- **Host Web URL**: \`https://qr-smart-attendance.web.app\`
- **Database Backend**: Firebase Realtime Database (handles users, rosters, sessions, requests, database triggers, and feedback).
- **Authentication**: Firebase Authentication (Google OAuth & Firebase Phone Auth).
- **PWA Capabilities**: Service worker handling offline assets and caching.
- **Mobile Environment**: Capacitor-wrapped native Android APK (~5 MB download size) containing native notifications and hardware-level mock location checks.

---

## Complete App UI Architecture & Navigation

This guide maps out the specific screens, panels, buttons, inputs, and modals in the ATTENDIFY user interface:

### 1. Website Landing Page (\`index.html\` - Web Only)
*Mobile native apps and PWAs automatically bypass this page and redirect directly to the login screen.*
- **Top Navigation Bar**:
  - Logo on left: \`🎓 ATTENDIFY\`
  - Navigation Links (Desktop): \`How it Works\`, \`Features\`, \`Support\`, \`Student Portal\` (opens \`track.html\`).
  - Mobile Menu Button: Hamburger menu icon (three-bar toggle).
  - Theme Toggle Switch: Animates between Sun (Light Mode) and Moon (Dark Mode).
- **Hero Header Section**:
  - Title: *"Attendance, simplified for every class"*
  - Subtitle paragraph outlining QR codes, geofencing, Meet imports, and Excel exports.
  - Buttons:
    - \`Open CR Dashboard\` (Primary): Enters the Class Representative login container.
    - \`Student Portal\` (Secondary): Direct link to the Student Tracker Portal.
- **Live Preview Card**:
  - Displays a mock real-time presentation dashboard widget:
    - A pulse badge: \`🟢 22 present\`
    - An interactive QR code representation with a scanning laser line.
    - Mini features tags: \`5-Min QR / Session validity\`, \`No App / Students scan in browser\`, \`Instant / Live sync\`.
- **Informative Sections**:
  - **How it Works Flow**: Visual step-by-step layout for CRs and Students.
  - **Features Grid**: Outlines smart geofencing, anti-cheat mechanisms, Google sync, and reporting.
  - **Role Selection Box**: Comparison card contrasting CR Dashboard access and Student Portal features.

### 2. Login Screen (\`index.html\` - Active Container)
- **Top Bar**:
  - Info Button (\`i\` icon): Opens the User Manual (\`manual.html\`) in a new browser tab.
  - Theme Toggle Knob: Allows switching dark/light themes before logging in.
- **Header**:
  - Shows the circular logo badge.
  - Title: \`🎓 ATTENDIFY\`
  - Description: *"Experience the future of attendance tracking"*
- **Login Tabs Selector**:
  - \`Google Login\` tab (Recommended): Shows a primary button \`Continue with Google\` featuring the Google logo.
  - \`Phone Login\` tab: Shows phone number inputs:
    - Mobile country code prefix: \`+91\` (fixed).
    - Mobile Number Input: 10-digit number field.
    - Action Button: \`Send OTP\`.
    - Verification Screen (Toggled post-OTP): Shows 6-digit OTP code entry field and buttons: \`Verify & Login\` and \`Edit Number\`.
    - Warning banner: *"Service under Setup: Real SMS OTP delivery is currently offline..."*
- **Student Portal Access Card (Bottom)**:
  - Text: *"Are you a Student? Track your subject-wise attendance statistics."*
  - Button: \`🔍 Open Student Portal\` (opens \`track.html?v=1.1\`).

### 3. Class Setup Screen (\`index.html\` - For New Users)
- **Header**: \`🎓 Setup Your Class\`
- **Input Fields**:
  - Passout Year (2-digit): e.g., \`29\` (for year 2029).
  - College Abbreviation: e.g., \`DTU\`.
  - Branch Code: e.g., \`CSE\`.
  - Section Code: e.g., \`5\`.
  - Custom Class Name: e.g., \`CSE-5\`.
- **Generation Logic**: The app automatically generates the **Class ID / Username** as \`Year + College + Branch + Section\` (e.g. \`29DTUCSE5\`). This Class ID is what students use to log in to the student portal.
- **Button**: \`Save and Continue ➔\` (Creates the database class profile node).

### 4. Class Representative (CR) Dashboard (\`index.html\`)
Once logged in, the CR accesses a unified layout with a top status header and tabbed panels.
- **Status Header**:
  - Stats card showing total registered students.
  - Active QR status banner (displays timer countdown, active subject, and a button to view current attendees).
  - Main navigation tabs bar.
- **Tab Panels**:
  - **QR Session Tab**:
    - Subject selector dropdown (populated from the subjects list in Roster).
    - Timer duration dropdown (1, 2, 3, 5, 10 minutes).
    - Geofencing configuration:
      - Geofencing switch: Enables/disables location check.
      - Geofence radius slider/input: Range of 10m to 2000m.
      - Set Reference Location button: Captures browser's current latitude/longitude to anchor the geofence around the classroom.
    - Button: \`Generate QR Code\` (Launches the QR fullscreen modal).
  - **Students Tab**:
    - Complete table roster showing student names, roll numbers, and binding statuses.
    - Quick Action Buttons:
      - \`➕ Add Student\`: Simple modal with Name and Roll Number inputs.
      - \`🟢 Sheets Sync\`: Modal to paste a Google Sheets published CSV URL to sync roster.
      - \`🎓 Classroom Import\`: Fetches rosters from a linked Google Classroom course.
      - \`📹 Meet Import\`: Area to paste Google Meet participant attendance log to auto-verify attendees.
  - **Requests Tab**:
    - Live feed of student submission requests waiting for CR review (students who submitted outside the geofence, with GPS blocked, or manually).
    - Details: Student Name, Roll Number, Distance from Geofence center, Request Reason.
    - Actions: One-click buttons to \`Approve\` (mark Present) or \`Deny\` (mark Absent).
  - **History Tab**:
    - List of completed sessions grouped by Date and Subject.
    - Click to expand: Reveals list of attendees, timestamp, and verification details for that specific session.
  - **Export Hub Tab**:
    - Dynamic spreadsheet matrix table. Rows: Students, Columns: Dates.
    - Live editing: CR can click directly on any cell to switch a student's status between Present (Green check), Absent (Red cross), or Pending (Yellow clock).
    - Button: \`Download Excel Report (.xlsx)\` (compiles and downloads sheet).
  - **Feedback Tab**:
    - TextArea to send feature requests and bugs directly to Shivam Kumar Mahto.
  - **Profile Tab**:
    - Account overview, Class ID details, and Creator contact details.
    - Danger zone buttons:
      - \`Reset Class Database\` (wipes history, sessions, roster).
      - \`Delete Account\` (wipes credentials and data permanently).

### 5. Student Tracker Portal (\`track.html\`)
- **Login Screen**: Requires the unique **Class ID** (e.g. \`29DTUCSE5\`) and **Roll Number** (e.g. \`25/B09/001\`).
- **Dashboard Widgets**:
  - **Overall Progress Ring**: Svg circle showing the overall attendance percentage.
  - **Total Summary**: Text listing attended lectures out of total.
  - **Target Threshold Input**: Box to input target percentage (e.g. \`75\`%). Sub-cards will turn green if above the threshold, yellow if close, or red if below.
- **Subject Grid**: Individual cards showing subject name, count fraction (e.g., \`15/20\`), percentage bar, and status pill (Safe / Warning / Danger).
- **Detailed Attendance Log**: List of all recorded instances. Dropdown filters to sort by specific subject or specific status (Present, Absent, Pending).
- **Export Action**: \`🖨️ Export PDF Report\` button to print or download a clean report.
- **Google Classroom Feed**: Banner button to connect Google Classroom, bringing in coursework, due dates, scores, and announcements into the portal feed.

---

## Key Processes & Workflows

### 1. QR Code Attendance Session
1. CR generates a session with subject, duration, and optional geofencing.
2. Fullscreen QR modal pops up. The QR is generated containing a dynamic submission URL:
   \`https://qr-smart-attendance.web.app/?classId=...&session=...\`
3. Timer countdown starts. CR can adjust time using \`+1 Min\` and \`-1 Min\` buttons.
4. Students scan, log in via Google account, and submit.
5. Once the timer hits \`00:00\`, the session record is automatically deleted from Firebase.
6. Auto-Export trigger launches immediately, prompting the CR to download or share the completed session report.

### 2. First-Scan Binding (Anti-Cheat)
- Prevents proxy submissions.
- On the first scan, the student's Google account ID (UID) is permanently bound to their roll number.
- In subsequent sessions, if the student logs in with a different Google account to submit for that roll number, the submission is blocked.
- If the student attempts to log in with their Google account to submit for a classmate's roll number, the system blocks the submission and flags it.

### 3. Device Fingerprinting (Anti-Proxy)
- The system generates a persistent, unique Device ID stored across three storage layers in the student's browser.
- If the same device ID is used to submit attendance for multiple different roll numbers in the same session, the system flags the records.
- Flags show up highlighted in **red** on the CR Dashboard feed and history, warning of a potential proxy attempt.

### 4. Smart Geofencing & Location Permissions
- Standard geofence boundaries range from **10m to 2000m**.
- **GPS-Drift Tolerance (Smart Geofence Auto-Approval)**: If a student submits and their GPS coordinates place them slightly outside the geofence radius, the system applies smart tolerance (up to 1.8x of standard radius or standard + 60m, whichever is smaller).
- Students in the tolerance zone are marked present with a \`geofenceRelaxed: true\` flag to prevent rejections from GPS drift in concrete walls.
- Students further out are sent to the CR's **Requests Tab** as pending for manual verification.
- **Location Permission Troubleshooting**:
  - *iOS Safari*: Settings -> Safari -> Location -> Set to Allow.
  - *Android Chrome*: Settings -> Site Settings -> Location -> Enable.
  - *Native App (Capacitor)*: Prompt asks for location permission. Must grant "While using the app" or "Always".

### 5. Native APK Mock Location Detection
- When accessed via the native Android APK, the native \`MockLocationChecker\` plugin runs.
- If a student uses a GPS Spoofing app, the application blocks the submission immediately and alerts the CR.

### 6. Roster Setup Workflows
- **Google Sheets Sync**:
  1. CR publishes a Google Sheet to the web: File -> Share -> Publish to Web -> Web Page -> change dropdown to **Comma-separated values (.csv)**.
  2. Copy the CSV URL.
  3. In the Students tab, click \`🟢 Sheets Sync\` and paste the URL.
  4. The system dynamically pulls student names and roll numbers and updates the roster.
- **Google Meet Import**:
  - CR copies the participant list from Google Meet.
  - Paste it into the \`📹 Meet Import\` box. The system runs a matching algorithm to identify students from the roster and log them present.
  - Custom alias mappings are saved in localStorage.

### 7. Troubleshooting Student Portal Login
- Students must enter the exact **Class ID** (e.g. \`29DTUCSE5\`, case-insensitive but must match the CR's class string).
- Students must enter the exact **Roll Number** they were registered with in the roster (e.g. \`25/B09/001\`, including slashes/symbols).
- The portal pulls attendance history matching the bound Google account.
`;
