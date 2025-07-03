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
   npm install
   ```

### Development

To run the application in development mode:

```bash
npm run dev
```

This will:
1. Start the Vite development server on http://localhost:5173
2. Launch the Electron application
3. Enable hot reloading for both React and Electron

### Building

To build the application for production:

```bash
npm run build
npm run build:electron
```

## Development Phases

This project is being developed in phases as outlined in PROJECT_PLAN.md:

- [x] **Phase 1.1**: Basic Electron + React setup ← **Current**
- [x] **Phase 1.2**: SQLite integration and database schema
- [x] **Phase 1.3**: IMAP/SMTP email functionality
- [ ] **Phase 2**: AI processing pipeline
- [ ] **Phase 3**: Collaborative UI & vector search
- [ ] **Phase 4**: Intelligent agent
- [ ] **Phase 5**: Native integrations & refinements

## Features (Planned)

- 🔒 **Local & Private**: All data is saved on your device
- 🪶 **Lightweight**: Efficient SQLite backend
- 🤖 **AI-Native**: Every email processed by LLM for insights
- 🤝 **Collaborative**: Human-AI collaboration interface
- 🔍 **Vector Search**: Semantic email search capabilities
- 📱 **Cross-platform**: Available on Windows, macOS, and Linux 