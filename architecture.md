# Architecture: File Creator Web Application

## Overview

A web-based application that allows users to authenticate via Google, create text-based files with custom extensions, and choose to either download them locally or save them to the cloud (Firebase). Users can also view their previously saved files on a personalized dashboard.

## Technology Stack

- **Frontend Core**: HTML5, CSS3 (Modern, responsive, glassmorphism UI), Vanilla JavaScript.
- **Build Tool**: Vite (for fast, zero-configuration local development and bundling).
- **Backend/BaaS**: Firebase
  - **Firebase Authentication**: Google Sign-In provider.
  - **Cloud Firestore**: NoSQL database for storing file metadata and file content (text).

## Structural Breakdown

### 1. Authentication Module (`auth.js`)

- **Responsibility**: Manages user login/logout states.
- **Flow**: User clicks "Sign in with Google" -> Firebase Auth authenticates via Google Provider popup -> Updates UI state.
- **Data Encapsulation**: Global access to Current User (`uid`, Display Name, Email, Profile Picture).

### 2. Dashboard Interface (`dashboard.js`)

- **Responsibility**: Central hub displaying a user's cloud-saved files.
- **Flow**: Subscribes to / Queries Firestore for files where `userId == currentUser.uid` -> Renders a structured grid of files.
- **Features**:
  - Real-time/Fetched File metadata display (Filename, Creation Date, File Type).
  - Open/Download functionality:
    - Fetches the file content (text) from Firestore.
    - Dynamically generates a downloadable file (Blob) in the browser using the stored text content and filename.

### 3. File Creator Workspace (`creator.js`)

- **Responsibility**: The main editor interface for creating raw files.
- **UI Components**:
  - Filename input with extension capability (e.g., `document.txt`, `script.js`).
  - Large workspace text area for content input.
  - Primary Action buttons: "Download Locally", "Save to Cloud (Firebase)".
- **Local Download Mechanism**: Utilizes the JavaScript `Blob` API in combination with `URL.createObjectURL()` to synthetically construct a file and trigger a native browser download event purely client-side.
- **Cloud Save Mechanism**:
  1. Captures the textual content from the workspace.
  2. Creates a document object containing the filename, creation timestamp, and the **full text content**.
  3. Inserts the document into the Firestore `files` collection purely as data (no file upload involved).

## Database Schema (Firestore)

**Collection**: `files`

- `id` (Document ID) - Auto-generated
- `uid` (String): Owner's User ID
- `filename` (String): e.g., "notes.txt"
- `content` (String): The actual text content of the file
- `createdAt` (Timestamp): Date of upload/creation
- `size` (Number): Content length (optional, for display)

## Security Rules Strategy (Firebase)

To ensure isolation and privacy:

- **Firestore**: `allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;`

## Improvements & Architectural Enhancements

- **Premium Aesthetics**: Implementing a dark-mode first design with sub-layer glassmorphism shadows and typography focus, yielding a technically professional visual impression.
- **State Preservation**: Debouncing logic to temporarily save workspace text content to `localStorage` (Local Drafts). If the user accidentally closes the tab or refreshes, their text isn't irrecoverably lost.
- **Feedback Loops**: Toast Notifications replacing native `alert()` for non-intrusive operational status messages during saving, downloading, and authentication.
