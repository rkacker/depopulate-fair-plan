# Google Apps Script — Signup Form Backend

The signup form in `web/src/components/sections/Signup.tsx` posts submissions to a Google Apps Script web app, which appends each row to your Google Sheet. This document covers the script you need to deploy and the deploy steps.

---

## Code.gs

Create a new Google Apps Script project and paste this as `Code.gs`:

```javascript
var SHEET_ID = "REPLACE_ME_WITH_YOUR_GOOGLE_SHEET_ID";

function doPost(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  sheet.appendRow([
    new Date(),
    e.parameter.email || "",
    e.parameter.name  || "",
    e.parameter.zips  || "",
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Replace `REPLACE_ME_WITH_YOUR_GOOGLE_SHEET_ID` with the ID from your Google Sheet URL:

```
https://docs.google.com/spreadsheets/d/<THIS_PART_IS_THE_ID>/edit
```

---

## Deploy steps

1. Open [script.google.com](https://script.google.com) and sign in with the Google account that owns the Sheet.
2. Click **New project**.
3. Delete the default `myFunction` stub and paste the `Code.gs` above.
4. Replace `SHEET_ID` with your real Sheet ID. Save (`Cmd/Ctrl + S`).
5. Click **Deploy → New deployment**.
6. Click the gear icon next to "Select type" and choose **Web app**.
7. Set **Description** to something like `Signup form endpoint v1`.
8. Set **Execute as** → **Me**.
9. Set **Who has access** → **Anyone**.
10. Click **Deploy**. Google will ask you to authorize the script — grant access.
11. Copy the **Web app URL** (it ends in `/exec`).
12. Open `web/src/components/sections/Signup.tsx` and replace the placeholder in the `APPS_SCRIPT_URL` constant with your `/exec` URL:

```typescript
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

13. Rebuild and redeploy the frontend.

---

## CORS / no-cors constraint

Google Apps Script web apps do **not** return permissive `Access-Control-Allow-Origin` headers when called from a browser. A standard `fetch()` with the default `cors` mode will be blocked by the browser's CORS policy before the request even reaches the script.

The reliable workaround is `mode: "no-cors"`. The browser still sends the `POST` (the script receives it and appends the row), but the browser discards the response — your JavaScript sees an opaque `Response` object whose `ok`, `status`, and `body` are all inaccessible.

**Practical consequence:** the form cannot surface server-side errors to the user. Any error from the Apps Script side (e.g. wrong Sheet ID, quota exceeded) will be silently swallowed. The form's "error" state only fires if the browser throws a network-level exception (e.g. the device is offline). For a low-volume signup form this tradeoff is acceptable; if you need reliable error detection, proxy the request through your own server instead.

---

## Sheet column layout

After the first submission your Sheet will have columns in this order:

| A | B | C | D |
|---|---|---|---|
| Timestamp | Email | Name | ZIP codes |
