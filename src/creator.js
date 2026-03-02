/**
 * File Creator Workspace Module
 * Handles file creation, local download, and cloud save
 */
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";
import { getCurrentUser } from "./auth.js";
import { showToast } from "./toast.js";

// DOM references (initialized in initCreator)
let fileNameInput;
let fileContentArea;
let btnDownload;
let btnSaveCloud;
let draftIndicator;

// Debounce timer for draft saving
let draftTimer = null;
const DRAFT_DEBOUNCE_MS = 1000;

/**
 * Initialize the creator module
 */
export function initCreator() {
  fileNameInput = document.getElementById("file-name");
  fileContentArea = document.getElementById("file-content");
  btnDownload = document.getElementById("btn-download");
  btnSaveCloud = document.getElementById("btn-save-cloud");
  draftIndicator = document.getElementById("draft-indicator");

  // Load any saved draft
  loadDraft();

  // Set up event listeners
  btnDownload.addEventListener("click", handleDownload);
  btnSaveCloud.addEventListener("click", handleCloudSave);

  // Draft auto-save with debounce
  fileContentArea.addEventListener("input", debounceSaveDraft);
  fileNameInput.addEventListener("input", debounceSaveDraft);
}

/**
 * Download file locally using Blob API
 */
function handleDownload() {
  const filename = fileNameInput.value.trim();
  const content = fileContentArea.value;

  if (!filename) {
    showToast("Please enter a filename", "warning");
    fileNameInput.focus();
    return;
  }

  if (!content) {
    showToast("File content is empty", "warning");
    fileContentArea.focus();
    return;
  }

  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`"${filename}" downloaded!`, "success");
  } catch (error) {
    console.error("Download error:", error);
    showToast("Download failed", "error");
  }
}

/**
 * Save file to Cloud Firestore
 */
async function handleCloudSave() {
  const user = getCurrentUser();
  if (!user) {
    showToast("Please sign in first", "warning");
    return;
  }

  const filename = fileNameInput.value.trim();
  const content = fileContentArea.value;

  if (!filename) {
    showToast("Please enter a filename", "warning");
    fileNameInput.focus();
    return;
  }

  if (!content) {
    showToast("File content is empty", "warning");
    fileContentArea.focus();
    return;
  }

  // Disable button and show loading
  btnSaveCloud.disabled = true;
  const originalHTML = btnSaveCloud.innerHTML;
  btnSaveCloud.innerHTML = `<span class="spinner"></span> Saving...`;

  try {
    await addDoc(collection(db, "files"), {
      uid: user.uid,
      filename: filename,
      content: content,
      createdAt: serverTimestamp(),
      size: content.length,
    });

    showToast(`"${filename}" saved to cloud!`, "success");
    clearDraft();
  } catch (error) {
    console.error("Cloud save error:", error);
    showToast("Failed to save to cloud", "error");
  } finally {
    btnSaveCloud.disabled = false;
    btnSaveCloud.innerHTML = originalHTML;
  }
}

/**
 * Debounced draft save to localStorage
 */
function debounceSaveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    saveDraft();
  }, DRAFT_DEBOUNCE_MS);
}

/**
 * Save current workspace to localStorage
 */
function saveDraft() {
  const draft = {
    filename: fileNameInput.value,
    content: fileContentArea.value,
    savedAt: Date.now(),
  };
  localStorage.setItem("filecreator_draft", JSON.stringify(draft));
  if (draftIndicator) {
    draftIndicator.style.display =
      draft.filename || draft.content ? "flex" : "none";
  }
}

/**
 * Load draft from localStorage
 */
function loadDraft() {
  try {
    const raw = localStorage.getItem("filecreator_draft");
    if (!raw) return;

    const draft = JSON.parse(raw);
    if (draft.filename) fileNameInput.value = draft.filename;
    if (draft.content) fileContentArea.value = draft.content;

    if (draft.filename || draft.content) {
      draftIndicator.style.display = "flex";
      showToast("Draft restored", "info");
    }
  } catch {
    // Ignore corrupt data
  }
}

/**
 * Clear saved draft
 */
function clearDraft() {
  localStorage.removeItem("filecreator_draft");
  if (draftIndicator) {
    draftIndicator.style.display = "none";
  }
}
