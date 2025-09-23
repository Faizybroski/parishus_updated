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
import { Calendar, Users, MapPin, Star, CalendarDays, Search, Users2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [walletPayments, setWalletPayments] = useState<WalletPayment[]>([]);
  useEffect(() => {
    if (profile) {
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
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {profile?.first_name || user?.email}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to connect over a great meal?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/events")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Events you've created
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/explore")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Explore</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Browse</div>
            <p className="text-xs text-muted-foreground">Find events to join</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/crossed-paths")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crossed Paths</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Recent connections</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/feedback")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Share</div>
            <p className="text-xs text-muted-foreground">
              Your thoughts matter
            </p>
          </CardContent>
        </Card>
      </div>
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
          <CardContent className="space-y-4">
            <Button
              onClick={() => navigate("/create-event")}
              className="w-full"
            >
              Create New Event
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/explore")}
              className="w-full"
            >
              Browse Events
            </Button>
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
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              className="w-full mt-4"
            >
              Update Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
