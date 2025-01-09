import { useState, useCallback, useRef } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CropImageDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  aspectRatio?: number;
  onCrop: (croppedImage: string) => void;
}

export function CropImageDialog({
  open,
  onClose,
  imageUrl,
  aspectRatio = 2/3,
  onCrop,
}: CropImageDialogProps) {
  const cropperRef = useRef<ReactCropperElement>(null);

  const handleCrop = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    cropper.getCroppedCanvas().toBlob((blob) => {
      if (!blob) return;
      onCrop(URL.createObjectURL(blob));
      onClose();
    }, "image/jpeg");
  }, [onCrop, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>이미지 크롭</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Cropper
            ref={cropperRef}
            src={imageUrl}
            style={{ height: 400, width: "100%" }}
            aspectRatio={aspectRatio}
            guides={false}
            viewMode={1}
            dragMode="move"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleCrop}>
            적용
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}