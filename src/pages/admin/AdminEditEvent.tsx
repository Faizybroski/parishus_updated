import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoaderText } from "@/components/loader/Loader";
import { useProfile } from "@/hooks/useProfile";
import { useParams } from "react-router-dom";
import { useRestaurants, Restaurant } from "@/hooks/useRestaurants";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Upload,
  Edit2,
  Trash2,
  PlusCircle,
  Plus,
  X,
  Users,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
const today = format(new Date(), "yyyy-MM-dd");
import { RestaurantSearchDropdown } from "@/components/restaurants/RestaurantSearchDropdown";
import { EmailInviteModal } from "@/components/Invitationmodals/EmailInviteModal";
import { CrossedPathInviteModal } from "@/components/Invitationmodals/CrossedPathInviteModal";
import { getEmailsFromIds } from "@/lib/getEmailsFromIds";
import { sendEventInvite } from "@/lib/sendInvite";
import GooglePlacesEventsForm from "@/components/restaurants/GooglePlacesEventsForm";
import FlyerUpload from "@/components/flyer/Flyerupload";
import ImageGalleryUpload from "@/components/imageGallery/ImageGalleryUpload";
import FeatureDialog from "@/components/eventfeatures/FeaturedDialog";
import RecurringEventDialog from "@/components/recurringEvent/AddRecurringEvent";
import ColorThief from "colorthief";
import bcrypt from "bcryptjs";

const AdminEditEvent = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    start_time: "",
    location_name: "",
    location_address: "",
    location_lat: "",
    location_lng: "",
    restaurant_id: "",
    max_attendees: 10,
    dining_style: "",
    dietary_theme: "",
    rsvp_deadline_date: "",
    rsvp_deadline_time: "",
    tags: [] as string[],
    is_mystery_dinner: false,
    guest_invitation_type: "",
    is_private: false,
    is_paid: false,
    guestList: true,
    features: false,
    is_password_protected: false,
    tiktok: false,
    tiktokLink: "",
    event_password: "",
    explore: true,
    imageGallery: false,
    event_fee: "",
    flyer_url: "",
    imageGalleryLinks: [] as string[],
    eventFeatures: [],
    recurring: false,
    recurrenceDates: [],
    end_date: "",
    end_time: "",
  });

  const [newTag, setNewTag] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();
  const [emailInviteModelOpen, setEmailInviteModelOpen] = useState(false);
  const [invitedGuestIds, setInvitedGuestIds] = useState<string[]>([]);
  const [crossedPathInviteModelOpen, setCrossedPathInviteModelOpen] =
    useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [editFeatureIndex, setEditFeatureIndex] = useState(null);
  const [colors, setColors] = useState([]);
  const [selectedFont, setSelectedFont] = useState("");
  const [selectedColor, setSelectedColor] = useState("#E4D7CD");
  const [selectedBgColor, setSelectedBgColor] = useState("#F8F6F1");
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [mode, setMode] = useState<"sell" | "rsvp">("sell");

  const navigate = useNavigate();

  useEffect(() => {
    if (!formData.flyer_url) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = formData.flyer_url;
    img.onload = () => {
      const colorThief = new ColorThief();
      const palette = colorThief.getPalette(img, 10);
      setColors(palette.map(([r, g, b]) => `rgb(${r},${g},${b})`));
    };
  }, [formData.flyer_url]);

  const dummyPictures = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=500&q=80",
  ];

  const FONT_OPTIONS = [
    "Cormorant",
    "Unbounded",
    "Audiowide",
    "Tagesschrift",
    "Raleway",
    "Space Mono",
    "Caprasimo",
    "Metal Mania",
    "Dancing Script",
    "Sergio Trendy",
    "Crimson Text",
  ];

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      // Populate form with existing data
      const eventDate = new Date(data.date_time);
      const rsvpDeadline = data.rsvp_deadline
        ? new Date(data.rsvp_deadline)
        : null;
      const eventEndDateTime = data.eventEndDateTime
        ? new Date(data.eventEndDateTime)
        : null;

      setSelectedFont(data.title_font || "");
      setSelectedColor(data.accent_color || "#E4D7CD");
      setSelectedBgColor(data.accent_bg || "#F8F6F1");
      setMode(data.is_paid ? "sell" : "rsvp");

      setFormData({
        name: data.name.trim() || "",
        description: data.description.trim() || "",
        start_date: eventDate.toISOString().split("T")[0],
        start_time: eventDate.toTimeString().slice(0, 5),
        location_name: data.location_name.trim() || "",
        location_address: data.location_address.trim() || "",
        location_lat: data.location_lat || "",
        location_lng: data.location_lng || "",
        restaurant_id: data.restaurant_id || "",
        max_attendees: data.max_attendees || 10,
        dining_style: data.dining_style || "",
        dietary_theme: data.dietary_theme || "",
        guest_invitation_type: data.guest_invitation_type,
        is_paid: data.is_paid,
        event_fee: data.event_fee,
        rsvp_deadline_date: rsvpDeadline
          ? rsvpDeadline.toISOString().split("T")[0]
          : "",
        rsvp_deadline_time: rsvpDeadline
          ? rsvpDeadline.toTimeString().slice(0, 5)
          : "",
        tags: data.tags || [],
        flyer_url: data.cover_photo_url || "",
        is_mystery_dinner: data.is_mystery_dinner || false,
        is_password_protected: data.is_password_protected || false,
        explore: data.explore || true,
        imageGallery: data.imageGallery || false,
        imageGalleryLinks: data.imageGalleryLinks || [],
        eventFeatures: data.eventFeatures || [],
        recurring: data.recurrence || false,
        recurrenceDates: data.recurrence_dates || [],
        end_date: eventEndDateTime
          ? eventEndDateTime.toISOString().split("T")[0]
          : "",
        end_time: eventEndDateTime
          ? eventEndDateTime.toTimeString().slice(0, 5)
          : "",
        tiktok: data.tiktok || false,
        tiktokLink: data.tiktok_Link || "",
        guestList: data.guest_list || true,
        features: data.features || false,
        eventFeatures: data.event_features || [],
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
      navigate("/admin/events");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "guest_invitation_type" && value === "manual") {
      setEmailInviteModelOpen(true);
    }
    if (field === "guest_invitation_type" && value === "crossed_paths") {
      setCrossedPathInviteModelOpen(true);
    }
  };

  function lightenColor(color: string, percent = 20) {
    // Convert to RGB
    let r, g, b;

    if (color.startsWith("#")) {
      const num = parseInt(color.slice(1), 16);
      r = (num >> 16) & 255;
      g = (num >> 8) & 255;
      b = num & 255;
    } else if (color.startsWith("rgb")) {
      const match = color.match(/\d+/g);
      if (!match) return color;
      [r, g, b] = match.map(Number);
    } else {
      return color;
    }

    // Apply lighten factor
    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

    return `rgb(${r}, ${g}, ${b})`;
  }

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    handleInputChange("title_font", font);
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const bgColor = lightenColor(color, 30);
    setSelectedBgColor(bgColor);

    handleInputChange("accent_color", color);
    handleInputChange("accent_bg", bgColor);

    document.documentElement.style.setProperty("--accent-color", color);
    document.documentElement.style.setProperty("--accent-bg", bgColor);
  };

  const handleFlyerChange = (url: string) => {
    setFormData((prev) => ({ ...prev, flyer_url: url }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `event-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("event-photos").getPublicUrl(filePath);

      handleInputChange("cover_photo_url", publicUrl);
      toast({
        title: "Photo uploaded!",
        description: "Your event cover photo has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast({
        title: "Authentication required",
        description: "Please log in to update events",
        variant: "destructive",
      });
      return;
    }

    if (!formData.flyer_url) {
      toast({
        title: "Image required",
        description: "Please upload an event photo",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Event name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Event description cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.start_date) {
      toast({
        title: "Validation Error",
        description: "Please select an event date.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.start_time) {
      toast({
        title: "Validation Error",
        description: "Please select an event time.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.location_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Event location cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (
      new Date(`${formData.start_date}T${formData.start_time}`) < new Date()
    ) {
      toast({
        title: "Validation Error",
        description: "Event date and time must be in the future.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.max_attendees) {
      toast({
        title: "Validation Error",
        description: "Please specify the maximum number of attendees.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.guest_invitation_type) {
      toast({
        title: "Validation Error",
        description: "Please select a guest invitation type.",
        variant: "destructive",
      });
      return;
    }

    if (
      mode === "sell" &&
      (!formData.event_fee || Number(formData.event_fee) <= 0)
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid event fee for paid events.",
        variant: "destructive",
      });
      return;
    }

    if (formData.tiktok) {
      if (!formData.tiktokLink) {
        toast({
          title: "Validation Error",
          description: "Please give URL for TikTok video.",
          variant: "destructive",
        });
        return;
      }
    }

    if (formData.features) {
      if (formData.eventFeatures.length <= 0) {
        toast({
          title: "Validation Error",
          description: "Please give atleast one feature for event features.",
          variant: "destructive",
        });
        return;
      }
    }

    if (formData.imageGallery) {
      if (formData.imageGalleryLinks.length <= 0) {
        toast({
          title: "Validation Error",
          description: "Please give atleast one image for image gallery.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      let passwordHashed = null;

      if (formData.is_password_protected) {
        const trimmedPassword = formData.event_password
          ? formData.event_password.trim()
          : null;
        if (trimmedPassword === null || trimmedPassword.length === 0) {
          toast({
            title: "Validation Error",
            description: "Password cannot be empty if protection is enabled.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const salt = await bcrypt.genSalt(10);
        passwordHashed = await bcrypt.hash(trimmedPassword, salt);
      }

      const eventDateTime = new Date(
        `${formData.start_date}T${formData.start_time}`
      );

      let eventEndDateTime: Date | null = null;

      if (formData.end_date || formData.end_time) {
        if (!formData.end_date || !formData.end_time) {
          toast({
            title: "Invalid end time",
            description: "Please provide both end date and end time.",
            variant: "destructive",
          });
          return;
        }

        const endDateTime = new Date(
          `${formData.end_date}T${formData.end_time}`
        );

        if (isNaN(endDateTime.getTime())) {
          toast({
            title: "Invalid date or time format",
            description: "Please ensure the end date and time are valid.",
            variant: "destructive",
          });
          return;
        }

        const now = new Date();
        if (endDateTime < now) {
          toast({
            title: "End time in the past",
            description: "End date and time cannot be in the past.",
            variant: "destructive",
          });
          return;
        }

        eventEndDateTime = endDateTime;
      }

      let rsvpDeadline = null;

      if (formData.rsvp_deadline_date && formData.rsvp_deadline_time) {
        rsvpDeadline = new Date(
          `${formData.rsvp_deadline_date}T${formData.rsvp_deadline_time}`
        );
      } else if (formData.rsvp_deadline_date) {
        rsvpDeadline = new Date(`${formData.rsvp_deadline_date}T23:59`);
      } else {
        rsvpDeadline = eventDateTime;
      }

      const { data, error } = await supabase
        .from("events")
        .update({
          guest_user_ids: invitedGuestIds,
          date_time: eventDateTime.toISOString(),
          location_name: formData.location_name,
          location_address: formData.location_address,
          location_lng: formData.location_lng,
          location_lat: formData.location_lat,
          restaurant_id: formData.restaurant_id || null,
          max_attendees: formData.max_attendees,
          status: "active",
          dining_style: formData.dining_style || null,
          dietary_theme: formData.dietary_theme || null,
          rsvp_deadline: rsvpDeadline?.toISOString() || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          cover_photo_url: formData.flyer_url,
          is_mystery_dinner: formData.is_mystery_dinner,
          description: formData.description,
          name: formData.name,
          guest_invitation_type: formData.guest_invitation_type,
          auto_suggest_crossed_paths:
            formData.guest_invitation_type === "crossed_paths",
          is_paid: mode === "sell" ? true : false,
          event_fee: mode === "sell" ? formData.event_fee : null,
          guest_list: formData.guestList,
          tiktok: formData.tiktok,
          tiktok_Link: formData.tiktok ? formData.tiktokLink : null,
          imageGallery: formData.imageGallery,
          imageGalleryLinks: formData.imageGallery
            ? formData.imageGalleryLinks
            : null,
          features: formData.features,
          event_features: formData.features ? formData.eventFeatures : null,
          title_font: selectedFont,
          accent_color: selectedColor,
          accent_bg: selectedBgColor,
          recurrence: formData.recurring,
          recurrence_dates: formData.recurring
            ? formData.recurrenceDates
            : null,
          eventEndDateTime: eventEndDateTime
            ? eventEndDateTime.toISOString()
            : null,
        } as any)
        .eq("id", eventId);

      if (error) throw error;
      const eventLink = `${window.location.origin}/event/${eventId}/details`;
      const emails = invitedEmails;

      if (
        (!emails || emails.length === 0) &&
        (!invitedGuestIds || invitedGuestIds.length === 0)
      ) {
        localStorage.setItem("eventUpdated", Date.now().toString());
        window.dispatchEvent(new CustomEvent("eventUpdated"));

        toast({
          title: "Event updated!",
          description: "Your event has been updated successfully.",
        });

        navigate("/admin/events");
        return;
      }

      // const emails = await getEmailsFromIds(invitedGuestIds);
      await sendEventInvite({
        to: emails,
        subject: "You're Invited to a Secret TableTalk 🍷",
        text: `Hi friend, you’ve been invited to a private dinner hosted on Parish!\n\nJoin here: ${eventLink}`,
      });

      localStorage.setItem("eventUpdated", Date.now().toString());
      window.dispatchEvent(new CustomEvent("eventUpdated"));

      toast({
        title: "Event updated!",
        description: "Your event has been updated successfully.",
      });
      navigate("/admin/events");
    } catch (error: any) {
      toast({
        title: "Error creating event",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureDelete = (index) => {
    const updated = formData.eventFeatures.filter((_, i) => i !== index);
    handleInputChange("eventFeatures", updated);
  };

  const isFormValid =
    formData.name &&
    formData.description &&
    formData.start_time &&
    formData.start_date &&
    formData.location_name &&
    formData.flyer_url;

  // Show loading while authentication or profile is loading
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    console.log("No user, redirecting to auth");
    navigate("/auth");
    return null;
  }

  // Show error if no profile
  if (!profile) {
    console.log("No profile found");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Profile Required
          </h2>
          <p className="text-muted-foreground">
            Please complete your profile to update events.
          </p>
          <Link to="/profile">
            <Button className="">Complete Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={
        selectedColor
          ? ({
              "--accent-bg": lightenColor(selectedBgColor),
              background: "var(--accent-bg)",
              transition: "background 0.5s ease",
            } as React.CSSProperties)
          : ({ transition: "background 0.5s ease" } as React.CSSProperties)
      }
    >
      <EmailInviteModal
        style={
          {
            "--accent-bg": lightenColor(selectedColor),
            background:
              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
            transition: "background 0.5s ease",
          } as React.CSSProperties
        }
        style_button={
          selectedColor
            ? {
                backgroundColor: selectedColor,
                borderColor: selectedColor,
              }
            : {}
        }
        open={emailInviteModelOpen}
        onClose={() => setEmailInviteModelOpen(false)}
        onInviteResolved={(guestIds) => setInvitedGuestIds(guestIds)}
        getInviteEmails={(emails) => setInvitedEmails(emails)}
        subscriptionStatus={"premium"}
      />

      <CrossedPathInviteModal
        style={
          {
            "--accent-bg": lightenColor(selectedColor),
            background:
              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
            transition: "background 0.5s ease",
          } as React.CSSProperties
        }
        style_button={
          selectedColor
            ? {
                backgroundColor: selectedColor,
                borderColor: selectedColor,
              }
            : {}
        }
        open={crossedPathInviteModelOpen}
        onClose={() => setCrossedPathInviteModelOpen(false)}
        onInviteResolved={(guestIds) => setInvitedGuestIds(guestIds)}
        subscriptionStatus={"premium"}
      />

      <form onSubmit={handleSubmit}>
        <div className="flex justify-center">
          <div
            className="flex items-center space-x-1 mt-3 px-1 py-1 bg-secondary rounded-full"
            style={
              selectedBgColor
                ? {
                    backgroundColor: selectedBgColor,
                  }
                : {}
            }
          >
            <Button
              type="button"
              size="sm"
              onClick={() => setMode("sell")}
              className={`rounded-full px-4 text-sm font-medium transition-all duration-200 ${
                mode === "sell"
                  ? "bg-primary text-primary-foreground shadow-lg text-lg"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
              style={{
                backgroundColor:
                  mode === "sell" ? "var(--accent-color)" : "transparent",
                borderColor: "var(--accent-color)",
              }}
            >
              Sell Tickets
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setMode("rsvp")}
              className={`rounded-full px-4 text-sm font-medium transition-all duration-200 ${
                mode === "rsvp"
                  ? "bg-primary text-primary-foreground shadow-lg text-lg"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
              style={{
                backgroundColor:
                  mode === "rsvp" ? "var(--accent-color)" : "transparent",
                borderColor: "var(--accent-color)",
              }}
            >
              RSVP
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 p-6">
          <div className="flex-1 space-y-6 min-w-0">
            <Card
              className="space-y-2"
              style={
                {
                  "--accent-bg": lightenColor(selectedColor),
                  background:
                    "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                  transition: "background 0.5s ease",
                } as React.CSSProperties
              }
            >
              <CardHeader>
                <CardTitle>Name & Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Wine Tasting Social"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    style={
                      {
                        "--accent-bg": lightenColor(selectedColor),
                        background:
                          "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                        transition: "background 0.5s ease",
                        fontFamily: selectedFont,
                      } as React.CSSProperties
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your event, what to expect, dress code, etc."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    style={
                      {
                        "--accent-bg": lightenColor(selectedColor),
                        background:
                          "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                        transition: "background 0.5s ease",
                      } as React.CSSProperties
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card
              className="space-y-2"
              style={
                {
                  "--accent-bg": lightenColor(selectedColor),
                  background:
                    "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                  transition: "background 0.5s ease",
                } as React.CSSProperties
              }
            >
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="start_date"
                        type="date"
                        min={today}
                        value={formData.start_date}
                        onChange={(e) =>
                          handleInputChange("start_date", e.target.value)
                        }
                        className="pl-10"
                        style={
                          {
                            "--accent-bg": lightenColor(selectedColor),
                            background:
                              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                            transition: "background 0.5s ease",
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_time">Time Start *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) =>
                          handleInputChange("start_time", e.target.value)
                        }
                        className="pl-10"
                        style={
                          {
                            "--accent-bg": lightenColor(selectedColor),
                            background:
                              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                            transition: "background 0.5s ease",
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="end_date"
                        type="date"
                        min={today}
                        className="pl-10"
                        value={formData.end_date}
                        onChange={(e) =>
                          handleInputChange("end_date", e.target.value)
                        }
                        style={
                          {
                            "--accent-bg": lightenColor(selectedColor),
                            background:
                              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                            transition: "background 0.5s ease",
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Time End</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) =>
                          handleInputChange("end_time", e.target.value)
                        }
                        className="pl-10"
                        style={
                          {
                            "--accent-bg": lightenColor(selectedColor),
                            background:
                              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                            transition: "background 0.5s ease",
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rsvp_deadline_date">
                      RSVP Deadline Date
                    </Label>
                    <Input
                      id="rsvp_deadline_date"
                      type="date"
                      min={today}
                      value={formData.rsvp_deadline_date}
                      onChange={(e) =>
                        handleInputChange("rsvp_deadline_date", e.target.value)
                      }
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rsvp_deadline_time">
                      RSVP Deadline Time
                    </Label>
                    <Input
                      id="rsvp_deadline_time"
                      type="time"
                      value={formData.rsvp_deadline_time}
                      onChange={(e) =>
                        handleInputChange("rsvp_deadline_time", e.target.value)
                      }
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_attendees">Maximum Attendees *</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    min="2"
                    max="50"
                    value={formData.max_attendees}
                    onChange={(e) =>
                      handleInputChange(
                        "max_attendees",
                        parseInt(e.target.value)
                      )
                    }
                    style={
                      {
                        "--accent-bg": lightenColor(selectedColor),
                        background:
                          "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                        transition: "background 0.5s ease",
                      } as React.CSSProperties
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurring">Recurring Series *</Label>
                  <div className="border py-3 px-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="recurring">
                        {formData.recurring == true ? "Yes" : "No"}
                      </Label>
                      <Checkbox
                        id="recurring"
                        checked={formData.recurring}
                        onCheckedChange={(checked) => {
                          handleInputChange("recurring", checked);
                        }}
                        style={
                          {
                            "--accent-bg": lightenColor(selectedColor),
                            background:
                              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                            transition: "background 0.5s ease",
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    {formData.recurring && (
                      <div className="space-y-4 mt-2 rounded-lg p-3">
                        {formData.recurrenceDates.length === 0 ? (
                          <div className="flex justify-between items-center border rounded-lg px-4 py-3">
                            <p className="text-sm text-muted-foreground italic">
                              No event recurring dates added yet.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => {
                                setShowRecurringDialog(true);
                              }}
                              className="rounded-full"
                              style={
                                selectedColor
                                  ? {
                                      backgroundColor: selectedColor,
                                      borderColor: selectedColor,
                                    }
                                  : {}
                              }
                            >
                              <PlusCircle className="w-4 h-4 mr-1" />
                              Add Recurrence date
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {formData.recurrenceDates.map((date, i) => (
                                <div
                                  key={i}
                                  className="bg-secondary border rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-all"
                                  style={
                                    {
                                      "--accent-bg":
                                        lightenColor(selectedColor),
                                      background:
                                        "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                                      transition: "background 0.5s ease",
                                    } as React.CSSProperties
                                  }
                                >
                                  <div className="flex items-center space-x-4">
                                    {new Date(date).toLocaleDateString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  setShowRecurringDialog(true);
                                }}
                                className="rounded-full mt-2"
                                style={
                                  selectedColor
                                    ? {
                                        backgroundColor: selectedColor,
                                        borderColor: selectedColor,
                                      }
                                    : {}
                                }
                              >
                                <PlusCircle className="w-4 h-4 mr-1" />
                                Add Recurrence Date
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              style={
                {
                  "--accent-bg": lightenColor(selectedColor),
                  background:
                    "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                  transition: "background 0.5s ease",
                } as React.CSSProperties
              }
            >
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="sspace-y-2 relative">
                  <Label htmlFor="restaurant">
                    Choose Restaurant (Optional)
                  </Label>
                  <RestaurantSearchDropdown
                    style={
                      {
                        "--accent-bg": lightenColor(selectedColor),
                        background:
                          "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                        transition: "background 0.5s ease",
                      } as React.CSSProperties
                    }
                    placeholder="Search and select a restaurant"
                    restaurants={restaurants}
                    value={formData.restaurant_id}
                    onSelect={(restaurant: Restaurant | null) => {
                      if (restaurant) {
                        handleInputChange("restaurant_id", restaurant.id);
                        handleInputChange("location_name", restaurant.name);
                        handleInputChange(
                          "location_lat",
                          restaurant.latitude.toString()
                        );
                        handleInputChange(
                          "location_lng",
                          restaurant.longitude.toString()
                        );
                        handleInputChange(
                          "location_address",
                          restaurant.full_address
                        );
                      } else {
                        handleInputChange("restaurant_id", "");
                        handleInputChange("location_name", "");
                        handleInputChange("location_address", "");
                        handleInputChange("location_lat", "");
                        handleInputChange("location_lng", "");
                      }
                    }}
                  />
                </div>
                <GooglePlacesEventsForm
                  style={
                    {
                      "--accent-bg": lightenColor(selectedColor),
                      background:
                        "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                      transition: "background 0.5s ease",
                    } as React.CSSProperties
                  }
                  formData={formData}
                  onChange={handleInputChange}
                />
              </CardContent>
            </Card>

            {mode === "sell" && (
              <Card
                style={
                  {
                    "--accent-bg": lightenColor(selectedColor),
                    background:
                      "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                    transition: "background 0.5s ease",
                  } as React.CSSProperties
                }
              >
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="event_fee">Event Fee (USD) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="event_fee"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.event_fee ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            "event_fee",
                            parseFloat(e.target.value)
                          )
                        }
                        className="pl-10"
                        required={mode === "sell"}
                        style={
                          {
                            "--accent-bg": lightenColor(selectedColor),
                            background:
                              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                            transition: "background 0.5s ease",
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Type Card */}
            <Card
              style={
                {
                  "--accent-bg": lightenColor(selectedColor),
                  background:
                    "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                  transition: "background 0.5s ease",
                } as React.CSSProperties
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Event Privacy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border px-4 py-2 rounded-md mb-2">
                  <Label htmlFor="is_private">
                    {formData.is_private ? "Private Event" : "Public Event"}
                  </Label>
                  <Checkbox
                    id="is_private"
                    checked={formData.is_private}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_private", checked)
                    }
                    className="w-4 h-4"
                    style={
                      {
                        "--accent-bg": lightenColor(selectedColor),
                        background:
                          "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                        transition: "background 0.5s ease",
                      } as React.CSSProperties
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Guest Invitation Type Card */}
            <Card
              style={
                {
                  "--accent-bg": lightenColor(selectedColor),
                  background:
                    "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                  transition: "background 0.5s ease",
                } as React.CSSProperties
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Guest Invitation Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="manual"
                      name="guest_invitation_type"
                      value="manual"
                      checked={formData.guest_invitation_type === "manual"}
                      onCheckedChange={(e) =>
                        handleInputChange("guest_invitation_type", "manual")
                      }
                      className="w-4 h-4"
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    />
                    <Label htmlFor="manual">Manually Invite Guests</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="crossed_paths"
                      name="guest_invitation_type"
                      value="crossed_paths"
                      checked={
                        formData.guest_invitation_type === "crossed_paths"
                      }
                      onCheckedChange={(e) =>
                        handleInputChange(
                          "guest_invitation_type",
                          "crossed_paths"
                        )
                      }
                      className="w-4 h-4"
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    />
                    <Label htmlFor="crossed_paths">
                      Suggest from Crossed Paths
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Crossed Paths suggests users you've recently visited the
                    same restaurants with
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              style={
                {
                  "--accent-bg": lightenColor(selectedColor),
                  background:
                    "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                  transition: "background 0.5s ease",
                } as React.CSSProperties
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  Extras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border py-2 rounded-md">
                  <div className="flex justify-between items-center px-4">
                    <Label htmlFor="guestList">Guestlist</Label>
                    <Checkbox
                      id="guestList"
                      checked={formData.guestList}
                      onCheckedChange={(checked) =>
                        handleInputChange("guestList", checked)
                      }
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  {formData.guestList && (
                    <>
                      <p className="mt-2 px-4">David and 09 others going</p>
                      <div className="flex gap-2 mt-2 overflow-x-auto px-3.5">
                        {dummyPictures.map((i, idx) => (
                          <Avatar
                            key={idx}
                            className="h-8 w-8 sm:h-16 sm:w-16 flex-shrink-0"
                          >
                            <AvatarImage src={i} />
                          </Avatar>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="border px-4 py-2 rounded-md">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="features">Event Features</Label>
                    <Checkbox
                      id="features"
                      checked={formData.features}
                      onCheckedChange={(checked) =>
                        handleInputChange("features", checked)
                      }
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  {formData.features && (
                    <div className="space-y-4 mt-2 rounded-lg p-3">
                      {/* Empty state */}
                      {formData.eventFeatures.length === 0 ? (
                        <div className="flex justify-between items-center border rounded-lg px-4 py-3">
                          <p className="text-sm text-muted-foreground italic">
                            No event features added yet.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                              setEditFeatureIndex(null);
                              setShowFeatures(true);
                            }}
                            className="rounded-full"
                            style={
                              selectedColor
                                ? {
                                    backgroundColor: selectedColor,
                                    borderColor: selectedColor,
                                  }
                                : {}
                            }
                          >
                            <PlusCircle className="w-4 h-4 mr-1" />
                            Add Feature
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-3">
                            {formData.eventFeatures.map((feature, i) => (
                              <div
                                key={i}
                                className="bg-secondary border rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-all"
                                style={
                                  {
                                    "--accent-bg": lightenColor(selectedColor),
                                    background:
                                      "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                                    transition: "background 0.5s ease",
                                  } as React.CSSProperties
                                }
                              >
                                {/* Feature content */}
                                <div className="flex items-center space-x-4">
                                  <img
                                    src={feature.image || "/placeholder.png"}
                                    alt={feature.title || "Feature image"}
                                    className="w-20 h-20 object-cover rounded-full border"
                                    onError={(e) =>
                                      (e.currentTarget.src = "/placeholder.png")
                                    }
                                  />
                                  <div className="flex flex-col">
                                    <h3 className="font-semibold text-lg">
                                      {feature.title || "Untitled Feature"}
                                    </h3>
                                    {feature.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {feature.description}
                                      </p>
                                    )}
                                    {feature.url && (
                                      <Link
                                        to={feature.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline break-all"
                                      >
                                        {feature.url}
                                      </Link>
                                    )}
                                    {feature.start_date &&
                                      feature.start_time && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {(() => {
                                            // Parse dates/times safely
                                            const start = new Date(
                                              `${feature.start_date}T${feature.start_time}`
                                            );
                                            const end =
                                              feature.end_date &&
                                              feature.end_time
                                                ? new Date(
                                                    `${feature.end_date}T${feature.end_time}`
                                                  )
                                                : null;

                                            // Format like 28/10 04:23pm
                                            const formatDateTime = (
                                              dt: Date
                                            ) => {
                                              const date =
                                                dt.toLocaleDateString("en-GB", {
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                });
                                              const time = dt
                                                .toLocaleTimeString("en-US", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                  hour12: true,
                                                })
                                                .toLowerCase();
                                              return `${date} ${time}`;
                                            };

                                            return (
                                              <span
                                                className="bg-background border px-2 py-1 rounded-md"
                                                style={
                                                  {
                                                    "--accent-bg":
                                                      lightenColor(
                                                        selectedColor
                                                      ),
                                                    background:
                                                      "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                                                    transition:
                                                      "background 0.5s ease",
                                                  } as React.CSSProperties
                                                }
                                              >
                                                {formatDateTime(start)}
                                                {end
                                                  ? ` - ${formatDateTime(end)}`
                                                  : ""}
                                              </span>
                                            );
                                          })()}
                                        </div>
                                      )}
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex space-x-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    type="button"
                                    onClick={() => {
                                      setEditFeatureIndex(i);
                                      setShowFeatures(true);
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    type="button"
                                    onClick={() => handleFeatureDelete(i)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Add Feature CTA */}
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => {
                                setEditFeatureIndex(null);
                                setShowFeatures(true);
                              }}
                              className="rounded-full mt-2"
                              style={
                                selectedColor
                                  ? {
                                      backgroundColor: selectedColor,
                                      borderColor: selectedColor,
                                    }
                                  : {}
                              }
                            >
                              <PlusCircle className="w-4 h-4 mr-1" />
                              Add Feature
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="border px-4 py-2 rounded-md">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="tiktok">TikTok Video</Label>
                    <Checkbox
                      id="tiktok"
                      checked={formData.tiktok}
                      onCheckedChange={(checked) =>
                        handleInputChange("tiktok", checked)
                      }
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  {formData.tiktok && (
                    <div
                      className="bg-primary rounded-md mt-2 px-4 py-3"
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    >
                      <div className="space-y-2">
                        <Label htmlFor="tiktokLink">Link for TikTok *</Label>
                        <div className="relative">
                          <Input
                            id="tiktokLink"
                            type="url"
                            value={formData.tiktokLink ?? ""}
                            onChange={(e) =>
                              handleInputChange("tiktokLink", e.target.value)
                            }
                            placeholder="Enter link *"
                            style={
                              {
                                "--accent-bg": lightenColor(selectedColor),
                                background:
                                  "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                                transition: "background 0.5s ease",
                              } as React.CSSProperties
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border px-4 py-2 rounded-md w-full min-w-0">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="imageGallery">Image Gallery</Label>
                    <Checkbox
                      id="imageGallery"
                      checked={formData.imageGallery}
                      onCheckedChange={(checked) =>
                        handleInputChange("imageGallery", checked)
                      }
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  {formData.imageGallery && (
                    <ImageGalleryUpload
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                      style_button={
                        selectedColor
                          ? {
                              backgroundColor: selectedColor,
                              borderColor: selectedColor,
                            }
                          : {}
                      }
                      onImagesUploaded={(urls) => {
                        handleInputChange("imageGalleryLinks", urls);
                      }}
                      existingImages={formData.imageGalleryLinks}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card
              style={
                {
                  "--accent-bg": lightenColor(selectedColor),
                  background:
                    "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                  transition: "background 0.5s ease",
                } as React.CSSProperties
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Event Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dining_style">Dining Style</Label>
                    <Select
                      value={formData.dining_style}
                      onValueChange={(value) =>
                        handleInputChange("dining_style", value)
                      }
                    >
                      <SelectTrigger
                        style={
                          {
                            "--accent-bg": lightenColor(selectedColor),
                            background:
                              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                            transition: "background 0.5s ease",
                          } as React.CSSProperties
                        }
                      >
                        <SelectValue placeholder="Select dining style" />
                      </SelectTrigger>
                      <SelectContent
                        style={
                          {
                            "--accent-bg": lightenColor(selectedColor),
                            background:
                              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                            transition: "background 0.5s ease",
                          } as React.CSSProperties
                        }
                      >
                        <SelectItem value="adventurous">Adventurous</SelectItem>
                        <SelectItem value="foodie_enthusiast">
                          Foodie Enthusiast
                        </SelectItem>
                        <SelectItem value="local_lover">Local Lover</SelectItem>
                        <SelectItem value="comfort_food">
                          Comfort Food
                        </SelectItem>
                        <SelectItem value="health_conscious">
                          Health Conscious
                        </SelectItem>
                        <SelectItem value="social_butterfly">
                          Social Butterfly
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dietary_theme">Dietary Preferences</Label>
                    <Select
                      value={formData.dietary_theme}
                      onValueChange={(value) =>
                        handleInputChange("dietary_theme", value)
                      }
                    >
                      <SelectTrigger
                        style={
                          {
                            "--accent-bg": lightenColor(selectedColor),
                            background:
                              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                            transition: "background 0.5s ease",
                          } as React.CSSProperties
                        }
                      >
                        <SelectValue placeholder="Select dietary preferences" />
                      </SelectTrigger>
                      <SelectContent
                        style={
                          {
                            "--accent-bg": lightenColor(selectedColor),
                            background:
                              "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                            transition: "background 0.5s ease",
                          } as React.CSSProperties
                        }
                      >
                        <SelectItem value="no_restrictions">
                          No Restrictions
                        </SelectItem>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="gluten_free">Gluten Free</SelectItem>
                        <SelectItem value="dairy_free">Dairy Free</SelectItem>
                        <SelectItem value="keto">Keto</SelectItem>
                        <SelectItem value="paleo">Paleo</SelectItem>
                        <SelectItem value="kosher">Kosher</SelectItem>
                        <SelectItem value="halal">Halal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              style={
                {
                  "--accent-bg": lightenColor(selectedColor),
                  background:
                    "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                  transition: "background 0.5s ease",
                } as React.CSSProperties
              }
            >
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a tag (e.g., wine, vegan, casual)"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    style={
                      {
                        "--accent-bg": lightenColor(selectedColor),
                        background:
                          "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                        transition: "background 0.5s ease",
                      } as React.CSSProperties
                    }
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    style={
                      selectedColor
                        ? {
                            backgroundColor: selectedColor,
                            borderColor: selectedColor,
                          }
                        : {}
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive/20"
                        style={
                          selectedColor
                            ? {
                                backgroundColor: selectedColor,
                                borderColor: selectedColor,
                              }
                            : {}
                        }
                        // onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <span className="" onClick={() => removeTag(tag)}>
                          <X className="h-3 w-3 ml-1" />
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card
              style={
                {
                  "--accent-bg": lightenColor(selectedColor),
                  background:
                    "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                  transition: "background 0.5s ease",
                } as React.CSSProperties
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  Page Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border px-4 py-2 rounded-md mb-2">
                  <Label htmlFor="explore">Show on Explore</Label>
                  <Checkbox
                    id="explore"
                    checked={formData.explore}
                    onCheckedChange={(checked) =>
                      handleInputChange("explore", checked)
                    }
                    style={
                      {
                        "--accent-bg": lightenColor(selectedColor),
                        background:
                          "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                        transition: "background 0.5s ease",
                      } as React.CSSProperties
                    }
                  />
                </div>
                <div className="border px-4 py-2 rounded-md">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="is_password_protected">
                      Password Protected Event
                    </Label>
                    <Checkbox
                      id="is_password_protected"
                      checked={formData.is_password_protected}
                      onCheckedChange={(checked) =>
                        handleInputChange("is_password_protected", checked)
                      }
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  {formData.is_password_protected && (
                    <div className="rounded-md mt-2 px-4 py-3">
                      <div className="space-y-2 border rounded-lg px-4 py-3">
                        <Label htmlFor="event_password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="event_password"
                            type="password"
                            value={formData.event_password ?? ""}
                            onChange={(e) =>
                              handleInputChange(
                                "event_password",
                                e.target.value
                              )
                            }
                            placeholder="Enter event password *"
                            style={
                              {
                                "--accent-bg": lightenColor(selectedColor),
                                background:
                                  "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                                transition: "background 0.5s ease",
                              } as React.CSSProperties
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:w-1/3 flex flex-col space-y-4 lg:sticky lg:top-1 lg:translate-y-[1%] self-start">
            <FlyerUpload
              value={formData.flyer_url}
              onChange={handleFlyerChange}
            />
            <Card
              style={
                {
                  "--accent-bg": lightenColor(selectedColor),
                  background:
                    "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                  transition: "background 0.5s ease",
                } as React.CSSProperties
              }
            >
              <CardHeader>
                <CardTitle>Customize Event Style</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Font Selector */}
                <div className="flex flex-col gap-1">
                  <Label>Title Font</Label>
                  <Select
                    onValueChange={(font) => {
                      setSelectedFont(font);
                      handleFontChange(font);
                    }}
                  >
                    <SelectTrigger
                      className="rounded-lg border bg-background/60 hover:bg-background transition"
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    >
                      <SelectValue
                        placeholder="Select font"
                        className="capitalize"
                      />
                    </SelectTrigger>
                    <SelectContent
                      className="max-h-60 overflow-y-auto"
                      style={
                        {
                          "--accent-bg": lightenColor(selectedColor),
                          background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
                          transition: "background 0.5s ease",
                        } as React.CSSProperties
                      }
                    >
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem
                          key={font}
                          value={font}
                          className="cursor-pointer hover:bg-accent/60"
                        >
                          <span
                            className="block text-base"
                            style={{ fontFamily: font }}
                          >
                            {font}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Font Preview */}
                  {selectedFont && (
                    <p
                      className="text-sm text-muted-foreground mt-1 pl-1 italic transition-all"
                      style={{ fontFamily: selectedFont }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-border/40 my-2" />

                {/* Color Selector */}
                <div className="flex flex-col gap-1">
                  <Label>Accent Color</Label>
                  {formData.flyer_url ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((color, i) => (
                          <Button
                            type="button"
                            size="icon"
                            key={i}
                            className={`w-7 h-7 rounded-md border transition-all hover:scale-105 ${
                              selectedColor === color
                                ? "ring-2 ring-offset-2 ring-primary"
                                : "ring-0"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setSelectedColor(color);
                              handleColorChange(color);
                              handleInputChange("color", color);
                            }}
                          />
                        ))}
                        {/* Custom Picker */}
                        {/* <Label className="w-7 h-7 rounded-md border flex items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-primary transition">
                      +
                    </Label> */}
                        <div
                          className="w-8 h-8 rounded-md border cursor-pointer shadow-sm hover:ring-2 hover:ring-primary transition-all"
                          style={{ backgroundColor: selectedColor }}
                          onClick={() =>
                            document.getElementById("color-picker").click()
                          }
                        >
                          {" "}
                          <Label className="w-7 h-7 flex items-center justify-center text-xs text-primary cursor-pointer">
                            +
                          </Label>
                        </div>
                        <Input
                          id="color-picker"
                          type="color"
                          value={selectedColor}
                          onChange={(e) => {
                            setSelectedColor(e.target.value);
                            handleColorChange(e.target.value);
                            handleInputChange("color", e.target.value);
                          }}
                          className="hidden"
                        />

                        {/* <div className="flex items-center gap-3">
                      <label
                        htmlFor="color-picker"
                        className="text-sm font-medium"
                      >
                        Choose Color:
                      </label>
                      <div
                        className="w-8 h-8 rounded-md border cursor-pointer shadow-sm hover:ring-2 hover:ring-primary transition-all"
                        style={{ backgroundColor: selectedColor }}
                        onClick={() =>
                          document.getElementById("color-picker").click()
                        }
                      ></div>
                      <input
                        id="color-picker"
                        type="color"
                        value={selectedColor}
                        onChange={(e) => {
                          setSelectedColor(e.target.value);
                          handleColorChange(e.target.value);
                          handleInputChange("color", e.target.value);
                        }}
                        className="hidden"
                      />
                    </div> */}
                      </div>

                      {/* Color Preview */}
                      {selectedColor && (
                        <div className="mt-2 text-xs text-muted-foreground pl-1 flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: selectedColor }}
                          ></div>
                          <span>{selectedColor}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span>Flyer is not selected</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="bg-primary hover:bg-secondary"
              style={
                selectedColor
                  ? {
                      backgroundColor: selectedColor,
                      borderColor: selectedColor,
                    }
                  : {}
              }
            >
              {loading ? "Updating..." : "Update Event"}
            </Button>
          </div>
        </div>
        <FeatureDialog
          open={showFeatures}
          onClose={() => setShowFeatures(false)}
          onChange={handleInputChange}
          existingFeatures={formData.eventFeatures}
          editFeatureIndex={editFeatureIndex}
        />
        <RecurringEventDialog
          open={showRecurringDialog}
          onClose={() => {
            // when dialog closes, keep it "Yes"
            setShowRecurringDialog(false);
            handleInputChange("recurring", true);
          }}
          // start_date={formData.start_date}
          // start_time={formData.start_time}
          start_time={
            formData.start_date && formData.start_time
              ? new Date(
                  `${formData.start_date}T${formData.start_time}`
                ).toISOString()
              : null
          }
          onSubmit={(data) => {
            console.log("Recurrence Data:", data);
            handleInputChange("recurrenceDates", data);
            handleInputChange("recurring", true);
            setShowRecurringDialog(false);
          }}
        />
      </form>
    </div>
    //   </div>
    // </div>
  );
};

export default AdminEditEvent;
