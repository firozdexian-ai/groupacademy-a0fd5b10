import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Loader2, RefreshCw, AlertCircle, Check } from "lucide-react";

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

const UPLOAD_TIMEOUT_MS = 60000; // 60 seconds - increased for larger files

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<FileItem | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    console.log('[MultiFileUpload] Starting upload:', fileName, 'to bucket:', bucket);
    setUploadingFileName(file.name);
    setUploadProgress(0);
    setUploadError(null);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[MultiFileUpload] Upload timeout - aborting');
      controller.abort();
    }, UPLOAD_TIMEOUT_MS);

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) return prev; // Cap at 85% until actual completion
        return prev + 5;
      });
    }, 300);

    try {
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      clearTimeout(timeoutId);

      if (uploadError) {
        console.error('[MultiFileUpload] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[MultiFileUpload] Upload successful:', data);
      setUploadProgress(100);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      console.log('[MultiFileUpload] Public URL:', urlData.publicUrl);
      
      return { name: file.name, url: urlData.publicUrl };
    } catch (error: any) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);

      const errorMessage = error.name === 'AbortError' 
        ? 'Upload timed out. Please try again.'
        : error.message || 'Upload failed';

      console.error('[MultiFileUpload] Error:', errorMessage);
      setUploadError(errorMessage);
      setUploadProgress(0);
      return null;
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - value.length;
    if (remainingSlots <= 0) {
      toast({ title: "Maximum files reached", description: `You can only upload ${maxFiles} files`, variant: "destructive" });
      return;
    }

    const file = files[0]; // Handle one file at a time for better UX
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: `${file.name} exceeds 10MB limit`, variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadFile(file);
      
      if (result) {
        console.log('[MultiFileUpload] Adding file to list:', result);
        const newFiles = [...value, result];
        onChange(newFiles);
        toast({ title: "Upload complete", description: `${file.name} uploaded successfully` });
        
        // Reset state after successful upload
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setUploadingFileName("");
        }, 500);
      } else {
        setIsUploading(false);
      }
    } catch (error: any) {
      console.error('[MultiFileUpload] Unexpected error:', error);
      setUploadError(error.message || 'Upload failed');
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    setUploadError(null);
    setUploadProgress(0);
    setUploadingFileName("");
    setIsUploading(false);
    fileInputRef.current?.click();
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
    if (!isUploading) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [isUploading, value, maxFiles]);

  const removeFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{label}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      {/* Upload Area */}
      {value.length < maxFiles && !isUploading && !uploadError && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {maxFiles - value.length} slot(s) remaining • Max 10MB per file
            </p>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {uploadProgress >= 100 ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              <span className="text-sm font-medium truncate max-w-[200px]">{uploadingFileName}</span>
            </div>
            <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {uploadProgress >= 100 ? 'Finalizing...' : 'Uploading...'}
          </p>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && !isUploading && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Upload failed</span>
            </div>
          </div>
          <p className="text-xs text-destructive">{uploadError}</p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-1" /> Try Again
          </Button>
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
                <Check className="h-4 w-4 shrink-0 text-green-600" />
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
