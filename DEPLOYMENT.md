# Deployment Guide

This app uses [EAS Build](https://docs.expo.dev/build/introduction/) for building and distributing production binaries.

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- An [Expo account](https://expo.dev/signup) linked via `eas login`
- Firebase project configured (see `README.md` for setup)

## Build Profiles

Build profiles are defined in `eas.json`:

| Profile | Purpose | Distribution |
| --------- | --------- | ------------- |
| `development` | Dev client for local testing | Internal |
| `preview` | Internal testing builds | Internal |
| `production` | Release builds | APK (Android) |

## Building

### Development Build

```bash
eas build --profile development --platform android
```

### Preview Build (Internal Testing)

```bash
eas build --profile preview --platform android
```

### Production Build

```bash
eas build --profile production --platform android
```

The production profile outputs an APK (`"buildType": "apk"` in `eas.json`). Version numbers auto-increment via `"appVersionSource": "remote"`.

### iOS Builds

```bash
eas build --profile production --platform ios
```

Requires an Apple Developer account and provisioning profile configuration.

## Environment Variables

Production builds pull environment variables from `eas.json` build profile `env` blocks. The Sentry DSN is configured there.

Firebase config variables (`EXPO_PUBLIC_FIREBASE_*`) are read from the `.env` file at build time. Ensure these are set in your build environment or CI.

**Never commit `.env` with real credentials.** Use `.env.example` as a template.

## Pre-Deployment Checklist

1. Run lint: `npm run lint`
2. Run type check: `npx tsc --noEmit`
3. Run tests: `npm test`
4. Verify Firestore security rules are deployed: `firebase deploy --only firestore:rules`
5. Verify `.env` values are correct for the target environment
6. Check `npm audit` for dependency vulnerabilities

## Deploying Firestore Rules

Firestore security rules live in `firestore.rules`. Deploy them with:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project your-project-id
```

## Sentry Source Maps

Sentry source maps are uploaded automatically during EAS builds when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are set. These are configured in `.env`.

## Updating the App

1. Make changes and verify locally
2. Update `CHANGELOG.md`
3. Bump version if needed (EAS auto-increments build numbers)
4. Run `eas build --profile production --platform android`
5. Distribute the APK or submit to the Play Store

## Troubleshooting

- **Build fails with missing env vars**: Ensure `.env` exists with all `EXPO_PUBLIC_FIREBASE_*` values, or set them in the `eas.json` `env` block
- **Firestore permission denied**: Verify security rules are deployed and match `firestore.rules`
- **Sentry not receiving events**: Check `EXPO_PUBLIC_SENTRY_DSN` is set in the build profile
- **EAS CLI not authenticated**: Run `eas login` and verify with `eas whoami`
