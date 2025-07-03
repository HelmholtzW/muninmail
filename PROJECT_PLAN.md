# Project Plan: AI-Native Email Client

## 1. Vision & Core Principles

To build a lightweight, local-first, AI-native email client. The application will run entirely on the user's machine, leveraging a single SQLite database file for all storage, including emails, attachments, vector embeddings, and task queues. The user experience will be centered around seamless human-machine collaboration, with an intelligent agent capable of performing any task the user can.

- **Local & Private:** All data stays on the user's device. No cloud dependency for core data.
- **Lightweight:** Electron front-end with a highly efficient SQLite backend.
- **AI-Native:** Every email is processed by an LLM to automate tasks and provide insights.
- **Collaborative:** The UI and the built-in agent are designed to work with the user, not just for them.

## 2. Technology Stack

- **Application Framework:** Electron
- **Frontend:** React
- **Database:** SQLite
  - **Vector Search:** `sqlite-vec`
  - **Persistent Job Queue:** `better-queue` (with SQLite driver)
  - **Email & Attachment Storage:** Direct storage in SQLite tables (attachments as BLOBS).
- **Email Protocols:**
  - **Initial:** IMAP for fetching, SMTP for sending.
  - **Future:** Native OAuth integration for Gmail and Outlook.
- **AI/LLM Orchestration:**
  - **Candidates:** LangGraph.js, LlamaIndex.ts, Vercel AI SDK.
  - **Model Interface:** OpenAI-compatible API endpoint.

## 3. Architecture Overview

The application is built on two main processes:

1.  **Electron Main Process (Backend/Core Logic):**
    - Manages the application lifecycle and native OS integration.
    - Runs the IMAP/SMTP clients to sync emails.
    - Manages the single SQLite database file (`local.db`).
    - Operates the `better-queue` instance, feeding incoming emails into the AI processing pipeline.
    - Hosts the AI agent and exposes its capabilities to the frontend.
    - Handles all interactions with the LLM service.

2.  **Electron Renderer Process (Frontend):**
    - A React-based single-page application.
    - Provides the user interface for reading, composing, and organizing emails.
    - Renders the "floating components" that display AI-generated insights (todos, classifications, etc.).
    - Communicates with the Main process via IPC to fetch data and trigger actions (e.g., send email, run agent task).

## 4. Development Phases

### Phase 1: Core Infrastructure & Basic Email Functionality
*   **Goal:** Establish a stable foundation and basic email client features.
*   **Tasks:**
    1.  ✅ Set up Electron with a React frontend boilerplate.
    2.  Integrate SQLite and establish the initial database schema:
        - `emails` table (headers, body, etc.).
        - `attachments` table (with a `blob` column for file data).
    3.  Implement a secure mechanism for storing user credentials (IMAP/SMTP).
    4.  Build the IMAP client logic to fetch and store emails in the SQLite database.
    5.  Build the SMTP client logic to send emails.
    6.  Create a basic React UI to list, view, and compose emails.

### Phase 2: AI Processing Pipeline
*   **Goal:** Automate the analysis of incoming emails.
*   **Tasks:**
    1.  Integrate `better-queue` with a SQLite backend.
    2.  Set up the background process to push new emails from the IMAP sync into the queue.
    3.  Choose and integrate one of the LLM orchestration libraries (e.g., LangGraph.js).
    4.  Create the core AI processing chain:
        - **Input:** Email content.
        - **Steps:**
            a. Classify the email (e.g., "Personal", "Work", "Spam", "Urgent").
            b. Extract a list of todos or action items.
            c. Determine if a direct response is required.
            d. Generate vector embeddings for the email content.
        - **Output:** A structured data object with the results.
    5.  Integrate `sqlite-vec` to store and index the generated embeddings.
    6.  Update the `emails` table to store the AI-generated metadata.

### Phase 3: Collaborative UI & Vector Search
*   **Goal:** Surface the AI insights to the user and enable semantic search.
*   **Tasks:**
    1.  Design and implement the "floating components" UI in React to display:
        - Email classification tags.
        - A checklist of extracted todos.
        - A clear indicator if a response is needed.
    2.  Build a search interface that uses `sqlite-vec` to find semantically similar emails.
    3.  Refine the UI to feel like a collaborative space between the human and the machine.

### Phase 4: The Agent
*   **Goal:** Empower the user with an agent that can act on their behalf.
*   **Tasks:**
    1.  Define a set of tools (functions) the agent can use. These should mirror user actions:
        - `sendEmail(to, subject, body)`
        - `draftReply(originalEmail, replyBody)`
        - `searchEmails(query)`
        - `addTodo(task)`
    2.  Use the chosen LLM orchestration library (LangGraph.js is a strong candidate here) to build the agent logic.
    3.  Create a command bar or chat-like interface in the UI for the user to give instructions to the agent.
    4.  Ensure the agent has access to the exact same toolset as the user.

### Phase 5: Native Integrations & Refinements
*   **Goal:** Move beyond IMAP/SMTP for major providers and polish the application.
*   **Tasks:**
    1.  Implement OAuth-based authentication for Gmail.
    2.  Refactor the email sync logic to use the Gmail API.
    3.  Implement OAuth-based authentication for Outlook/Microsoft 365.
    4.  Refactor the email sync logic to use the Microsoft Graph API.
    5.  Performance tuning and bug fixing.
