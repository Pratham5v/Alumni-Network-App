# Alumni Network

A frontend prototype for an alumni network built around current needs and offers. The guided walkthrough follows one request from discovery to outcome, then shows what it feels like to receive a request for help.

[Open the live prototype](https://alumni-network-app-ivory.vercel.app/)

## Run locally

Use Node.js 20.9 or newer and run these commands from the repository root. If you opened the parent Alumni Network workspace, enter its `frontend` folder first.

```sh
npm ci
npm run dev
```

Open [127.0.0.1:3000](http://127.0.0.1:3000/) or use the address printed by Next.js. After pulling a dependency change, install the updated dependencies and restart an already-running dev server so it picks up the new packages.

## Try the walkthrough

1. Select **Explore the walkthrough**. Review the editable sample details for Prathmesh Mehrotra, class of 2026, and continue through simulated verification.
2. Create and publish the prefilled startup-feedback intent. Open **Discover alumni** and find Aarav Shah’s matched card. His name and portrait open his full profile.
3. Choose **Request help** on the matched card to review the prefilled message and time commitment. Send it to see Aarav’s simulated acceptance, then select **Open conversation**.
4. Send the fixed walkthrough reply. After Aarav confirms the time, share the sample call link. **Add to Google Calendar** opens a prefilled event for review and manual saving.
5. Select **Record the outcome**. **Not yet** keeps the request open. If the conversation happened, you can finish the request and choose whether the intent stays active.
6. Return Home to find Riya’s incoming AI interview-preparation request. Accept it to send the prefilled reply and receive a sample call link, decline it with an editable response, or suggest Kabir Mehta as an alternative.

Confirmations appear inline alongside the relevant step. Desktop uses a shared app layout and sidebar. Phones use bottom tabs, and an alumni profile opens as a full-screen detail view.

## Demo behavior

- Onboarding and verification are simulated. Profiles, contact previews, requests, chat messages, and call links are sample data. The highlighted discovery match is scripted.
- State is held in React memory. Navigation retains progress within the session. A refresh or **Your profile → Restart walkthrough** starts over. **Try another intent** starts a new outgoing journey while keeping your profile and any existing incoming request.
- The outgoing walkthrough supports one intent and request at a time. Both chats use scripted replies. Riya’s alternative flow shows the recommendation sent to her and ends there.
- Calendar event links use the agreed slot, participants, context, and sample call link. The date is set at confirmation using tomorrow at 6 PM in Asia/Kolkata. Saving the event happens in Google Calendar. [Google Calendar event link format](https://developers.google.com/workspace/calendar/api/concepts/inviting-attendees-to-events#provide_a_link_for_users_to_add_the_event)

## Checks and deployment

```sh
npm test
npm run typecheck
npm run build
```

The Next.js build exports a static site to `out/`. The GitHub repository is deployed on Vercel, with Web Analytics and Speed Insights wired into the root layout. The prototype uses client-side state and requires no app environment variables or database.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/components/alumni-app.tsx` | Screens, navigation, and guided interactions |
| `src/app/globals.css` | Mobile and desktop layouts, shared styles, and transitions |
| `src/app/layout.tsx` | Page metadata and Vercel integrations |
| `src/lib/model.ts` | Sample scenarios, reducer, and lifecycle rules |
| `src/lib/people.ts` and `public/avatars/` | Demo profiles and illustrated avatars |
| `src/lib/calendar.ts` | Meeting times and prefilled calendar links |
| `tests/` | Reducer, request, outcome, and calendar checks |
