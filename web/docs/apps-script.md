# Google Apps Script — Signup Form Backend (narrow-scope setup)

The signup form in `web/src/components/sections/Signup.tsx` posts to a Google Apps Script web app that appends each submission as a row to a Google Sheet.

This guide uses a **container-bound** script with the narrowed OAuth scope `spreadsheets.currentonly`. The OAuth consent prompt will then ask for access only to **the one specific Sheet** — not "all your spreadsheets" and not anything else in your Drive.

---

## Setup

### 1. Create the Google Sheet

Create a new Google Sheet for signups. Add a header row in row 1 if you want (it's optional — Apps Script will append below whatever's there):

| A | B | C | D |
|---|---|---|---|
| Timestamp | Email | Name | ZIP codes |

### 2. Open the script editor *from inside the Sheet*

In the Sheet, click **Extensions → Apps Script**.

This step is the load-bearing one. Opening Apps Script from inside a Sheet creates a *container-bound* script that's tied to this Sheet, which is what lets us use the narrower `spreadsheets.currentonly` scope. (Standalone scripts at script.google.com need the broader `spreadsheets` or Drive scope.)

### 3. Paste the script as `Code.gs`

Delete the `myFunction` stub. Paste:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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

No `SHEET_ID` constant needed — `getActiveSpreadsheet()` resolves to the parent Sheet automatically. Save (`Cmd/Ctrl + S`).

### 4. Narrow the OAuth scope via the manifest

In the script editor's left sidebar, click the **gear icon (Project Settings)** and check **"Show 'appsscript.json' manifest file in editor"**.

Switch back to the **Editor** tab. `appsscript.json` now appears in the file list. Replace its contents with:

```json
{
  "timeZone": "America/Los_Angeles",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly"
  ],
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
```

Save. The manifest forces Apps Script to request only the `spreadsheets.currentonly` scope at deploy time, rejecting any broader scopes it would otherwise auto-derive.

### 5. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. **Description**: `Signup form v1` (or anything memorable).
4. **Execute as**: `Me` (resolves to `USER_DEPLOYING` from the manifest).
5. **Who has access**: `Anyone` (resolves to `ANYONE_ANONYMOUS`).
6. Click **Deploy**. Google shows the OAuth consent screen.
7. **Verify the consent prompt language.** It should read something like:

   > "Depopulate FAIR Plan Signup wants to access your Google Account. **See and modify the spreadsheet this app is installed in.**"

   If you instead see **"See, edit, create, and delete all your Google Sheets spreadsheets"** or anything mentioning Drive, **stop**. The narrowed scope isn't applied — go back to step 4 and verify the manifest, save, then click "Deploy → Manage deployments → Edit → New version" to redeploy.

8. Authorize. Copy the **Web app URL** (it ends in `/exec`).

### 6. Wire the frontend to the endpoint

Open `web/src/components/sections/Signup.tsx`. Line 9:

```typescript
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/REPLACE_ME/exec";
```

Replace the whole URL with your `/exec` URL. Save, commit, push. GH Actions rebuilds and the form is live in ~2 min.

### 7. Smoke test

1. Visit `https://depopulatefairplan.com#signup` on the live site.
2. Submit your own email.
3. Check the Sheet — a new row should appear within ~5 seconds.
4. Because of the no-cors constraint (see below), the frontend will always show "success" even if something went wrong server-side. The Sheet is your source of truth — always verify a real row appears.

---

## What you're actually granting

After authorization, visit [myaccount.google.com/permissions](https://myaccount.google.com/permissions) and find the script. The granted scope should read:

> "See and modify the specific spreadsheet this app is installed in"

That's the only thing the script can do with your account. It cannot:

- Read or modify any other Sheets
- Access Drive, Docs, Gmail, Calendar, Contacts, or any other Google product
- Run when you're not actively triggering it via HTTP POST
- Reach out to other services on your behalf

You can revoke it at any time from that same Permissions page — the form would stop working but the Sheet itself stays.

---

## CORS / no-cors constraint

Google Apps Script web apps do **not** return permissive `Access-Control-Allow-Origin` headers. A standard `fetch()` with default `cors` mode would be blocked before reaching the script.

The frontend uses `mode: "no-cors"` as the workaround. The browser still sends the POST and Apps Script receives it, but the browser discards the response — `res.ok`, `res.status`, and the body are all inaccessible.

**Practical consequence:** the form cannot surface server-side errors to the user. If the Sheet ID is wrong, quota is exceeded, or the script has a bug, the user still sees the success message but no row appends. The "error" state fires only on browser-level network exceptions (device offline, DNS failure, etc.).

For low-volume signups this trade-off is fine. Test once yourself after deploy, then keep the Sheet bookmarked to monitor.

---

## Sheet column layout

After the first submission:

| A | B | C | D |
|---|---|---|---|
| Timestamp | Email | Name | ZIP codes |

---

## If you need to widen scope later

If you ever need to write to a *different* Sheet (e.g., archive to a separate workbook), you'd need to either:

- Move that Sheet into the same workbook as additional tabs, then use `getSheetByName("ArchiveTab")` (stays within `spreadsheets.currentonly`), or
- Switch to standalone-script + `openById()` with the broader `spreadsheets` scope.

The first option is preferred — keeps the scope narrow.
