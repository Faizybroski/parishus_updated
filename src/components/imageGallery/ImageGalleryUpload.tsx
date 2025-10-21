import { useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function ImageGalleryUpload({
  onImagesUploaded,
  existingImages = [],
  bucketName = "event-photos",
}) {
  const [images, setImages] = useState<string[]>([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    if (Array.isArray(existingImages)) {
      setImages(existingImages);
    }
  }, [existingImages]);

  const handleFileSelect = (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        setSelectedIndex(index);
        setCropModalOpen(true);
      }
    };
    input.click();
  };

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedIndex(index);
      setCropModalOpen(true);
    }
  };

  // Generate cropped image blob
  const getCroppedImg = async (imageSrc: string, cropArea: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx!.drawImage(
      image,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, "image/jpeg");
    });
  };

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleUploadCropped = async () => {
    if (!selectedFile || selectedIndex === null) return;

    const imageUrl = URL.createObjectURL(selectedFile);
    const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
    const croppedFile = new File([croppedBlob], selectedFile.name, { type: "image/jpeg" });

    await uploadImage(croppedFile, selectedIndex);

    setCropModalOpen(false);
    setSelectedFile(null);
    setSelectedIndex(null);
  };

  const uploadImage = async (file: File, index: number) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      const newImages = [...images];
      newImages[index] = publicUrl;
      setImages(newImages);
      onImagesUploaded(newImages);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newImages = [...images];
    newImages[index] = "";
    setImages(newImages);
    onImagesUploaded(newImages);
  };

  return (
    <>
      {/* Scrollable selector row */}
      <div className="my-2 pb-2 w-full overflow-x-auto">
        <div className="flex gap-3 min-w-max px-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="relative w-28 aspect-[4/5] rounded-md border border-dashed border-muted-foreground/40 flex-shrink-0 flex items-center justify-center text-muted-foreground bg-secondary hover:bg-secondary/70 transition-colors cursor-pointer"
              onDrop={(e) => handleDrop(e, i)}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => handleFileSelect(i)}
            >
              {images[i] ? (
                <>
                  <img
                    src={images[i]}
                    alt={`upload-${i}`}
                    className="absolute inset-0 w-full h-full object-cover rounded-md"
                  />
                  <button
                    onClick={(e) => handleRemoveImage(e, i)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className="text-sm font-medium">{i + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cropping Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crop Image (4:5)</DialogTitle>
          </DialogHeader>

          <div className="relative w-full h-[400px] bg-black rounded-md overflow-hidden">
            {selectedFile && (
              <Cropper
                image={URL.createObjectURL(selectedFile)}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCropModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadCropped}>Upload Cropped</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
