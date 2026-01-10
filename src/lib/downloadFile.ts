import { toast } from "sonner";

/**
 * Downloads a file from a URL by fetching it and triggering a browser download.
 * This bypasses ad-blocker issues that block direct links to storage domains.
 * 
 * @param url - The URL of the file to download
 * @param filename - Optional filename for the downloaded file
 */
export async function downloadFile(url: string, filename?: string): Promise<void> {
  try {
    // Extract filename from URL if not provided
    const extractedFilename = filename || extractFilenameFromUrl(url) || 'download';
    
    toast.loading('Downloading file...', { id: 'file-download' });
    
    // Fetch the file
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    // Get the blob
    const blob = await response.blob();
    
    // Create a blob URL
    const blobUrl = URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = extractedFilename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    
    toast.success('File downloaded successfully', { id: 'file-download' });
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download file. Opening in new tab...', { id: 'file-download' });
    
    // Fallback: try to open in new tab
    window.open(url, '_blank');
  }
}

/**
 * Extracts a filename from a URL
 */
function extractFilenameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    
    // Decode URI component and return
    if (lastSegment) {
      return decodeURIComponent(lastSegment);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Opens a file in a new tab, with a toast warning about potential ad-blocker issues
 */
export function openFileInNewTab(url: string): void {
  const newWindow = window.open(url, '_blank');
  
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    toast.warning('Pop-up blocked. Try disabling your ad-blocker or use Download instead.');
  }
}
