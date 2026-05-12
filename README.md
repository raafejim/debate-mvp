# Debate — Omegle for debates

Match with a random person, swipe through debate statements (Yes / No / Skip), and when one of you says "Yes" and the other says "No", you jump into a live video call to argue it out.

## Tech overview

- **Frontend** (`apps/web`): Next.js 14 + Tailwind + Socket.IO client. Deploys to **Vercel**.
- **Backend** (`apps/server`): Node + Express + Socket.IO. Handles matchmaking, card synchronization, and WebRTC signaling. Deploys to **Fly.io**.
- **Video**: Native browser WebRTC, peer-to-peer (free, no media server). Uses Google's public STUN servers.

---

## Run it locally

You need Node.js 20+ installed.

**Terminal 1 — backend:**
```bash
cd apps/server
npm install
npm run dev
```
Backend runs on http://localhost:8080.

**Terminal 2 — frontend:**
```bash
cd apps/web
npm install
cp .env.local.example .env.local
npm run dev
```
Frontend runs on http://localhost:3000.

**Testing the full flow:** Open http://localhost:3000 in two different browsers (or one regular tab + one incognito tab — they need separate Socket.IO connections). Enter different names in each, click "Start debating" in both, and they'll match. Pick opposite answers (one Yes, one No) on any card to trigger the video call.

> The browser will ask for camera/microphone permission when the video call starts. You must allow it.

---

## Deploy to production

You'll deploy two pieces: backend to Fly.io, frontend to Vercel. Total time: ~15 minutes the first time.

### Step 1 — Put the code on GitHub

If you haven't already:

```bash
cd "C:\Claude Code\debate-mvp"
git init
git add .
git commit -m "Initial commit"
```

Then create a new empty repository on https://github.com/new (don't add a README or .gitignore — your local copy already has them), and push:

```bash
git remote add origin https://github.com/YOUR-USERNAME/debate-mvp.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy the backend to Fly.io

1. **Create a Fly.io account** at https://fly.io/app/sign-up. You'll need to add a credit card, but new accounts get a $5/month credit which is more than enough for this app (a small always-on machine costs about $2/month).

2. **Install the Fly CLI**. On Windows (PowerShell as admin):
   ```powershell
   pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```
   Then restart your terminal.

3. **Sign in:**
   ```bash
   fly auth login
   ```

4. **Launch the app.** From the project root:
   ```bash
   cd apps/server
   fly launch --no-deploy
   ```
   When prompted:
   - **App name**: pick something globally unique, like `debate-mvp-yourname`. Write this down — you'll need it.
   - **Region**: pick the one closest to you (e.g., `iad` for US East, `lhr` for London).
   - **Postgres/Redis**: choose **No** to both.
   - **Copy existing fly.toml?**: choose **Yes** if asked.

5. **Deploy:**
   ```bash
   fly deploy
   ```
   Wait ~2 minutes. When done, your backend is live at `https://<your-app-name>.fly.dev`. Test it by opening `https://<your-app-name>.fly.dev/health` in a browser — you should see `{"ok":true,"waiting":0,"sessions":0}`.

### Step 3 — Deploy the frontend to Vercel

1. **Create a Vercel account** at https://vercel.com/signup. Sign in with your GitHub account — it makes the next step easier.

2. **Import the project.** Click "Add New… → Project", select your `debate-mvp` repo. Vercel will detect it's a Next.js project.

3. **Configure the root directory:**
   - Click **Edit** next to "Root Directory"
   - Set it to `apps/web`
   - Leave Framework Preset as **Next.js** (auto-detected)

4. **Add the environment variable:**
   - Expand **Environment Variables**
   - Add: `NEXT_PUBLIC_SERVER_URL` = `https://<your-fly-app-name>.fly.dev` (use the URL from Step 2.5)

5. Click **Deploy**. Wait ~2 minutes. Vercel will give you a URL like `https://debate-mvp-abc123.vercel.app`. **Write this down.**

### Step 4 — Lock down CORS on the backend

Right now your backend accepts connections from anywhere. Tighten it to only accept your Vercel URL:

```bash
cd apps/server
fly secrets set CORS_ORIGIN=https://<your-vercel-url>.vercel.app
```

This automatically restarts the backend with the new setting.

> If you later add a custom domain in Vercel, update this secret with both:
> `fly secrets set CORS_ORIGIN=https://yourdomain.com,https://<your-vercel-url>.vercel.app`

### Step 5 — Test it

Open your Vercel URL in two different browsers. Pair up. Disagree on a card. You should land in a video call.

---

## Troubleshooting

**The video doesn't connect (both sides show "Connecting…")**
~10–15% of users behind strict corporate or mobile carrier NATs can't make a direct peer-to-peer connection. For an MVP, retry on a different network first. If real users hit this often, add a TURN server (see below).

**Adding TURN later (when you need it):**
1. Sign up at https://www.metered.ca/tools/openrelay/ — free tier covers 50 GB/month.
2. Get your TURN credentials.
3. Edit `apps/web/src/lib/webrtc.ts` and add to the `ICE_SERVERS` array:
   ```ts
   { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
   ```
4. Redeploy the frontend (push to GitHub; Vercel auto-deploys).

**"Camera access denied"**
The user has to allow camera/microphone permission in their browser. In production, this only works over HTTPS (Vercel and Fly.io both serve HTTPS by default, so you're fine).

**Backend keeps restarting / cold-starting**
Make sure `auto_stop_machines = false` and `min_machines_running = 1` are set in `apps/server/fly.toml` (they are by default).

**Two browsers on the same machine don't pair**
Socket.IO sometimes coalesces connections in dev mode. Use an incognito window or a different browser for the second user.

---

## What's in this repo

```
apps/
├── server/                 Socket.IO backend
│   ├── src/
│   │   ├── index.ts        HTTP + Socket.IO entry; event handlers
│   │   ├── matchmaking.ts  Queue, sessions, answer logic
│   │   ├── cards.ts        50 debate statements + shuffle
│   │   └── types.ts        Shared types
│   ├── Dockerfile          For Fly.io build
│   └── fly.toml            Fly.io app config
│
└── web/                    Next.js frontend
    └── src/
        ├── app/
        │   └── page.tsx    State machine: home → queue → cards → video → ended
        ├── components/     One file per phase view
        └── lib/
            ├── types.ts    Mirrors server types
            └── webrtc.ts   WebRTC peer connection wrapper
```

## How matching works

1. User clicks "Start debating" → enters server-side queue (single waiting slot).
2. When a second user joins, both are paired into a `Session`. A reshuffled 50-card deck is created.
3. Both users see the same card. Server collects answers and only advances when both have answered.
4. Outcome:
   - Both Yes, both No, or any Skip → next card
   - One Yes + one No → **debate match**, both transition to video
5. Video uses WebRTC P2P. The user who was waiting longer is designated the WebRTC "initiator" and sends the SDP offer.
6. Leaving / disconnecting notifies the other side and ends the session cleanly.
