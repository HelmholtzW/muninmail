# Azure AD Setup Guide for Developers

This guide is for **developers** who want to build and distribute Munin Email with Microsoft Graph integration. End users do not need to follow this guide.

## Prerequisites

- Developer access to Azure Portal
- Ability to create Azure AD app registrations

## Step 1: Create Azure AD Application

1. **Go to the Azure Portal**
   - Visit [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your Microsoft account

2. **Navigate to Azure Active Directory**
   - In the left sidebar, click on **Azure Active Directory**
   - If you don't see it, click on **More services** and search for it

3. **Register a New Application**
   - Click on **App registrations** in the left sidebar
   - Click **New registration**

4. **Fill in the Application Details**
   - **Name**: Enter a name like "Munin Email Client"
   - **Supported account types**: Select "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"
   - **Redirect URI**: Leave this blank for now (we'll configure it later)
   - Click **Register**

## Step 2: Configure the Application

1. **Copy the Application (Client) ID**
   - After registration, you'll see the application overview page
   - Copy the **Application (client) ID** - you'll need this for Munin Email

2. **Set up Authentication**
   - Click on **Authentication** in the left sidebar
   - Click **Add a platform**
   - Select **Mobile and desktop applications**
   - Check the box for **https://login.microsoftonline.com/common/oauth2/nativeclient**
   - Click **Configure**

3. **Configure API Permissions**
   - Click on **API permissions** in the left sidebar
   - You should see "Microsoft Graph" with "User.Read" permission already added
   - Click **Add a permission**
   - Select **Microsoft Graph**
   - Select **Delegated permissions**
   - Search for and select the following permissions:
     - `Mail.Read` - Read user mail
     - `Mail.Send` - Send mail as user
     - `Mail.ReadWrite` - Read and write access to user mail (optional, for future features)
     - `offline_access` - Maintain access to data you have given it access to
   - Click **Add permissions**

4. **Grant Admin Consent** (if required)
   - If your organization requires admin consent, click **Grant admin consent for [Your Organization]**
   - If you're using a personal account, this step is usually not required

## Step 3: Configure Munin Email

1. **Set Environment Variable**
   - Set the `AZURE_CLIENT_ID` environment variable to your Application (client) ID
   - For development: Create a `.env` file in the project root:
     ```
     AZURE_CLIENT_ID=your-client-id-here
     ```
   - For production builds: Set the environment variable on the build system

2. **Build and Distribute**
   - Users can now simply select "Microsoft Outlook" and click "Login with Microsoft"
   - No additional setup required for end users

## Common Issues and Solutions

### Issue: "AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application"

**Solution**: Make sure you added the redirect URI correctly in Step 2.2:
- Go to your Azure AD app registration
- Click **Authentication**
- Ensure `https://login.microsoftonline.com/common/oauth2/nativeclient` is listed under redirect URIs

### Issue: "Insufficient privileges to complete the operation"

**Solution**: You need the correct permissions:
- Go to your Azure AD app registration
- Click **API permissions**
- Ensure `Mail.Read` and `Mail.Send` are added with delegated permissions
- If in an organization, ensure admin consent is granted

### Issue: Authentication fails silently

**Solution**: Check the Client ID:
- Ensure you copied the **Application (client) ID** correctly from Azure AD
- The Client ID should be in the format: `12345678-1234-1234-1234-123456789012`

## Security Notes

- The Client ID is not sensitive information and can be stored in the application
- Access tokens are stored securely using the system's credential storage
- Refresh tokens are used to maintain access without requiring frequent re-authentication
- All authentication happens through Microsoft's secure OAuth 2.0 flow

## Permissions Explained

- **Mail.Read**: Allows the application to read your email messages
- **Mail.Send**: Allows the application to send email on your behalf
- **offline_access**: Allows the application to maintain access even when you're not actively using it
- **User.Read**: Allows the application to read your basic profile information

## Next Steps

After setting up your Azure AD application and connecting your Outlook account in Munin Email, you can:

1. **Sync your emails**: The application will automatically sync your recent emails
2. **Send emails**: Compose and send emails through the Microsoft Graph API
3. **Manage folders**: Browse and organize your email folders
4. **Use AI features**: Let the AI assistant help you manage your emails (coming soon)

For more help, refer to the main README.md file or check the Microsoft Graph documentation at [https://docs.microsoft.com/en-us/graph/](https://docs.microsoft.com/en-us/graph/).