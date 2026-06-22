export default `
# ATTENDIFY AI Customer Support Knowledge Base

Generated automatically from the repository manual and documentation.

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
- **Database Backend**: Firebase Realtime Database.
- **Authentication**: Firebase Authentication (Google OAuth & Firebase Phone Auth).
- **PWA Capabilities**: Service worker handling offline assets and caching.
- **Mobile Environment**: Capacitor-wrapped native Android APK (~5 MB download size) containing native notifications and hardware-level mock location checks.

---

## System Features & User Manual (Official Documentation)

### 🌐 System Overview


> **[TIP]** 💡 ATTENDIFY is 100% free — no subscription, no credit card. Built on Firebase + OpenStreetMap.


### 🎯 CR Registration (CR Only)

1. Open the app and click the **Google Login** button to sign in with your college Google account.
2. On the Setup screen, enter your **Passout Year** (last 2 digits, e.g. \`29\`), College, Branch, and Section.
3. Enter your **Mobile Number** (10 digits) for OTP verification and account recovery.
4. *(Optional)* Enter your **College Website** URL (e.g. \`https://dtu.ac.in\`) if you'd like students to have a direct portal link.
5. Enter all **Subjects** — one per line (e.g. MATHEMATICS-1, PHYSICS, BASIC CIVIL ENGINEERING).
6. Click **"Copy ChatGPT Prompt"** → paste in ChatGPT with your class roster → copy the formatted result → paste it in the Students field.
7. Click **Save & Continue**. Your class ID (e.g. \`29DTUCSE5\`) is auto-generated.

> **[TIP]** 💡 **Student Format:** Each student should be on one line as \`NAME - ROLLNO\` (e.g. \`RAHUL SHARMA - 29/B09/042\`). ChatGPT handles the formatting for you.


### 📲 Taking Attendance (CR Only)

1. Login and go to the **CR** tab.
2. Select the subject from the **Select Subject** dropdown.
3. *(Optional)* Configure **Geofencing** — enable it and set the classroom location on the map.
4. Click **Generate QR Code**. The QR is valid for **5 minutes** (extendable by 1 minute).
5. Show the QR on your screen, or click **Copy Link** to share the attendance link via WhatsApp/message.
6. Watch the **live attendance feed** as students submit. Present / Total counts update in real-time.

#### QR Lifecycle & Security

- **📺 Fullscreen Presentation:** Click the Fullscreen button to project a large, dynamically scaled QR code with a distraction-free dark layout. Real-time student statistics (e.g. \`Present: 15 / 60\`) are displayed directly below the subject name and update live.
- **⏱️ Timer Natural Expiry:** When the 5-minute countdown reaches zero, the QR code disappears from the CR dashboard. However, students who already have the registration page open can still request **"Late Attendance"** (pending manual approval in your Requests tab).
- **🛑 Manual Termination (✕ Clear):** If you click **"✕ Clear"** or switch the selected subject, the QR session is instantly deleted from the database. Any student attempting to mark attendance after this will be blocked with an error (\`❌ Invalid or expired session\`) and cannot even request late attendance.
- **🔄 Active Session Recovery:** If the dashboard page is reloaded, refreshed, or closed accidentally while a QR code session is active, the app will automatically recover and restore the active QR code, its remaining countdown timer, live attendance counts, and fullscreen presentation state on load.

> **[WARNING]** ⚠️ Each student can mark attendance **only once per QR session**. Duplicate submissions are automatically blocked.


### 📍 Geofencing & Location Verification (CR Only)


#### Setting Up

1. In the CR tab, set **Geofencing** dropdown to *"Enabled (Verify Student Location)"*.
2. Click **"Configure Area on Map"**. The map modal opens centered on your current GPS position.
3. Use the **search bar** to find your college or building by name (e.g. "DTU Delhi").
4. **Drag the marker** to the exact classroom location, or click anywhere on the map to reposition it.
5. Use the **radius slider** (10m – 2km) to set the allowed boundary. The blue circle updates live. Typical classroom = 30–50m. Campus-wide = 500m+.
6. Click **"Set Location"** to save. The button label will update to show the selected radius.

#### How Verification Works

- When a student submits attendance, the browser requests their GPS location.
- The Haversine formula calculates the exact distance from the classroom center.
- **Within range →** Attendance marked immediately ✅
- **Smart Geofence Auto-Approval →** Students within a minor GPS-drift tolerance (1.8x the geofence radius, capped at +60m) are automatically marked Present with a \`geofenceRelaxed\` flag, saving manual CR review time.
- **Out of range →** Submission goes to *Requests* tab with distance shown 📍
- **GPS denied →** Submission goes to *Requests* tab marked as GPS Denied ⚠️

> **[TIP]** 💡 GPS accuracy varies by device and network. The Smart Geofence tolerance handles minor drifts automatically, but it's still best to set a reasonable baseline radius.


### 🎓 Google Meet &amp; Classroom Integration (CR Only)


#### Google Meet Import

- **🟢 Meet Import Button:** Click the "Meet Import" button on the dashboard. Paste the raw participant list copied from your Google Meet session.
- **🧠 Smart Alias Memory:** The system automatically runs fuzzy name matching to link names with registered roll numbers. If a student uses a custom alias, you can map it manually once, and the system will remember it forever using localStorage.
- **Conflict Resolution:** Handles same-name conflicts with checkboxes and displays unmatched participants for manual mapping.

#### Google Classroom & Sheets Sync

- **🏫 Import from Classroom:** Go to the Students tab and click "Import from Google Classroom". Authenticate with your Google account using GIS OAuth to import course rosters directly (requires Teacher role in the course).
- **📊 Google Sheets Live Sync:** Publish a Google Sheet as a CSV (File → Share → Publish to Web → CSV), paste the URL into the Google Sheets sync modal, and pull your entire class list in one click.

### 🛡️ Anti-Proxy Security Engine (CR Only)


#### How It Protects Your Roster

- **Mandatory Google Student Authentication:** Students must authenticate using their Google account before they can submit attendance, eliminating anonymous/unauthenticated submissions.
- **First-Scan Binding:** During a student's first scan, their Google account UID is locked to their Roll Number in the database. Subsequent scans automatically verify this link, preventing students from using multiple accounts or marking attendance for friends.
- **Persistent Device Fingerprinting:** Every student device is assigned a unique, secure 3-layer device identifier stored in localStorage, sessionStorage, and browser cookies.
- **Silent Fraud Detection:** If multiple students attempt to mark attendance using the same device in a single session, the system flags the submissions as suspicious without showing any block/error page to the student (to prevent evasion).
- **Visual Auditing:** Marked attendance displays a ⚠️ Suspicious badge with a red dashed border on the CR live feed, detailing the reason (e.g. "Device shared with [Other Student Name]"). The CR can review and choose to approve or delete the entry.
- **Native Mock Location Blocking (Android APK):** The official Android app utilizes a native Geolocation checker plugin to verify coordinates directly from the OS. It detects and completely blocks attendance marking if any Fake GPS or mock location provider app is active.

### 📱 Mobile Application (Android APK) (All Users)


#### Key Features & Settings

- **⚡ Native App Shell:** ATTENDIFY is fully packaged as a lightweight native Android app (.apk) using Capacitor.
- **⚡ Smart Landing Bypass:** The mobile app is designed for speed; it bypasses the marketing landing page on launch and opens the login/dashboard screen instantly.
- **🔔 Native Push Notifications:** The app utilizes the Capacitor Local Notifications plugin to deliver system alerts directly to the device notification tray.
- **🔊 Custom Web Audio Alerts:** Audio feedback chimes are played (success chime for correct marking, warning chime for suspicious entries) to provide immediate acoustic feedback during active sessions.

### 👨‍🎓 Student Guide (Students)

1. **Scan** the QR code shown by your CR on screen, or open the attendance link shared via WhatsApp/message.
2. Enter your **Roll Number** exactly as registered (case-insensitive). You can also type your full name.
3. If Geofencing is enabled, **allow location access** when the browser asks. Denying will send your attendance for CR approval.
4. Click **Submit**. You'll be redirected to a confirmation page.

#### Student Attendance Tracker (track.html)

- **🔑 Login:** Students can log in to the Student Portal using their Class ID and Roll Number. No Firebase account is required.
- **🌐 College Portal Link:** If the CR configured a college website during setup, a **🌐 College Portal** button will appear on the dashboard. Clicking this redirects students to their college portal.
- **📈 Track Attendance:** Monitor overall attendance percentage, check attended vs. total lectures, configure target threshold warnings (defaults to 75%), and filter detailed logs.

> **[WARNING]** ⚠️ If your attendance shows as **"Pending CR Approval"**, it means you were outside the classroom boundary or denied GPS access. Your CR will review and approve/reject it manually.


### 🔔 Managing Requests (CR Only)

- Go to the **Requests** tab to see all pending attendance submissions.
- Each request shows the student name, roll number, time, and reason (Late / Out of Range / GPS Denied).
- Click **Approve** to mark the student as present, or **Reject** to decline.
- Out-of-range requests show the **exact distance** the student was from the classroom.

### 📊 History & Export (CR Only)


#### View History

- Click the **History** tab to see all past attendance sessions grouped by subject and date.
- Each session shows who was present and who was absent.

#### Export Hub & Reporting

1. Click the **📊 Export Hub** button.
2. Select export format: **All Subjects**, specific subjects, or individual student report.
3. Optionally filter by **date range**.
4. Click **Download Report** to save as an Excel (.xlsx) file.
5. **⚡ Session Auto-Export:** When you clear or close an active QR session, a prompt automatically appears, allowing you to instantly download or share the compiled Excel report (via native share sheets on WhatsApp, Email, etc.).

### ⚙️ Account Management

- Click **⚙️ Settings** in the top bar to view your Class ID, linked accounts, and manage login methods.
- You can link both a **Google account** and a **phone number** for login flexibility.
- To add/edit/remove students, go to the **Students** tab.
- To add or rename subjects, click **📚 Manage Subjects**.

### 🤖 Customer Support & AI Assistant

- **💬 Inline AI Assistant:** A custom support chatbot widget is now embedded directly on the **Contact Us** page (\`contact.html\`). You can ask it questions about how to use the app, troubleshoot login issues, or clarify QR session lifecycles.
- **📧 Email support:** Clicking the Email card on the Contact page will instantly copy the support email (\`sm3165599@gmail.com\`) to your clipboard for quick and easy messaging.
- **📱 Social Channels:** Connect directly with the developer via the official Instagram and LinkedIn links provided on the contact page.
`;
