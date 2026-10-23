# Phase 1 prototype QA notes — ClinicConsilium

**Date:** 2026-10-23  
**Scope:** Static source review of the homepage and newly added information pages  
**Status:** Preliminary checks only; not a production security, accessibility or clinical audit

## Pages reviewed

- `index.html`
- `about.html`
- `contact.html`
- `privacy.html`
- `terms.html`
- `status.html`

## Checks completed

- [x] Confirmed all six pages exist in the repository and have document titles.
- [x] Checked same-page fragment links on all six pages against element IDs; no missing fragment targets were found.
- [x] Confirmed the homepage contains a visible prototype-status disclosure.
- [x] Confirmed the Contact page explains that enquiries are not active and submissions are not sent or stored.
- [x] Confirmed the Privacy and Terms pages explicitly state they are preliminary and require qualified review.
- [x] Confirmed the Service Status page distinguishes prototype, unavailable and deferred capabilities.
- [x] Confirmed the homepage's two forms have client-side submit handlers that prevent normal submission and explicitly tell visitors that information has not been sent or stored.
- [x] Removed a duplicate role option from the homepage demo form.
- [x] Changed the free-text form label to request general feedback only and warn against including personal or health information.

## Not yet verified

- [ ] Browser-based visual review at desktop, tablet and mobile sizes.
- [ ] Keyboard-only navigation, screen-reader labels, visible focus and WCAG 2.2 AA contrast testing.
- [ ] Real-browser console errors, external image/font availability and network performance.
- [ ] Cross-browser checks and zoom/reflow testing.
- [ ] HTTP response headers, hosting configuration, dependency/security scans and deployment status.
- [ ] Qualified Nigerian legal/privacy review of the Privacy Notice and Terms of Use.
- [ ] Clinical review of any health-related public education or emergency wording.
- [ ] Owner review and approval of Phase 1 acceptance criteria.

## Important limitations

These checks were performed against source retrieved from GitHub. They do not prove that the live Vercel deployment has rebuilt, that every visual interaction works in a browser, or that the site is ready for production. No real patient information was used. Forms must remain demo-only until the legal operator, authorised recipient, privacy process, secure backend and required reviews are approved.
