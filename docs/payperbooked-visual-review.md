# PayPerBooked visual review candidate

October 30, 2026. Owner review requested; **not premium-approved or launch-ready**.

## Relationship and release controls

This branch, `codex/ppb-premium-review`, starts at reliability PR #44 head `1afb9dd9bd9fd7b4b624dfbdbc851b31fc5019a5`. It targets #44's branch so the visual work can be reviewed separately. #44 depends on branding PR #42. Neither parent branch is modified. NFM is a separate site.

`vercel.json` retains the #44 branch deployment exclusion and adds `codex/ppb-premium-review: false` under `git.deploymentEnabled`. No Vercel administration, credentials, permissions, merge, deployment or auto-merge is authorized. A later merge to another branch can deploy and requires exact-commit approval.

## Design decisions

- Plain PayPerBooked product name in the header/footer and titles; remove the N-shaped favicon and decorative P badge. No new official logo is fabricated. Existing OG asset retained. No legal-parent identity is invented; approved legal attribution remains an owner decision.
- Short audience-specific headline and complete static offer: $0 setup, $49/month + $29 per confirmed booking, $499 cap for all trades. Explicit zero-booking base fee. An appointment is not represented as completed work.
- Custom HTML/SVG workflow, permanently labeled illustrative and synthetic, showing call, business rules, calendar appointment and booking fee. No real customer, testimonial, live-product simulation or earnings claim.
- Dark ink, orange and warm paper palette with muted green for workflow/billing. Intentional type scale, compact mobile pricing, clear keyboard focus and no fixed conversion bar covering content. Animation removed from the home content; reduced-motion rules remain.
- Sequence: value/full price, workflow, inclusions/exclusions, calculator, service area, fair comparison, FAQs, inquiry. Existing three routes retained. Qualification copy uses request/inquiry rather than reservation claims.
- Service capability statements remain subject to operational verification before release. Existing commercial rules are not newly approved by this visual draft.

## Current official comparison sources

Checked October 30, 2026:

- [Narlo](https://narlo.ai/pricing): $40 per booked job on missed-call textback. Voice adds $49/month, including 250 minutes, then $0.40/minute; booking fees remain. Not portrayed as identical to the PPB voice offer.
- [Goodcall](https://www.goodcall.com/pricing): Starter $79/month, 100 unique customers, then $0.79 per extra customer. Different billing unit from appointments.
- [Rosie](https://heyrosie.com/pricing): direct calendar booking starts at Scale, $149/month with 1,000 minutes; the $49 Professional plan sends appointment links.

The earlier Rivvet/typical-service totals and implied same-volume comparison are removed. No cheapest/best assertion. Sources are linked beside the dated comparison; customers are told features, included usage and definitions differ.

## Verification

- `npm test`: **27 passing local tests**, plus 12-file copy scan. No remote CI pass is claimed.
- `git diff --check`: clean.
- Existing API and inquiry controller are byte-for-byte unchanged from #44. Validation, rejection, timeout, unknown outcome and duplicate/retry tests still pass.
- Calculator tests: zero bookings $49; one $78; 15 $484; 16 and 80 $499, across all six trade selectors. Slider and keyboard form submit exercised. Browser independently checked zero and 16.
- Internal route/fragment links resolve. Canonicals, Organization identity and available structured price specifications checked. Host routing, PPB robots/sitemap and approved price values remain intact. This is technical preparation, not proof of indexing, ranking or AI citation.
- Rendered home/pricing/booking at **320, 390, 768 and 1440 CSS pixels**, 900px height. No horizontal document overflow and no visible fixed overlay in any of 12 observations. Full price grid ended between 455px and 683px from the viewport top. [Measured matrix](visual-review/responsive-matrix.json).
- Keyboard FAQ expansion showed an explicit focus outline. Keyboard submission exercised the local mocked failure and deliberate retry. Answers remained available; retry succeeded against the loopback mock. No mail, SMS or charge occurred.
- Core color-pair contrast sampled: normal text pairs >=4.5:1 after darkening small workflow labels. Not a complete automated accessibility certification.
- **Native 200% browser zoom remains unverified:** available browser keyboard commands did not change zoom or device pixel ratio. A local CSS `zoom:2` proxy exposed a cramped form; the layout was corrected to reflow by available container width. The corrected error/retry controls were readable and usable. A 720px viewport also passed as the reflow equivalent of 1440px at 200%. These proxies do not replace a native-browser zoom check.
- NFM protection is precisely an unchanged-content check of **11 named root assets against origin/main**, plus routing tests. It is not complete runtime regression coverage.

## Transferable review images

These are local rendered screenshots of the draft, not production:

- [Desktop home, 1440px](visual-review/home-1440.jpg)
- [Workflow illustration, 1440px](visual-review/workflow-1440.jpg)
- [Tablet home, 768px](visual-review/home-768.jpg)
- [Mobile home, 390px](visual-review/home-390.jpg)
- [Narrow home, 320px](visual-review/home-320.jpg)
- [Mobile pricing](visual-review/pricing-390.jpg)
- [Mobile inquiry page](visual-review/booking-390.jpg)

## Remaining decisions and launch gates

### Mobile evidence follow-up

Fresh local sessions verified home and booking at 320px and 390px with `scrollY=0`. In all four observations, the wordmark bounds were top 18px and bottom 41px; clipping was not reproduced. The four header captures were replaced or added. A restored accepted inquiry can focus its status panel and scroll the page, so top-of-page captures used a fresh session. The cause of the earlier image crop is not established. [Measurements](visual-review/mobile-top-check.json).

The follow-up found a shared mobile CSS rule hiding the home workflow link. A PayPerBooked-only override in `payperbooked/base.css` restores that link. No shared NFM stylesheet or inquiry behavior changed.

Additional local evidence at a 390px browser viewport (375px content width excluding the scrollbar):

- [Complete mobile workflow](visual-review/workflow-mobile-390.jpg)
- [Initial mobile form](visual-review/form-mobile-390.jpg)
- [Mock failure with preserved answers and retry](visual-review/form-error-mobile-390.jpg)
- [Mock acceptance after deliberate retry](visual-review/form-retry-accepted-mobile-390.jpg)
- [Home footer clearance](visual-review/home-footer-mobile-390.jpg)
- [Booking footer clearance](visual-review/booking-footer-mobile-390.jpg)
- [Narrow booking header](visual-review/booking-320.jpg)
- [Form and clearance measurements](visual-review/mobile-form-clearance.json)

The failure/retry screenshots use synthetic example.test contact data and a loopback-only mock: first a retryable 503, then accepted 202. This is UI evidence, not provider acceptance or inbox receipt. No external message or production submission occurred. Both footer checks found no fixed overlays or horizontal overflow. Native 200% zoom remains unverified; no unavailable native controls were bypassed.

### Release gates remain open

1. Tony's premium/distinctive design review of this candidate; native 200% zoom and final accessibility/browser checks.
2. Approved privacy/terms/SMS-policy content and accurate legal attribution. Existing /privacy, /terms and /sms-terms are absent; no invented policies are published here.
3. Evidence for operational voice attachment, business/calendar rules, missed-call textback, campaign journey, callback ownership, onboarding and usage billing. A website inquiry is not operational booking or billing proof.
4. Verify existing claims: five pilot openings, 24/7 coverage, cancellation/exclusion/dispute rules and supported service boundaries. No SLA or integrations were invented.
5. Exact reviewed release commits and a separately authorized internal-only smoke test. The original #41 test's eventual Inbox receipt is established; its delay cause is unknown, and the new handler has not run in production.

See also [reliability readiness report](payperbooked-readiness.md). Resolve business/operational gates independently; do not treat functional checks or polished visuals as whole-business approval.
