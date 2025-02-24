import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CropImageDialog } from "@/components/CropImageDialog";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ImageUploaderProps {
  onImagePrepared: (imageData: { file: File, preview: string }) => void;
  aspectRatio?: number;
  username?: string;
  hidePreview?: boolean;
}

export function ImageUploader({
  onImagePrepared,
  aspectRatio = 2/3,
  username,
  hidePreview = false,
}: ImageUploaderProps) {
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const [uploadFileName, setUploadFileName] = useState<string>('');

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event:', event);
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      console.log('FileReader loaded');
      setCropImageUrl(reader.result as string);
      toast({
        description: "이미지를 크롭해주세요.",
      });
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('onDrop called with files:', acceptedFiles);
    const file = acceptedFiles[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      console.log('FileReader onload called');
      const result = reader.result as string;
      console.log('Setting cropImageUrl:', result.substring(0, 50) + '...');
      setCropImageUrl(result);
      toast({
        description: "이미지를 크롭해주세요.",
      });
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      toast({
        variant: "destructive",
        description: "이미지 로드에 실패했습니다.",
      });
    };

    console.log('Starting to read file:', file.name);
    reader.readAsDataURL(file);
  }, [toast]);

  const handleCrop = async (croppedImage: string) => {
    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      
      const originalName = uploadFileName || 'image.jpg';
      const fileName = `${username || 'unknown'}_${originalName}`;

      const file = new File([blob], fileName, { 
        type: blob.type || 'image/jpeg'
      });
  
      setPreviewUrl(croppedImage);
  
      onImagePrepared({
        file,
        preview: croppedImage
      });
  
      toast({
        description: "이미지가 준비되었습니다.",
      });
    } catch (error) {
      console.error("이미지 처리 실패:", error);
      toast({
        variant: "destructive",
        description: "이미지 처리에 실패했습니다.",
      });
    } finally {
      setCropImageUrl(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"]
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    noClick: true
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center
          ${isDragActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          cursor-pointer
        `}
        onClick={open}
      >
        <input 
          {...getInputProps()} 
          onChange={handleFileSelect}
        />
        <p className="text-xs text-muted-foreground">
          이미지를 드래그하거나 클릭하여 선택하세요
          <br />
          <span className="text-xs text-gray-500">
            (최대 5MB, JPG/PNG/WebP)
          </span>
        </p>
      </div>

      {!hidePreview && previewUrl && (
        <div className="relative">
          <Image
            src={previewUrl}
            alt="Cropped preview"
            width={90}
            height={135}
            className="rounded-lg"
          />
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCropImageUrl(previewUrl);
              toast({
                description: "이미지를 다시 크롭해주세요.",
              });
            }}
            className="absolute top-2 right-2"
            variant="secondary"
            size="sm"
          >
            다시 크롭하기
          </Button>
        </div>
      )}

      {cropImageUrl && (
        <CropImageDialog
          open={true}
          onClose={() => {
            console.log('CropImageDialog onClose called');
            setCropImageUrl(null);
            toast({
              description: "크롭이 취소되었습니다.",
            });
          }}
          imageUrl={cropImageUrl}
          aspectRatio={aspectRatio}
          onCrop={handleCrop}
        />
      )}
    </div>
  );
}
