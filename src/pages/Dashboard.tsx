import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import InviteToPrivateDinnerModal from "@/components/invitations/InviteToPrivateDinnerModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Clock,
  Users,
  MapPin,
  UserCheck,
  Calendar,
  Utensils,
  User,
  Plus,
  Star,
  Heart,
  Search,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import EventsCarousel from "@/components/events/EventsCarousel";
import { useMyUpcomingEvents } from "@/hooks/useMyUpcomingEvents";
interface CrossedPath {
  id: string;
  matched_at: string;
  location_name: string;
  is_active: boolean;
  user1_id: string;
  user2_id: string;
  total_crosses: number;
  locations: string[];
  location_details?: Array<{
    name: string;
    address?: string;
    cross_count: number;
  }>;
  matched_user: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    profile_photo_url: string;
    job_title: string;
    location_city: string;
    dining_style: string;
    dietary_preferences: string[];
    gender_identity: string;
  };
}
const Dashboard = () => {
  const navigate = useNavigate();
  const { myUpcomingEvents, loading } = useMyUpcomingEvents();
  const [crossedLoading, setCrossedLoading] = useState(true);
  const { user } = useAuth();
  const [crossedPaths, setCrossedPaths] = useState<CrossedPath[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<
    CrossedPath["matched_user"] | null
  >(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCrossedPath, setSelectedCrossedPath] =
    useState<CrossedPath | null>(null);
  const { profile } = useProfile();
  const [walletPayments, setWalletPayments] = useState<WalletPayment[]>([]);
  useEffect(() => {
    if (profile) {
      fetchCrossedPaths();
      fetchWalletPayments();
    }
  }, [profile]);
  const fetchWalletPayments = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from("events_payments")
        .select(
          `
        id,
        creator_id,
        event_id,
        created_at,
        withdraw_status,
        events:event_id (
          id,
          name,
          event_fee,
          date_time,
          location_name
        )
      `
        )
        .eq("creator_id", profile.user_id)
        .eq("withdraw_status", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWalletPayments(data || []);
    } catch (err) {
      console.error("Error fetching wallet payments:", err);
      toast({
        title: "Error",
        description: "Failed to load wallet payments",
        variant: "destructive",
      });
    }
  };

  const fetchCrossedPaths = async () => {
    if (!profile) return;

    try {
      // First get basic crossed paths using proper foreign key joins
      const { data: crossedPathsData, error } = await supabase
        .from("crossed_paths")
        .select(
          `
          *,
          user1:profiles!crossed_paths_user1_id_fkey(
            id, user_id, first_name, last_name, username, profile_photo_url, job_title, 
            location_city, dining_style, dietary_preferences, gender_identity
          ),
          user2:profiles!crossed_paths_user2_id_fkey(
            id, user_id, first_name, last_name, username, profile_photo_url, job_title, 
            location_city, dining_style, dietary_preferences, gender_identity
          )
        `
        )
        .or(`user1_id.eq.${profile.user_id},user2_id.eq.${profile.user_id}`)
        .eq("is_active", true)
        .order("matched_at", { ascending: false })
        .limit(2);

      if (error) {
        console.error("Error fetching crossed paths:", error);
        setCrossedPaths([]);
        return;
      }

      // Now get aggregated data from crossed_paths_log for each pair
      const enrichedPaths = await Promise.all(
        (crossedPathsData || []).map(async (path: any) => {
          const otherUserId =
            path.user1_id === profile.user_id
              ? path.user2.user_id
              : path.user1.user_id;
          const userAId =
            profile.user_id < otherUserId ? profile.user_id : otherUserId;
          const userBId =
            profile.user_id < otherUserId ? otherUserId : profile.user_id;

          // Get all crossed path logs for this user pair
          const { data: logData } = await supabase
            .from("crossed_paths_log")
            .select("restaurant_name, cross_count")
            .eq("user_a_id", userAId)
            .eq("user_b_id", userBId);

          const locations =
            logData?.map((log) => log.restaurant_name).filter(Boolean) || [];
          const totalCrosses =
            logData?.reduce((sum, log) => sum + (log.cross_count || 1), 0) || 1;

          // Create location_details array with proper structure
          const locationDetails =
            logData?.reduce((acc, log) => {
              if (!log.restaurant_name) return acc;

              const existing = acc.find(
                (item) => item.name === log.restaurant_name
              );
              if (existing) {
                existing.cross_count += log.cross_count || 1;
              } else {
                acc.push({
                  name: log.restaurant_name,
                  cross_count: log.cross_count || 1,
                });
              }
              return acc;
            }, [] as Array<{ name: string; cross_count: number }>) || [];

          return {
            ...path,
            matched_user:
              path.user1_id === profile.user_id ? path.user2 : path.user1,
            total_crosses: totalCrosses,
            locations: [...new Set(locations)], // Remove duplicates
            location_details: locationDetails,
          };
        })
      );

      setCrossedPaths(enrichedPaths);
    } catch (error: any) {
      console.error("Error in fetchCrossedPaths:", error);
      setCrossedPaths([]);
      toast({
        title: "Error",
        description: "Failed to load crossed paths",
        variant: "destructive",
      });
    } finally {
      setCrossedLoading(false);
    }
  };

  const handleInviteToDinner = (path: CrossedPath) => {
    // console.log("Path:===>>", path.matched_user.email, path.matched_user.id,path.matched_user.first_name, path.matched_user.last_name);

    navigate("/explore", {
    state: {
      invitedUser: {
        id: path.matched_user.id,
        first_name: path.matched_user.first_name,
        last_name: path.matched_user.last_name,
        email: path.matched_user.email,
      },
    },
  });
    // setSelectedCrossedPath(path);
    // setShowInviteModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back!
              </h1>
              <p className="text-muted-foreground mt-1">
                Ready for your next dining adventure?
              </p>
            </div>
            <div className="justify-end">
              <Button
                className="bg-peach-gold hover:bg-peach-gold/90 mt-4 sm:mt-0 me-2"
                onClick={() => navigate("/explore")}
              >
                {" "}
                <Calendar className="h-4 w-4 mr-2" />
                View All Events
              </Button>
              <Button
                onClick={() => navigate("/create-event")}
                className="bg-peach-gold hover:bg-peach-gold/90 mt-4 sm:mt-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          </div>

          {/* Featured Admin Events Carousel */}
          <EventsCarousel />
          <Card className="shadow-card border-border mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                My Wallet
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/wallet/withdraw")}
                >
                  Request Withdrawal
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              {walletPayments?.length === 0 ? (
                <p className="text-muted-foreground">
                  No payments received yet.
                </p>
              ) : (
                <table className="min-w-full text-sm text-left border border-border rounded-lg overflow-hidden">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-3 whitespace-nowrap">Event</th>
                      <th className="p-3 whitespace-nowrap">Date</th>
                      <th className="p-3 whitespace-nowrap">Gross</th>
                      <th className="p-3 whitespace-nowrap">Admin Fee (15%)</th>
                      <th className="p-3 whitespace-nowrap">You Got</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletPayments.map((payment) => {
                      const gross = payment.events?.event_fee || 0;
                      const fee = gross * 0.15;
                      const net = gross - fee;
                      return (
                        <tr
                          key={payment.id}
                          className="border-t border-border hover:bg-muted/50 transition"
                        >
                          <td className="p-3">
                            {payment.events?.name || "Unknown Event"}
                          </td>
                          <td className="p-3">
                            {payment.events?.date_time
                              ? format(
                                  new Date(payment.events.date_time),
                                  "MMM dd, yyyy"
                                )
                              : "-"}
                          </td>
                          <td className="p-3">${gross}</td>
                          <td className="p-3 text-red-500">
                            -${fee.toFixed(2)}
                          </td>
                          <td className="p-3 text-green-600">
                            ${net.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  My Upcoming Events
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/events")}
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground">
                    Loading your events...
                  </p>
                ) : myUpcomingEvents.length === 0 ? (
                  <p className="text-muted-foreground">
                    No upcoming events found.
                  </p>
                ) : (
                  myUpcomingEvents.map((event) => (
                    <Link to={`/event/${event.id}/details`} key={event.id}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-dark-surface rounded-lg hover:bg-muted transition-colors duration-200">
                        <div className="flex flex-col space-y-1 min-w-0">
                          <h3 className="font-semibold text-lg text-foreground truncate">
                            {event.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(event.date_time), "MMM dd")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(event.date_time), "hh:mm a")}
                            </span>
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="h-4 w-4" />
                              {event.location_name}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                          <Badge
                            variant={
                              event.creator_id === user?.id
                                ? "default"
                                : "secondary"
                            }
                          >
                            {event.creator_id === user?.id
                              ? "Creator"
                              : "Attending"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {event.rsvp_count || 0} attending
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-sage-green" />
                    Crossed Paths
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/crossed-paths")}
                  >
                    View All
                  </Button>
                </CardTitle>
                <CardDescription>
                  People you've encountered at similar places
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {crossedPaths.map((path) => (
                  <div
                    key={path.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-2 bg-dark-surface rounded-lg"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="h-10 w-10 bg-sage-green/20 rounded-full flex items-center justify-center">
                        <span className="text-sage-green font-semibold">
                          {path.matched_user.first_name?.[0]}
                          {path.matched_user.last_name?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {path.matched_user.first_name}{" "}
                          {path.matched_user.last_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {path.locations.length > 0 && (
                            <span className="truncate max-w-[180px]">
                              {path.locations.join(", ")}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className="text-xs font-medium"
                          >
                            {path.total_crosses}x
                          </Badge>
                          <span>•</span>
                          <span>
                            {new Date(path.matched_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:shrink-0">
                      <Button
                        onClick={() => handleInviteToDinner(path)}
                        variant="outline"
                        size="sm"
                        className="border-sage-green text-sage-green hover:bg-sage-green/10"
                      >
                        Invite
                      </Button>
                      <Button
                        onClick={() => navigate(`/profile/${path.matched_user.username}`)}
                        variant="outline"
                        size="sm"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-card border-border cursor-pointer hover:shadow-glow transition-shadow">
              <Link to={`/create-event/`}>
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-peach-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-6 w-6 text-peach-gold" />
                  </div>
                  <h3 className="font-semibold mb-2">Create Event</h3>
                  <p className="text-sm text-muted-foreground">
                    Host your own dining experience
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card
              className="shadow-card border-border cursor-pointer hover:shadow-glow transition-shadow"
              onClick={() => navigate("/explore")}
            >
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-sage-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-sage-green" />
                </div>
                <h3 className="font-semibold mb-2">Explore Events</h3>
                <p className="text-sm text-muted-foreground">
                  Find dining events near you
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border cursor-pointer hover:shadow-glow transition-shadow">
              <Link to={`/feedback/`}>
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-mystery-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-mystery-purple" />
                  </div>
                  <h3 className="font-semibold mb-2">Give Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    Rate your recent experiences
                  </p>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
