# Gmail API Setup Guide

This guide will walk you through setting up Gmail API integration for the Munin Email Client.

## Prerequisites

- A Google account with Gmail enabled
- Access to the Google Cloud Console
- The Munin Email Client application

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" dropdown in the top navigation
3. Click "New Project"
4. Enter a project name (e.g., "Munin Email Client")
5. Click "Create"

## Step 2: Enable Gmail API

1. In the Google Cloud Console, make sure your project is selected
2. Go to the [APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard)
3. Click "Enable APIs and Services"
4. Search for "Gmail API"
5. Click on "Gmail API" from the results
6. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. In the Google Cloud Console, go to [APIs & Services > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Choose "External" user type (unless you're in a Google Workspace organization)
3. Click "Create"
4. Fill in the required information:
   - **App name**: Munin Email Client
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the Scopes page, click "Add or Remove Scopes"
7. Add the following scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
8. Click "Save and Continue"
9. On the Test users page, add your email address as a test user
10. Click "Save and Continue"
11. Review the summary and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Desktop application" as the application type
4. Enter a name (e.g., "Munin Email Client")
5. Click "Create"
6. **Important**: Copy the Client ID and Client Secret - you'll need these for the app

## Step 5: Configure Munin Email Client

1. Open the Munin Email Client
2. Click "Add Email Account"
3. Select "Gmail (OAuth2)" from the provider dropdown
4. Fill in the required information:
   - **Email Address**: Your Gmail address
   - **Google Client ID**: The Client ID from Step 4
   - **Google Client Secret**: The Client Secret from Step 4
   - **Display Name**: Your preferred display name (optional)

## Step 6: Complete OAuth Authorization

1. Click "Authorize with Google"
2. A browser window will open with Google's authorization page
3. Sign in to your Google account if prompted
4. Review the permissions and click "Allow"
5. Google will redirect you to a page showing an authorization code
6. Copy the authorization code
7. Return to the Munin Email Client and paste the code in the "Authorization Code" field
8. Click "Complete Authorization"

## Step 7: Test the Connection

1. Once the account is added, you should see it in your accounts list
2. Try syncing emails to verify the connection is working
3. You should be able to send and receive emails through the Gmail API

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you've added your email as a test user in the OAuth consent screen
- Verify that the Gmail API is enabled for your project

### "Invalid client: no application name"
- Make sure you've completed the OAuth consent screen configuration
- Ensure the app name is set in the OAuth consent screen

### "The OAuth client was not found"
- Verify that your Client ID and Client Secret are correct
- Make sure you're using credentials for a "Desktop application" type

### "insufficient_scope" error
- Ensure you've added all required scopes in the OAuth consent screen:
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/gmail.send`
  - `https://www.googleapis.com/auth/gmail.modify`

### "Token has been expired or revoked"
- The refresh token functionality should handle this automatically
- If issues persist, try removing and re-adding your Gmail account

## Security Notes

- Keep your Client ID and Client Secret secure
- The app stores access tokens securely using the system's credential store
- Refresh tokens are used to automatically renew access when needed
- You can revoke access at any time from your [Google Account settings](https://myaccount.google.com/permissions)

## Production Setup

For production use, you'll need to:

1. Complete the OAuth app verification process with Google
2. Update the OAuth consent screen from "Testing" to "In production"
3. Consider using a more secure redirect URI setup
4. Implement proper error handling for production scenarios

## API Limits

Gmail API has the following limits:
- 1 billion quota units per day
- 250 quota units per user per second
- Each API call consumes different amounts of quota

The Munin Email Client is designed to be efficient with API calls, but be aware of these limits if you're syncing large amounts of email data.

## Support

If you encounter issues:
1. Check the application logs in the developer console
2. Verify your Google Cloud project settings
3. Ensure all API scopes are properly configured
4. Test with a simple Gmail account first

For more detailed information, refer to the [Gmail API documentation](https://developers.google.com/gmail/api/guides).