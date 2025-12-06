import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Loader2, RefreshCw, AlertCircle } from "lucide-react";

interface FileItem {
  name: string;
  url: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'error' | 'complete';
  error?: string;
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

const UPLOAD_TIMEOUT_MS = 30000; // 30 seconds

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
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const [dragActive, setDragActive] = useState(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const uploadFile = async (file: File, fileKey: string): Promise<FileItem | null> => {
    const abortController = new AbortController();
    abortControllersRef.current.set(fileKey, abortController);

    // Set timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, UPLOAD_TIMEOUT_MS);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Update progress to show upload started
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.set(fileKey, { file, progress: 10, status: 'uploading' });
        return newMap;
      });

      // Simulate progress updates (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => {
          const current = prev.get(fileKey);
          if (current && current.status === 'uploading' && current.progress < 90) {
            const newMap = new Map(prev);
            newMap.set(fileKey, { ...current, progress: Math.min(current.progress + 10, 90) });
            return newMap;
          }
          return prev;
        });
      }, 500);

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      abortControllersRef.current.delete(fileKey);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Update to complete
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.set(fileKey, { file, progress: 100, status: 'complete' });
        return newMap;
      });

      // Remove from uploading after short delay
      setTimeout(() => {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileKey);
          return newMap;
        });
      }, 500);

      return { name: file.name, url: publicUrl };
    } catch (error: any) {
      clearTimeout(timeoutId);
      abortControllersRef.current.delete(fileKey);

      const errorMessage = error.name === 'AbortError' 
        ? 'Upload timed out. Please retry.'
        : error.message || 'Upload failed';

      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.set(fileKey, { file, progress: 0, status: 'error', error: errorMessage });
        return newMap;
      });

      return null;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - value.length;
    if (remainingSlots <= 0) {
      toast({ title: "Maximum files reached", description: `You can only upload ${maxFiles} files`, variant: "destructive" });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // Validate file sizes (max 10MB each)
    for (const file of filesToUpload) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB limit`, variant: "destructive" });
        return;
      }
    }

    const uploadPromises = filesToUpload.map(async (file) => {
      const fileKey = `${file.name}-${Date.now()}`;
      return uploadFile(file, fileKey);
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((r): r is FileItem => r !== null);
    
    if (successfulUploads.length > 0) {
      onChange([...value, ...successfulUploads]);
      toast({ title: "Upload complete", description: `${successfulUploads.length} file(s) uploaded` });
    }
  };

  const retryUpload = async (fileKey: string) => {
    const uploadingFile = uploadingFiles.get(fileKey);
    if (!uploadingFile) return;

    // Reset status and retry
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.set(fileKey, { ...uploadingFile, progress: 0, status: 'uploading', error: undefined });
      return newMap;
    });

    const result = await uploadFile(uploadingFile.file, fileKey);
    if (result) {
      onChange([...value, result]);
      toast({ title: "Upload complete", description: `${result.name} uploaded successfully` });
    }
  };

  const cancelUpload = (fileKey: string) => {
    const controller = abortControllersRef.current.get(fileKey);
    if (controller) {
      controller.abort();
    }
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileKey);
      return newMap;
    });
  };

  const removeErroredUpload = (fileKey: string) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileKey);
      return newMap;
    });
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

  const removeFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const isUploading = Array.from(uploadingFiles.values()).some(f => f.status === 'uploading');

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{label}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      {/* Upload Area */}
      {value.length < maxFiles && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
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

      {/* Uploading Files with Progress */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadingFiles.entries()).map(([key, uploadingFile]) => (
            <div
              key={key}
              className={`p-3 rounded-lg border ${
                uploadingFile.status === 'error' 
                  ? 'bg-destructive/10 border-destructive/30' 
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {uploadingFile.status === 'uploading' ? (
                    <Loader2 className="h-4 w-4 shrink-0 text-primary animate-spin" />
                  ) : uploadingFile.status === 'error' ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className="text-sm truncate">{uploadingFile.file.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {uploadingFile.status === 'error' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => retryUpload(key)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => uploadingFile.status === 'uploading' ? cancelUpload(key) : removeErroredUpload(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {uploadingFile.status === 'uploading' && (
                <div className="space-y-1">
                  <Progress value={uploadingFile.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{uploadingFile.progress}%</p>
                </div>
              )}
              
              {uploadingFile.status === 'error' && (
                <p className="text-xs text-destructive">{uploadingFile.error}</p>
              )}
            </div>
          ))}
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
