import React, { useState, useEffect, useRef } from "react";
import bcrypt from "bcryptjs";
import { Input } from "@/components/ui/input";
import { LoaderText } from "@/components/loader/Loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfile } from "@/hooks/useProfile";
import { useRestaurants, Restaurant } from "@/hooks/useRestaurants";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
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
  Eye,
  Edit2,
  Trash2,
  PlusCircle,
  EyeOff,
  Upload,
  Camera,
  Plus,
  X,
  Users,
  DollarSign,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
const today = format(new Date(), "yyyy-MM-dd");
import { EmailInviteModal } from "@/components/Invitationmodals/EmailInviteModal";
import { CrossedPathInviteModal } from "@/components/Invitationmodals/CrossedPathInviteModal";
import { getEmailsFromIds } from "@/lib/getEmailsFromIds";
import { sendEventInvite } from "@/lib/sendInvite";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { RestaurantSearchDropdown } from "@/components/restaurants/RestaurantSearchDropdown";
import GooglePlacesEventsForm from "@/components/restaurants/GooglePlacesEventsForm";
import FlyerUpload from "@/components/flyer/Flyerupload";
import ImageGalleryUpload from "@/components/imageGallery/ImageGalleryUpload";
import FeatureDialog from "@/components/eventfeatures/FeaturedDialog";
import ColorThief from "colorthief";

const OurEventsCreate = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_time: "",
    start_date: "",
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
    cover_photo_url: "",
    is_mystery_dinner: false,
    guest_invitation_type: "",
    guestList: true,
    features: false,
    is_paid: false,
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
  });
  const [newTag, setNewTag] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();
  const [emailInviteModelOpen, setEmailInviteModelOpen] = useState(false);
  const [mode, setMode] = useState<"sell" | "rsvp">("sell");
  const [invitedGuestIds, setInvitedGuestIds] = useState<string[]>([]);
  const [crossedPathInviteModelOpen, setCrossedPathInviteModelOpen] =
    useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [editFeatureIndex, setEditFeatureIndex] = useState(null);
  const [colors, setColors] = useState([]);
  const [selectedFont, setSelectedFont] = useState("");
  const [selectedColor, setSelectedColor] = useState("primary");
  const [selectedBgColor, setSelectedBgColor] = useState("background");

  // Optional: handle blur or Enter key to confirm editing

  const navigate = useNavigate();
  const subscriptionStatus = useSubscriptionStatus(profile?.id);

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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // if (ref.current) setText(ref.current.innerText);
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

  // const handleInput = () => {
  //   setText(ref.current?.innerText || "");
  // };

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
        description: "Please log in to create events",
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
      if (subscriptionStatus === "free") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const { count, error: countError } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", profile.id)
          .gte("created_at", startOfMonth.toISOString())
          .lte("created_at", endOfMonth.toISOString());

        if (countError) throw countError;

        if (count >= 2) {
          toast({
            title: "Event Limit Reached",
            description:
              "Free-tier users can only create 2 events per month. Upgrade to Premium to unlock unlimited events.",
            variant: "destructive",
          });
          setTimeout(() => {
            navigate("/subscription");
          }, 1500);
          setLoading(false);
          return;
        }
      }

      let passwordHashed = null;

      if (formData.is_password_protected) {
        const trimmedPassword = formData.event_password.trim();
        if (trimmedPassword.length === 0) {
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
        .from("dummyevents")
        .insert({
          creator_id: profile.id,
          guest_user_ids: invitedGuestIds,
          date_time: eventDateTime.toISOString(),
          location_name: formData.location_name.trim(),
          location_address: formData.location_address.trim(),
          location_lng: formData.location_lng,
          location_lat: formData.location_lat,
          restaurant_id: formData.restaurant_id || null,
          max_attendees: formData.max_attendees,
          status: "active",
          dining_style: formData.dining_style || null,
          dietary_theme: formData.dietary_theme || null,
          rsvp_deadline: rsvpDeadline?.toISOString(),
          tags: formData.tags.length > 0 ? formData.tags : null,
          cover_photo_url: formData.flyer_url,
          is_mystery_dinner: formData.is_mystery_dinner,
          description: formData.description.trim(),
          name: formData.name.trim(),
          is_password_protected: formData.is_password_protected,
          password_hash: passwordHashed,
          explore: formData.explore,
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
            : [],
          features: formData.features,
          event_features: formData.features ? formData.eventFeatures : null,
          title_font: selectedFont,
          accent_color: selectedColor,
          accent_bg: selectedBgColor,
        } as any)
        .select()
        .single();

      if (error) throw error;
      const eventLink = `${window.location.origin}/event/${data.id}/details`;
      const emails = invitedEmails;

      if (
        (!emails || emails.length === 0) &&
        (!invitedGuestIds || invitedGuestIds.length === 0)
      ) {
        localStorage.setItem("eventUpdated", Date.now().toString());
        window.dispatchEvent(new CustomEvent("eventUpdated"));

        toast({
          title: "Event created!",
          description:
            "Your event has been created successfully. Invitations have been sent!",
        });

        navigate("/events");
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
        title: "Event created!",
        description:
          "Your event has been created successfully. Invitations have been sent!",
      });

      navigate("/events");
    } catch (error: any) {
      toast({
        title: "Error creating event",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
      console.error("Upload Error →", error);
      toast({
        title: "Upload failed",
        description:
          typeof error === "object" ? JSON.stringify(error) : String(error),
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
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }
  if (!user) {
    console.log("No user, redirecting to auth");
    navigate("/auth");
    return null;
  }
  if (!profile) {
    console.log("No profile found");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Profile Required
          </h2>
          <p className="text-muted-foreground">
            Please complete your profile to create events.
          </p>
          <Link to={"/profile"}>
            <Button className="">Complete Profile</Button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen bg-background  font-serif"
      style={
        {
          "--accent-bg": lightenColor(selectedColor),
          background:
            "linear-gradient(135deg, var(--accent-bg) 0%, #ffffff 100%)",
          transition: "background 0.5s ease",
        } as React.CSSProperties
      }
    >
      <EmailInviteModal
        open={emailInviteModelOpen}
        onClose={() => setEmailInviteModelOpen(false)}
        onInviteResolved={(guestIds) => setInvitedGuestIds(guestIds)}
        subscriptionStatus={subscriptionStatus}
        getInviteEmails={(emails) => setInvitedEmails(emails)}
      />

      <CrossedPathInviteModal
        open={crossedPathInviteModelOpen}
        onClose={() => setCrossedPathInviteModelOpen(false)}
        onInviteResolved={(guestIds) => setInvitedGuestIds(guestIds)}
        subscriptionStatus={subscriptionStatus}
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
                  ? "bg-primary text-primary-foreground shadow-sm"
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
                  ? "bg-primary text-primary-foreground shadow-sm"
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
            <Card className="space-y-2">
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
                    style={{ fontFamily: selectedFont }}
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
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="space-y-2">
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start date*</Label>
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
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">End Date*</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="date" type="date" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time End *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="time" type="time" className="pl-10" />
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
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurring">Recurring Series *</Label>
                    <div className="flex justify-between items-center border py-3 px-4 rounded-md">
                      <Label htmlFor="recurring">
                        {formData.recurring == true ? "Yes" : "No"}
                      </Label>
                      <Checkbox id="recurring" checked={formData.recurring} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="sspace-y-2 relative">
                  <Label htmlFor="restaurant">
                    Choose Restaurant (Optional)
                  </Label>
                  <RestaurantSearchDropdown
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
                  formData={formData}
                  onChange={handleInputChange}
                />
              </CardContent>
            </Card>

            {mode === "sell" && (
              <Card>
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
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Guest Invitation Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="manual"
                      name="guest_invitation_type"
                      value="manual"
                      checked={formData.guest_invitation_type === "manual"}
                      onChange={(e) =>
                        handleInputChange(
                          "guest_invitation_type",
                          e.target.value
                        )
                      }
                      className="w-4 h-4"
                    />
                    <Label htmlFor="manual">Manually Invite Guests</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="crossed_paths"
                      name="guest_invitation_type"
                      value="crossed_paths"
                      checked={
                        formData.guest_invitation_type === "crossed_paths"
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "guest_invitation_type",
                          e.target.value
                        )
                      }
                      className="w-4 h-4"
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

            <Card>
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
                    />
                  </div>
                  {formData.features && (
                    <div className="space-y-4 mt-2 bg-primary/10 rounded-lg p-3">
                      {/* Empty state */}
                      {formData.eventFeatures.length === 0 ? (
                        <div className="flex justify-between items-center border rounded-lg px-4 py-3 bg-secondary/30">
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
                                              <span className="bg-background border px-2 py-1 rounded-md">
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
                    />
                  </div>

                  {formData.tiktok && (
                    <div className="bg-primary rounded-md mt-2 px-4 py-3">
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
                    />
                  </div>

                  {formData.imageGallery && (
                    <ImageGalleryUpload
                      onImagesUploaded={(urls) => {
                        handleInputChange("imageGalleryLinks", urls);
                      }}
                      existingImages={formData.imageGalleryLinks}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select dining style" />
                      </SelectTrigger>
                      <SelectContent>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select dietary preferences" />
                      </SelectTrigger>
                      <SelectContent>
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

            <Card>
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
                  />
                  <Button type="button" onClick={addTag} variant="outline">
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
                        onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
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
                    />
                  </div>

                  {formData.is_password_protected && (
                    <div className="bg-primary rounded-md mt-2 px-4 py-3">
                      <div className="space-y-2">
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
            <Card>
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
                    <SelectTrigger className="rounded-lg border bg-background/60 hover:bg-background transition">
                      <SelectValue
                        placeholder="Select font"
                        className="capitalize"
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
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
              {loading ? "Creating..." : "Create Event"}
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
      </form>
    </div>
  );
};

export default OurEventsCreate;
