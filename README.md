# PlayersHunt — Launch Landing Page

A responsive, dark premium launch page for PlayersHunt, a global football talent discovery concept. The page is set to launch on **January 1, 2027 (Dhaka time)** and is structured for simple deployment to Heroku from GitHub.

## Included

- Responsive desktop and mobile navigation
- Live launch countdown to 1 January 2027
- Find Players, Scouting & Talent Discovery, Trials & circulars, Player Highlights
- Global football reach section for Europe, the Americas, Africa and Asia
- Searchable/filterable sample player cards
- Wishlist drawer with browser-local persistence
- Profile-preview modal
- Email waitlist form with client-side validation and browser-local persistence
- Intersection-based reveal animations and reduced-motion support
- Lightweight Node.js server; no build step and no runtime dependency installs needed

## Run locally

Requires Node.js 20 or newer.

```bash
npm start
```

Then open `http://localhost:3000`.

## Push to GitHub

Create an empty GitHub repository, then run these commands from this project folder:

```bash
git init
git add .
git commit -m "Build PlayersHunt launch landing page"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your actual GitHub repository URL.

## Deploy on Heroku

1. Create or open a Heroku app.
2. Connect the GitHub repository in **Deploy**.
3. Select the `main` branch and deploy.
4. Open the app URL and test it on both desktop and mobile.

The included `Procfile` runs `node server.js`. The server reads Heroku's `PORT` environment variable automatically.

## Before launch — important production notes

- **Waitlist:** the current form is a front-end preview and saves emails only in the visitor's browser via `localStorage`. It does **not** send emails to Vantargo or a mailing list. Connect a real form endpoint or an email provider before collecting launch registrations.
- **Wishlist:** saved profiles are stored locally in the visitor's browser, not in a user account or shared database.
- **Sample data:** the player names and profile stats are fictional sample content used to demonstrate the interface, not verified real footballer data.
- **Images and fonts:** the bespoke hero image is stored locally in `assets/hero-player.webp`; feature/player images and Google Fonts are loaded from external URLs and therefore require internet access in the visitor's browser. Replace these with licensed production assets before a commercial launch if required.
- **Brand/legal:** “Vantargo” appears in the footer as requested. Check trademark, privacy and applicable data-protection requirements before launch.

## Project files

- `index.html` — page structure and content
- `styles.css` — visual design, responsive layout and animations
- `script.js` — countdown, mobile menu, search/filter, wishlist, modal and waitlist preview
- `server.js` — dependency-free Node.js static server for Heroku
- `Procfile` — Heroku web process
