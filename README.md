# The Eternal Jannati Stopwatch

This project is a lightweight static stopwatch website designed to count elapsed time from the fixed start of:

- Bangladesh Standard Time: 2026-10-29 06:30:00 +06:00
- UTC equivalent: 2026-10-29T00:30:00Z

## Timekeeping method

The website calculates elapsed duration from the fixed timestamp using JavaScript timestamps rather than a manually incremented counter. It attempts to synchronize with the public UTC time API at `https://worldtimeapi.org/api/timezone/Etc/UTC` when the network is available. If the request fails or the browser is offline, it falls back to the device clock and clearly labels the status as an offline estimate.

## Important notes

- The fixed start date never changes on refresh or restart.
- The page displays `00 DAYS : 00 HOURS : 00 MINUTES : 00 SECONDS` before the official start time.
- After the start time, the page shows the true elapsed duration with exactly four units: days, hours, minutes, and seconds.
- The stopwatch remains a static, fixed-start display with no start/reset controls.

## Deployment

1. Upload the files `index.html`, `style.css`, and `script.js` to a GitHub Pages repository.
2. Make sure the image file `Golden Veil by the Garden Waters.png` is also present in the repository root.
3. Publish via GitHub Pages from the repository's default branch.

## Files included

- `index.html`
- `style.css`
- `script.js`
- `Golden Veil by the Garden Waters.png`

## Local testing

Open `index.html` in a browser, or publish to GitHub Pages and confirm the timer updates correctly through midnight and long-duration periods.

## Limitation

Internet time synchronization is best-effort and may be unavailable. The website does not claim perfect external accuracy when running offline; it only displays the best available estimate and indicates the status clearly.

