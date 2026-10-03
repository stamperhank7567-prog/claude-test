# Halden & Vale: consulting funnel site

A static, dependency-free landing funnel for an operations and margin consulting firm. Open `index.html` in a browser, or serve the folder with any static host (Netlify, Vercel, GitHub Pages, S3).

## Funnel structure

| Stage | Section | Job |
|---|---|---|
| Attention | Hero + animated EBITDA bridge | State the promise and show the outcome in the buyer's own units |
| Self-identification | "Revenue is up. Margin isn't." | Let the visitor recognise their problem with concrete thresholds |
| Offer | 90-day Margin Sprint + 3× guarantee | One product, a fixed sequence, risk reversal |
| Proof | Stats + testimonials | Evidence, stated in basis points and ROI |
| Conversion | 4-question fit check | Scores the lead, then routes to **booking** (qualified) or **nurture** (not yet) |
| Objections | FAQ | Price, time, confidentiality |
| Last call | Closing CTA + mobile dock | Scarcity and a persistent path back to the fit check |

## Before you launch

These are placeholders. Shipping them as-is would be misleading:

- **Firm name, stats, testimonials, sectors and cities** are invented. Replace every figure in `#results` with verified data, or remove the section. The site prints a disclaimer under the testimonials until you do.
- **The 3× fee-back guarantee and the $45k–$90k fee range** are commitments. Delete them unless the firm will honour them.
- **"Six Sprint slots a quarter / Q1 2027 is filling now"** is a scarcity claim. Keep it only if it's true.

## Wiring it up

- **Lead capture:** set `data-endpoint` on `<form id="quiz">` to a URL that accepts a JSON `POST` (Formspree, a Zapier/Make webhook, HubSpot via a serverless function). With no endpoint, the payload is logged to the console and saved to `localStorage` only.
- **Booking:** the time-slot picker generates a *request*, not a confirmed meeting. If you use Calendly, Cal.com or HubSpot Meetings, replace `#result-yes` with a link to your scheduler, prefilled with name and email.
- **Scoring:** each answer carries `data-score`; the threshold is `QUALIFY_AT` in `assets/app.js` (default 8 of 11). Tune it against real close rates.
- **Analytics:** events (`cta_click`, `quiz_start`, `quiz_answer`, `quiz_complete`, `call_requested`) are pushed to `window.dataLayer`, ready for Google Tag Manager.

## Notes

- Light and dark themes follow the visitor's OS setting.
- All motion respects `prefers-reduced-motion`. Content is visible without JavaScript; animations only enhance it.
