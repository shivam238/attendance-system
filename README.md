# 📱 ATTENDIFY

A high-performance, **Firebase-powered web application** designed for seamless student attendance management using **dynamic QR codes** and **smart campus-scale geofencing**.

---

## 🚀 Key Features

- **⚡ Real-time Tracking**: Live attendance updates powered by Firebase Realtime Database.
- **🔐 Secure Sessions**: Unique, auto-expiring QR codes to prevent unauthorized entries.
- **📍 Smart Geofencing**: 
  - Verification range from **10m up to 2.0 km** with automated unit scaling (`m` and `km`).
  - Interactive map configuration using Leaflet.js with circle boundary visualization.
  - Multi-result geocoding location search bar powered by **Nominatim (OpenStreetMap)** with Indian colleges/campus location bias.
  - Automatic map zooming to fit the geofence circle bounds perfectly.
- **🔔 Advanced Request Management**:
  - Automatically flags late check-ins, out-of-boundary submissions, or GPS access denials.
  - Color-coded badges with reasons (e.g., `Out of Range (120m)`, `GPS Denied`, `Late`).
  - One-click approval or rejection by the CR.
- **👨‍🏫 Teacher Dashboard**: Comprehensive control panel for subject management, live monitoring, and student list updates.
- **👩‍🎓 Student Portal**: Instant, zero-install attendance submission via mobile QR scanning.
- **📊 Smart Export**: Export professional Excel reports with a customizable date filter, subject filter, or individual student report.
- **📖 Embedded User Manual**: Svelte, digital manual accessible via `manual.html`, print-friendly (Save as PDF), and accessible directly from the login page and dashboard.
- **🌙 Premium UI**: Responsive, modern dark-themed interface optimized for all devices with CSS layout fallbacks for absolute stability.

---

## 🧭 Quick Start Guide

### 👨‍🏫 For Educators (CR)

1. **Initialize**: Open the dashboard and sign in.
2. **Setup**: Add your subjects and student list in the settings.
3. **Configure Geofencing (Optional)**: Enable geofencing, search for your building/campus, drag the marker, set the radius, and click **Set Location**.
4. **Generate**: Select a subject and click **“Generate QR Code”**.
5. **Monitor & Approve**: Watch the attendance list populate in real-time. Approve/reject flagged submissions in the **Requests** tab.
6. **Report**: Download the final list as an Excel file from the **Export Hub**.

### 👩‍🎓 For Students

1. **Scan**: Use your phone camera to scan the teacher's QR code.
2. **Verify**: Ensure the subject and teacher details are correct.
3. **Submit**: Enter your Roll Number, allow browser location permission (if requested), and tap **Submit**.
4. **Confirm**: Receive instant confirmation or pending approval notice.

---

## ⚙️ Built With

- **Logic**: Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS3 with Custom Properties & Dark Mode
- **Backend**: Google Firebase (Auth & Realtime DB)
- **Mapping**: Leaflet.js & Nominatim Geocoding API
- **Engines**: 
  - `qrcode.js` for dynamic vector QR generation
  - `SheetJS` for enterprise-grade Excel processing

---

## 📄 License & Attribution

This project is licensed under the **MIT License**.

**Developed by Shivam Kumar Mahto**  
🔗 [GitHub](https://github.com/shivam238) | 📷 [Instagram](https://www.instagram.com/heheshivam/)

© 2026 ATTENDIFY. All rights reserved.
