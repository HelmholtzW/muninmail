# OAuth-2 Setup for Munin Email Client

Munin now supports password-less sign-in for Gmail and Outlook accounts, offering the same friction-free experience as Apple Mail or the official mail apps.

---

## 1.  What happens under the hood?

1. The **renderer** (React) calls `window.electronAPI.oauth.login('gmail' | 'outlook')` whenever the user adds an account without a password.
2. The **main** process opens a small browser window via **electron-oauth2** where the user completes the provider’s login & consent screen.
3. Google/Microsoft redirects back with an **authorisation code**; electron-oauth2 exchanges it for an **access token** (+ refresh token).
4. Tokens are returned to the main process and stored **encrypted** with Keytar.  
   • SMTP uses Nodemailer’s built-in OAuth2 transport.  
   • IMAP uses XOAUTH2 (RFC 7628) with the same token.
5. EmailManager automatically refreshes tokens when Nodemailer detects expiry (for SMTP) or when the IMAP connection fails (TBD).

---

## 2.  Why do we need *client IDs* (and sometimes *secrets*)?

| Term | Purpose | Who owns it? | Do users see it? |
|------|---------|--------------|------------------|
| **Client ID** | Identifies *your application* to Google/Microsoft so they can show the right consent screen and apply quotas. | **Developer** – created once in a cloud console. | **No** |
| **Client Secret** | Legacy field for “confidential” clients. Public desktop apps cannot really keep it secret; Google/Microsoft treat it as *public information*. | **Developer** – optional for native apps (pass empty string if not required). | **No** |

End-users only grant access via their normal login; they never provide developer keys.

---

## 3.  One-time steps for you, the developer

### 3.1 Google (Gmail)
1. Open the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).  
2. `Create credentials` → **OAuth client ID**.  
3. Application type: **Desktop app**.  
4. Copy the generated **Client ID** (and the **Secret** – optional).  
5. Add the scope `https://mail.google.com/` to the OAuth consent screen (covers IMAP + SMTP).

### 3.2 Microsoft (Outlook/Office 365)
1. Go to the [Azure Portal](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).  
2. `New registration` → *Name your app*.  
3. **Supported account types**: leave default (Accounts in any org and personal).  
4. **Redirect URI**: type **Public client / native (mobile/desktop)** and enter `http://localhost`.  
5. After creation, open **Authentication** → enable *Allow public client flows* (for native apps).  
6. Open **API permissions** → `Add permission` → **APIs my organisation uses** and add:  
   • `IMAP.AccessAsUser.All`  
   • `SMTP.Send`  
   • `offline_access` (refresh tokens)
7. No secret is required for public clients.

### 3.3 Provide the keys to the app
Create a `.env` (or set env vars in your build pipeline):

```bash
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxx   # optional for desktop apps
OUTLOOK_CLIENT_ID=<Application (client) ID>
# OUTLOOK_CLIENT_SECRET  # usually not needed
```

**Important:** these IDs are *not* sensitive. They can safely ship with your binaries, but keeping them in env vars allows you to switch apps without editing code.

---

## 4.  End-user experience
1. Click **“+ Add Email Account”**.
2. Choose **Gmail** or **Outlook (Hotmail)**.  
   • The **Password** field disappears – the app will use OAuth instead.  
3. Enter the email address and press **Add Account**.
4. A system browser window opens – user logs in, grants access, window closes.
5. Account is added; Munin starts syncing immediately.

For **Custom IMAP/SMTP** (e.g. company mail servers) the UI still shows password + host/port fields.

---

## 5.  Troubleshooting
• *The OAuth window never opens* – ensure your client IDs are present in the environment and that you restarted Electron after setting them.  
• *Microsoft scope error* – double-check the IMAP/SMTP permissions are **delegated**, not application permissions, and that admin consent (if required) is granted.  
• *Token expired* – refresh tokens usually last 90 days. Munin requests long-lived tokens automatically.

---

Happy coding & enjoy password-less email 🎉