# File Creator

A web application for creating text-based files with custom extensions, downloading them locally, or saving them to the cloud via Firebase. Includes Google authentication and a personal dashboard to manage saved files.

![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff)
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?logo=firebase&logoColor=fff)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)

## Features

- **Google Sign-In** — Authenticate via Firebase Authentication
- **File Creator** — Write content and specify any filename with extension (`.txt`, `.js`, `.json`, etc.)
- **Local Download** — Generate and download files client-side using the Blob API
- **Cloud Save** — Save files as documents to Cloud Firestore
- **Dashboard** — View, preview, edit, download, and delete your cloud-saved files
- **Editable Preview** — Click any file to open it in an editable modal, make changes, and save back to the cloud
- **Draft Autosave** — Workspace content is debounced and saved to `localStorage` so nothing is lost on accidental refresh
- **Toast Notifications** — Non-intrusive feedback for all operations
- **Dark Glassmorphism UI** — Responsive, dark-mode-first design with blur effects and gradient accents

## Tech Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Frontend   | HTML5, CSS3, Vanilla JavaScript           |
| Build Tool | [Vite](https://vitejs.dev/)               |
| Auth       | Firebase Authentication (Google provider) |
| Database   | Cloud Firestore                           |

## Project Structure

```
file_Creater/
├── index.html              # Entry HTML — auth screen, creator, dashboard, preview modal
├── vite.config.js          # Vite dev server & build configuration
├── package.json
├── firestore.rules         # Firestore security rules
├── architecture.md         # Detailed architecture document
├── src/
│   ├── main.js             # App entry — wires auth, navigation, modules
│   ├── firebase.js         # Firebase config & SDK exports
│   ├── auth.js             # Google Sign-In / Sign-Out / auth state
│   ├── creator.js          # File editor, local download, cloud save, draft logic
│   ├── dashboard.js        # File listing, preview modal, edit, delete
│   ├── toast.js            # Toast notification system
│   └── styles/
│       └── main.css        # Full stylesheet (glassmorphism, responsive)
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Firebase project](https://console.firebase.google.com/) with:
  - **Authentication** → Google sign-in enabled
  - **Cloud Firestore** database created

### Installation

```bash
git clone <repo-url>
cd file_Creater
npm install
```

### Configuration

Open `src/firebase.js` and replace the placeholder values with your Firebase project credentials:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### Deploy Firestore Rules

Copy the contents of `firestore.rules` into your Firebase Console → Firestore → Rules, then click **Publish**. Or use the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

### Run

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

Output is generated in the `dist/` folder.

## Firestore Schema

**Collection:** `files`

| Field       | Type      | Description                   |
| ----------- | --------- | ----------------------------- |
| `uid`       | string    | Owner's Firebase user ID      |
| `filename`  | string    | e.g. `notes.txt`              |
| `content`   | string    | Full text content of the file |
| `createdAt` | timestamp | Creation date                 |
| `size`      | number    | Content length in characters  |

## Security

- Firestore rules enforce that users can only read/write their own files (`uid == auth.uid`)
- Right-click and DevTools keyboard shortcuts are disabled in production

## License

ISC
