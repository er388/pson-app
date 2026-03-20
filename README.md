# Pson.io

Εφαρμογή διαχείρισης λίστας αγορών και καταλόγου προϊόντων για Android.

## Τι κάνει

- Λίστα αγορών με ομαδοποίηση ανά κατηγορία ή κατάστημα
- Κατάλογος προϊόντων με barcode scanner και Open Food Facts integration
- Στατιστικά δαπανών ανά κατηγορία, προϊόν και κατάστημα
- Ιστορικό αγορών με δυνατότητα επαναφόρτωσης λίστας
- Templates λίστας για επαναλαμβανόμενες αγορές
- Loyalty cards με barcode/QR εμφάνιση
- Cloud backup (Google Drive, OneDrive, Dropbox)
- Πολύγλωσση υποστήριξη (Ελληνικά / English)
- Themes: Light, Dark, AMOLED, Green, Blue, Red

## Tech Stack

- React + Vite + TypeScript
- Capacitor (Android wrapper)
- shadcn-ui + Tailwind CSS
- Target: Android 12+ (minSdk 26)

## Setup
```bash
git clone https://github.com/er388/pson-app
cd pson-app
npm install
```

Για Android development, χρειάζεται:
- Android Studio (Hedgehog ή νεότερο)
- JDK 21
- Android SDK 36

## Build
```bash
# Web assets
npm run build
npx cap sync android

# APK (από Android Studio)
# Build → Generate Signed App Bundle or APK → APK → release

# ή από terminal
cd android
./gradlew assembleRelease
```

Το signed APK βρίσκεται στο `android/app/release/app-release.apk`.

### Signing

Το keystore βρίσκεται εκτός repo. Τα credentials ορίζονται στο `android/app/build.gradle` → `signingConfigs.release` και στο `android/gradle.properties`.

### ADB install
```bash
adb uninstall io.pson.app
adb install android/app/release/app-release.apk
```

## Cloud Backup Setup

Για οδηγίες ρύθμισης OAuth για κάθε cloud provider, δες [CLOUD_BACKUP_SETUP.md](./CLOUD_BACKUP_SETUP.md).

## Known Issues

<!-- Συμπλήρωσε εδώ -->

## Contributing

1. Fork το repo
2. Δημιούργησε branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Άνοιξε Pull Request

Το project ακολουθεί [Semantic Versioning](https://semver.org/).