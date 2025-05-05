
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader, File, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface FileUploadButtonProps {
  appointmentId: string;
  onSuccess?: () => void;
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
}

const FileUploadButton = ({ appointmentId, onSuccess }: FileUploadButtonProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFiles, setShowFiles] = useState(false);
  const { user } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    try {
      setIsUploading(true);
      const file = e.target.files[0];
      
      if (!user) {
        throw new Error("You must be logged in to upload files");
      }
      
      // Upload file to Supabase
      const filePath = `${user.id}/${appointmentId}/${file.name}`;
      const { data, error } = await supabase.storage
        .from("appointment_files")
        .upload(filePath, file, {
          upsert: true
        });
        
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from("appointment_files")
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry
        
      if (urlData) {
        setUploadedFiles(prev => [
          ...prev,
          {
            name: file.name,
            url: urlData.signedUrl,
            size: file.size,
          }
        ]);
      }
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been successfully uploaded`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error.message || "There was a problem uploading your file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = "";
    }
  };

  const listFiles = async () => {
    if (!user) return;
    
    try {
      setShowFiles(true);
      
      // List files from this appointment
      const { data, error } = await supabase.storage
        .from("appointment_files")
        .list(`${user.id}/${appointmentId}`);
        
      if (error) {
        throw error;
      }
      
      // Get signed URLs for each file
      const filesWithUrls = await Promise.all(
        data.map(async (file) => {
          const filePath = `${user.id}/${appointmentId}/${file.name}`;
          const { data: urlData } = await supabase.storage
            .from("appointment_files")
            .createSignedUrl(filePath, 60 * 60 * 24); // 1 day expiry
            
          return {
            name: file.name,
            url: urlData?.signedUrl || "",
            size: file.metadata.size,
          };
        })
      );
      
      setUploadedFiles(filesWithUrls);
    } catch (error: any) {
      console.error("Error listing files:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to list files",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="relative overflow-hidden"
          disabled={isUploading}
        >
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
          {isUploading ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isUploading ? "Uploading..." : "Upload File"}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={listFiles}
          className="text-xs"
        >
          <File className="h-4 w-4 mr-2" />
          View Files
        </Button>
      </div>
      
      {showFiles && (
        <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
          {uploadedFiles.length > 0 ? (
            uploadedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm"
              >
                <div className="flex items-center">
                  <File className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium truncate max-w-[150px]">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDownload(file)}
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>No files uploaded yet</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowFiles(false)}
            className="w-full text-xs mt-2"
          >
            <X className="h-4 w-4 mr-1" /> Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploadButton;
