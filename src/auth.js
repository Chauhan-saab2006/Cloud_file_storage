/**
 * Authentication Module
 * Manages Google Sign-In / Sign-Out via Firebase Auth
 */
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "./firebase.js";
import { showToast } from "./toast.js";

let currentUser = null;
let authChangeCallbacks = [];


/**
 * Get the currently authenticated user
 * @returns {object|null} User object with uid, displayName, email, photoURL
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Register a callback for auth state changes
 * @param {function} cb - Called with user object or null
 */
export function onAuthChange(cb) {
  authChangeCallbacks.push(cb);
}

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
    showToast("Signed in successfully!", "success");
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user") {
      showToast("Sign-in cancelled", "warning");
    } else {
      console.error("Auth error:", error);
      showToast("Sign-in failed. Please try again.", "error");
    }
  }
}

/**
 * Sign out the current user
 */
export async function logOut() {
  try {
    await signOut(auth);
    showToast("Signed out", "info");
  } catch (error) {
    console.error("Sign-out error:", error);
    showToast("Sign-out failed", "error");
  }
}

/**
 * Initialize auth state listener
 */
export function initAuth() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = {
        uid: user.uid,
        displayName: user.displayName || "User",
        email: user.email,
        photoURL: user.photoURL,
      };
    } else {
      currentUser = null;
    }
    authChangeCallbacks.forEach((cb) => cb(currentUser));
  });
}
