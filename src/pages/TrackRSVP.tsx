import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoaderText } from "@/components/loader/Loader";
import {
  Search,
  ShieldCheck,
  ShieldX,
  User,
  Ticket,
  Calendar,
  Crown,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  QrCode,
  Clock,
  MapPin,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TrackingData {
  rsvp: {
    id: string;
    track_code: string;
    status: string;
    payment_status: string | null;
    created_at: string;
    checked_in: boolean;
    checked_in_at: string | null;
    date: string | null;
    stripe_payment_id: string | null;
  };
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    profile_photo_url: string | null;
  };
  event: {
    id: string;
    name: string;
    date_time: string;
    location_name: string | null;
    location_address: string | null;
    location: string | null;
    is_paid: boolean;
    event_fee: string | null;
    creator_id: string;
    cover_photo_url: string | null;
  };
  owner: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

const TrackRSVP = () => {
  const { trackCode: urlTrackCode } = useParams<{ trackCode?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  const [trackCodeInput, setTrackCodeInput] = useState(urlTrackCode || "");
  const [activeTrackCode, setActiveTrackCode] = useState(urlTrackCode || "");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Wait for auth to load
  useEffect(() => {
    if (user !== undefined && profile !== undefined) {
      setAuthLoading(false);
    }
  }, [user, profile]);

  // Auto-fetch if track code is in URL
  useEffect(() => {
    if (urlTrackCode && !authLoading && user) {
      fetchTrackingData(urlTrackCode);
    }
  }, [urlTrackCode, authLoading, user]);

  const fetchTrackingData = async (code: string) => {
    if (!code.trim()) {
      toast({
        title: "Enter a tracking code",
        description: "Please enter or scan a valid tracking code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setNotFound(false);
    setTrackingData(null);
    setIsAuthorized(false);

    try {
      // Fetch RSVP by track_code with user profile and event data
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select(
          `
          id,
          track_code,
          status,
          payment_status,
          created_at,
          checked_in,
          checked_in_at,
          date,
          stripe_payment_id,
          user_id,
          event_id,
          profiles:user_id (
            first_name,
            last_name,
            email,
            profile_photo_url
          ),
          events:event_id (
            id,
            name,
            date_time,
            location_name,
            location_address,
            location,
            is_paid,
            event_fee,
            creator_id,
            cover_photo_url
          )
        `,
        )
        .eq("track_code", code.trim())
        .single();

      if (rsvpError || !rsvpData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const event = rsvpData.events as any;
      const rsvpUser = rsvpData.profiles as any;

      // Check authorization: only event creator can view
      if (!profile || event.creator_id !== profile.id) {
        setIsAuthorized(false);
        setLoading(false);
        setTrackingData(null);
        return;
      }

      setIsAuthorized(true);

      // Fetch event owner profile
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", event.creator_id)
        .single();

      setTrackingData({
        rsvp: {
          id: rsvpData.id,
          track_code: rsvpData.track_code,
          status: rsvpData.status || "confirmed",
          payment_status: rsvpData.payment_status,
          created_at: rsvpData.created_at,
          checked_in: rsvpData.checked_in || false,
          checked_in_at: rsvpData.checked_in_at,
          date: rsvpData.date,
          stripe_payment_id: rsvpData.stripe_payment_id,
        },
        user: {
          first_name: rsvpUser?.first_name,
          last_name: rsvpUser?.last_name,
          email: rsvpUser?.email || "",
          profile_photo_url: rsvpUser?.profile_photo_url,
        },
        event: {
          id: event.id,
          name: event.name,
          date_time: event.date_time,
          location_name: event.location_name,
          location_address: event.location_address,
          location: event.location,
          is_paid: event.is_paid,
          event_fee: event.event_fee,
          creator_id: event.creator_id,
          cover_photo_url: event.cover_photo_url,
        },
        owner: {
          first_name: ownerProfile?.first_name || null,
          last_name: ownerProfile?.last_name || null,
          email: ownerProfile?.email || "",
        },
      });
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      toast({
        title: "Error",
        description: "Failed to load tracking information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!trackingData) return;

    if (trackingData.rsvp.checked_in) {
      toast({
        title: "Already Checked In",
        description: `This attendee was checked in at ${format(new Date(trackingData.rsvp.checked_in_at!), "PPP p")}`,
        variant: "destructive",
      });
      return;
    }

    setCheckingIn(true);
    try {
      const { error } = await supabase
        .from("rsvps")
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
        })
        .eq("id", trackingData.rsvp.id);

      if (error) throw error;

      // Update local state
      setTrackingData((prev) =>
        prev
          ? {
              ...prev,
              rsvp: {
                ...prev.rsvp,
                checked_in: true,
                checked_in_at: new Date().toISOString(),
              },
            }
          : null,
      );

      toast({
        title: "✅ Checked In!",
        description: `${trackingData.user.first_name} ${trackingData.user.last_name} has been checked in.`,
      });
    } catch (error) {
      console.error("Check-in error:", error);
      toast({
        title: "Check-in Failed",
        description: "Could not mark attendee as checked in.",
        variant: "destructive",
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSearch = () => {
    setActiveTrackCode(trackCodeInput);
    fetchTrackingData(trackCodeInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-16">
        <Card className="max-w-md w-full border-none shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <ShieldX className="h-16 w-16 text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">
              Access Denied
            </h2>
            <p className="text-muted-foreground">
              You must be logged in to access RSVP tracking information.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 pt-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#c4b0a2] to-[#a89282] mb-4">
            <QrCode className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-script">
            RSVP Tracker
          </h1>
          <p className="text-muted-foreground">
            Enter a tracking code or scan a QR code to view attendee details
          </p>
        </div>

        {/* Search Input */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={trackCodeInput}
                  onChange={(e) => setTrackCodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter tracking code..."
                  className="pl-10 h-12 text-base font-mono"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading || !trackCodeInput.trim()}
                className="h-12 px-6 bg-gradient-to-r from-[#c4b0a2] to-[#a89282] hover:from-[#b5a193] hover:to-[#998373] text-white"
              >
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  "Track"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoaderText text="Parish" />
          </div>
        )}

        {/* Not Found */}
        {notFound && !loading && (
          <Card className="border-none shadow-lg border-l-4 border-l-red-400">
            <CardContent className="p-8 text-center space-y-3">
              <XCircle className="h-12 w-12 text-red-400 mx-auto" />
              <h3 className="text-xl font-semibold text-foreground">
                Tracking Code Not Found
              </h3>
              <p className="text-muted-foreground">
                The tracking code{" "}
                <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                  {activeTrackCode}
                </code>{" "}
                does not match any RSVP record.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Unauthorized */}
        {!isAuthorized && !loading && !notFound && activeTrackCode && !trackingData && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 text-center space-y-3">
              <ShieldX className="h-12 w-12 text-amber-400 mx-auto" />
              <h3 className="text-xl font-semibold text-foreground">
                Unauthorized Access
              </h3>
              <p className="text-muted-foreground">
                Only the event organizer can view RSVP tracking details.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tracking Data Display */}
        {trackingData && isAuthorized && !loading && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Check-in Status Banner */}
            {trackingData.rsvp.checked_in ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    Checked In
                  </p>
                  <p className="text-sm text-green-600/70 dark:text-green-400/70">
                    {trackingData.rsvp.checked_in_at &&
                      format(
                        new Date(trackingData.rsvp.checked_in_at),
                        "PPP 'at' p",
                      )}
                  </p>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg"
              >
                {checkingIn ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Checking In...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Mark as Checked In
                  </div>
                )}
              </Button>
            )}

            {/* User Info */}
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-[#c4b0a2]/10 to-transparent">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5 text-[#c4b0a2]" />
                  Attendee Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <div className="flex items-center gap-4">
                  {trackingData.user.profile_photo_url ? (
                    <img
                      src={trackingData.user.profile_photo_url}
                      alt="Attendee"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#c4b0a2]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#c4b0a2] to-[#a89282] flex items-center justify-center text-white font-bold text-xl">
                      {(trackingData.user.first_name?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-lg text-foreground">
                      {trackingData.user.first_name}{" "}
                      {trackingData.user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {trackingData.user.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RSVP Info */}
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/10 to-transparent">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Ticket className="h-5 w-5 text-amber-500" />
                  RSVP Info
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    icon={<Clock className="h-4 w-4" />}
                    label="RSVP Date"
                    value={format(
                      new Date(trackingData.rsvp.created_at),
                      "MMM d, yyyy",
                    )}
                  />
                  <InfoItem
                    icon={<QrCode className="h-4 w-4" />}
                    label="Track Code"
                    value={
                      <span className="font-mono text-xs break-all">
                        {trackingData.rsvp.track_code}
                      </span>
                    }
                  />
                  <InfoItem
                    icon={<CreditCard className="h-4 w-4" />}
                    label="Payment"
                    value={
                      <Badge
                        className={
                          trackingData.event.is_paid
                            ? trackingData.rsvp.payment_status === "paid"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }
                      >
                        {trackingData.event.is_paid
                          ? trackingData.rsvp.payment_status || "pending"
                          : "Free"}
                      </Badge>
                    }
                  />
                  {trackingData.event.is_paid &&
                    trackingData.event.event_fee && (
                      <InfoItem
                        icon={<CreditCard className="h-4 w-4" />}
                        label="Price"
                        value={`$${trackingData.event.event_fee}`}
                      />
                    )}
                  <InfoItem
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Status"
                    value={
                      <Badge
                        className={
                          trackingData.rsvp.status === "confirmed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }
                      >
                        {trackingData.rsvp.status}
                      </Badge>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Event Info */}
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 to-transparent">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Event Info
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {trackingData.event.cover_photo_url && (
                  <img
                    src={trackingData.event.cover_photo_url}
                    alt={trackingData.event.name}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                )}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {trackingData.event.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-[#c4b0a2]" />
                    {format(
                      new Date(trackingData.event.date_time),
                      "EEEE, MMMM d, yyyy 'at' h:mm a",
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-[#c4b0a2]" />
                    {trackingData.event.location_name ||
                      trackingData.event.location ||
                      "Location TBD"}
                    {trackingData.event.location_address && (
                      <span className="text-xs">
                        {" "}
                        — {trackingData.event.location_address}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/10 to-transparent">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Crown className="h-5 w-5 text-purple-500" />
                  Event Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="font-semibold text-foreground">
                  {trackingData.owner.first_name}{" "}
                  {trackingData.owner.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {trackingData.owner.email}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State - No search yet */}
        {!activeTrackCode && !loading && (
          <div className="text-center py-16 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
              <QrCode className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">
              Ready to Track
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Enter a tracking code above or scan a QR code to view attendee
              check-in details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for info items
const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider">
      {icon}
      {label}
    </div>
    <div className="text-sm font-medium text-foreground">{value}</div>
  </div>
);

export default TrackRSVP;
