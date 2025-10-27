import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Image, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function FeatureDialog({
  open,
  onClose,
  onChange,
  existingFeatures = [],
  editFeatureIndex = null,
}) {
  const isEditMode = editFeatureIndex !== null;

  const [feature, setFeature] = useState({
    title: "",
    url: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    description: "",
    image: "",
  });

  const [uploading, setUploading] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isEditMode && existingFeatures[editFeatureIndex]) {
      setFeature(existingFeatures[editFeatureIndex]);
    } else {
      setFeature({
        title: "",
        url: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
        description: "",
        image: "",
      });
    }
  }, [editFeatureIndex, isEditMode, existingFeatures, open]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFeature((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // ✅ Generate a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `event-features/${fileName}`;

      // ✅ Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("event-photos") // your bucket name
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // ✅ Get public URL
      const { data } = supabase.storage
        .from("event-photos")
        .getPublicUrl(filePath);

      setFeature((prev) => ({ ...prev, image: data.publicUrl }));
    } catch (err) {
      console.error("Upload error:", err.message);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFeatureSave = () => {
    const { title, image, start_date, start_time, end_date, end_time } =
      feature;

    // 🔹 Required Fields
    if (!title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a feature title.",
        variant: "destructive",
      });
      return;
    }

    if (!image.trim()) {
      toast({
        title: "Missing Image",
        description: "Please upload an image for this feature.",
        variant: "destructive",
      });
      return;
    }

    // 🔹 Start Date/Time Logic
    if (start_date && !start_time) {
      toast({
        title: "Missing Start Time",
        description:
          "You selected a start date — please also provide a start time.",
        variant: "destructive",
      });
      return;
    }

    // 🔹 End Date/Time Logic
    if ((end_date && !end_time) || (end_time && !end_date)) {
      toast({
        title: "Incomplete End Time",
        description: "Both end date and end time are required together.",
        variant: "destructive",
      });
      return;
    }

    if ((end_date || end_time) && (!start_date || !start_time)) {
      toast({
        title: "Start Required First",
        description:
          "You must set a start date and time before setting an end.",
        variant: "destructive",
      });
      return;
    }

    // 🔹 Chronological Validation
    if (start_date && start_time && end_date && end_time) {
      const start = new Date(`${start_date}T${start_time}`);
      const end = new Date(`${end_date}T${end_time}`);

      if (end < start) {
        toast({
          title: "Invalid Time Range",
          description: "End date/time cannot be before start date/time.",
          variant: "destructive",
        });
        return;
      }
    }

    // ✅ Passed Validation — Save Feature
    // (You can now add or update the feature safely)
    let updated = [...existingFeatures];
    if (isEditMode) updated[editFeatureIndex] = feature;
    else updated.push(feature);

    onChange("eventFeatures", updated);
    onClose();

    toast({
      title: "Feature Saved",
      description: `${title} added successfully.`,
    });
  };

  // const handleSubmit = () => {
  //   let updated = [...existingFeatures];
  //   if (isEditMode) updated[editFeatureIndex] = feature;
  //   else updated.push(feature);
  //   onChange("eventFeatures", updated);
  //   onClose();
  // };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Feature" : "Add Feature"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image Upload */}
          <div className="flex flex-col items-center space-y-3">
            <div
              className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex items-center justify-center w-full h-full text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : feature.image ? (
                <img
                  src={feature.image}
                  alt="Feature"
                  className="object-cover w-full h-full rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-500 bg-primary">
                  <Image className="h-10 w-10 opacity-70" />
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={feature.title}
              onChange={handleFieldChange}
              placeholder="e.g., Live Concert"
            />
          </div>

          {/* URL */}
          <div className="space-y-1">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="url"
              value={feature.url}
              onChange={handleFieldChange}
              placeholder="https://example.com"
            />
          </div>

          {/* Toggle Dates & Time */}
          <div className="flex items-center justify-between mt-2">
            <Label>Show Date & Time</Label>
            <Switch checked={showDates} onCheckedChange={setShowDates} />
          </div>

          {showDates && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  name="start_date"
                  value={feature.start_date}
                  onChange={handleFieldChange}
                />
              </div>
              <div className="space-y-1">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  name="start_time"
                  value={feature.start_time}
                  onChange={handleFieldChange}
                />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input
                  type="date"
                  name="end_date"
                  value={feature.end_date}
                  onChange={handleFieldChange}
                />
              </div>
              <div className="space-y-1">
                <Label>End Time</Label>
                <Input
                  type="time"
                  name="end_time"
                  value={feature.end_time}
                  onChange={handleFieldChange}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              value={feature.description}
              onChange={handleFieldChange}
              placeholder="Write a short description..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleFeatureSave} disabled={uploading}>
            {isEditMode ? "Save Changes" : "Add Feature"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
