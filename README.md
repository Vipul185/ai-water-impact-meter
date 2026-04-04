# AI Impact Meter

AI Impact Meter is a Chrome extension that shows a rough estimate of how much electricity and cooling-equivalent water an AI prompt may use on major AI chat websites.

## Start here

**You do not need `npm install` or `npm run build` if you only want to use the extension.**

### Quick use for non-developers

1. **Download this repository**
2. **Open `chrome://extensions`**
3. **Turn on `Developer mode`**
4. **Click `Load unpacked`**
5. **Select the `dist` folder from the downloaded project**

**The `dist` folder in this repository already contains the ready-to-load extension files.**

It adds:

- a popup dashboard when you click the extension icon
- a sticky on-page meter on supported AI sites
- live water estimation for the message you are currently typing
- running totals for the current chat, the current site, and all supported sites combined

## What this extension does

When you type a message on a supported AI website, the extension reads the draft locally in your browser and estimates:

- electricity usage in `kWh`
- cooling-equivalent water usage in `mL`
- a rough confidence level for the estimate

It also keeps simple local totals such as:

- current chat usage
- current site total usage
- all sites combined usage

## Important accuracy note

This extension is an estimate tool, not an exact meter.

- Electricity numbers are useful for rough comparison
- Water numbers are more uncertain
- Results are best used to compare prompts, not as scientific measurements

## Quick answer

- Regular users: no npm needed
- Developers editing the source code: use npm and rebuild

## Supported sites

- ChatGPT
- Claude
- Gemini
- Perplexity
- DeepSeek
- Grok
- Microsoft Copilot

## Privacy

- Prompt text is processed locally in the browser
- The extension stores only aggregate counters in `chrome.storage`
- It does not intentionally store full prompt text permanently
- It does not send prompt text or usage totals to a server

See:

- `PRIVACY_POLICY.md`
- `public/privacy-policy.html`

## Tech stack

- React
- Vite
- Chrome Extension Manifest V3

## Project directory

Run all setup commands from the project root folder.

This means the folder that contains:

- `package.json`
- `src/`
- `public/`

If you open a terminal somewhere else first, move into the project folder with:

```bash
cd your-project-folder
```

## Project structure

- `src/` popup UI and shared estimator logic
- `public/content.js` on-page sticky meter logic
- `public/content.css` on-page styles
- `public/manifest.json` Chrome extension manifest
- `public/privacy-policy.html` hostable privacy policy page

## Developer setup (optional)

### Before you start

This section is only for people who want to edit the source code.

Make sure Node.js and npm are installed on your system.

### 1. Install dependencies

Open a terminal in the project root folder.

Then run:

```bash
npm install
```

### 2. Build the extension

Still in the same project root folder, run:

```bash
npm run build
```

This recreates the `dist` folder with the unpacked extension files.

### 3. Load it in Chrome

1. Open `chrome://extensions`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select the `dist` folder inside the project

## How to use

1. Load the extension in Chrome
2. Open one of the supported AI websites
3. Start typing in the chat box
4. Watch the sticky panel update on the page
5. Click the extension icon to view the popup dashboard

## Available scripts

Run these from:

the project root folder

```bash
npm run build
npm run preview
```

## Chrome Web Store prep

This project already includes:

- extension icons
- manifest setup
- privacy policy draft
- submission notes

See:

- `CHROME_WEB_STORE_SUBMISSION.md`

## Notes for contributors

- `dist/` is intentionally included so non-developers can load the extension without building it
- `node_modules/` should not be committed
- if you change the source code, rebuild the project so `dist/` stays up to date

## License

Add your preferred license before publishing publicly.
