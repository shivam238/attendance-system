#!/bin/bash
# ATTENDIFY Unified Build, Deploy & Sync Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}          ATTENDIFY UNIFIED DEPLOYMENT SCRIPT       ${NC}"
echo -e "${BLUE}===================================================${NC}"

COMMIT_MSG="$1"

if [ -z "$COMMIT_MSG" ]; then
    read -rp "Commit message (Enter = default): " input
    COMMIT_MSG="${input:-chore: automated deployment update}"
fi

########################################
# 1
########################################

echo -e "\n${BLUE}[1/10] Git Credential Helper${NC}"

git config credential.helper store

########################################
# 2
########################################

echo -e "\n${BLUE}[2/10] Updating details & chatbot KB${NC}"

node scripts/update-details.js

########################################
# 3
########################################

echo -e "\n${BLUE}[3/10] Generating PDF Manual${NC}"

google-chrome \
--headless \
--disable-gpu \
--print-to-pdf="public/QR Attendance System - Complete User Manual.pdf" \
file://$(pwd)/public/manual.html

########################################
# 4
########################################

echo -e "\n${BLUE}[4/10] Building Android APK${NC}"

bash scripts/build-app.sh

########################################
# 5
########################################

echo -e "\n${BLUE}[5/10] Uploading APK to GitHub Release${NC}"

python3 scripts/upload-apk.py

########################################
# 6
########################################

echo -e "\n${BLUE}[6/10] Installing APK (ADB)${NC}"

if adb devices | grep -w "device" >/dev/null
then
    adb install -r ATTENDIFY.apk
else
    echo -e "${YELLOW}No Android device connected. Skipping.${NC}"
fi

########################################
# 7
########################################

echo -e "\n${BLUE}[7/10] Firebase Hosting + Database${NC}"

firebase deploy --only hosting,database

########################################
# 8
########################################

echo -e "\n${BLUE}[8/10] Cloud Functions (optional)${NC}"

if [ -d functions ]; then

    (
        cd functions
        npm install
    )

    if firebase deploy --only functions
    then
        echo -e "${GREEN}Functions deployed.${NC}"
    else
        echo -e "${YELLOW}"
        echo "Functions skipped."
        echo "Reason: Blaze plan/API not enabled."
        echo -e "${NC}"
    fi

else

    echo -e "${YELLOW}functions/ folder not found. Skipping.${NC}"

fi

########################################
# 9
########################################

echo -e "\n${BLUE}[9/10] Cloudflare Worker${NC}"

if [ -d attendify-support-worker ]; then

(
cd attendify-support-worker

if command -v npx >/dev/null
then
    npx wrangler deploy || echo "Worker deploy skipped."
fi

)

else

echo -e "${YELLOW}Worker folder not found.${NC}"

fi

########################################
# 10
########################################

echo -e "\n${BLUE}[10/10] Git Sync${NC}"

git add .

if git diff --cached --quiet
then
    echo -e "${YELLOW}Nothing to commit.${NC}"
else
    git commit -m "$COMMIT_MSG"
    git push origin "$(git branch --show-current)"
fi

echo
echo -e "${GREEN}===================================================${NC}"
echo -e "${GREEN}      ATTENDIFY DEPLOYMENT FINISHED SUCCESSFULLY    ${NC}"
echo -e "${GREEN}===================================================${NC}"
