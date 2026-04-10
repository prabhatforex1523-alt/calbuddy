# CALSNAP AI

React + TypeScript + Vite nutrition tracker with Firebase Auth, Firestore food logs, and AI-assisted food analysis.

## Features

- Email/password signup and login with Firebase Auth
- Persistent auth session after refresh
- Food analysis using a secure AI scan endpoint, USDA, and local fallback data
- User-specific Firestore storage at `users/{uid}/foodLogs/{docId}`
- Food log reloads automatically on app reopen
- Local Firestore cache for smoother development

## Run Locally

Prerequisites:
- Node.js
- Firebase project with Authentication and Firestore enabled

1. Install dependencies:
   `npm install`
2. Create `.env` and set:
   `VITE_USDA_API_KEY=your_key`
   Optional for local development only:
   `VITE_GEMINI_API_KEY=your_key`
   Launch-safe AI scan:
   `VITE_AI_SCAN_ENDPOINT=https://your-domain.com/scan-food`
3. Start the dev server:
   `npm run dev`
4. Type-check:
   `npm run lint`
5. Production build:
   `npm run build`

## AI Scan Launch Note

- For local development, direct Gemini image scan can still work from `VITE_GEMINI_API_KEY`.
- For a real launch build, prefer a secure server endpoint and set `VITE_AI_SCAN_ENDPOINT`.
- A simple proxy example is included at `server/ai-scan-proxy.mjs`.
- If your frontend and proxy run on different domains, set `AI_SCAN_ALLOWED_ORIGIN=https://your-app-domain.com`.
- Run it locally in PowerShell with:
  ``$env:GEMINI_API_KEY='your_key'; npm run ai-scan-server``

## Firebase Launch Deploy

- This repo now includes Firebase Hosting + Cloud Functions config for a secure scan endpoint.
- Production builds use `https://calsnap-ai-82070.web.app/api/scan-food` from `.env.production`.
- The secure backend lives in `functions/index.js` and expects the `GEMINI_API_KEY` secret in Firebase Secret Manager.
- Deploy steps:
  `npm run firebase:login`
  `npm run firebase:secret:gemini`
  `npm run firebase:deploy`
- The Hosting config rewrites `/api/scan-food` to the `aiScanFood` function, so the same HTTPS endpoint works for both web and mobile builds.

## Firebase Notes

- Enable Email/Password sign-in in Firebase Authentication.
- Create Firestore Database.
- Recommended food-log path:
  `users/{uid}/foodLogs/{docId}`
