/**
 * Dashboard Module
 * Displays user's cloud-saved files with download/delete capabilities
 */
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { getCurrentUser } from "./auth.js";
import { showToast } from "./toast.js";

let filesGrid;
let emptyState;
let btnRefresh;

/**
 * Initialize the dashboard module
 */
export function initDashboard() {
  filesGrid = document.getElementById("files-grid");
  emptyState = document.getElementById("empty-state");
  btnRefresh = document.getElementById("btn-refresh");

  btnRefresh.addEventListener("click", loadFiles);
}

/**
 * Fetch and render user's files from Firestore
 */
export async function loadFiles() {
  const user = getCurrentUser();
  if (!user) return;

  filesGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align:center; padding:2rem;">
      <span class="spinner" style="display:inline-block; width:28px; height:28px;"></span>
    </div>`;
  emptyState.style.display = "none";

  try {
    const q = query(collection(db, "files"), where("uid", "==", user.uid));

    const snapshot = await getDocs(q);
    filesGrid.innerHTML = "";

    if (snapshot.empty) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    // Sort client-side by createdAt descending (avoids composite index requirement)
    const docs = [];
    snapshot.forEach((docSnap) => docs.push(docSnap));
    docs.sort((a, b) => {
      const aTime = a.data().createdAt?.seconds || 0;
      const bTime = b.data().createdAt?.seconds || 0;
      return bTime - aTime;
    });

    docs.forEach((docSnap) => {
      const data = docSnap.data();
      const card = createFileCard(docSnap.id, data);
      filesGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Load files error:", error);
    filesGrid.innerHTML = "";
    showToast("Failed to load files", "error");
  }
}

/**
 * Create a file card DOM element
 */
function createFileCard(id, data) {
  const card = document.createElement("div");
  card.className = "file-card";
  card.dataset.id = id;

  const ext = data.filename.split(".").pop().toUpperCase();
  const date = data.createdAt
    ? new Date(data.createdAt.seconds * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown";
  const sizeStr = formatSize(data.size || data.content?.length || 0);

  card.innerHTML = `
    <div class="file-card-header">
      <div class="file-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
        </svg>
      </div>
      <div class="file-card-actions">
        <button class="btn btn-ghost btn-sm btn-card-download" title="Download">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button class="btn btn-danger btn-sm btn-card-delete" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
    <h3>${escapeHTML(data.filename)}</h3>
    <div class="file-meta">
      <span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${date}
      </span>
      <span>${ext} &middot; ${sizeStr}</span>
    </div>
  `;

  // Click card to preview file content
  card.addEventListener("click", (e) => {
    // Don't open preview if clicking action buttons
    if (e.target.closest(".file-card-actions")) return;
    openPreview(id, data);
  });
  card.style.cursor = "pointer";

  // Download button
  card.querySelector(".btn-card-download").addEventListener("click", (e) => {
    e.stopPropagation();
    downloadFile(data.filename, data.content);
  });

  // Delete button
  card
    .querySelector(".btn-card-delete")
    .addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete "${data.filename}"?`)) return;
      await deleteFile(id, card);
    });

  return card;
}

/**
 * Download a file from its stored content
 */
function downloadFile(filename, content) {
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
 * Delete a file from Firestore
 */
async function deleteFile(id, cardEl) {
  try {
    await deleteDoc(doc(db, "files", id));
    cardEl.style.transition = "opacity 0.3s, transform 0.3s";
    cardEl.style.opacity = "0";
    cardEl.style.transform = "scale(0.95)";
    setTimeout(() => {
      cardEl.remove();
      // Check if grid is empty
      if (filesGrid.children.length === 0) {
        emptyState.style.display = "block";
      }
    }, 300);
    showToast("File deleted", "info");
  } catch (error) {
    console.error("Delete error:", error);
    showToast("Failed to delete file", "error");
  }
}

/**
 * Format byte size to human-readable string
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Open file preview modal
 */
function openPreview(docId, data) {
  const modal = document.getElementById("file-preview-modal");
  const filenameEl = document.getElementById("preview-filename");
  const metaEl = document.getElementById("preview-meta");
  const contentEl = document.getElementById("preview-content");
  const btnDownload = document.getElementById("btn-preview-download");
  const btnSave = document.getElementById("btn-preview-save");
  const btnClose = document.getElementById("btn-close-preview");

  const ext = data.filename.split(".").pop().toUpperCase();
  const sizeStr = formatSize(data.size || data.content?.length || 0);

  filenameEl.textContent = data.filename;
  metaEl.textContent = `${ext} \u00B7 ${sizeStr}`;
  contentEl.value = data.content || "";

  modal.style.display = "flex";
  contentEl.focus();

  // Close handlers
  const close = () => {
    modal.style.display = "none";
    cleanup();
  };
  const onOverlayClick = (e) => {
    if (e.target === modal) close();
  };
  const onEsc = (e) => {
    if (e.key === "Escape") close();
  };
  const onDownload = () => downloadFile(data.filename, contentEl.value);
  const onSave = async () => {
    const newContent = contentEl.value;
    btnSave.disabled = true;
    const originalHTML = btnSave.innerHTML;
    btnSave.innerHTML = `<span class="spinner"></span> Saving...`;
    try {
      await updateDoc(doc(db, "files", docId), {
        content: newContent,
        size: newContent.length,
      });
      data.content = newContent;
      data.size = newContent.length;
      showToast(`"${data.filename}" updated!`, "success");
    } catch (error) {
      console.error("Update error:", error);
      showToast("Failed to save changes", "error");
    } finally {
      btnSave.disabled = false;
      btnSave.innerHTML = originalHTML;
    }
  };

  const cleanup = () => {
    btnClose.removeEventListener("click", close);
    modal.removeEventListener("click", onOverlayClick);
    document.removeEventListener("keydown", onEsc);
    btnDownload.removeEventListener("click", onDownload);
    btnSave.removeEventListener("click", onSave);
  };

  btnClose.addEventListener("click", close);
  modal.addEventListener("click", onOverlayClick);
  document.addEventListener("keydown", onEsc);
  btnDownload.addEventListener("click", onDownload);
  btnSave.addEventListener("click", onSave);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
