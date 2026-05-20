# CityIRA — APK Build & Branding Plan

## App Quality Audit

Before building, here is an honest assessment against typical hackathon judging criteria:

| Criteria | Status | Notes |
|---|---|---|
| **Core Functionality** | ✅ | Incident ingest (text/voice/camera), live map, AI plan, trace |
| **AI Integration** | ✅ | Multi-tier LLM failover (Groq → Groq 70B → Gemini → Mock) |
| **Real-time Feed** | ✅ | Incidents auto-refresh on tab focus |
| **Deployed Backend** | ✅ | `wakanda-backend.onrender.com` live and healthy |
| **Voice Input** | ✅ | Now properly scoped to Report screen only |
| **Camera / Vision** | ✅ | Image attach + vision pipeline in Report screen |
| **UX Consistency** | ✅ | Voice/camera removed from all tabs except Report |
| **App Name/Icon** | ⚠️ | Currently placeholder icon + named "CityIRA" — needs update |
| **Splash Screen** | ⚠️ | Default expo splash — needs branded version |
| **APK** | ❌ | Not built yet — requires EAS Build |
| **Backend health fallback** | ✅ | Always falls back to `localhost` in dev, Render in prod |

---

## Open Questions

> [!IMPORTANT]
> **App name**: The project is named `wakanda` in the repo but the app displays `CityIRA`. Which name should appear on the phone home screen?
> - Option A: **CityIRA** (current, matches the backend service name)
> - Option B: **Wakanda** (repo name)
>
> Currently proceeding with **CityIRA** as it matches the backend and docs.

> [!IMPORTANT]
> **EAS Account**: Building an APK via EAS requires an Expo account and `eas-cli`.
> You will need to run `eas login` once with your Expo credentials.
> If you don't have an account, create one free at https://expo.dev

---

## Proposed Changes

### 1. Icon & Splash Screen
#### [MODIFY] assets/images/icon.png
Replace the blank placeholder with the generated branded icon (dark bg, green shield + city skyline).

#### [MODIFY] assets/images/adaptive-icon.png
Same icon, used on Android home screen adaptive icon foreground.

#### [MODIFY] assets/images/splash-icon.png
Replace with the branded splash image (dark bg, centered logo + CityIRA text + tagline).

---

### 2. app.json — Branding & Android Config
#### [MODIFY] [app.json](file:///d:/Documents/Project/CityIncidentWorkspace/wakanda/mobile/app.json)

Key changes:
```json
{
  "expo": {
    "name": "CityIRA",
    "slug": "cityira",
    "splash": {
      "backgroundColor": "#09090B"   // dark background to match branded splash
    },
    "android": {
      "package": "com.cityira.app",  // required for APK
      "versionCode": 1,
      "adaptiveIcon": {
        "backgroundColor": "#09090B"
      }
    }
  }
}
```

---

### 3. EAS Build Setup
#### [NEW] eas.json
```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

### 4. _layout.tsx — Fix Hardcoded localhost in Health Check
#### [MODIFY] [_layout.tsx](file:///d:/Documents/Project/CityIncidentWorkspace/wakanda/mobile/app/_layout.tsx)
The `RootLayoutNav` health check still has `'http://localhost:8000/v1'` as fallback.
Change to `'https://wakanda-backend.onrender.com/v1'`.

---

## Build Steps (run in order)

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to your Expo account
eas login

# 3. Configure the project (run once — links to your Expo account)
cd mobile
eas build:configure

# 4. Build the APK (cloud build — no Android Studio needed)
eas build --platform android --profile preview
```

The build runs in Expo's cloud (~10-15 min). When done, a download link for the `.apk` is provided.

---

## Verification Plan

1. Install APK on a physical Android device.
2. Confirm app name shows "CityIRA" on home screen.
3. Confirm branded icon and splash screen appear correctly.
4. Open app → verify backend health chip shows "Backend Connected" (Render).
5. Navigate all 5 tabs — confirm NO floating voice/camera buttons except on Report.
6. Submit a test incident via text, voice, and camera — all should succeed against the live Render backend.
7. Run "Autonomous Plan" — verify it succeeds with LLM fallover chain.
