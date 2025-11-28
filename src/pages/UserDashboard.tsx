import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Users,
  MapPin,
  Star,
  CalendarDays,
  Search,
  Users2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

const UserDashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [walletPayments, setWalletPayments] = useState([]);
  const [crossedPaths, setCrossedPaths] = useState([]);
  const [events, setEvents] = useState([]);
  useEffect(() => {
    if (profile) {
      fetchWalletPayments();
      fetchAllEvents();
      fetchCrossedPaths();
    }
  }, [profile]);

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
              id, user_id, email,  username, first_name, last_name, profile_photo_url, job_title, 
              location_city, dining_style, dietary_preferences, gender_identity,
              payments:payments!payments_user_id_fkey (
                id, user_id, status, updated_at
              )
            ),
            user2:profiles!crossed_paths_user2_id_fkey(
              id, user_id,  email, username, first_name, last_name, profile_photo_url, job_title, 
              location_city, dining_style, dietary_preferences, gender_identity,
              payments:payments!payments_user_id_fkey (
                id, user_id, status, updated_at
              )
            )
          `
        )
        .or(`user1_id.eq.${profile.user_id},user2_id.eq.${profile.user_id}`)
        .eq("is_active", true)
        .order("matched_at", { ascending: false })
        // 👇 apply ordering+limit on the joined payments table
        .order("updated_at", {
          foreignTable: "user1.payments",
          ascending: false,
        })
        .limit(1, { foreignTable: "user1.payments" })
        .order("updated_at", {
          foreignTable: "user2.payments",
          ascending: false,
        })
        .limit(1, { foreignTable: "user2.payments" });

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
            payment_status:
              path.user1_id === profile.user_id
                ? path.user2.payments?.[0]?.status || "free"
                : path.user1.payments?.[0]?.status || "free",
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
    }
  };

  const fetchAllEvents = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from("events")
        .select("id")
        .eq("creator_id", profile?.id);

      if (error) throw error;
      setEvents(data);
    } catch (error) {
      console.error("error for events on dashboard", error);
    }
  };

  const fetchWalletPayments = async () => {
    if (!profile?.id) return;

    try {
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id, name, event_fee, date_time")
        .eq("creator_id", profile.id)
        .eq("is_paid", true)
        .order("date_time", { ascending: false });

      if (eventsError) throw eventsError;

      const eventIds = events.map((e) => e.id);
      if (eventIds.length === 0) return [];

      const { data, error: paymentsError } = await supabase
        .from("events_payments")
        .select(
          `
    id,
    creator_id,
    event_id,
    created_at,
    withdraw_status,
    events:events_payments_event_id_fkey (
      id,
      name,
      event_fee,
      date_time,
      location_name,
      creator_id
    )
  `
        )
        .in("event_id", eventIds)
        .eq("withdraw_status", false) // optional filter
        .eq("payment_status", "succeeded")
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      // if (eventsError) throw eventsError;

      // const { data, error } = await supabase
      //   .from("events_payments")
      //   .select(
      //     `
      //   id,
      //   creator_id,
      //   event_id,
      //   created_at,
      //   withdraw_status,
      //   events:events_payments_event_id_fkey (
      //     id,
      //     name,
      //     event_fee,
      //     date_time,
      //     location_name,
      //     creator_id
      //   )
      // `
      //   )
      //   .eq("events.creator_id", profile.user_id)
      //   .eq("withdraw_status", false)
      //   .order("created_at", { ascending: false });

      // if (error) throw error;

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
  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-script">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to connect over a great meal?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/events">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground icon-animate" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">
                Events you've created
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/explore">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Explore</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground icon-animate" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Browse</div>
              <p className="text-xs text-muted-foreground">
                Find events to join
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/crossed-paths">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Crossed Paths
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground icon-animate" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{crossedPaths.length}</div>
              <p className="text-xs text-muted-foreground">
                Recent connections
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/feedback">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground icon-animate" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Share</div>
              <p className="text-xs text-muted-foreground">
                Your thoughts matter
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
      <Card className="shadow-card border-border mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            My Wallet
            <Link to="/wallet/withdraw">
              <Button variant="outline" size="sm">
                Request Withdrawal
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          {walletPayments?.length === 0 ? (
            <p className="text-muted-foreground">No payments received yet.</p>
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
                      <td className="p-3 text-red-500">-${fee.toFixed(2)}</td>
                      <td className="p-3 text-green-600">${net.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with your next dining experience
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Link to="/create-event">
              <Button className="w-full">Create New Event</Button>
            </Link>
            <Link to="/explore">
              <Button variant="outline" className="w-full">
                Browse Events
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Status</CardTitle>
            <CardDescription>
              Keep your profile updated for better connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Profile Complete</span>
                <span className="text-sm font-medium text-green-600">✓</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Photo Uploaded</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {profile?.profile_photo_url ? "✓" : "Pending"}
                </span>
              </div>
            </div>
            <Link to="/profile">
              <Button variant="outline" className="w-full mt-4">
                Update Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
