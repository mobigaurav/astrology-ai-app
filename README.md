## Astrology AI App

Unified Expo/React Native app that bundles tarot, palm, and face reading into a single experience, with room for an AI chat assistant.

### Features
- **Tarot**: Daily, Quick, and Celtic spreads with flip animation and modal meanings (upright/reversed) powered by `src/data/tarot_major_arcana_full.json` and card art in `src/assets/tarot`.
- **Palm reading**: Tappable palm zones overlaid on an outline (`src/data/palm_reading_zones.json`) with contextual descriptions.
- **Face reading**: Clickable facial zones from `src/data/face_reading_zones_for_updated_image.json` mapped on `face-outline-updated.png`.
- **Navigation**: Bottom tabs via React Navigation; Redux slices set up for user state and readings.
- **Assets**: Custom Poppins/Montserrat fonts; tarot, palm, and face imagery under `src/assets`.

### Tech stack
- Expo SDK 53, React Native 0.79, React 19
- React Navigation bottom tabs
- Redux Toolkit + React Redux
- NativeWind/Tailwind for styling hooks
- TypeScript

### Getting started
1) Install deps (Expo-managed): `npm install`
2) Run in Expo:
   - `npm run start` (launch Expo CLI)
   - `npm run android` / `npm run ios` / `npm run web` as needed
3) Fonts are loaded in `App.tsx`; ensure the `.ttf` files remain in `src/assets/fonts`.

### Project structure
- `App.tsx` — loads fonts, Redux provider, and `TabNavigator`
- `src/navigation/TabNavigator.tsx` — bottom tab setup
- `src/screens/` — `Home`, `Tarot`, `PalmReading`, `FaceReading`, `AIChat` (placeholder)
- `src/components/TarotCard.tsx` — tarot card tile rendering
- `src/store/` — `userSlice` (auth/premium), `readingSlice` (tarot selections, image URIs)
- `src/data/` — tarot meanings, palm/face zone definitions, expanded datasets
- `src/assets/` — images and fonts referenced by the app

### Notes & gaps
- AI chat screen is currently a placeholder.
- `src/services` and `src/utils` are empty; hooks/services can be added there for API calls (e.g., AI readings).
- Keep JSON/image filenames in sync with `src/assets/tarotImageMap.ts`.
