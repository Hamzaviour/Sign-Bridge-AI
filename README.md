# SignBridge

Real-time, two-way translation between sign language and speech, with a crew of friendly signing avatars.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Optional: copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` and `LLM_MODEL` (an Anthropic model ID) so an LLM turns sign glosses into natural English. Without a key the app falls back to simple offline rules.

Use Chrome or Edge for speech recognition (Web Speech API). Camera and speech stay in the browser; only gloss tokens are sent to `/api/gloss`.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Landing page with the signing crew (Pip, Kai, Nova, Bolt, Mochi) |
| `/call` | Split-screen call: fingerspell to the camera on the left, speak or type on the right and the avatar signs it back |
| `/practice` | The avatar demonstrates a letter, you copy it; XP, levels, streaks, confetti |
| `/learn` | Phrasebook of 20 everyday signs plus the full A–Z alphabet |
| `/train` | Record your own samples to train the on-device k-NN classifier; export/import JSON |

## How it works

- **Hand tracking**: MediaPipe Hand Landmarker (`src/lib/handTracker.ts`), drawn as a rainbow skeleton whose glow scales with confidence (`src/components/HandCam.tsx`).
- **Recognition** (`src/lib/classifier.ts`): geometric rules for A B C D F I L O S U V W Y and open-hand space, plus a k-nearest-neighbour model over wrist-centred, rotation- and scale-normalised landmarks that you train on `/train`. A letter is committed once it is held steadily (~0.65 s).
- **Gloss to English**: `src/app/api/gloss/route.ts` sends the gloss tokens to an LLM (Anthropic API); `src/lib/glossFallback.ts` is the offline path.
- **Avatar**: a hand-drawn SVG rig (`src/components/Avatar.tsx`) with two-bone IK arms and per-finger curl/spread handshapes. Signs are keyframes in `src/lib/signs.ts`; `src/lib/useSignPlayer.ts` interpolates them, and `textToPlaylist` maps English to signs or fingerspelling.
- **Accessibility**: large resizable captions, 44–52 px targets, visible focus, `aria-live` regions, and `prefers-reduced-motion` support (animations stop and the avatar snaps between poses).

Handshapes and phrase signs are simplified approximations for demos and learning. They are not a substitute for a qualified interpreter.
