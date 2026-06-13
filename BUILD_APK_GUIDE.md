# FasalGuard — Android APK Build Guide

## Prerequisites

| Item | Required | Notes |
|------|----------|-------|
| Expo account | ✅ Yes | Free at https://expo.dev/signup |
| Node.js 18+ | ✅ Yes | Already installed |
| EAS CLI | ✅ Install below | `npm install -g eas-cli` |
| Android phone | ✅ Yes | For installing APK |
| USB cable OR internet | ✅ Either | adb (USB) or download link (internet) |

---

## Step 1: Install EAS CLI

Open PowerShell **as administrator** and run:

```powershell
npm install -g eas-cli
```

If you get a permission error, run this first (enables script execution for current session):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

Verify installation:

```powershell
eas --version
```

---

## Step 2: Login to Expo

```powershell
eas login
```

Enter your Expo username and password (create account at https://expo.dev/signup first if you don't have one).

Check login status:

```powershell
eas whoami
```

---

## Step 3: Configure Project for EAS Build

Inside the `app/` directory:

```powershell
cd E:\SMIT_final_project\app
eas build:configure
```

This creates an `eas.json` file in `app/`. It will ask:

- **"What would you like your Android package name to be?"** → Press Enter to accept default, OR enter `com.fasalguard.app`

---

## Step 4: Create eas.json for APK (Not AAB)

Open the generated `app/eas.json` and replace its content with:

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

**Why this matters:** By default, EAS builds produce `.aab` (Android App Bundle) which can't be installed directly on a phone. Setting `"buildType": "apk"` under the `preview` profile forces it to output a `.apk` file.

---

## Step 5: Install expo-dev-client

```powershell
npx expo install expo-dev-client
```

This is required for development builds. For a production APK it's optional but recommended for testing.

---

## Step 6: Build the APK (Cloud Build)

Run:

```powershell
eas build -p android --profile preview
```

What happens:
1. EAS CLI uploads your project to Expo's cloud servers
2. Build runs on Google Cloud Linux machines (free tier available)
3. Takes **5-15 minutes** depending on queue
4. When done, you get a download URL

**Expected prompts:**
- **"Generate a new Android Keystore?"** → Type `Y` (EAS handles signing for you)
- **"What's your app's package name?"** → `com.fasalguard.app` (or press Enter for default)

**On success:** The terminal shows a URL like:
```
https://expo.dev/builds/...
```
Open this URL to download the `.apk` file.

---

## Step 7: Install APK on Your Phone

### Option A: Direct download (easiest)

1. Open the build URL from Step 6 on your phone
2. Tap "Download APK"
3. Open the downloaded file
4. If asked "Install unknown apps" → enable for your browser/download manager
5. Tap "Install"

### Option B: Using adb (USB cable)

Enable Developer Options on your phone:
1. Settings → About Phone → Tap "Build Number" 7 times
2. Settings → Developer Options → Enable "USB Debugging"
3. Connect phone to PC via USB

Then run:

```powershell
adb install path\to\downloaded.apk
```

---

## Common Errors & Fixes

### Error 1: `Set-ExecutionPolicy` — Scripts disabled

```
File cannot be loaded because running scripts is disabled
```

**Fix:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

(Run this in every new PowerShell session before using EAS CLI)

### Error 2: Build fails with "Android SDK not found"

Happens when trying local builds without Android Studio.

**Fix:** Don't use `--local` flag. Use cloud builds (default) — no Android SDK needed.

### Error 3: Build fails with "expo-dev-client not found"

```powershell
npx expo install expo-dev-client --fix
```

### Error 4: "npm ERR! Missing script: 'expo'"

You ran `npm run expo`. The correct command is:

```powershell
npx expo ...
```

or use the package.json scripts:

```powershell
npm run web    # for web
npm run android  # for Android emulator
```

### Error 5: EAS Build produces `.aab` instead of `.apk`

**Fix:** Make sure your `eas.json` has `"buildType": "apk"` under the profile you're using (see Step 4).

### Error 6: Build stuck at "uploading project"

Large `node_modules` or asset files. Ensure `.gitignore` excludes `node_modules/`, `dist/`, `.expo/`.

### Error 7: "APK not installing on phone"

- Go to Settings → Security → Toggle "Install from unknown apps" ON for your file manager/browser
- Make sure the APK isn't corrupted (re-download)
- Check Android version (minimum: Android 6.0+)

### Error 8: "Cannot find module" during build

Some packages may not be compatible with EAS build environment.

**Fix:**

```powershell
npx expo install --fix
npx expo-doctor
```

Fix any warnings shown by `expo-doctor`, then retry the build.

---

## Alternative: Build Locally (Windows)

If cloud build doesn't work, you can build locally — but this requires Android Studio + SDK (~5 GB download):

1. Install Android Studio: https://developer.android.com/studio
2. Add to PATH: `C:\Users\YOUR_USER\AppData\Local\Android\Sdk\platform-tools`
3. Set env variable: `ANDROID_HOME=C:\Users\YOUR_USER\AppData\Local\Android\Sdk`
4. Run:

```powershell
npx expo prebuild
cd android
./gradlew assembleRelease
```

The APK will be at: `app\android\app\build\outputs\apk\release\app-release.apk`

---

## Quick Reference (Cheat Sheet)

```powershell
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configure project
cd app
eas build:configure

# 4. Edit eas.json → set buildType: "apk"

# 5. Build APK
eas build -p android --profile preview

# 6. Wait 5-15 min → download from link
```
