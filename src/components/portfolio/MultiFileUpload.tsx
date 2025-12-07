import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Loader2, RefreshCw, XCircle } from "lucide-react";

interface FileItem {
  name: string;
  url: string;
}

interface MultiFileUploadProps {
  bucket: string;
  maxFiles?: number;
  acceptedTypes?: string;
  value: FileItem[];
  onChange: (files: FileItem[]) => void;
  label: string;
  description?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function MultiFileUpload({
  bucket,
  maxFiles = 5,
  acceptedTypes = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  value,
  onChange,
  label,
  description,
}: MultiFileUploadProps) {
  const { toast } = useToast();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [lastFailedFiles, setLastFailedFiles] = useState<File[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadFile = async (file: File, signal: AbortSignal): Promise<FileItem> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    // Check if aborted
    if (signal.aborted) {
      throw new Error('Upload cancelled');
    }

    console.log(`[MultiFileUpload] Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (signal.aborted) {
      throw new Error('Upload cancelled');
    }

    if (uploadError) {
      console.error('[MultiFileUpload] Supabase upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`[MultiFileUpload] Upload complete: ${file.name} -> ${publicUrl}`);
    return { name: file.name, url: publicUrl };
  };

  const handleFiles = async (files: FileList | null, isRetry = false) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - value.length;
    if (remainingSlots <= 0) {
      toast({ title: "Maximum files reached", description: `You can only upload ${maxFiles} files`, variant: "destructive" });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // Validate file sizes (max 5MB for CVs - reduced for faster uploads)
    for (const file of filesToUpload) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 5MB limit. Please compress your file.`, variant: "destructive" });
        return;
      }
    }

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setUploadStatus('uploading');
    setUploadProgress(0);
    setStatusMessage('Connecting to server...');
    setLastFailedFiles([]);
    
    try {
      const uploadedFiles: FileItem[] = [];
      const total = filesToUpload.length;
      
      for (let i = 0; i < total; i++) {
        if (signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const file = filesToUpload[i];
        const estimatedTime = Math.ceil(file.size / (50 * 1024)); // ~50KB/s estimate
        setStatusMessage(`Uploading ${file.name}... (est. ${estimatedTime}s)`);
        
        // 120-second timeout per file
        const uploadWithTimeout = Promise.race([
          uploadFile(file, signal),
          new Promise<never>((_, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error(`Upload timed out for ${file.name}. The file may be too large or your connection is slow.`));
            }, 120000);
            
            // Clear timeout if aborted
            signal.addEventListener('abort', () => clearTimeout(timeoutId));
          })
        ]);
        
        const result = await uploadWithTimeout;
        uploadedFiles.push(result);
        setUploadProgress(Math.round(((i + 1) / total) * 100));
        setStatusMessage(`Uploaded ${i + 1} of ${total} files`);
      }
      
      onChange([...value, ...uploadedFiles]);
      setUploadStatus('success');
      setStatusMessage('Upload complete!');
      toast({ title: "Files uploaded", description: `${uploadedFiles.length} file(s) uploaded successfully` });
      
      // Reset after success
      setTimeout(() => {
        setUploadStatus('idle');
        setStatusMessage('');
      }, 2000);
    } catch (error: any) {
      console.error('[MultiFileUpload] Upload error:', error);
      
      if (error.message === 'Upload cancelled') {
        setUploadStatus('idle');
        setStatusMessage('');
        toast({ title: "Upload cancelled", description: "You cancelled the upload", variant: "default" });
      } else {
        setUploadStatus('error');
        setStatusMessage(error.message || 'Upload failed');
        setLastFailedFiles(filesToUpload);
        toast({ 
          title: "Upload failed", 
          description: error.message || "Please try again or use the URL option", 
          variant: "destructive" 
        });
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRetry = () => {
    if (lastFailedFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      lastFailedFiles.forEach(file => dataTransfer.items.add(file));
      handleFiles(dataTransfer.files, true);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [value, maxFiles]);

  const removeFile = async (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const isUploading = uploadStatus === 'uploading';

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{label}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      {/* Upload Area */}
      {value.length < maxFiles && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${isUploading ? 'pointer-events-none' : 'cursor-pointer'}
            ${uploadStatus === 'error' ? 'border-destructive bg-destructive/5' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && document.getElementById(`file-input-${label}`)?.click()}
        >
          <input
            id={`file-input-${label}`}
            type="file"
            multiple={maxFiles > 1}
            accept={acceptedTypes}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">{statusMessage}</p>
              <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{uploadProgress}% complete</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                className="mt-2"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Upload
              </Button>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium text-destructive">Upload Failed</p>
              <p className="text-xs text-muted-foreground">{statusMessage}</p>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); setUploadStatus('idle'); setStatusMessage(''); }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Max 5MB per file • {maxFiles - value.length} slot(s) remaining
              </p>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Files List */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm truncate">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
