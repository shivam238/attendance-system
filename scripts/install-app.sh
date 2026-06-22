#!/bin/bash
# ATTENDIFY Android APK Quick Installer
# Directly installs the compiled ATTENDIFY.apk onto a connected device via ADB.

# Define terminal colors for beautiful output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}          ATTENDIFY APK DIRECT INSTALLER            ${NC}"
echo -e "${BLUE}===================================================${NC}"

# Check if APK exists
APK_PATH="./ATTENDIFY.apk"
if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}❌ Error: $APK_PATH not found!${NC}"
    echo -e "${YELLOW}Please build the APK first by running: ${BLUE}bash scripts/build-app.sh${NC}"
    exit 1
fi

# Check for connected ADB devices
echo -e "${BLUE}Checking for connected Android devices via ADB...${NC}"
DEVICE_LIST=$(adb devices | grep -w "device")

if [ -n "$DEVICE_LIST" ]; then
    DEVICE_COUNT=$(echo "$DEVICE_LIST" | wc -l)
    echo -e "${GREEN}✔ Detected $DEVICE_COUNT connected device(s).${NC}"
    
    echo -e "${YELLOW}Installing/Updating APK on device...${NC}"
    if adb install -r "$APK_PATH"; then
        echo -e "${GREEN}=============================================${NC}"
        echo -e "${GREEN}🎉 SUCCESS: APK installed on your device!${NC}"
        echo -e "${GREEN}=============================================${NC}"
    else
        echo -e "${RED}❌ Installation failed. Please check if your phone is unlocked and allows installs via USB.${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ No Android device detected via ADB.${NC}"
    echo -e "${YELLOW}Please check that:${NC}"
    echo -e "  1. Your phone is connected via USB cable."
    echo -e "  2. USB Debugging is enabled in Developer Options."
    echo -e "  3. You have allowed USB Debugging authorization on your phone screen."
    echo -e "\n${BLUE}Tip: Run 'adb devices' in terminal to check device status.${NC}"
    exit 1
fi
