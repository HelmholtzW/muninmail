# Munin Email Client

An AI-native, local-first email client built with Electron, React, and Vite.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables (for Microsoft Graph integration):
   ```bash
   cp .env.example .env
   # Edit .env and add your Azure Client ID
   ```

### Development

To run the application in development mode:

```bash
pnpm run dev
```

This will:
1. Start the Vite development server on http://localhost:5173
2. Launch the Electron application
3. Enable hot reloading for both React and Electron

### Building

To build the application for production:

```bash
pnpm run build
pnpm run build:electron
```

## Development Phases

This project is being developed in phases as outlined in PROJECT_PLAN.md:

- [x] **Phase 1.1**: Basic Electron + React setup
- [x] **Phase 1.2**: SQLite integration and database schema
- [x] **Phase 1.3**: IMAP/SMTP email functionality
- [x] **Phase 5.1**: Outlook Graph API integration ← **Current**
- [ ] **Phase 2**: AI processing pipeline
- [ ] **Phase 3**: Collaborative UI & vector search
- [ ] **Phase 4**: Intelligent agent
- [ ] **Phase 5.2**: Gmail API integration & other refinements

## Supported Email Providers

### Traditional IMAP/SMTP
- **Gmail** (requires App Password)
- **Outlook/Hotmail** (requires IMAP enabled)
- **Yahoo Mail** (requires App Password)
- **iCloud Mail** (requires App Password)
- **Custom IMAP/SMTP servers**

### Modern OAuth Integration
- **Microsoft Outlook** (via Microsoft Graph API)
  - ✅ One-click OAuth 2.0 authentication
  - ✅ No passwords or app passwords required
  - ✅ Enhanced security and features
  - ✅ Automatic token refresh
  - ✅ Works with personal and business accounts

Simply select "Microsoft Outlook" and click "Login with Microsoft" - no additional setup required!

## User Experience

### Adding a Microsoft Account
1. Click "Add Email Account"
2. Select "Microsoft Outlook" from the provider dropdown
3. Enter your email address
4. Click "Login with Microsoft"
5. A secure Microsoft login window will open
6. Sign in with your Microsoft credentials
7. Grant permission for email access
8. Done! Your emails will start syncing automatically

## Features (Planned)

- 🔒 **Local & Private**: All data is saved on your device
- 🪶 **Lightweight**: Efficient SQLite backend
- 🤖 **AI-Native**: Every email processed by LLM for insights
- 🤝 **Collaborative**: Human-AI collaboration interface
- 🔍 **Vector Search**: Semantic email search capabilities
- 📱 **Cross-platform**: Available on Windows, macOS, and Linux 