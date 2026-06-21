#!/bin/bash
# Build script for ATTENDIFY Android APK

# Exit immediately if a command exits with a non-zero status
set -e

echo "Syncing assets to Android platform..."
npx cap sync android

echo "Building APK..."
export JAVA_HOME="$(pwd)/jdk21"
export ANDROID_HOME="/home/darkeeidea/Android/Sdk"
cd android
./gradlew assembleDebug

cd ..
cp android/app/build/outputs/apk/debug/app-debug.apk ./ATTENDIFY.apk

echo "============================================="
echo "BUILD SUCCESSFUL!"
echo "APK resides at: $(pwd)/ATTENDIFY.apk"
echo "============================================="
