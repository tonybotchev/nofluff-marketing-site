# PayPerBooked inquiry readiness review

Prepared October 30, 2026. This is a draft for independent review, not a production release or a declaration that the service is operational.

## Dependency and scope

Branch `codex/ppb-inquiry-readiness` starts at PR #42 head `1e89c755f3cb1aa3ae6912abfee38f0f688ede83`, itself based on merged PR #41 / main `8ec866db941610163b38fcb24df0b3e2b62e8a4e`. The draft targets #42's branch, `cursor/payperbooked-preview-seo-b32d`, so its diff contains only the inquiry reliability work. It relies on #42's branding, assets and host routing. PR #43 is separate NFM wording and is excluded. Neither PR is approved for release by this document.

The draft branch has `git.deploymentEnabled` set to false for its exact name in vercel.json. Other branch behavior is unchanged. No production settings, credentials or permissions are changed. A future merge into another branch can deploy and requires separate release approval.

## Diagnosis and changes

The original PR #41 internal test eventually reached the internal Inbox on October 29 at 17:12:21 UTC. The independent mailbox check found no matching draft. Eventual delivery passes; the observed delay's cause is unknown. A transient Drafts observation does not establish a permanently unsent message.

Microsoft Graph sendMail returns 202 when accepted for asynchronous processing; that is not delivery confirmation. The previous browser success state promised review/callback after an HTTP success, the handler accepted any successful HTTP status, and failures discarded the interactive form. Submission references, bounded waits and browser duplicate protection were missing. These defects are established from the code; they do not explain the observed delivery delay.

- Require Graph 202 and return an explicit accepted state. Customer copy describes submission for email delivery, not inbox arrival, appointment reservation or paid activation.
- Preserve answers on known failures and permit deliberate retries only when no send occurred or the provider explicitly rejected it. Ambiguous network/provider outcomes display an uncertain state and phone fallback without resending.
- Add bounded provider/browser waits, input validation, correlation references, internal server-controlled recipients and a Sent Items audit copy. Do not log form contents, provider errors or credentials.
- Lock duplicate clicks synchronously. Save only reference/status/expiry in sessionStorage to prevent repeat submissions on same-tab navigation for 24 hours. This is NOT durable server-side idempotency; another tab/device or unavailable storage can bypass it. References are for correlation, not guaranteed deduplication.
- Share one form controller between home and booking, add a JavaScript-disabled phone fallback and a factual data-use notice. Remove #42's contact-email placeholders; retain the existing public phone. No new mailbox or policy terms are invented.
- Keep prices static: the prior home counter animation briefly displayed intermediate dollar amounts.

References: [Graph sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0), [Graph mail processing stages](https://learn.microsoft.com/en-us/graph/outlook-things-to-know-about-send-mail), [Vercel branch deployment configuration](https://vercel.com/docs/project-configuration/git-configuration).

## Acceptance evidence

| Stage | Status | Evidence / limits |
| --- | --- | --- |
| Approved pricing | Passed | $0 setup, $49/month + $29/confirmed booking, $499 cap every trade. Source/copy scans and local rendered pages. Browser calculator checked at 16 bookings for all six trade selectors: $499. |
| Desktop/mobile pages | Passed locally | Home, pricing and booking rendered at 1365x900 and 390x844. Navigation, pricing/booking links, phone hrefs and form CTA inspected. No document horizontal overflow at those widths; no browser console errors. Loopback mock only, not deployed code. |
| Form validation | Passed locally | Browser rejected fractional call volume. Automated tests cover incomplete/invalid/oversized data, email/phone, allowed trade/town and integer bounds. |
| Mail failure handling | Passed with mocks | Token/provider rejection, malformed responses, timeouts, transport ambiguity and non-202 responses. No automatic resend. |
| Retry / duplicate click | Passed with mocks | Retains answers, safe deliberate retry, synchronous double-submit lock, navigation guard, expired/unavailable storage and unavailable UUID handling. No server-wide dedup guarantee. |
| Browser submit | Passed with mock | Synthetic data submitted only to loopback server with no provider integration. Accepted-state copy and same-tab navigation guard verified. |
| Existing internal receipt | Passed | Original PR #41 test confirmed in internal Inbox, received October 29 17:12:21 UTC. Delay cause unknown. No second live lead submitted. |
| New handler live receipt | Untested | Draft has not been deployed. Existing receipt does not validate this new code in production. A separately authorized internal-only smoke test is needed after approved release. |
| NFM regression | Passed locally | NFM freeze test compares its pages to main; existing host routing tests pass. API call-site search finds only PPB's controller. No NFM content changes. |
| Contact placeholders | Passed | No contact-email placeholders in PPB pages/llms. Existing public (940) 394-5656 retained; reachability/ownership not independently called. |
| Privacy / terms / SMS terms | Blocked | Parent public audit found /privacy, /terms and /sms-terms return 404 with no policy links. Home has inline commercial terms, not complete policies. Owner-approved content and applicability are required; this draft does not invent legal terms. |
| Promised customer follow-up | Blocked | Site promises a callback. Repository handler sends an internal inquiry; no customer acknowledgement or callback automation is implemented here. Need named operational owner and evidence of the promised process. |
| Voice / calendar / missed-call text | Blocked on operational evidence | Existing assignment for voice-agent configuration and a mystery-call test remains outstanding in the latest operational audit. Do not replace the public site phone with an internal voice-service number. External configuration may exist; repository absence is not proof it is absent. |
| Billing / onboarding / fulfillment | Untested / external dependency | /booking is an inquiry form, not checkout or calendar reservation. No operational usage billing/onboarding path is evidenced in this repository. Need existing external receipts, including cap enforcement, exclusions/disputes/cancellation. No live charges or customer workflows tested. |
| Other offer claims | Blocked on owner verification | Five available pilot spots, 24/7 coverage, booking exclusions, callback process, cancellation/dispute promises and competitor comparisons require owner/current-source evidence. Existing commercial terms are retained, not newly approved. |

`npm test`: 24 passing tests plus 11-file copy scan. `git diff --check`: clean. Tests make no real provider calls. Local preview uses synthetic data and cannot send email, SMS, book appointments or charge anyone.

## Smallest next decision

Independent reviewer should first assess this draft and #42 together. This does not authorize a merge or deployment. Before requesting a production release, resolve policy/contact/process claims or explicitly scope the website release with owner-approved copy. Obtain voice/calendar/billing operational receipts separately before calling the whole service ready. A release decision should name the exact reviewed commit(s), target project/domains and the internal-only post-release smoke test. Do not merge #42 alone while its contact placeholders remain.
