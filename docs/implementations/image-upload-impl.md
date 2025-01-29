# 이미지 업로드 시스템 상세 구현

구현 파일:
- src/components/ImageUploader.tsx
- src/components/CropImageDialog.tsx
- src/app/api/uploadthing/core.ts
- src/app/api/uploadthing/route.ts

## 1. 이미지 업로더 컴포넌트

### 1.1 개요
```typescript
목적:
- 이미지 파일 업로드
- 이미지 크롭 기능
- 드래그 앤 드롭 지원

특징:
- 파일 크기 제한
- 이미지 미리보기
- 반응형 UI
```

### 1.2 컴포넌트 구조
```typescript
interface ImageUploaderProps {
  onImagePrepared: (imageData: { file: File, preview: string }) => void;
  aspectRatio?: number;
  username?: string;
}

// 상태 관리
const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [uploadFileName, setUploadFileName] = useState<string>('');
```

### 1.3 파일 처리
```typescript
// 파일 드롭 처리
const onDrop = useCallback(async (acceptedFiles: File[]) => {
  const file = acceptedFiles[0];
  if (!file) return;

  setUploadFileName(file.name);

  const reader = new FileReader();
  reader.onload = () => {
    setCropImageUrl(reader.result as string);
    toast({
      description: "이미지를 크롭해주세요.",
    });
  };
  reader.readAsDataURL(file);
}, [toast]);

// Dropzone 설정
const { getRootProps, getInputProps } = useDropzone({
  onDrop,
  accept: {
    "image/*": [".png", ".jpg", ".jpeg", ".webp"]
  },
  maxSize: 5 * 1024 * 1024,
  multiple: false,
  noClick: true
});
```

## 2. 이미지 크롭 다이얼로그

### 2.1 개요
```typescript
목적:
- 이미지 크롭 UI 제공
- 비율 제한 적용
- 크롭 결과 처리

특징:
- react-cropper 사용
- 모달 다이얼로그
- 실시간 미리보기
```

### 2.2 컴포넌트 구조
```typescript
interface CropImageDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  aspectRatio?: number;
  onCrop: (croppedImage: string) => void;
}

// 크롭 처리
const handleCrop = useCallback(() => {
  const cropper = cropperRef.current?.cropper;
  if (!cropper) return;

  cropper.getCroppedCanvas().toBlob((blob) => {
    if (!blob) return;
    onCrop(URL.createObjectURL(blob));
    onClose();
  }, "image/jpeg");
}, [onCrop, onClose]);
```

### 2.3 크로퍼 설정
```typescript
<Cropper
  ref={cropperRef}
  src={imageUrl}
  style={{ height: 400, width: "100%" }}
  aspectRatio={aspectRatio}
  guides={false}
  viewMode={1}
  dragMode="move"
/>
```

## 3. 이미지 처리 로직

### 3.1 파일 변환
```typescript
const handleCrop = async (croppedImage: string) => {
  try {
    const response = await fetch(croppedImage);
    const blob = await response.blob();
    
    // 파일명 생성
    const originalName = uploadFileName || 'image.jpg';
    const fileName = `${username || 'unknown'}_${originalName}`;

    // File 객체 생성
    const file = new File([blob], fileName, { 
      type: blob.type || 'image/jpeg'
    });

    // 결과 전달
    onImagePrepared({
      file,
      preview: croppedImage
    });
  } catch (error) {
    console.error("이미지 처리 실패:", error);
    toast({
      variant: "destructive",
      description: "이미지 처리에 실패했습니다.",
    });
  }
};
```

## 4. 성능 최적화

### 4.1 메모리 관리
```typescript
1. 리소스 정리
   - URL.revokeObjectURL 사용
   - 불필요한 상태 정리
   - 메모리 누수 방지

2. 이미지 최적화
   - 크기 제한
   - 포맷 최적화
   - 압축 처리
```

### 4.2 사용자 경험
```typescript
1. 로딩 상태
   - 업로드 진행 표시
   - 에러 피드백
   - 성공 알림

2. 접근성
   - 키보드 지원
   - 스크린리더 지원
   - 포커스 관리
```

## 5. 보안 고려사항

### 5.1 파일 검증
```typescript
1. 입력 검증
   - 파일 크기 제한
   - 형식 검증
   - MIME 타입 확인

2. 보안 처리
   - XSS 방지
   - 파일명 살균
   - 메타데이터 제거
```

### 5.2 업로드 보안
```typescript
1. 권한 관리
   - 사용자 인증
   - 용량 제한
   - 접근 제어

2. 저장소 보안
   - 안전한 저장
   - 접근 제한
   - 백업 관리
