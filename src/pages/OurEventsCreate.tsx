import React, { useState, useEffect } from "react";
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

const OurEventsCreate = () => {
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
    is_paid: false,
    event_fee: "",
  });
  const [newTag, setNewTag] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();
  const [showGuestList, setShowGuestList] = useState(false);
  const [emailInviteModelOpen, setEmailInviteModelOpen] = useState(false);
  const [invitedGuestIds, setInvitedGuestIds] = useState<string[]>([]);
  const [crossedPathInviteModelOpen, setCrossedPathInviteModelOpen] =
    useState(false);
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
      const eventDateTime = new Date(`${formData.date}T${formData.time}`);
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
          cover_photo_url: formData.cover_photo_url,
          is_mystery_dinner: formData.is_mystery_dinner,
          description: formData.description.trim(),
          name: formData.name.trim(),
          guest_invitation_type: formData.guest_invitation_type,
          auto_suggest_crossed_paths:
            formData.guest_invitation_type === "crossed_paths",
          is_paid: formData.is_paid,
          event_fee: formData.is_paid ? formData.event_fee : null,
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
      <div className="flex justify-center space-x-4 border-b border-gray-800 py-4">
        <Button variant="default" className="">
          Sell Tickets
        </Button>
        <Button variant="outline" className="">
          RSVP
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-6">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl font-semibold font-script">My Event Name</h1>
          <Button className="px-4 py-2  text-gray-400 rounded-md">
            Short Summary
          </Button>

          <Card className="space-y-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Dates</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Start *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="date" type="date" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">End *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="date" type="date" className="pl-10" />
                  </div>
                </div>
              </div>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Recurring Series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* <div>
            <p className="text-sm text-gray-400 mb-2">Event Details</p>
            <input
              className="w-full bg-gray-900 rounded-md px-3 py-2 mb-2"
              placeholder="Add Description"
            />
            <input
              className="w-full bg-gray-900 rounded-md px-3 py-2 mb-2"
              placeholder="Location"
            />
            <input
              className="w-full bg-gray-900 rounded-md px-3 py-2"
              placeholder="Venue Name"
            />
          </div> */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event, what to expect, dress code, etc."
                  rows={4}
                />
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="date">Date *</Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="date"
                                  type="date"
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
                                  className="pl-10"
                                />
                              </div>
                            </div>
                          </div> */}

              <div className="sspace-y-2 relative">
                <Label htmlFor="restaurant">Choose Restaurant (Optional)</Label>
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
                      handleInputChange("event_fee", parseFloat(e.target.value))
                    }
                    className="pl-10"
                    required={formData.is_paid}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
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
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                Event Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">Add Feature</Button>
            </CardContent>
          </Card>

          <div>
            <p className="text-sm text-gray-400 mb-2">YouTube Video</p>
            <Input
              className="w-full bg-gray-900 rounded-md px-3 py-2"
              placeholder="Add video from YouTube"
            />
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Image Gallery</p>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-900 rounded-md flex items-center justify-center text-gray-500"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Page Settings</p>
            <div className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded-md mb-2">
              <span>Show on Explore</span>
              <Input type="checkbox" className="w-5 h-5" />
            </div>
            <div className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded-md">
              <span>Password Protected Event</span>
              <Input type="checkbox" className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="lg:w-1/3 flex flex-col space-y-4">
          <div className="bg-gray-900 rounded-md flex items-center justify-center h-64">
            <button className="bg-gray-700 px-4 py-2 rounded-full">
              Upload your flyer
            </button>
          </div>
          <button className="bg-gray-900 rounded-md px-4 py-2 text-gray-300 text-left">
            Add song from Spotify
          </button>
          <Select className="bg-gray-900 px-3 py-2 rounded-md text-gray-300">
            <option>Title Font</option>
          </Select>
          <Select className="bg-gray-900 px-3 py-2 rounded-md text-gray-300">
            <option>Accent Color</option>
          </Select>
          <button className="bg-gray-700 rounded-md px-4 py-3 text-white font-semibold">
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default OurEventsCreate;
