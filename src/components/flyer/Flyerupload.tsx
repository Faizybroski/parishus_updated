import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { cn } from "@/lib/utils";

export default function FlyerUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (url: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  // const [formData, setFormData] = useState({ cover_photo_url: "" });
  const [mode, setMode] = useState<"picture" | "gif">("picture");
  const [files, setFiles] = useState<File[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Cropper state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_: any, areaPixels: any) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  // --- DROPZONE HANDLER ---
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (mode === "gif") {
        setUploading(true); // 👈 immediate state update before async starts
        uploadToSupabase(file).finally(() => setUploading(false));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = new Image();
        image.onload = () => {
          const aspect = image.width / image.height;
          if (Math.abs(aspect - 0.8) < 0.05) {
            // already roughly 4:5, no crop needed
            uploadToSupabase(file);
          } else {
            setImageSrc(e.target?.result as string);
            setCropDialogOpen(true);
          }
        };
        image.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      setFiles(acceptedFiles);
    },
    [mode]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:
      mode === "picture"
        ? { "image/*": [] }
        : { "image/gif": [], "image/*": [] },
    multiple: false,
  });

  // --- CROPPING FUNCTION ---
  async function getCroppedImage(imageSrc: string, crop: any) {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((res) => (image.onload = res));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg");
    });
  }

  // --- UPLOAD TO SUPABASE ---
  async function uploadToSupabase(file: File | Blob) {
    try {
      setUploading(true);
      const fileName = `flyers/${crypto.randomUUID()}-${Date.now()}${
        file instanceof File ? `-${file.name}` : ".jpg"
      }`;

      const { data, error } = await supabase.storage
        .from("event-photos") // ⚠️ Change this to your actual bucket name
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("event-photos")
        .getPublicUrl(fileName);

      onChange?.(publicUrlData.publicUrl);
      setDialogOpen(false);
      setCropDialogOpen(false);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  }

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels);
    await uploadToSupabase(croppedBlob);
  };

  return (
    <>
      {/* --- MAIN SELECTOR CARD --- */}
      <div
        className="bg-primary rounded-md flex items-center justify-center relative overflow-hidden cursor-pointer group aspect-[4/5] w-full max-w-sm mx-auto"
        onClick={() => !uploading && setDialogOpen(true)}
      >
        {!value ? (
          <span className="text-secondary-foreground/80 group-hover:opacity-70 transition">
            {uploading ? "Uploading..." : "Click to upload your flyer"}
          </span>
        ) : (
          <>
            <img
              src={value}
              alt="Event flyer"
              className="w-full h-full object-cover rounded-md"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <span className="text-white text-sm font-medium">
                Change flyer
              </span>
            </div>
          </>
        )}
      </div>

      {/* --- MAIN UPLOAD DIALOG --- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Upload {mode === "picture" ? "Picture" : "GIF"}
            </DialogTitle>
          </DialogHeader>

          {/* MODE TOGGLE */}
          <div className="flex justify-center mb-4 space-x-2">
            <Button
              variant={mode === "picture" ? "default" : "outline"}
              onClick={() => setMode("picture")}
            >
              Pictures
            </Button>
            <Button
              variant={mode === "gif" ? "default" : "outline"}
              onClick={() => setMode("gif")}
            >
              GIFs
            </Button>
          </div>

          {/* DROPZONE */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-md p-10 text-center transition",
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/30 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <p className="text-primary font-medium">Uploading...</p>
            ) : isDragActive ? (
              <p className="text-primary font-medium">Drop files here...</p>
            ) : (
              <p className="text-muted-foreground">
                Drag & drop {mode === "gif" ? "GIFs" : "images"} here, or{" "}
                <span className="text-primary font-medium cursor-pointer">
                  click to select
                </span>
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- CROP DIALOG --- */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-lg h-[500px] flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle>Crop to 4:5 Flyer</DialogTitle>
          </DialogHeader>

          <div className="relative w-full h-[350px] bg-black rounded-md overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Zoom to adjust crop
            </p>
            <Slider
              value={[zoom]}
              onValueChange={(v) => setZoom(v[0])}
              min={1}
              max={3}
              step={0.1}
            />
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setCropDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm} disabled={uploading}>
              {uploading ? "Uploading..." : "Confirm Crop"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
