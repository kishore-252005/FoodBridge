# FoodBridge Android App

This project is now configured as a Capacitor Android app.

## Requirements

- Node.js and npm
- Android Studio
- JDK 17 or newer
- `JAVA_HOME` set to your JDK path
- Android SDK installed through Android Studio

## Build and Sync

```bash
npm run app:sync
```

This builds the React app and copies the compiled files into the Android project.

## Open in Android Studio

```bash
npm run app:open
```

From Android Studio you can run the app on an emulator or a USB-connected Android phone.

## Build a Debug APK

```bash
cd android
.\gradlew.bat assembleDebug
```

The APK will be created at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Install on a Phone

Enable Developer Options and USB Debugging on the phone, connect it by USB, then run from Android Studio or install the generated APK manually.

## Updating the Installed App

For local APK installs, run:

```bash
npm run app:sync
```

Then build/install the APK again. For automatic user updates, publish release builds through Google Play.
