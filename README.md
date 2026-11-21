# Alumni Network — interaction prototype

A small frontend prototype for reviewing the feel of an alumni network. The interface stays in a mobile layout on phones and larger screens.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Next.js.

## Review the main journey

1. Select **Explore the walkthrough**, review the sample profile, and enter the network.
2. Create an intent. **Use the startup feedback example** fills a realistic scenario; all fields remain editable.
3. Publish, discover alumni, search or filter, and open a profile.
4. Send a structured request with context and a commitment.
5. On the pending request, select **Preview acceptance**.
6. Open the conversation. The reply is prefilled and read-only; select **Send message**. The alumnus confirms 6 PM after a short pause, and **Share a call link** appears. That button is a visual placeholder and does not open or create a call.
7. Select **Record the outcome** after the confirmation. Choose whether the conversation happened, whether it helped, and whether the intent is resolved.

The default walkthrough profile is Prathmesh Mehrotra, class of 2026, Software Engineer. Acceptance and the single follow-up reply are scripted; chat is not free-form.

**Not yet** keeps the request open. Completing a conversation can leave the intent active. The app has no real authentication, email delivery, chat backend, calls, AI matching, admin panel, or external integrations. All people, companies and conversations are sample data.

State lives only in React memory. A refresh or fresh visit starts at the welcome screen. Navigation within the app retains progress. Browser Back/Forward works within a walkthrough. **Restart walkthrough** is available from the profile button.

## Deploy to Vercel

Push this folder as a repository, then import it into Vercel.

- Framework preset: **Next.js**
- Root directory: repository root (or `frontend` if deploying the parent workspace)
- Build command: `npm run build`
- Output directory: `out` (the project uses Next.js static export)
- Environment variables: none

No database or server configuration is required.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

## Structure

- `src/components/alumni-app.tsx`: screens and user interactions
- `src/app/globals.css`: mobile layout, visual styling and transitions
- `src/lib/model.ts`: typed intent/request state and lifecycle rules
- `src/lib/people.ts`: sample alumni
- `tests/model.test.ts`: lifecycle and outcome checks

The core journey is intentionally limited to one intent and one request at a time. A new journey clears the previous demo interaction. Reduced-motion preferences, form labels, radio groups, keyboard focus and navigation states are supported.
