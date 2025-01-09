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
}

export function ImageUploader({
  onImagePrepared,
  aspectRatio = 2/3,
  username,
}: ImageUploaderProps) {
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const [uploadFileName, setUploadFileName] = useState<string>('');  // 파일명 저장용 상태 추가

  // 파일 선택 이벤트 핸들러 추가
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event:', event);
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);  // 원본 파일명 저장

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

    setUploadFileName(file.name);  // 원본 파일명 저장

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
      
      // 파일명 생성
      // const extension = 'jpg';
      // const sanitizedTitle = title?.replace(/[^a-zA-Z0-9]/g, '_') || 'untitled';
      // const fileName = `${username || 'unknown'}_${sanitizedTitle}.${extension}`;

      const originalName = uploadFileName || 'image.jpg';
      const fileName = `${username || 'unknown'}_${originalName}`;

      // File 객체 생성 시 원본 파일의 타입 유지
      const file = new File([blob], fileName, { 
        type: blob.type || 'image/jpeg'
      });
  
      // 프리뷰 URL 설정 (이 부분이 누락되었었습니다)
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

  // useDropzone 설정 수정
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"]
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    noClick: true  // 클릭 이벤트를 직접 처리하기 위해 비활성화
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
        onClick={open}  // 직접 open 함수 호출
      >
        <input 
          {...getInputProps()} 
          onChange={handleFileSelect}  // 직접 파일 선택 이벤트 처리
        />
        <p className="text-xs text-muted-foreground">
          이미지를 드래그하거나 클릭하여 선택하세요
          <br />
          <span className="text-xs text-gray-500">
            (최대 5MB, JPG/PNG/WebP)
          </span>
        </p>
      </div>

      {previewUrl && (
        <div className="relative">
          <Image
            src={previewUrl}
            alt="Cropped preview"
            width={90}
            height={135}
            className="rounded-lg"
          />
          <Button
            type="button"  // 버튼 타입 명시
            onClick={(e) => {
              e.preventDefault();  // 이벤트 전파 방지
              e.stopPropagation(); // 이벤트 버블링 방지
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