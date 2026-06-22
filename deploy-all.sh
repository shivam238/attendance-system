#!/bin/bash
# ATTENDIFY Unified Build, Deploy & Sync Script
# Runs all deployment steps and git sync in a single command.

# Exit immediately if a command exits with a non-zero status
set -e

# Define terminal colors for beautiful output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}          ATTENDIFY UNIFIED DEPLOYMENT SCRIPT       ${NC}"
echo -e "${BLUE}===================================================${NC}"

# 1. Handle Git Commit Message
COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
    echo -e "${YELLOW}Enter Git commit message (press Enter for default 'chore: automated deployment update'):${NC}"
    read -r input_msg
    if [ -z "$input_msg" ]; then
        COMMIT_MSG="chore: automated deployment update"
    else
        COMMIT_MSG="$input_msg"
    fi
fi

# 2. Configure Git Credential Helper to avoid entering token/password repeatedly
echo -e "\n${BLUE}[1/8] Ensuring Git credential helper is active...${NC}"
git config credential.helper store
echo -e "${GREEN}✔ Git credential helper is set to store credentials.${NC}"

# 3. Regenerate PDF Manual
echo -e "\n${BLUE}[2/8] Regenerating PDF User Manual from manual.html...${NC}"
google-chrome --headless --disable-gpu --print-to-pdf="public/QR Attendance System - Complete User Manual.pdf" file://$(pwd)/public/manual.html
echo -e "${GREEN}✔ PDF User Manual regenerated successfully.${NC}"

# 4. Sync assets and build Android APK
echo -e "\n${BLUE}[3/8] Syncing web assets and compiling Android APK...${NC}"
bash build-app.sh
echo -e "${GREEN}✔ Android APK built successfully.${NC}"

# 5. Upload APK to GitHub Releases
echo -e "\n${BLUE}[4/8] Uploading new APK to latest GitHub Release...${NC}"
python3 upload-apk.py
echo -e "${GREEN}✔ APK uploaded to GitHub Releases successfully.${NC}"

# 6. Check and install on connected ADB device
echo -e "\n${BLUE}[5/8] Checking for connected Android devices via ADB...${NC}"
if adb devices | grep -q -w "device"; then
    echo -e "${YELLOW}Device detected! Reinstalling/updating APK on device...${NC}"
    adb install -r ATTENDIFY.apk
    echo -e "${GREEN}✔ APK installed on connected device.${NC}"
else
    echo -e "${YELLOW}⚠ No Android device detected via ADB. Skipping local installation.${NC}"
fi

# 7. Deploy to Firebase Hosting
echo -e "\n${BLUE}[6/8] Deploying frontend assets to Firebase Hosting...${NC}"
firebase deploy --only hosting
echo -e "${GREEN}✔ Firebase Hosting deployment completed.${NC}"

# 8. Deploy Cloudflare Worker
echo -e "\n${BLUE}[7/8] Deploying Cloudflare Worker for AI Chatbot...${NC}"
cd attendify-support-worker
npx wrangler deploy
cd ..
echo -e "${GREEN}✔ Cloudflare Worker deployed.${NC}"

# 9. Sync with Git Repository
echo -e "\n${BLUE}[8/8] Staging, committing, and pushing changes to GitHub...${NC}"
git add .
git commit -m "$COMMIT_MSG"
git push origin main
echo -e "${GREEN}✔ Git repository successfully updated & pushed to main branch.${NC}"

echo -e "\n${GREEN}===================================================${NC}"
echo -e "${GREEN}          ALL DEPLOYMENTS COMPLETED SUCCESSFULLY!   ${NC}"
echo -e "${GREEN}===================================================${NC}\n"
