// sample projext ImageUploader
// src/components/ImageUploader.tsx
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CropImageDialog } from "@/components/CropImageDialog";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface ImageUploaderProps {
  onImagePrepared: (imageData: { file: File, preview: string }) => void;
  aspectRatio?: number;
  username?: string;
  hidePreview?: boolean;
  textOverrides?: Partial<{
    imageCropRequired: string;
    imageLoadFailed: string;
    imageReady: string;
    imageProcessFailed: string;
    imageDropHint: string;
    imageFileGuide: string;
    recrop: string;
    cropCancelled: string;
  }>;
}

export function ImageUploader({
  onImagePrepared,
  aspectRatio = 2/3,
  username,
  hidePreview = false,
  textOverrides,
}: ImageUploaderProps) {
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const tUploader = useTranslations('VideoUploader');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const getText = (key: keyof NonNullable<ImageUploaderProps['textOverrides']>) =>
    textOverrides?.[key] || tUploader(key);

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
        description: getText('imageCropRequired'),
      });
    };
    reader.readAsDataURL(file);
  }, [toast, tUploader, textOverrides]);

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
        description: getText('imageCropRequired'),
      });
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      toast({
        variant: "destructive",
        description: getText('imageLoadFailed'),
      });
    };

    console.log('Starting to read file:', file.name);
    reader.readAsDataURL(file);
  }, [toast, tUploader, textOverrides]);

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
        description: getText('imageReady'),
      });
    } catch (error) {
      console.error("이미지 처리 실패:", error);
      toast({
        variant: "destructive",
        description: getText('imageProcessFailed'),
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
          {getText('imageDropHint')}
          <br />
          <span className="text-xs text-gray-500">
            ({getText('imageFileGuide')})
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
                description: getText('imageCropRequired'),
              });
            }}
            className="absolute top-2 right-2"
            variant="secondary"
            size="sm"
          >
            {getText('recrop')}
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
              description: getText('cropCancelled'),
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
