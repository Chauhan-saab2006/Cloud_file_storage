/**
 * Main Entry Point
 * Wires up authentication, creator, dashboard, and navigation
 */
import { initAuth, onAuthChange, signInWithGoogle, logOut } from "./auth.js";
import { initCreator } from "./creator.js";
import { initDashboard, loadFiles } from "./dashboard.js";

// ===== Block Inspect / DevTools =====
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("keydown", (e) => {
  if (
    e.key === "F12" ||
    (e.ctrlKey &&
      e.shiftKey &&
      ["I", "J", "C"].includes(e.key.toUpperCase())) ||
    (e.ctrlKey && e.key.toUpperCase() === "U")
  ) {
    e.preventDefault();
  }
});

// ===== DOM References =====
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const btnGoogleSignin = document.getElementById("btn-google-signin");
const btnSignout = document.getElementById("btn-signout");
const userAvatar = document.getElementById("user-avatar");
const userName = document.getElementById("user-name");
const navTabs = document.querySelectorAll(".nav-tab");
const tabCreator = document.getElementById("tab-creator");
const tabDashboard = document.getElementById("tab-dashboard");

// ===== Auth Events =====
btnGoogleSignin.addEventListener("click", signInWithGoogle);
btnSignout.addEventListener("click", logOut);

// ===== Tab Navigation =====
navTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    // Update active tab button
    navTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // Show target tab content
    tabCreator.classList.toggle("active", target === "creator");
    tabDashboard.classList.toggle("active", target === "dashboard");

    // Load files when switching to dashboard
    if (target === "dashboard") {
      loadFiles();
    }
  });
});

// ===== Auth State Handler =====
onAuthChange((user) => {
  if (user) {
    // Show app, hide auth
    authScreen.classList.remove("active");
    appScreen.classList.add("active");

    // Update user info in navbar
    userAvatar.src = user.photoURL || "";
    userAvatar.style.display = user.photoURL ? "block" : "none";
    userName.textContent = user.displayName;
  } else {
    // Show auth, hide app
    appScreen.classList.remove("active");
    authScreen.classList.add("active");

    // Clear user info
    userAvatar.src = "";
    userName.textContent = "";
  }
});

// ===== Initialize Modules =====
initAuth();
initCreator();
initDashboard();
