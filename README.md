# Halden & Vale: consulting funnel site

A static, dependency-free landing funnel for an operations and margin consulting firm. Open `index.html` in a browser, or serve the folder with any static host (Netlify, Vercel, GitHub Pages, S3).

## Funnel structure

| Stage | Section | Job |
|---|---|---|
| Attention | Hero + animated EBITDA bridge | State the promise and show the outcome in the buyer's own units |
| Self-identification | "Revenue is up. Margin isn't." | Let the visitor recognise their problem with concrete thresholds |
| Offer | 90-day Margin Sprint + 3× guarantee | One product, a fixed sequence, risk reversal |
| Proof | Stats + testimonials | Evidence, stated in basis points and ROI |
| Conversion | "Apply for a free discovery call" | One button to the application form (Google Form, opens in a new tab) |
| Objections | FAQ | Price, time, confidentiality |
| Last call | Closing CTA + mobile dock | Scarcity and a persistent path back to the application |

## Before you launch

These are placeholders. Shipping them as-is would be misleading:

- **Firm name, stats, testimonials, sectors and cities** are invented. Replace every figure in `#results` with verified data, or remove the section. The site prints a disclaimer under the testimonials until you do.
- **The 3× fee-back guarantee and the $45k–$90k fee range** are commitments. Delete them unless the firm will honour them.
- **"Six Sprint slots a quarter / Q1 2027 is filling now"** is a scarcity claim. Keep it only if it's true.

## Wiring it up

- **Application form:** the main button in `#apply` links to `https://forms.gle/vpxuxUm5aRSqbAAn8`. Every other call to action (nav, hero, closing banner, mobile dock) scrolls to that section. To change the form, edit the `href` in `index.html`.
- **Analytics:** click events (`cta_click` with an `id` such as `hero_cta` or `apply_form`) are pushed to `window.dataLayer`, ready for Google Tag Manager. The site can't see form completions; count those in Google Forms responses.

## Notes

- Light and dark themes follow the visitor's OS setting.
- All motion respects `prefers-reduced-motion`. Content is visible without JavaScript; animations only enhance it.
