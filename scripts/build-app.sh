#!/bin/bash
# Build script for AttenMo Android APK

# Exit immediately if a command exits with a non-zero status
set -e

echo "Syncing assets to Android platform..."
npx cap sync android

echo "Building APK..."
if [ -d "$(pwd)/jdk21" ]; then
    export JAVA_HOME="$(pwd)/jdk21"
elif [ -d "/usr/lib/jvm/java-17-temurin-jdk" ]; then
    export JAVA_HOME="/usr/lib/jvm/java-17-temurin-jdk"
fi
export ANDROID_HOME="/home/darkeeidea/Android/Sdk"
cd android
./gradlew assembleDebug

cd ..
cp android/app/build/outputs/apk/debug/app-debug.apk ./AttenMo.apk

echo "============================================="
echo "BUILD SUCCESSFUL!"
echo "APK resides at: $(pwd)/AttenMo.apk"
echo "============================================="
