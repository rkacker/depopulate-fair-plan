# Cloudflare Web Analytics

Free, privacy-friendly pageview/visitor analytics for `depopulatefairplan.com`. No cookie banner required (GDPR/CCPA compliant by default). Doesn't require routing traffic through Cloudflare's CDN — the beacon script reports independently.

## Setup

1. Go to [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) and sign in (free Cloudflare account is enough; no need to transfer DNS to them).
2. Click **Add a site** → enter `depopulatefairplan.com` → choose "Manual JavaScript installation" (NOT "Use Cloudflare proxy").
3. Cloudflare gives you a snippet that includes a `data-cf-beacon` token like `"token": "abc123def456..."`.
4. Open `web/index.html` and replace `REPLACE_ME_WITH_CF_ANALYTICS_TOKEN` with that token string.
5. Commit + push. GH Actions rebuilds, beacon starts firing within minutes.

## Verifying it works

- Visit `https://depopulatefairplan.com` in a fresh tab.
- Open DevTools → Network → filter for `beacon.min.js`. You should see a request to `static.cloudflareinsights.com` returning 200.
- A second request to `cloudflareinsights.com/cdn-cgi/rum` reports the pageview.
- Cloudflare's dashboard at `dash.cloudflare.com/?to=/:account/web-analytics` shows the first events within ~5 minutes.

## What you'll see

- Pageviews, unique visitors, top pages, top referrers
- Country breakdown (IP-derived, no precise location)
- Browser, OS, device-type splits
- 30-day rolling history (free tier)
- No event tracking, no funnels — for that, add PostHog as a second layer.

## Privacy posture

- No cookies set
- IP addresses are hashed and discarded
- No personal data sent to Cloudflare
- Aligns with the campaign's privacy-respecting positioning

## Removing later

Delete the `<script>` block from `web/index.html`. Done. Cloudflare retains historical data for the configured window even after script is removed.
