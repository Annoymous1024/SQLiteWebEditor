import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileUploaded: (fileId: string) => void;
}

export default function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/sqlite/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "SQLite file uploaded successfully",
      });
      onFileUploaded(data.file.id);
      queryClient.invalidateQueries({ queryKey: ['/api/sqlite'] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const sampleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sqlite/sample');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Sample database loaded successfully",
      });
      onFileUploaded(data.file.id);
      queryClient.invalidateQueries({ queryKey: ['/api/sqlite'] });
    },
    onError: (error) => {
      toast({
        title: "Load failed",
        description: error instanceof Error ? error.message : "Failed to load sample database",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setIsUploading(true);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-sqlite3': ['.db', '.sqlite', '.sqlite3'],
      'application/octet-stream': ['.db', '.sqlite', '.sqlite3'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="p-4 border-b border-border">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/30 hover:border-primary/50"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        data-testid="file-upload-zone"
      >
        <input {...getInputProps()} data-testid="file-input" />
        <div className="flex flex-col items-center">
          {isUploading ? (
            <FileText className="h-8 w-8 text-primary mb-3 animate-pulse" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
          )}
          <p className="text-sm text-muted-foreground mb-2">
            {isUploading
              ? "Uploading..."
              : isDragActive
              ? "Drop SQLite file here"
              : "Drop SQLite file here"}
          </p>
          {!isUploading && (
            <>
              <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
              <p className="text-xs text-muted-foreground">Supports .db, .sqlite, .sqlite3</p>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex justify-center">
        <Button
          onClick={() => sampleMutation.mutate()}
          disabled={sampleMutation.isPending || isUploading}
          variant="outline"
          size="sm"
          data-testid="button-load-sample"
        >
          <Database className="h-4 w-4 mr-2" />
          {sampleMutation.isPending ? "Loading..." : "Load Sample Database"}
        </Button>
      </div>
    </div>
  );
}
