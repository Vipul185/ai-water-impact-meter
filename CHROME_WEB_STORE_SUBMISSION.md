# Chrome Web Store Submission Checklist

This repository is prepared for Chrome Web Store submission, except for screenshots and the final public privacy policy URL.

## Included in the project

- MV3 manifest with extension icons in `public/manifest.json`
- PNG icons in `public/icon16.png`, `public/icon32.png`, `public/icon48.png`, and `public/icon128.png`
- Built extension output in `dist`
- Draft privacy policy in `PRIVACY_POLICY.md`

## Manual steps before submission

1. Create or use a Chrome Web Store developer account and enable 2-Step Verification.
2. Host the privacy policy publicly and copy its public URL into the Chrome Web Store listing.
3. Replace the `Contact` section in `PRIVACY_POLICY.md` with your real support email or website.
4. Prepare screenshots for the listing.
5. Zip the contents of `dist` for upload, or upload through the dashboard/API as required.
6. In the listing privacy disclosures, state clearly:
   - the extension reads prompt text on supported AI websites
   - prompt text is processed locally for estimation
   - only aggregate counters are stored locally
   - no prompt text is transmitted to your servers
7. In the permissions justification, explain why host access is needed on supported AI sites: to read the active composer and show live impact estimates on-page.

## Suggested Chrome Web Store short description

Estimate electricity and cooling-equivalent water usage for prompts on major AI chat sites.

## Suggested privacy disclosure summary

AI Impact Meter reads the text typed into supported AI chat composers to estimate impact locally in the browser. It stores only aggregate usage totals in local extension storage and does not transmit prompt text to the developer.
