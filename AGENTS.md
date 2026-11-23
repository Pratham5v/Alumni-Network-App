<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository context

- This repository is the Next.js frontend under the parent Alumni Network workspace. Run project commands from this folder.
- The app is a static export with client-side demo state. `src/components/alumni-app.tsx` owns screen composition and navigation. `src/lib/model.ts` owns lifecycle rules. Keep state transitions in the reducer when changing a demo flow.
- `src/lib/people.ts` and `public/avatars/` hold sample profiles and portraits. `src/lib/calendar.ts` handles the agreed meeting time and prefilled Google Calendar URL. The root layout loads Vercel Web Analytics and Speed Insights.

## Interaction and layout

- The demo stays in Prathmesh’s perspective for the outgoing request to Aarav and the incoming request from Riya. The current conversations have one fixed, read-only reply per path. Preserve those behaviors unless the task explicitly changes them.
- Render confirmations in the screen’s normal flow. Use the existing inline confirmation and live region so the next action remains tappable.
- Keep desktop alumni profiles inside the shared app layout. On phones, preserve the full-screen profile and its pinned action. Use the existing breakpoints, controls, and approved portraits when extending a screen.
- Review exact wording and interaction changes against the requested screen before editing shared components.

## Local checks

- Use `npm run dev` for the local preview and `npm test`, `npm run typecheck`, and `npm run build` as appropriate for the change. Browser-check the affected walkthrough at phone and desktop sizes for layout or interaction changes.
- After pulling a dependency change, install the updated dependencies and restart a stale development server if it still reports a missing module. Next.js generates `next-env.d.ts`; review any dev-mode rewrite separately from the feature diff.
