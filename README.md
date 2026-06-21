# 📱 ATTENDIFY

A high-performance, **Firebase-powered web application** for seamless student attendance management using **dynamic QR codes**, **smart geofencing**, **Google Meet integration**, and a built-in **anti-proxy detection engine**.

---

## 🚀 Key Features

### Core Attendance
- **⚡ Real-time Tracking**: Live attendance updates powered by Firebase Realtime Database.
- **🔐 Secure QR Sessions**: Unique, auto-expiring QR codes (5 min default, extendable by 1 min) to prevent unauthorized entries.
- **📍 Smart Geofencing**: Verification range from **10m up to 2.0 km** with Leaflet.js map, draggable marker, Nominatim geocoding search (India-biased), and circle boundary visualization.
- **🔔 Request Management**: Auto-flags late check-ins, out-of-boundary submissions, GPS denials — with one-click CR approval/rejection.

### 🛡️ Anti-Proxy System *(New)*
- **Device Fingerprinting**: Persistent 3-layer Device ID (localStorage → sessionStorage → cookie) to uniquely identify student devices.
- **Silent Fraud Detection**: Flags proxy attempts (same device, different roll numbers) without alerting the student — CR sees a ⚠️ Suspicious badge with red dashed border.
- **Zero false blocking**: Suspicious records are still saved but visually flagged for CR audit.

### 🔔 Native Notifications & Audio *(New)*
- **OS-Level Push Notifications**: Browser native notifications for every attendance submission — visible even when tab is minimized.
- **Distinct Audio Chimes**: Web Audio API (no MP3 files needed) — success chime for normal, warning chime for proxy/suspicious submissions.

### 🎓 Google Meet Attendance Import *(New)*
- **Paste & Match**: CR pastes Google Meet participant list → system auto-matches names using multi-layer fuzzy matching.
- **Smart Alias Memory**: Remembers custom name-to-roll mappings in localStorage — fully automatic after first link.
- **Conflict Resolution**: Handles same-name conflicts with checkboxes; unmatched names (e.g., parent accounts) shown with dropdown selection.

### 🏫 Google Classroom Import *(New)*
- Import student roster directly from Google Classroom using Google Identity Services (GIS) OAuth.
- No Firebase session disruption — shows only a minimal Classroom consent popup.
- *Note: Requires CR to have Teacher role in the Classroom to fetch full roster.*

### 📊 Dashboard & Reporting
- **👨‍🏫 CR Dashboard**: Tabs for QR generation, live feed, today's summary, student management, history, requests, and Export Hub.
- **👩‍🎓 Student Portal** (`track.html`): Subject-wise attendance percentage, logs, PDF export — no Firebase Auth needed.
- **📊 Export Hub**: Excel reports (`.xlsx`) with list/matrix formats, date range filter, student search, and manual present/absent editing.
- **🤖 AI Support Chatbot**: Inline chatbot on the Contact page powered by Gemini 2.5 Flash with OpenRouter fallback, deployed on Cloudflare Workers.

---

## 🧭 Quick Start Guide

### 👨‍🏫 For CRs / Educators

1. **Sign In**: Google login (recommended) or phone OTP.
2. **Setup**: Add class details, subjects, and student list (`NAME - ROLLNO` format per line).
3. **Generate QR**: Select subject → click **Generate QR Code** → share fullscreen or copy link.
4. **Monitor**: Watch live attendance feed with OS notifications and audio chimes.
5. **Online Class**: Use **🟢 MEET IMPORT** → paste Google Meet participant list → auto-match & save.
6. **Review**: Approve/reject pending requests; audit ⚠️ Suspicious entries.
7. **Export**: Download Excel report from Export Hub.

### 👩‍🎓 For Students

1. **Scan** the CR's QR code or open the shared link.
2. **Enter** Roll Number (or full name).
3. **Allow** location if requested.
4. **Submit** — get instant confirmation or pending approval notice.
5. **Track** attendance anytime via `track.html` using Class ID + Roll Number.

---

## ⚙️ Built With

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| **Backend / DB** | Google Firebase (Auth + Realtime Database + Hosting) |
| **AI Chatbot** | Gemini 2.5 Flash (primary) + OpenRouter (fallback) on Cloudflare Workers |
| **Mapping** | Leaflet.js + Nominatim (OpenStreetMap) |
| **Classroom OAuth** | Google Identity Services (GIS) |
| **QR Generation** | qrcode.js |
| **Excel Export** | SheetJS (xlsx) |
| **Notifications** | Browser Notification API + Web Audio API |
| **PWA** | Service Worker (cache-first/network-first strategy) |

---

## 🌐 Live URLs

- **Main App**: https://qr-smart-attendance.web.app
- **AI Support Worker**: https://attendify-support-worker.sm3165599.workers.dev

---

## 📱 Mobile Application (Android APK)

ATTENDIFY is fully integrated with **Capacitor** to build a native Android app.

### 🌟 Mobile-Specific Features
- **Instant Entry**: Detects Capacitor and automatically bypasses the landing page to load the login screen instantly.
- **Native Notifications**: Integrated with `@capacitor/local-notifications` to send native push notifications to the device system tray.
- **Custom App Branding**: Custom launcher icons and splash screens compiled using `@capacitor/assets`.

### 🛠️ Building the APK
To compile the native Android APK from the current code:
1. Ensure your environment has Java 17+ (`jdk21` folder or system path) and Android SDK (`/home/darkeeidea/Android/Sdk`) configured.
2. Run the build script in the root directory:
   ```bash
   bash build-app.sh
   ```
3. The script will copy the web assets, sync the Android platform, and run the Gradle build.
4. The output APK will be generated at the root directory as **`ATTENDIFY.apk`** (~5 MB).

---

## 📄 License & Attribution

This project is licensed under the **MIT License**.

**Developed by Shivam Kumar Mahto**  
🔗 [GitHub](https://github.com/shivam238) | 📷 [Instagram](https://www.instagram.com/heheshivam/) | 💼 [LinkedIn](https://www.linkedin.com/in/shivam-kumar-mahto-046228361/)

© 2026 ATTENDIFY. All rights reserved.


---

