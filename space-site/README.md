# Space — 3D Portfolio

A responsive portfolio and interactive 3D space experience for Subhadip Dey. The site is a static frontend with optional Vercel serverless API functions backed by MongoDB. It includes a content admin panel, contact form, project comments, Space Bot, and audio-enabled 3D scene.

## Project structure

```text
space-site/
├── api/                         # Vercel serverless functions
│   ├── _lib.js                  # MongoDB connection, admin auth, rate limits
│   ├── content.js               # Public content GET; authenticated admin PUT
│   ├── contact.js               # Contact submissions; authenticated message admin
│   ├── comments.js              # Project comment GET/POST; authenticated deletion
│   ├── chat.js                  # Space Bot; optional Gemini/Anthropic providers
│   └── login.js                 # Admin login and signed token
├── public/                      # Vercel output directory
│   ├── index.html               # Portfolio homepage and 3D scene host
│   ├── contact.html             # Contact details page
│   ├── privacy-policy.html      # Privacy notice
│   ├── terms-and-conditions.html# Website terms
│   ├── css/                     # Shared and legal-page stylesheets
│   ├── js/
│   │   ├── app.js               # Homepage UI, content rendering, forms, comments, chat
│   │   ├── scene.js             # Three.js space scene
│   │   ├── audio.js             # Optional Web Audio engine and real-audio playback
│   │   └── data.js              # Default portfolio content and Space Bot knowledge
│   ├── admin/                   # Admin interface and scripts
│   ├── assets/black-hole.webp   # Space brand mark
│   ├── audio/manifest.json      # Optional audio file map
│   └── content.default.json    # Static content fallback
├── package.json                 # MongoDB driver dependency
├── vercel.json                  # Static output, clean URLs, response headers
├── .env.example                 # Environment variable template
└── .gitignore
```

## Requirements

- Node.js 18 or newer
- A MongoDB database for persistent content, contact messages and comments
- A Vercel account for serverless API deployment (or another compatible host that supports these API functions)

## Local development

1. Open a terminal in `space-site/`.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and set your database and admin secrets. Do not commit `.env` or real credentials.
4. Run the project using Vercel's local development server:

   ```bash
   npx vercel dev
   ```

5. Open the local URL printed by Vercel. The admin panel is at `/admin`.

The static pages can be previewed without a database, but API-backed features will use their browser demo behavior or remain unavailable depending on the feature.

## Deploy to Vercel

1. Import the repository into Vercel and set the project **Root Directory** to `space-site`.
2. Use the **Other** framework preset. `vercel.json` configures the `public` output directory and leaves the build command empty.
3. Add the environment variables listed below in **Project Settings → Environment Variables**.
4. Deploy and visit `/admin` to sign in and manage site content.

The Vercel CLI can also deploy from this directory:

```bash
npx vercel
npx vercel --prod
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | For persistent API features | MongoDB connection string. |
| `MONGODB_DB` | Optional | Database name; defaults to `space` in the project configuration. |
| `ADMIN_PASSWORD` | Yes for admin login | Strong admin login password. |
| `ADMIN_SECRET` | Recommended | Long, random signing secret for admin tokens and privacy-preserving analytics IDs. |
| `GEMINI_API_KEY` | Optional | Enables Gemini-backed Space Bot responses. |
| `ANTHROPIC_API_KEY` | Optional | Optional Anthropic provider configuration, if enabled in the chat function. |

Use a unique, long password and random secret. Keep credentials in the hosting provider's environment settings; never put real secrets in frontend files or commit them to Git.

## Admin panel and APIs

Open `/admin` after deployment and sign in with `ADMIN_PASSWORD`.

- **Content:** edit portfolio text, skills, experience, projects, About section and contact information.
- **Messages:** review contact-form submissions.
- **Comments:** review and moderate project comments.
- Changes saved through the panel are stored in MongoDB when the backend is configured.

The API routes are in `api/`. Admin-only actions require a valid signed token. The contact endpoint includes a honeypot and rate limiting. The public homepage may use local browser storage for demo messages, comments and image choices when APIs are unavailable; those local demo submissions are not delivered to the site owner.

## 3D scene and sound

The homepage's Three.js scene is implemented in `public/js/scene.js`. Its scene includes stars, nebulae, planets and other astronomical objects.

Sound is opt-in because browsers require a user gesture before audio playback. `public/js/audio.js` provides synthesized sounds and can play optional audio files mapped by `public/audio/manifest.json` when the files are present. Missing files fall back to generated audio. Do not describe synthesized audio as an actual recording of sound in space.

To add audio, place appropriately licensed files in `public/audio/` and update `manifest.json`. See `public/audio/README.md` for file preparation guidance. Verify each recording's source, licence and credit requirements before publishing it.

## Static legal and contact pages

The following clean URLs are configured through Vercel's `cleanUrls` setting:

- `/contact`
- `/privacy-policy`
- `/terms-and-conditions`

These pages link back to the homepage and to one another. Keep the contact email and any related disclosures consistent across the contact page, privacy notice, terms, homepage content and admin-managed content.

## Troubleshooting

- **Styles or content look old after a change:** confirm that Vercel deployed the latest commit, then hard-refresh the browser or open the page in a private window.
- **API errors:** confirm `MONGODB_URI`, database network access and Vercel function logs.
- **Cannot log into `/admin`:** verify `ADMIN_PASSWORD` and `ADMIN_SECRET` are set for the active deployment environment.
- **No sound:** tap the site's sound control; check browser audio permissions and that any optional audio paths in the manifest exist.
- **No API configuration:** the static portfolio still renders, but data persistence and server-backed features require the API and database setup.

## Privacy and legal notes

The privacy notice and terms are general website information, not legal advice. Review them against the actual hosting, analytics, AI providers, storage practices and applicable jurisdiction before relying on them. Update the published contact email and notices whenever the site's services or data practices change.
