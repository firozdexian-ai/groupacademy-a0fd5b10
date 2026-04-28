import { toast } from "sonner";

/**
 * GroUp Academy: Institutional File Ingress Node
 * CTO Reference: Authoritative utility for resilient artifact downloads.
 * Strategy: Implements Blob-buffering to bypass storage-domain ad-blocker filters.
 */

export async function downloadFile(url: string, filename?: string): Promise<void> {
  try {
    // HUD: Filename_Registry_Audit
    const extractedFilename = filename || extractFilenameFromUrl(url) || "academy_artifact";

    toast.loading("Synchronizing artifact...", { id: "file-download" });

    // PHASE: Binary_Ingress_Fetch
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`REGISTRY_INGRESS_FAULT: ${response.status} ${response.statusText}`);
    }

    // ACTION: Convert network stream to local Blob artifact
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // HUD: Virtual_Anchor_Handshake
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = extractedFilename;
    document.body.appendChild(link);
    link.click();

    // PHASE: Atomic_Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    toast.success("Artifact successfully committed to device.", { id: "file-download" });
  } catch (err) {
    console.error("DOWNLOAD_ORCHESTRATOR_FAULT:", err);
    toast.error("Direct download failed. Attempting secondary tab-ingress...", { id: "file-download" });

    // FALLBACK: Pivot to standard browser-handled download
    window.open(url, "_blank");
  }
}

/**
 * HUD: Filename Extraction & Decoding
 * Decouples filename artifacts from complex storage URI segments.
 */
function extractFilenameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const lastSegment = urlObj.pathname.split("/").pop();
    return lastSegment ? decodeURIComponent(lastSegment) : null;
  } catch {
    return null;
  }
}

/**
 * HUD: Safe Viewport Handshake
 * Opens artifacts in a new viewport with pop-up diagnostic tracking.
 */
export function openFileInNewTab(url: string): void {
  const newWindow = window.open(url, "_blank");

  if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
    toast.warning("Handshake Blocked: Please authorize pop-ups or use the direct Download action.");
  }
}
