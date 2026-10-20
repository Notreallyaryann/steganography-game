# StegGame

A steganography puzzle game plus a private hide-a-message Studio. Next.js (App Router) and TypeScript.
All hiding and extracting runs in the browser. The server only checks mission answers and serves hints.

## What is in here

| Area | Files |
|---|---|
| LSB engine (bit plane, channels, bit order, scan direction, scatter hook) | `lib/stego/lsb.ts` |
| Password-seeded scattering | `lib/stego/scatter.ts` |
| AES-GCM + PBKDF2 (Web Crypto) | `lib/stego/crypto.ts` |
| Studio hide/reveal (no recognisable header, wrong password == nothing found) | `lib/stego/studio.ts`, `payload.ts` |
| WAV support (16-bit PCM) reusing the same engine | `lib/stego/wav.ts` |
| Browser image helpers, quality metric, decode layers | `image.ts`, `metrics.ts`, `layers.ts` |
| Game: scoring, public mission data, local progress | `lib/game/` |
| Server-only answers, hints, validation | `*.server.ts`, `app/api/missions/**` |
| Toolkit UI: bit-plane viewer, manual extractor, layer decoder | `components/` |
| Pages | `app/` (home, `/play`, `/play/[id]`, `/studio`) |
| Mission generator (contains the solutions) | `scripts/build-missions.mjs` |

### Studio (hide and reveal)
Hide text or any file in a PNG/JPG/WebP image or a 16-bit WAV. The output is always PNG or WAV.
The data is encrypted with AES-GCM (key from your password via PBKDF2, 210k iterations) and the
ciphertext is scattered across pixels using a password-derived permutation. Salt and IV are random,
the length is masked, so nothing in the file is recognisable. Without the password a file looks
exactly like an unmodified one: both give "No message found."

### Missions (4 included)
1. First Contact: LSB with default settings
2. Quiet Channel: find the right bit plane and channel
3. Against the Grain: channels, bit order, column scan
4. Dead Drop: extract, then base64, then XOR with a key from the story

The player gets a bit-plane viewer, a manual extractor and a layer decoder. There is no one-click
extract. Answers are salted hashes checked on the server; hints are served by the server and cost points.

