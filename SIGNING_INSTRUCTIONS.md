# Signed APK Build Instructions

## Step 1 — Generate a keystore (one time only)
Run this command in your terminal:

```
keytool -genkey -v -keystore pson-release-key.keystore \
  -alias pson-key -keyalg RSA -keysize 2048 -validity 10000
```

Store the `.keystore` file securely. Do NOT commit it to git.

## Step 2 — Configure gradle signing
Create or edit `android/gradle.properties` and add:

```
MYAPP_UPLOAD_STORE_FILE=pson-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=pson-key
MYAPP_UPLOAD_STORE_PASSWORD=YOUR_STORE_PASSWORD
MYAPP_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

## Step 3 — Reference in build.gradle
In `android/app/build.gradle`, under `android { signingConfigs { ... } }`:

```groovy
signingConfigs {
    release {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

## Step 4 — Build release APK
```
cd android
./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

## Step 5 — Or build AAB for Play Store
```
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Capacitor Build Workflow
```bash
npm install
npm run build
npx cap sync android
npx cap open android
# Then build signed APK/AAB from Android Studio
```

## Important Notes
- The `capacitor.config.ts` has `appId: 'io.pson.app'` and `appName: 'Pson.io'`
- Before building the final APK, **remove** the `server` block from `capacitor.config.ts` so the app runs offline from the built web assets
- Add `.keystore`, `.jks` files to `.gitignore`
