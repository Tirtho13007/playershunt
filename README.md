# PlayersHunt — Animated Launch Landing Page

Premium, responsive coming-soon landing page for PlayersHunt.com with an animated countdown to **January 1, 2027 at 00:00 Bangladesh time (UTC+06:00)**, animated feature cards, mobile navigation, and an optional Supabase-backed early-access form.

## Files

- `index.html` — page markup and feature sections
- `styles.css` — responsive premium dark/football visual design and animations
- `script.js` — countdown, reveal animations, mobile menu, waitlist form submission
- `config.js` — public Supabase client configuration (empty until set)
- `supabase-waitlist.sql` — table and insert-only RLS policy for early access
- `server.js` — tiny Node HTTP server to serve the site on Heroku without dependencies

## Run locally

Requires Node.js 22.x.

```bash
npm start
```

Open `http://localhost:3000`.

## Optional: activate the waitlist form

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase-waitlist.sql` once.
3. In Supabase Project Settings, copy the Project URL and the **publishable key** (or legacy anon key). Never use the `service_role`/secret key in the browser.
4. Set those values in `config.js`:

```js
window.PLAYERSHUNT_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_PUBLISHABLE_KEY"
};
```

The table is intentionally insert-only for public visitors; there is no public SELECT policy for email addresses. Add proper rate limiting/CAPTCHA and review privacy/consent requirements before promoting the form widely. The included honeypot is only a basic spam deterrent.

Until this is configured, the form tells visitors that signups are not connected; it does not pretend that their email was saved.

## Deploy to Heroku

**Important:** deploying this as the root of your existing `playershunt` GitHub repository will replace the current app code with this standalone landing page. Back up the existing repository/app first. If your current application already has a React/Next app, integrate the HTML/CSS/JS into that app instead of replacing its package and server files.

For a standalone deployment:

1. Put these files in the root of a dedicated GitHub repository (or a backed-up launch branch).
2. Commit and push the code. Do not commit passwords or private secrets.
3. In Heroku Dashboard → app → Deploy, connect the repository and select the intended branch.
4. Deploy the branch. Heroku should detect the Node.js app and use `npm start`.
5. Open the app and check the countdown, section links, mobile nav and form.
6. If connecting a custom domain, confirm its DNS and HTTPS settings in Heroku.

This small landing page does not require a Gemini API key. The Supabase URL and public key are only needed to store waitlist signups.

## Notes

- Countdown target is midnight on January 1, 2027 in Bangladesh (UTC+06:00).
- Google Fonts are loaded remotely; system fallback fonts remain available if the font service is blocked.
- Feature art is CSS illustration, so no third-party player photos are required.
