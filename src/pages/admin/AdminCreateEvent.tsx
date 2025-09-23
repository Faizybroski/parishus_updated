import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
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
  Plus,
  X,
  Users,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
const today = format(new Date(), "yyyy-MM-dd");
import { RestaurantSearchDropdown } from "@/components/restaurants/RestaurantSearchDropdown";
import { EmailInviteModal } from "@/components/Invitationmodals/EmailInviteModal";
import { CrossedPathInviteModal } from "@/components/Invitationmodals/CrossedPathInviteModal";
import { getEmailsFromIds } from "@/lib/getEmailsFromIds";
import { sendEventInvite } from "@/lib/sendInvite";
import GooglePlacesEventsForm from "@/components/restaurants/GooglePlacesEventsForm";
const AdminCreateEvent = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
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
    is_private: false,
    is_paid: false,
    event_fee: 0,
  });
  const [newTag, setNewTag] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();
  const [emailInviteModelOpen, setEmailInviteModelOpen] = useState(false);
  const [invitedGuestIds, setInvitedGuestIds] = useState<string[]>([]);
  const [crossedPathInviteModelOpen, setCrossedPathInviteModelOpen] =
    useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: any) => {
    // setFormData((prev) => ({
    //   ...prev,
    //   [field]: value,
    // }));

    setFormData((prev) => {
      const updatedData = { ...prev, [field]: value };

      if (field === "event_type") {
        updatedData.is_private = value === "private";
      }
      return updatedData;
    });
    if (field === "guest_invitation_type" && value === "manual") {
      setEmailInviteModelOpen(true);
    }
    if (field === "guest_invitation_type" && value === "crossed_paths") {
      setCrossedPathInviteModelOpen(true);
    }
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
        description: "Please log in to create events",
        variant: "destructive",
      });
      return;
    }

    if (!formData.cover_photo_url) {
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
    
        if (!formData.date) {
          toast({
            title: "Validation Error",
            description: "Please select an event date.",
            variant: "destructive",
          });
          return;
        }
    
        if (!formData.time) {
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
    
        if (new Date(`${formData.date}T${formData.time}`) < new Date()) {
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
    
        if(!formData.guest_invitation_type) {
          toast({
            title: "Validation Error",
            description: "Please select a guest invitation type.",
            variant: "destructive",
          });
          return;
        }
    
        if (formData.is_paid && (!formData.event_fee || Number(formData.event_fee) <= 0)) {
          toast({
            title: "Validation Error",
            description: "Please enter a valid event fee for paid events.",
            variant: "destructive",
          });
          return;
        }

    setLoading(true);

    try {
      const eventDateTime = new Date(`${formData.date}T${formData.time}`);
      let rsvpDeadline = null;

      if (formData.rsvp_deadline_date && formData.rsvp_deadline_time) {
        rsvpDeadline = new Date(
          `${formData.rsvp_deadline_date}T${formData.rsvp_deadline_time}`
        );
      } else if (formData.rsvp_deadline_date) {
        rsvpDeadline = new Date(`${formData.rsvp_deadline_date}T23:59`);
      }

      const { data, error } = await supabase
        .from("events")
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
          rsvp_deadline: rsvpDeadline?.toISOString() || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          cover_photo_url: formData.cover_photo_url,
          is_mystery_dinner: formData.is_mystery_dinner,
          description: formData.description.trim(),
          name: formData.name.trim(),
          guest_invitation_type: formData.guest_invitation_type,
          auto_suggest_crossed_paths:
            formData.guest_invitation_type === "crossed_paths",
          is_private: formData.is_private,
          is_paid: formData.is_paid,
          event_fee: formData.is_paid ? formData.event_fee : null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      const eventLink = `${window.location.origin}/event/${data.id}/details`;
      const emails = invitedEmails;

     if ( (!emails || emails.length === 0) && (!invitedGuestIds || invitedGuestIds.length === 0)) {
        localStorage.setItem("eventUpdated", Date.now().toString());
        window.dispatchEvent(new CustomEvent("eventUpdated"));

        toast({
          title: "Event created!",
          description:
            "Your event has been created successfully. Invitations have been sent!",
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
        title: "Event created!",
        description:
          "Your event has been created successfully. Invitations have been sent!",
      });

      navigate("/admin/events");
    } catch (error: any) {
      toast({
        title: "Error creating event",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.name &&
    formData.description &&
    formData.date &&
    formData.time &&
    formData.location_name &&
    formData.cover_photo_url;
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-peach-gold border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
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
          <Button
            onClick={() => navigate("/profile")}
            className="bg-peach-gold hover:bg-peach-gold/90"
          >
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
           <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/events')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Events</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
              <p className="text-muted-foreground mt-1">
                Plan your next dining experience and invite others to join
              </p>
            </div>
          </div>

          <EmailInviteModal
            open={emailInviteModelOpen}
            onClose={() => setEmailInviteModelOpen(false)}
            onInviteResolved={(guestIds) => setInvitedGuestIds(guestIds)}
            getInviteEmails={(emails) => setInvitedEmails(emails)}
            subscriptionStatus={"premium"}
          />

          <CrossedPathInviteModal
            open={crossedPathInviteModelOpen}
            onClose={() => setCrossedPathInviteModelOpen(false)}
            onInviteResolved={(guestIds) => setInvitedGuestIds(guestIds)}
            subscriptionStatus={"premium"}
          />

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        min={today}
                        value={formData.date}
                        onChange={(e) =>
                          handleInputChange("date", e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) =>
                          handleInputChange("time", e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurant">
                    Choose Restaurant (Optional)
                  </Label>
                  <RestaurantSearchDropdown
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
                    placeholder="Search and select a restaurant..."
                  />
                </div>
                <GooglePlacesEventsForm
                  formData={formData}
                  onChange={handleInputChange}
                />

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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rsvp_deadline_time">RSVP Deadline Time</Label>
                  <Input
                    id="rsvp_deadline_time"
                    type="time"
                    value={formData.rsvp_deadline_time}
                    onChange={(e) =>
                      handleInputChange("rsvp_deadline_time", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Event Photo Card */}
            <Card>
              <CardHeader>
                <CardTitle>Event Photo *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.cover_photo_url && (
                  <div className="relative">
                    <img
                      src={formData.cover_photo_url}
                      alt="Event cover"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleInputChange("cover_photo_url", "")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={uploading}
                />

                <label htmlFor="photo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className="w-full cursor-pointer"
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {formData.cover_photo_url
                            ? "Change Photo"
                            : "Upload Cover Photo"}
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>

            {/* Event Type Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Event Privacy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_private"
                    checked={formData.is_private}
                    onChange={(e) =>
                      handleInputChange("is_private", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_private">
                    {formData.is_private ? "Private Event" : "Public Event"}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Guest Invitation Type Card */}
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

            {/* Event Preferences Card */}
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
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Payment Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_paid"
                    checked={formData.is_paid}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_paid", checked)
                    }
                  />
                  <Label htmlFor="is_paid">This is a paid event</Label>
                </div>

                {formData.is_paid && (
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
                        value={formData.event_fee}
                        onChange={(e) =>
                          handleInputChange(
                            "event_fee",
                            parseFloat(e.target.value)
                          )
                        }
                        className="pl-10"
                        required={formData.is_paid}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Users will need to pay this amount to RSVP to your event
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Tags Card */}
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

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || loading}
                className="bg-peach-gold hover:bg-peach-gold/90"
              >
                {loading ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateEvent;
