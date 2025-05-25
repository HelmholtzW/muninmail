# 🐦‍⬛✉️ MuninMail Project Plan

## 🚩 Project Goals

* **Lightweight Email Client**: Transform current robust email client architecture into a lightweight, self-contained Mac application
* **Simplified Architecture**: Move from Docker/Celery/Redis/PostgreSQL to SQLite/asyncio for easier maintenance and distribution
* **Mac Distribution**: Package as a native .dmg installer for seamless Mac user experience

---

## 📅 Project Phases

### Phase 1: Core Email Client Architecture

- [ ] Protocol Adaptors:
  - [x] IMAP/SMTP integration (`email_service.py`)
  - [ ] GMail API adaptor
  - [ ] MS Graph API adaptor
  - [ ] OAuth2 authentication foundations

- [x] FastAPI Backend:
- [x] Minimal Next.js Frontend:

### Phase 2: Local AI Integration

- [x] AI Skills Implementation:
  - [x] Email summarization (`summarize_email.py`)
  - [x] Todo extraction (`extract_todos.py`) 
  - [x] Flag detection and tagging (`get_flags.py`)

### 🚧 Phase 3: Database Migration (SQLite Transition)
- [x] **Replace PostgreSQL with SQLite**

### 🚧 Phase 4: Background Processing Modernization
- [ ] **Replace Celery with AsyncIO**:
  - [ ] Migrate `email_tasks.py` to pure asyncio queues
  - [ ] Implement simple task scheduling with `asyncio.create_task()`
  - [ ] Remove Redis dependency entirely
- [ ] **Streamlined Processing Pipeline**:
  - [ ] Direct email ingestion without message broker
  - [ ] In-memory task queues for AI processing
  - [ ] Background email sync with configurable intervals

### 🔄 Phase 5: Architecture Simplification

- [ ] **Remove Docker Dependencies**:
  - [ ] Create standalone Python application
  - [ ] Bundle all dependencies with the application
  - [ ] Implement configuration file-based setup (no environment variables)
- [ ] **Self-Contained Email Storage**:
  - [ ] Local SQLite database in user's app data directory
  - [ ] Email attachments stored in local file system
  - [ ] Configurable storage limits and cleanup

### 🔄 Phase 6: Enhanced Local AI Pipeline

- [ ] **Improved AI Features**:
  - [ ] Add custom flag definitions
  - [ ] Create proper MuninAgent with control over the entire client
  - [ ] Meeting/calendar integration extraction

- [ ] **Improve UI/UX**:
  - [ ] Add Drafts, Sent, Deleted, etc. folders
  - [ ] Expose custom flag definition
  - [ ] Add calendar view
  - [ ] etc.


### 💰 Phase 7: Moentization

- [ ] **Adding Credit Logic***:
  - [ ] Setting up tracking for user credits

- [ ] **Adding Payments**:
  - [ ] Integrating Strip to buy more credits

### 🔄 Phase 8: Native Mac Application Framework

- [ ] **Electron/Tauri Integration**:
  - [ ] Choose between Electron and Tauri for native app wrapper
  - [ ] Bundle Next.js frontend and FastAPI backend
  - [ ] Implement native Mac system integration (notifications, menu bar)
- [ ] **Application Architecture**:
  - [ ] Single executable with embedded web server
  - [ ] Native file dialogs and system integrations
  - [ ] Mac-specific features (Touch Bar, shortcuts)

### 🎯 Phase 9: .dmg Distribution Preparation

- [ ] **Build System**:
  - [ ] Create automated build pipeline for Mac
  - [ ] Code signing and notarization for Mac App Store compatibility
  - [ ] .dmg packaging with proper installer UX
- [ ] **Native Features**:
  - [ ] Mac keychain integration for email credentials
  - [ ] System preferences integration
  - [ ] Auto-update mechanism
- [ ] **Performance Optimization**:
  - [ ] Minimize memory footprint
  - [ ] Optimize startup time
  - [ ] Background processing without blocking UI

### 🔒 Phase 10: Security & Privacy (Ongoing)

- [ ] **Local Data Security**:
  - [ ] SQLite database encryption
  - [ ] Secure credential storage in Mac Keychain
  - [ ] No cloud data transmission (except AI API calls)
- [ ] **Privacy Compliance**:
  - [ ] Minimal data collection
  - [ ] User control over AI processing
  - [ ] Clear privacy policy for AI feature usage

---

## 🔧 Technical Migration Priorities

### Immediate (Phase 3-4):
1. **SQLite Migration**: Update database layer to use SQLite
2. **Remove Celery**: Replace with asyncio-based task processing  
3. **Simplify Dependencies**: Reduce external service requirements

### Medium Term (Phase 5-6):
1. **Docker Removal**: Create standalone application structure
2. **Enhanced AI**: Improve local processing capabilities
3. **Configuration**: File-based setup without Docker

### Long Term (Phase 7-8):
1. **Native App**: Bundle into Electron/Tauri application
2. **Mac Integration**: Native Mac features and system integration
3. **.dmg Distribution**: Professional Mac application distribution

---

## 💡 Key Architectural Changes

### From Current Heavy Stack:
- Docker + PostgreSQL + Redis + Celery + FastAPI + Next.js

### To Lightweight Stack:
- SQLite + AsyncIO + FastAPI + Next.js → Native Mac App (.dmg)

### Benefits:
- **Easier Maintenance**: No Docker orchestration needed
- **Faster Startup**: No service dependencies
- **User-Friendly**: Single .dmg installer
- **Resource Efficient**: Lower memory and CPU usage
- **Privacy-First**: All data stored locally
