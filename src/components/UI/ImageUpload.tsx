import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  onUpload: (base64: string) => void;
  currentImage?: string;
  onRemove: () => void;
  maxSize?: number;
  accept?: string[];
}

export function ImageUpload({
  onUpload,
  currentImage,
  onRemove,
  maxSize = 5 * 1024 * 1024,
  accept = ["image/jpeg", "image/png", "image/webp", "image/gif"],
}: ImageUploadProps) {
  const [hovered, setHovered] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        const base64 = await fileToBase64(file);
        onUpload(base64);
      } catch (error) {
        console.error("Base64 conversion failed:", error);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
  });

  if (currentImage) {
    return (
      <div
        className="relative group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={currentImage}
          alt="Uploaded"
          className="w-full h-48 object-cover rounded-lg"
        />
        {hovered && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-gray-100 rounded-full">
            {isDragActive ? (
              <Upload className="w-8 h-8 text-blue-600" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-600" />
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isDragActive ? "Drop the image here" : "Upload featured image"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, WebP up to {(maxSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>
      </div>
    </div>
  );
}
