
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FileUploadButtonProps {
  onUpload?: (file: File) => void;
  accept?: string;
  children?: React.ReactNode;
}

const FileUploadButton = ({ 
  onUpload, 
  accept = ".pdf,.doc,.docx,.txt", 
  children 
}: FileUploadButtonProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <Button variant="outline" className="relative">
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept={accept}
      />
      <Upload className="h-4 w-4 mr-2" />
      {children || "Upload File"}
    </Button>
  );
};

export default FileUploadButton;
