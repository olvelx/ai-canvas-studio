import React, { useCallback } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (base64: string | null) => void;
  selectedImage: string | null;
}

export const ImageUpload = ({ onImageSelect, selectedImage }: ImageUploadProps) => {
  const handleFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onImageSelect(reader.result as string);
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (selectedImage) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-border bg-card">
        <img src={selectedImage} alt="uploaded" className="w-full max-h-48 object-contain bg-muted" />
        <button
          onClick={() => onImageSelect(null)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer"
    >
      <Upload className="w-8 h-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">点击或拖拽图片上传</p>
      <p className="text-xs text-muted-foreground/50">支持 JPG、PNG 格式，最大 10MB</p>
      <input type="file" accept="image/jpeg,image/png" onChange={handleChange} className="hidden" />
    </label>
  );
};
