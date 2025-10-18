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
    guestList: false,
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
  });
  const [newTag, setNewTag] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();
  const [showGuestList, setShowGuestList] = useState(false);
  const [emailInviteModelOpen, setEmailInviteModelOpen] = useState(false);
  const [mode, setMode] = useState<"sell" | "rsvp">("sell");
  const [invitedGuestIds, setInvitedGuestIds] = useState<string[]>([]);
  const [crossedPathInviteModelOpen, setCrossedPathInviteModelOpen] =
    useState(false);
  // const [text, setText] = useState("");
  // const ref = useRef<HTMLHeadingElement>(null);

  // Optional: handle blur or Enter key to confirm editing

  const navigate = useNavigate();
  const subscriptionStatus = useSubscriptionStatus(profile?.id);

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
      formData.is_paid &&
      (!formData.event_fee || Number(formData.event_fee) <= 0)
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid event fee for paid events.",
        variant: "destructive",
      });
      return;
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
    <div className="min-h-screen bg-background  font-serif">
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
          <div className="flex items-center space-x-1 mt-3 px-1 py-1 bg-secondary rounded-full">
            <Button
              type="button"
              onClick={() => setMode("sell")}
              className={`rounded-full px-4 py-1 text-sm font-medium transition-all duration-200 ${
                mode === "sell"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Sell Tickets
            </Button>

            <Button
              type="button"
              onClick={() => setMode("rsvp")}
              className={`rounded-full px-4 py-1 text-sm font-medium transition-all duration-200 ${
                mode === "rsvp"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              RSVP
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 p-6">
          <div className="flex-1 space-y-6">
            {/* <h1
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            value={formData.name}
            onInput={(e) => handleInputChange("name", e.target.value)}
            data-placeholder="My Event Name"
            className="m-3 p-0 text-4xl font-semibold font-script focus:outline-none
                 empty:before:content-[attr(data-placeholder)]
                 empty:before:text-gray-400
                 empty:before:select-none"
            style={{ direction: "ltr" }}
          />
          <Button className="px-4 py-2  text-gray-400 rounded-md">
            Short Summary
          </Button> */}

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
                    <Label htmlFor="max_attendees">Recurring Series *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Recurring Series" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
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

                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_attendees">Maximum Attendees *</Label>
                  <Input id="max_attendees" type="number" min="2" max="50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rsvp_deadline_date">RSVP Deadline Date</Label>
                  <Input id="rsvp_deadline_date" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rsvp_deadline_time">RSVP Deadline Time</Label>
                <Input id="rsvp_deadline_time" type="time" />
              </div> */}
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
                <div className="border px-4 py-2 rounded-md">
                  <div className="flex justify-between items-center">
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
                    // <div className="bg-primary rounded-md mt-2 px-4 py-3">
                    <>
                      <p className="mt-2">David and 09 others going</p>
                      <div className="flex gap-2 mt-2 overflow-x-auto">
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
                    // </div>
                  )}
                </div>

                <div className="flex justify-between items-center border px-4 py-2 rounded-md">
                  <Label htmlFor="features">Event Features</Label>
                  <Checkbox
                    id="features"
                    checked={formData.features}
                    onCheckedChange={(checked) =>
                      handleInputChange("features", checked)
                    }
                  />
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

                <div className="border px-4 py-2 rounded-md">
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
                    <div className="space-y-4 min-w-0 mt-2">
                      <div className="overflow-x-auto w-full">
                        <div className="grid grid-flow-col auto-cols-[6rem] gap-3">
                          {Array.from({ length: 7 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-24 bg-primary rounded-md flex items-center justify-center text-gray-500 flex-shrink-0"
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-y-1 relative">
                  Guestlist
                  <button
                    type="button"
                    className="absolute right-3 top-2"
                    onClick={() => setShowGuestList(!showGuestList)}
                  >
                    {showGuestList ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary rounded-md px-4 py-3">
                  <span className="flex mb-2 text-sm relative">
                    David and 09 others going
                    <button
                      type="button"
                      className="absolute -right-[0.1rem] top-1"
                      onClick={() => setShowGuestList(!showGuestList)}
                    >
                      {showGuestList ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </span>
                  <div className="flex space-x-2 justify-center gap-2">
                    {dummyPictures.map((i) => (
                      <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
                        <AvatarImage src={i} />
                      </Avatar>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card> */}

            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  Event Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full">Add Feature</Button>
              </CardContent>
            </Card> */}

            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  YouTube Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input className="" placeholder="Add video from YouTube" />
              </CardContent>
            </Card> */}

            {/* <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  Image Gallery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 min-w-0">
                <div className="overflow-x-auto w-full [display:block]">
                  <div className="grid grid-flow-col auto-cols-[6rem] gap-3 w-max">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-24 bg-primary rounded-md flex items-center justify-center text-gray-500"
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card> */}

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
                <div className="flex justify-between items-center border px-4 py-2 rounded-md">
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
                  <div className="space-y-2">
                    <Label htmlFor="event_password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="event_password"
                        type="password"
                        value={formData.event_password ?? ""}
                        onChange={(e) =>
                          handleInputChange("event_password", e.target.value)
                        }
                        placeholder="Enter event password *"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:w-1/3 flex flex-col space-y-4 lg:sticky lg:top-1 lg:translate-y-[1%] self-start">
            {/* <div
              className="bg-primary rounded-md flex items-center justify-center h-64 relative overflow-hidden cursor-pointer group"
              onClick={() =>
                !uploading && document.getElementById("flyer-upload")?.click()
              }
            >
              <input
                id="flyer-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />

              {!formData.cover_photo_url ? (
                <span className="text-secondary-foreground/80 group-hover:opacity-70 transition">
                  {uploading ? "Uploading..." : "Click to upload your flyer"}
                </span>
              ) : (
                <>
                  <img
                    src={formData.cover_photo_url}
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
            </div> */}
             <FlyerUpload value={formData.flyer_url} onChange={handleFlyerChange} />

            <Button className="rounded-md px-4 py-2 text-left">
              Add song from Spotify
            </Button>
            <Card>
              <Select>
                <SelectTrigger className="border-none">
                  <SelectValue placeholder="Title Font" />
                </SelectTrigger>
                <SelectContent>
                  <Button
                    size="icon"
                    className="bg-secondary rounded-sm"
                  ></Button>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="border-none">
                  <SelectValue placeholder="Accent Color" />
                </SelectTrigger>
                <SelectContent>
                  <Button
                    size="icon"
                    className="bg-secondary rounded-sm"
                  ></Button>
                </SelectContent>
              </Select>
            </Card>
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="bg-primary hover:bg-secondary"
            >
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OurEventsCreate;
