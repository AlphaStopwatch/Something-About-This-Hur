# The Eternal Jannati Stopwatch
Fixed-start elapsed time (days, hours, minutes, seconds) since **2026-10-29T06:30:00+06:00** (= 2026-10-29T00:30:00Z). Files: `index.html`, `style.css`, `script.js`.

## Timekeeping
- Elapsed = trusted-now − fixed start, computed with `BigInt` from timestamps every tick; nothing is incremented. Before the start, all units show zero.
- Trusted-now = server time at the sync midpoint (round-trip compensated) + `performance.now()` (monotonic). If the device sleeps and the monotonic clock stalls, it re-anchors to the wall clock. The display never runs backwards after a correction.
- Sources, in order: `https://worldtimeapi.org/api/timezone/Etc/UTC` (JSON `utc_datetime`), then the site's own HTTP `Date` header via a HEAD request (±1 s resolution). 6 s timeout, invalid values rejected, no keys, re-sync every 10 min and on wake/online.
- If every source fails, the page uses the device clock and says so ("Offline estimate"). It never claims verification it does not have. Accuracy is limited by the source and network latency.

## Reference image
`style.css` loads `assets/golden-veil.png` first, then the GitHub raw URL as fallback. For offline use, save the image as `assets/golden-veil.png`.

## Deploy
Push to a GitHub repo → Settings → Pages → deploy from branch root. No backend.
