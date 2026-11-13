# Space — 3D portfolio (Vercel + MongoDB)

```
space-site/
├── api/                    ← Vercel serverless functions (Node.js)
│   ├── _lib.js             (MongoDB connection, admin auth, rate limit)
│   ├── content.js          GET site content · PUT (admin) save content
│   ├── contact.js          POST message · GET/DELETE (admin)
│   ├── comments.js         GET/POST project comments · DELETE (admin)
│   ├── chat.js             Space Bot (Gemini / Claude if a key is set, else built-in)
│   └── login.js            admin login → signed token
├── public/                 ← static site (Vercel "Output Directory")
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── data.js         default content + Space Bot knowledge base
│   │   ├── app.js          UI: side-scroll, reveal, comments, contact form, bot
│   │   ├── audio.js        sound engine: real recordings + synthesised fallback for every object
│   │   └── scene.js        3D space scene (Three.js): black hole, wormhole, nebulae…
│   ├── admin/              ← backend panel at /admin
│   │   ├── index.html · admin.css · admin.js
│   ├── audio/              ← drop real recordings here (manifest.json + README.md explain how)
│   ├── assets/black-hole.webp   (logo)
│   └── content.default.json
├── package.json            (mongodb driver)
├── vercel.json             (outputDirectory = public, clean URLs, caching)
├── .env.example
└── .gitignore
```

## Deploy
1. **MongoDB Atlas (free):** create a cluster → *Connect → Drivers* → copy the connection string. In *Network Access* allow `0.0.0.0/0`.
2. **GitHub:** upload this whole folder as a repo (keep the structure above).
3. **Vercel:** *Add New → Project* → import the repo. Framework: **Other**. Leave Build Command empty. (`vercel.json` already sets Output Directory to `public`.)
4. **Environment Variables** (see `.env.example`): `MONGODB_URI`, `ADMIN_PASSWORD`, `ADMIN_SECRET` (+ optional `GEMINI_API_KEY`).
5. Deploy, then open `https://YOUR-SITE.vercel.app/admin` and log in.

Prefer the CLI? From this folder run `npx vercel --prod`.

## Using the admin panel
- **Content:** hero text, about, skills, experience, projects (add/delete), About-me text + **photo upload**, contact info. Save → live in ~20 s.
- **Messages:** contact-form submissions.  **Comments:** moderate project comments.

## Sounds
Tap **🔇 Sound off** (bottom-left) to enable audio (browsers require a tap). Every object has a sound:
- **Real recordings:** put NASA / mission files in `public/audio/` (names in `audio/manifest.json`; see `audio/README.md` for where to download and how to convert). They play when you approach the object and the footer credit fills in automatically.
- **Fallback:** if a file is missing, a synthesised voice plays, so nothing is silent.
- Sound fades with distance, pans to the side the object is on, and a whoosh plays when you cross it.

## Notes
- Without a backend (e.g. opened locally) the contact form and comments run in demo mode (saved in the browser only).
- Space Bot works with no key at all; add `GEMINI_API_KEY` (free tier) for open-ended answers.
- Spam protection: hidden honeypot field + per-IP rate limits.
