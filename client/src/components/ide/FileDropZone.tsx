import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileDropZoneProps {
  onFileLoaded: (code: string, fileName: string) => void;
  className?: string;
}

export function FileDropZone({ onFileLoaded, className = '' }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    const validExtensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      setError(`Unsupported file type. Please use: ${validExtensions.join(', ')}`);
      return;
    }

    try {
      const text = await file.text();
      onFileLoaded(text, file.name);
    } catch (err) {
      setError('Failed to read file. Please try again.');
    }
  }, [onFileLoaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".js,.ts,.jsx,.tsx,.mjs,.cjs"
        onChange={handleInputChange}
        className="hidden"
        data-testid="input-file-drop"
      />
      
      <div
        onClick={handleClick}
        className={`
          cursor-pointer border-2 border-dashed rounded-xl p-8 text-center
          transition-all duration-200
          ${isDragging 
            ? 'border-primary bg-primary/10 scale-[1.02]' 
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
          }
        `}
        data-testid="drop-zone"
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            transition-colors duration-200
            ${isDragging ? 'bg-primary/20' : 'bg-muted'}
          `}>
            {isDragging ? (
              <Upload className="w-8 h-8 text-primary animate-bounce" />
            ) : (
              <FileCode className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-foreground">
              {isDragging ? 'Drop your file here' : 'Drop a .js or .ts file'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
