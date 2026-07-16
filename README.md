# Syncora

Current foundation of the voice-translation meeting platform: host accounts, secure server-side sessions, owned meetings, invitation email delivery, protected host entry, and passwordless guest pre-join links.

## Stack

- React, TypeScript, and Vite
- Fastify and Node.js
- PostgreSQL
- ZeptoMail REST API, with local console simulation

The base LiveKit meeting room is implemented. Translation remains a later milestone.

## Host and guest access

- Hosts register with their name, email, and password, then sign in to create and manage meetings.
- Passwords are hashed with scrypt and never stored in plain text.
- Browser sessions use opaque, HTTP-only, SameSite cookies. Only a SHA-256 hash of the session token is stored.
- Every new meeting records its creator and creates a `host` membership.
- Host pages require the authenticated owner. A different signed-in host receives no meeting details.
- Guests continue to use `/join/:joinCode` without creating an account.
- Existing meetings created before migration `002` remain valid guest links but have no automatic host owner.

This local credential implementation sits behind an application auth boundary. Amazon Cognito can replace credential verification later while preserving users, meeting ownership, roles, and frontend routes.

## Local setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL: `docker compose up -d postgres`.
3. Install dependencies: `pnpm install`.
4. Apply the schema: `pnpm --filter @voice/api db:migrate`.
5. Start the app: `pnpm dev`.
6. Open `http://localhost:5173`.

The default `EMAIL_MODE=console` prints invitation links in the API terminal and marks them as simulated.

For a disposable preview without PostgreSQL, set `DATABASE_MODE=memory`. This mode loses all meetings when the API restarts and is rejected when `NODE_ENV=production`.

## LAN HTTPS testing

Camera and microphone access works on HTTP only for the browser's special `localhost` secure context. Other devices opening a private IP such as `192.168.0.195` need HTTPS with a certificate they trust.

On Windows, generate a private development CA and a certificate containing the PC's current LAN IP:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-lan-https.ps1 -LanIp 192.168.0.195
```

The script creates `certificates/voicemeet-lan-root-ca.crt` without changing any device trust settings. Install only that public `.crt` file in the trusted root certificate store on this PC and each phone, tablet, or computer used for testing. Confirm that its common name is `VoiceMeet LAN Development Root CA`. Never copy `voicemeet-lan-root-ca.key` or `voicemeet-lan-dev.pfx` to another device; possession of the CA private key allows creation of certificates trusted by devices where this CA is installed.

Set the public link and allowed origins in `.env`, restart the app, and use the LAN command:

```env
APP_BASE_URL=https://192.168.0.195:5173
CORS_ORIGIN=http://localhost:5173,https://192.168.0.195:5173
```

```powershell
pnpm dev:lan
```

Open `https://192.168.0.195:5173` from devices on the same network. If the PC's DHCP address changes, rerun the setup script with the new IP and update `.env`. The CA can be reused, but a new server certificate is required for the new IP.

## ZeptoMail

After verifying a sender domain/address in ZeptoMail, set:

```env
EMAIL_MODE=zeptomail
ZEPTOMAIL_TOKEN=your_agent_send_mail_token
ZEPTOMAIL_FROM_ADDRESS=no-reply@your-verified-domain.com
ZEPTOMAIL_FROM_NAME=VoiceMeet
```

The send token remains in the API process and is never returned to the browser. The adapter sends one transactional message per recipient so delivery can be tracked individually.

The API host must match the ZeptoMail account's data center. This project is configured for the India data center with `https://api.zeptomail.in/v1.1/email`; accounts in other data centers should use the endpoint shown in their Agent's SMTP/API setup page.

## LiveKit meeting room

The LAN development stack self-hosts LiveKit Server through Docker. Its signaling endpoint uses the same private development certificate authority as the frontend, and media is exposed over ICE/TCP and ICE/UDP:

```env
LIVEKIT_URL=wss://192.168.0.195:7880
LIVEKIT_NODE_IP=192.168.0.195
LIVEKIT_API_KEY=your-local-api-key
LIVEKIT_API_SECRET=your-random-local-api-secret
```

After creating the LAN certificates, start PostgreSQL, LiveKit, and its TLS proxy:

```powershell
docker compose up -d postgres livekit livekit-proxy
pnpm dev:lan
```

The Docker stack exposes signaling on `7880/tcp`, ICE fallback on `7881/tcp`, and WebRTC media on `7882/udp`. Allow these three ports on the Windows private-network firewall if another LAN device cannot connect. Restart the API after changing `.env`. The secret is read only by Docker and the Node.js backend and must never be exposed through Vite variables or committed to source control.

This single-node configuration is intended for development and LAN testing. A public production deployment still needs a public domain, publicly trusted TLS, TURN, monitoring, backups, and usually Redis. LiveKit Cloud credentials can still be used by replacing the three `LIVEKIT_*` connection values.

The application issues short-lived, room-scoped tokens:

- Host sessions require the authenticated meeting owner and receive `roomAdmin`, publish, subscribe, data, camera, microphone, and screen-share grants.
- Guests with the private join code first create a waiting-room request. The request credential is returned only to that browser, while only its SHA-256 hash is stored.
- Hosts poll the protected waiting-room list and can admit or deny each pending guest. A guest token is issued only when the meeting, admission ID, private lobby credential, and admitted status all match.
- Admitted guest sessions receive publish/subscribe media grants without `roomAdmin`.
- LiveKit creates the media room lazily when the first participant connects.

The React room includes camera and microphone preview, device selection, participant video layout, remote audio, mute/camera controls, screen sharing, chat, leave, and rejoin. When credentials are absent, the pre-join page remains available and the session endpoint returns an actionable setup message.

Camera publishing uses a quality-first profile for rooms with up to three active cameras. It requests the camera's best available resolution up to 1080p at 30 fps, with 720p and 360p simulcast fallbacks. Remote cameras request their highest available layer instead of being downscaled based on tile size, while dynacast avoids encoding layers that nobody requests. Actual quality still depends on the publishing device, Wi-Fi signal, CPU, packet loss, and synchronized system clocks.

## Commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm test
```

## Implemented API

- `POST /api/meetings` creates a meeting and sends its invitations.
- `GET /api/meetings` lists meetings owned by the signed-in host.
- `DELETE /api/meetings/:id` permanently deletes a meeting owned by the signed-in host.
- `GET /api/meetings/:id/host` verifies protected host access.
- `POST /api/meetings/:id/host-session` creates a protected LiveKit host token.
- `GET /api/meetings/:id/admissions` lists pending waiting-room guests for the host.
- `PATCH /api/meetings/:id/admissions/:admissionId` admits or denies a pending guest.
- `GET /api/join/:joinCode` returns the public pre-join meeting details.
- `POST /api/join/:joinCode/admissions` creates a private guest waiting-room request.
- `GET /api/join/:joinCode/admissions/:admissionId` lets that guest check its own status.
- `POST /api/join/:joinCode/session` creates a non-admin LiveKit guest token only after admission.
- `GET /api/health` provides a basic service health response.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me` manage host sessions.
