import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subMonths, getMonth, getYear } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { sendEventInvite } from "@/lib/sendInvite";
import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Ban,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Star,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  UserX
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis
} from "recharts";

const generateStubData = async () => {
  const now = new Date();
  const monthsWindow = Array.from({ length: 12 })
    .map((_, i) => {
      const d = subMonths(now, 11 - i); 
      return format(d, "MMM yyyy"); 
    });

  // const { data: userRows, error: userError } = await supabase
  //   .from("profiles")
  //   .select("created_at");
  // if (userError) throw userError;

    const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("created_at, dining_style, id, role");
  if (profileError) throw profileError;

  const userGrowthMap: Record<string, number> = {};
  monthsWindow.forEach((m) => (userGrowthMap[m] = 0)); 

  profileRows.forEach(({ created_at }) => {
    const month = format(new Date(created_at), "MMM yyyy");
    if (month in userGrowthMap) {
      userGrowthMap[month] += 1;
    }
  });

  const userGrowthData = monthsWindow.map((month) => ({
    month,
    users: userGrowthMap[month],
  }));

  const { data: eventRows, error: eventError } = await supabase
    .from("events")
    .select("created_at, event_fee, creator_id, is_paid");
  if (eventError) throw eventError;

  const eventTrendsMap: Record<string, number> = {};
  monthsWindow.forEach((m) => (eventTrendsMap[m] = 0));

  eventRows.forEach(({ created_at }) => {
    const month = format(new Date(created_at), "MMM yyyy");
    if (month in eventTrendsMap) {
      eventTrendsMap[month] += 1;
    }
  });

  const eventTrendsData = monthsWindow.map((month) => ({
    month,
    events: eventTrendsMap[month],
  }));

  const formatName = (str) =>
    str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const diningStyles = [
    "adventurous",
    "foodie_enthusiast",
    "local_lover",
    "comfort_food",
    "health_conscious",
    "social_butterfly",
  ];

  const diningStylesData = diningStyles.map((style) => ({
    name: formatName(style),
    value: profileRows.filter((p) => p.dining_style === style).length,
    color:
      style === "adventurous" ? "#FF6F61" :
      style === "foodie_enthusiast" ? "#6A5ACD" :
      style === "local_lover" ? "#20B2AA" :
      style === "comfort_food" ? "#FFD700" :
      style === "health_conscious" ? "#32CD32" :
      "#FF8C00",
  }));

  const adminIds = profileRows.filter((p) => p.role === "admin").map((p) => p.id);

  if (adminIds.length === 0) {
    console.warn("No admins found, revenue will be zero.");
  }

  const revenueMap: Record<string, number> = {};
  monthsWindow.forEach((m) => (revenueMap[m] = 0));

  let currentMonthRevenue = 0;
  let currentYearRevenue = 0;

  const thisMonth = getMonth(now);
  const thisYear = getYear(now);

  eventRows.forEach(({ created_at, creator_id, is_paid, event_fee }) => {
    if (is_paid && adminIds.includes(creator_id)) {
      const eventDate = new Date(created_at);
      const month = format(eventDate, "MMM yyyy");

      if (month in revenueMap) {
        revenueMap[month] += event_fee || 0;
      }

      if (getMonth(eventDate) === thisMonth && getYear(eventDate) === thisYear) {
        currentMonthRevenue += event_fee || 0;
      }

      if (getYear(eventDate) === thisYear) {
        currentYearRevenue += event_fee || 0;
      }
    }
  });

  const revenueData = monthsWindow.map((month) => ({
    month,
    revenue: revenueMap[month],
  }));

  return { userGrowthData, eventTrendsData, revenueData, diningStylesData, currentMonthRevenue, currentYearRevenue };
};

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalEvents: 0,
    monthlyRSVPs: 0,
    monthlyRevenue: 8500,
    yearlyRevenue: 47200,
  });

  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingUserSearchTerm, setPendingUserSearchTerm] = useState("");
  const [eventSearchTerm, setEventSearchTerm] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [eventStatusFilter, setEventStatusFilter] = useState("all");
  const [pendingUserStatusFilter, setPendingUserStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "",
    message: "",
  });

  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    generateStubData().then(setChartData).catch(console.error);
  }, []);

  useEffect(() => {
    if (
      profile &&
      (profile.role === "admin")
    ) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // Fetch users with RSVP counts
      const { data: usersData } = await supabase.from("profiles").select(`
          *,
          rsvps:rsvps(count),
          created_events:events(count)
        `);

      // Fetch events with RSVP data
      const { data: eventsData } = await supabase.from("events").select(`
          *,
          profiles!events_creator_id_fkey(first_name, last_name, email),
          rsvps(*, profiles(first_name, last_name, email))
        `);

      // Fetch pending users
      const { data: pendingUsersData } = await supabase.from("profiles").select(`*`).eq("approval_status", "pending");

      // Calculate RSVPs for the month
      const thisMonth = new Date();
      thisMonth.setDate(1);

      const { data: monthlyRSVPs } = await supabase
        .from("rsvps")
        .select("*")
        .gte("created_at", thisMonth.toISOString());

      const activeUsers =
        usersData?.filter((u) => u.onboarding_completed && !u.is_suspended)
          .length || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        activeUsers,
        totalEvents: eventsData?.length || 0,
        monthlyRSVPs: monthlyRSVPs?.length || 0,
        monthlyRevenue: 8500, // Stub data
        yearlyRevenue: 47200, // Stub data
      });

      setUsers(usersData || []);
      setEvents(eventsData || []);
      setPendingUsers(pendingUsersData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({ title: "Error loading dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { data: updatedProfiles, error: updateError } = await supabase
        .from("profiles")
        .update({ approval_status: "approved" })
        .eq("user_id", userId)
        .select("email, first_name");
  
      if (updateError) throw updateError;

      const approvedUserEmail = updatedProfiles?.[0]?.email;
      const approvedUserName = updatedProfiles?.[0]?.first_name;
      if (!approvedUserEmail) throw new Error("User email not found");
  
      // await supabase.from("audit_logs").insert({
      //   admin_id: user?.id,
      //   action: "approve_user",
      //   target_type: "user",
      //   target_id: userId,
      //   notes: "User approved via admin panel",
      // });

      await sendEventInvite({
        to: approvedUserEmail,
        subject: "Welcome to Parish – You’re Officially Approved!",
        html: `<!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                      <title>Account Approved</title>
                    </head>
                    <body style="margin:0; padding:0; background-color:#f9fafb; font-family:Arial, sans-serif; color:#333;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; padding:20px;">
                        <tr>
                          <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                              
                              <!-- Header -->
                              <tr>
                                <td align="center" style="background-color:#16a34a; padding:40px 20px;">
                                  <h1 style="margin:0; font-size:26px; color:#ffffff;">Account Approved ✅</h1>
                                </td>
                              </tr>

                              <!-- Body -->
                              <tr>
                                <td style="padding:30px; font-size:16px; line-height:1.6; color:#444;">
                                  <p>Hi <strong>${approvedUserName}</strong>,</p>
                                  <p>
                                    Congratulations! 🎉 Your account has been 
                                    <span style="color:#16a34a; font-weight:bold;">approved</span> by our team.
                                  </p>

                                  <p>
                                    You now have full access to all features and services available in your account.
                                  </p>

                                  <p style="margin-top:20px; text-align:center;">
                                    <a href="https://parishus.com/" 
                                      style="display:inline-block; background-color:#16a34a; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:8px; font-weight:bold; font-size:16px;">
                                      Go to Dashboard
                                    </a>
                                  </p>

                                  <p style="margin-top:30px; font-size:14px; color:#888;">
                                    – The Parish Team
                                  </p>
                                </td>
                              </tr>

                              <!-- Footer -->
                              <tr>
                                <td align="center" style="background-color:#f3f4f6; padding:20px; font-size:12px; color:#666;">
                                  <p style="margin:0;">Parish • User Accounts</p>
                                  <p style="margin:5px 0 0;">If you did not create this account, please contact support immediately.</p>
                                </td>
                              </tr>

                            </table>
                          </td>
                        </tr>
                      </table>
                    </body>
                  </html>`,
      });
  
      toast({ title: "User approved successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error approving user", variant: "destructive" });
    }
  };
  
  const handleRejectUser = async (userId: string) => {
    try {
      const { data: updatedProfiles, error: updateError } = await supabase
        .from("profiles")
        .update({ approval_status: "rejected" })
        .eq("user_id", userId)
        .select("email, first_name");
  
      if (updateError) throw updateError;

      const approvedUserEmail = updatedProfiles?.[0]?.email;
      const approvedUserName = updatedProfiles?.[0]?.first_name;
      if (!approvedUserEmail) throw new Error("User email not found");
  
      // await supabase.from("audit_logs").insert({
      //   admin_id: user?.id,
      //   action: "reject_user",
      //   target_type: "user",
      //   target_id: userId,
      //   notes: "User rejected via admin panel",
      // });

      await sendEventInvite({
        to: approvedUserEmail,
        subject: "Update on Your Parish Application",
         html: `<!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                      <title>Account Rejected</title>
                    </head>
                    <body style="margin:0; padding:0; background-color:#f9fafb; font-family:Arial, sans-serif; color:#333;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; padding:20px;">
                        <tr>
                          <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                              
                              <!-- Header -->
                              <tr>
                                <td align="center" style="background-color:#dc2626; padding:40px 20px;">
                                  <h1 style="margin:0; font-size:26px; color:#ffffff;">Account Rejected ❌</h1>
                                </td>
                              </tr>

                              <!-- Body -->
                              <tr>
                                <td style="padding:30px; font-size:16px; line-height:1.6; color:#444;">
                                  <p>Hi <strong>${approvedUserName}</strong>,</p>
                                  <p>
                                    Unfortunately, your account application has been 
                                    <span style="color:#dc2626; font-weight:bold;">rejected</span>.
                                  </p>

                                  <p>
                                    This may be due to incomplete information, failing verification, or not meeting our eligibility criteria.
                                  </p>

                                  <p>
                                    If you believe this is a mistake, please reach out to our support team for further clarification.
                                  </p>

                                  <p style="margin-top:30px; font-size:14px; color:#888;">
                                    – The Parish Team
                                  </p>
                                </td>
                              </tr>

                              <!-- Footer -->
                              <tr>
                                <td align="center" style="background-color:#f3f4f6; padding:20px; font-size:12px; color:#666;">
                                  <p style="margin:0;">Parish • User Accounts</p>
                                  <p style="margin:5px 0 0;">If you did not apply for this account, you can ignore this email.</p>
                                </td>
                              </tr>

                            </table>
                          </td>
                        </tr>
                      </table>
                    </body>
                  </html>`,
      });
  
      toast({ title: "User rejected successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error rejecting user", variant: "destructive" });
    }
  };

  const suspendUser = async (userId: string) => {
    if (!confirm("Are you sure you want to suspend this user?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: true })
        .eq("user_id", userId);

      if (error) throw error;

      // Log audit action
      // await supabase.from("audit_logs").insert({
      //   admin_id: user?.id,
      //   action: "suspend_user",
      //   target_type: "user",
      //   target_id: userId,
      //   notes: "User suspended via admin panel",
      // });

      toast({ title: "User suspended successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error suspending user", variant: "destructive" });
    }
  };

  const reactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: false })
        .eq("user_id", userId);

      if (error) throw error;

      // Log audit action
      // await supabase.from("audit_logs").insert({
      //   admin_id: user?.id,
      //   action: "reactivate_user",
      //   target_type: "user",
      //   target_id: userId,
      //   notes: "User reactivated via admin panel",
      // });

      toast({ title: "User reactivated successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error reactivating user", variant: "destructive" });
    }
  };

    const deleteUser = async (userId: string) => {
      if (!confirm("Are you sure you want to delete this user? This action cannot be undone."))return;

      try {
        const { data, error } = await supabase.rpc("delete_user_account", {
  target_user: userId
});
        if (error) {
          console.error("❌ Error deleting user:", error.message);
        } else {
          console.log("✅ User deleted successfully!");
          toast({ title: "User deleted successfully" });
        }
        fetchDashboardData();

      } catch (error) {
        toast({ title: "Error deleting user", variant: "destructive" });
      }
    };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      // Log audit action
      // await supabase.from("audit_logs").insert({
      //   admin_id: user?.id,
      //   action: "delete_event",
      //   target_type: "event",
      //   target_id: eventId,
      //   notes: "Event deleted via admin panel",
      // });

      toast({ title: "Event deleted successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error deleting event", variant: "destructive" });
    }
  };

  const cancelEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to cancel this event?")) return;

    try {
      const { error } = await supabase
        .from("events")
        .update({ status: "cancelled" })
        .eq("id", eventId);

      if (error) throw error;

      // Log audit action
      // await supabase.from("audit_logs").insert({
      //   admin_id: user?.id,
      //   action: "cancel_event",
      //   target_type: "event",
      //   target_id: eventId,
      //   notes: "Event cancelled via admin panel",
      // });

      toast({ title: "Event cancelled successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error cancelling event", variant: "destructive" });
    }
  };

  const sendEmail = async () => {
    // This would integrate with your email service
    try {
          await sendEventInvite({
            to: [emailData.to],
            subject: `${emailData.subject.trim()}`,
            text: `${emailData.message.trim()}`,
              html: `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${emailData.subject.trim()}</title>
    <style>
      /* Basic reset */
      body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
      table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
      img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
      a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important}
      /* Container */
      .email-body{width:100%;background-color:#f6f8fb;padding:24px 0}
      .email-card{max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 6px 18px rgba(22,28,45,0.08);overflow:hidden;font-family:Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;}
      .header{padding:28px 32px;background:linear-gradient(90deg,#0ea5a4,#6366f1);color:#fff}
      .brand{font-weight:700;font-size:20px;letter-spacing:0.2px}
      .preheader{display:none!important;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;line-height:1px;color:transparent}
      .content{padding:28px 32px;color:#0f172a;line-height:1.5}
      .title{font-size:20px;font-weight:600;margin:0 0 8px}
      .message{font-size:15px;color:#334155;margin:0 0 20px;white-space:pre-wrap}
      .cta{display:inline-block;padding:12px 18px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;font-weight:600}
      .meta{font-size:13px;color:#64748b;margin-top:18px}
      .footer{padding:18px 32px;background:#f1f5f9;color:#64748b;font-size:13px;text-align:center}
      .small{font-size:12px;color:#9aa4b2}
      @media (max-width:420px){
        .email-card{margin:0 12px}
        .header{padding:20px}
        .content{padding:20px}
      }
    </style>
  </head>
  <body>
    <!-- preheader: short summary for inbox preview -->
    <div class="preheader">${(emailData.message.trim() || '').slice(0,120).replace(/\\n/g,' ')}</div>

    <table role="presentation" class="email-body" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" class="email-card" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td class="header" align="left">
                <div class="brand">Parish — Admin Message</div>
              </td>
            </tr>

            <tr>
              <td class="content">
                <h1 class="title">${emailData.subject.trim()}</h1>

                <div class="message">
                  ${(emailData.message.trim() || '').replace(/\\n/g,'<br/>')}
                </div>

              </td>
            </tr>

            <tr>
              <td class="footer">
                © ${new Date().getFullYear()} Parish <br/>
                <span class="small">You received this message because you're registered with Parish.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `
          })
          toast({ title: "Email sent successfully" });
        } catch {
          toast({ title: "Error sending mail to user", variant: "destructive" });
        }
    setShowEmailModal(false);
    setEmailData({ to: "", subject: "", message: "" });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = `${user.first_name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim());
    const matchesStatus =
      userStatusFilter === "all" ||
            (userStatusFilter === "active" &&
              !user.is_suspended &&
              user.onboarding_completed &&
              user.approval_status === "approved") ||
            (userStatusFilter === "suspended" &&
              user.is_suspended &&
              user.approval_status === "approved") ||
            (userStatusFilter === "incomplete" &&
              !user.onboarding_completed &&
              user.approval_status === "approved") ||
            (userStatusFilter === "pending" && user.approval_status === "pending") ||
            (userStatusFilter === "rejected" && user.approval_status === "rejected");
    return matchesSearch && matchesStatus;
  });

    const pendingFilteredUsers = pendingUsers.filter((user) => {
    const matchesSearch = `${user.first_name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(pendingUserSearchTerm.toLowerCase().trim());
    const matchesStatus =
            (pendingUserStatusFilter === "pending" && user.approval_status === "pending") ||
            (pendingUserStatusFilter === "rejected" && user.approval_status === "rejected");
    return matchesSearch && matchesStatus;
  });

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(eventSearchTerm.toLowerCase().trim());
    const matchesStatus =
      eventStatusFilter === "all" || event.status === eventStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile || (profile.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-2xl p-8 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {profile?.first_name}!
            </h1>
            <p className="text-muted-foreground text-lg">
              Here's what's happening with your platform today.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              className="flex items-center space-x-2"
              onClick={() => navigate("/admin/events")}
            >
              <Calendar className="h-4 w-4" />
              <span>View all Events</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Data</span>
            </Button>
            <Button className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Total Users
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>{stats.activeUsers} active users</span>
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Total Events
            </CardTitle>
            <div className="p-2 bg-accent/10 rounded-full">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.totalEvents.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Active events</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-secondary/20 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              RSVPs This Month
            </CardTitle>
            <div className="p-2 bg-secondary/10 rounded-full">
              <UserCheck className="h-5 w-5 text-secondary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.monthlyRSVPs.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Event registrations</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-muted/5 to-muted/10 border-muted/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-muted/20 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Monthly Revenue
            </CardTitle>
            <div className="p-2 bg-muted/10 rounded-full">
              <DollarSign className="h-5 w-5 text-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              ${chartData.currentMonthRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              Yearly: ${chartData.currentYearRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

         {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-6 xl:gap-8">
        {/* User Growth */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-base md:text-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold">User Growth Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartContainer
              config={{
                users: {
                  label: "Users",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="w-full h-[260px] sm:h-[300px] overflow-hidden"
            >
              <LineChart data={chartData.userGrowthData} width={undefined}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="var(--color-users)"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Event Trends */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-base md:text-lg">
              <div className="p-2 bg-accent/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <span className="font-semibold">Event Creation Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartContainer
              config={{
                events: {
                  label: "Events",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="w-full h-[260px] sm:h-[300px] overflow-hidden"
            >
              <BarChart data={chartData.eventTrendsData} width={undefined}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="events" fill="var(--color-events)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Trends */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-base md:text-lg">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold">Revenue Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="w-full h-[260px] sm:h-[300px] overflow-hidden"
            >
              <LineChart data={chartData.revenueData} width={undefined}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Dining Styles */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-base md:text-lg">
              <div className="p-2 bg-muted/10 rounded-lg">
                <Star className="h-5 w-5 text-foreground" />
              </div>
              <span className="font-semibold">Top Dining Styles</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {chartData && chartData.diningStylesData?.length > 0 ? (
            <ChartContainer   
              config={{
                adventurous: { label: "Adventurous", color: "#FF6F61" },
                foodie: { label: "Foodie Enthusiast", color: "#6A5ACD" },
                local: { label: "Local Lover", color: "#20B2AA" },
                comfort: { label: "Comfort Food", color: "#FFD700" },
                health: { label: "Health Conscious", color: "#32CD32" },
                social: { label: "Social Butterfly", color: "#FF8C00" },
              }} 
              className="w-full h-[260px] sm:h-[300px] overflow-hidden">
                          <PieChart>
                <Pie
                  data={chartData.diningStylesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {chartData.diningStylesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            ) : (
              <p className="text-center text-gray-500">Loading chart...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>User Management</span>
          </TabsTrigger>
          <TabsTrigger value="pending_users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Pending User Management</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Event Management</span>
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
  <Card className="max-w-full overflow-x-auto">
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <CardTitle>User Management</CardTitle>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
          <Select
            value={userStatusFilter}
            onValueChange={setUserStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
    <CardContent className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Events Created</TableHead>
            <TableHead>RSVPs</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.slice(0, 10).map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium truncate max-w-[150px]">
                {user.first_name} {user.last_name}
              </TableCell>
              <TableCell className="truncate max-w-[150px]">{user.email}</TableCell>
              <TableCell>
                <Badge
                  variant={user.is_suspended ? "destructive" : "default"}
                >
                  {user.is_suspended ? "Suspended" : "Active"}
                </Badge>
              </TableCell>
              <TableCell>{user.created_events?.[0]?.count || 0}</TableCell>
              <TableCell>{user.rsvps?.[0]?.count || 0}</TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserDetails(true);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEmailData({ ...emailData, to: user.email });
                      setShowEmailModal(true);
                    }}
                  >
                    <Mail className="h-3 w-3" />
                  </Button>
                  {user.approval_status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveUser(user.user_id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectUser(user.user_id)}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      {user.is_suspended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reactivateUser(user.user_id)}
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => suspendUser(user.user_id)}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteUser(user.user_id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</TabsContent>

<TabsContent value="pending_users" className="space-y-4">
  <Card className="max-w-full overflow-x-auto">
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <CardTitle>Pending User Management</CardTitle>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pending users..."
              value={pendingUserSearchTerm}
              onChange={(e) => setPendingUserSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
          <Select
            value={pendingUserStatusFilter}
            onValueChange={setPendingUserStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
    <CardContent className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingFilteredUsers.slice(0, 10).map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium truncate max-w-[150px]">
                {user.first_name} {user.last_name}
              </TableCell>
              <TableCell className="truncate max-w-[150px]">{user.email}</TableCell>
              <TableCell>
                <Badge
                  variant={user.is_suspended ? "destructive" : "default"}
                >
                  {user.is_suspended ? "Suspended" : "Active"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserDetails(true);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEmailData({ ...emailData, to: user.email });
                      setShowEmailModal(true);
                    }}
                  >
                    <Mail className="h-3 w-3" />
                  </Button>
                  {user.approval_status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveUser(user.user_id)}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectUser(user.user_id)}
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {user.is_suspended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reactivateUser(user.user_id)}
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => suspendUser(user.user_id)}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteUser(user.user_id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</TabsContent>


        {/* Event Management Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <CardTitle>Event Management</CardTitle>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={eventSearchTerm}
                      onChange={(e) => setEventSearchTerm(e.target.value)}
                      className="w-full sm:w-64"
                    />
                  </div>
                  <Select
                    value={eventStatusFilter}
                    onValueChange={setEventStatusFilter}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Seats Remaining</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.slice(0, 10).map((event) => {
                    const confirmedRSVPs =
                      event.rsvps?.filter((rsvp) => rsvp.status === "confirmed")
                        .length || 0;
                    const seatsRemaining =
                      (event.max_attendees || 0) - confirmedRSVPs;

                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          {event.name}
                        </TableCell>
                        <TableCell>
                          {event.profiles?.first_name}{" "}
                          {event.profiles?.last_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {new Date(event.date_time).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              event.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              seatsRemaining <= 5
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {seatsRemaining}/{event.max_attendees}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowEventDetails(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelEvent(event.id)}
                              disabled={event.status === "cancelled"}
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteEvent(event.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              User Details: {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Contact Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <p>
                        <strong>Email:</strong> {selectedUser.email}
                      </p>
                      <p>
                        <strong>Phone:</strong>{" "}
                        {selectedUser.phone || "Not provided"}
                      </p>
                      <p>
                        <strong>LinkedIn:</strong>{" "}
                        {selectedUser.linkedin_username ? (
                          <a
                            href={`https://linkedin.com/in/${selectedUser.linkedin_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedUser.linkedin_username}
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </p>

                      <p>
                        <strong>Instagram:</strong>{" "}
                        {selectedUser.instagram_username ? (
                          <a
                            href={`https://instagram.com/${selectedUser.instagram_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:underline"
                          >
                            {selectedUser.instagram_username}
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </p>
                      <p>
                        <strong>Location:</strong>{" "}
                        {selectedUser.location_city || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Profile Details
                    </Label>
                    <div className="mt-2 space-y-2">
                      <p>
                        <strong>Job Title:</strong>{" "}
                        {selectedUser.job_title || "Not provided"}
                      </p>
                      <p>
                        <strong>Gender:</strong>{" "}
                        {selectedUser.gender_identity || "Not specified"}
                      </p>
                      <p>
                        <strong>Dining Style:</strong>{" "}
                        {selectedUser.dining_style || "Not specified"}
                      </p>
                      <p>
                        <strong>Dietary Preferences:</strong>{" "}
                        {selectedUser.dietary_preferences?.join(", ") ||
                          "None specified"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Account Status
                    </Label>
                    <div className="mt-2 space-y-2">
                      <p>
                        <strong>Status:</strong>
                        <Badge
                          className="ml-2"
                          variant={
                            selectedUser.is_suspended
                              ? "destructive"
                              : "default"
                          }
                        >
                          {selectedUser.is_suspended ? "Suspended" : "Active"}
                        </Badge>
                      </p>
                      <p>
                        <strong>Role:</strong>
                        <Badge className="ml-2" variant="outline">
                          {selectedUser.role}
                        </Badge>
                      </p>
                      <p>
                        <strong>Onboarding:</strong>{" "}
                        {selectedUser.onboarding_completed
                          ? "Completed"
                          : "Incomplete"}
                      </p>
                      <p>
                        <strong>Joined:</strong>{" "}
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Subscription Info (Stub)
                    </Label>
                    <div className="mt-2 space-y-2">
                      <p>
                        <strong>Plan:</strong> Premium Monthly
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <Badge variant="default">Active</Badge>
                      </p>
                      <p>
                        <strong>Start Date:</strong>{" "}
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Next Billing:</strong>{" "}
                        {new Date(
                          Date.now() + 30 * 24 * 60 * 60 * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Activity Summary
                </Label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {selectedUser.created_events?.[0]?.count || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Events Created
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {selectedUser.rsvps?.[0]?.count || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total RSVPs
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-sm text-muted-foreground">
                          Crossed Paths
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details: {selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Event Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <p>
                        <strong>Description:</strong>{" "}
                        {selectedEvent.description || "No description"}
                      </p>
                      <p>
                        <strong>Date & Time:</strong>{" "}
                        {new Date(selectedEvent.date_time).toLocaleString()}
                      </p>
                      <p>
                        <strong>Location:</strong> {selectedEvent.location_name}
                      </p>
                      <p>
                        <strong>Address:</strong>{" "}
                        {selectedEvent.location_address || "Not provided"}
                      </p>
                      <p>
                        <strong>Max Attendees:</strong>{" "}
                        {selectedEvent.max_attendees}
                      </p>
                      <p>
                        <strong>Status:</strong>
                        <Badge
                          className="ml-2"
                          variant={
                            selectedEvent.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedEvent.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Creator Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <p>
                        <strong>Name:</strong>{" "}
                        {selectedEvent.profiles?.first_name}{" "}
                        {selectedEvent.profiles?.last_name}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedEvent.profiles?.email}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Event Details
                    </Label>
                    <div className="mt-2 space-y-2">
                      <p>
                        <strong>Dining Style:</strong>{" "}
                        {selectedEvent.dining_style || "Not specified"}
                      </p>
                      <p>
                        <strong>Dietary Theme:</strong>{" "}
                        {selectedEvent.dietary_theme || "Not specified"}
                      </p>
                      <p>
                        <strong>Mystery Dinner:</strong>{" "}
                        {selectedEvent.is_mystery_dinner ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Tags:</strong>{" "}
                        {selectedEvent.tags?.join(", ") || "None"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  RSVP Guest List
                </Label>
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>RSVP Status</TableHead>
                        <TableHead>RSVP Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEvent.rsvps?.map((rsvp) => (
                        <TableRow key={rsvp.id}>
                          <TableCell>
                            {rsvp.profiles?.first_name}{" "}
                            {rsvp.profiles?.last_name}
                          </TableCell>
                          <TableCell>{rsvp.profiles?.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                rsvp.status === "confirmed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {rsvp.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(rsvp.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      )) || []}
                    </TableBody>
                  </Table>
                  {(!selectedEvent.rsvps ||
                    selectedEvent.rsvps.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">
                      No RSVPs yet
                    </p>
                  )}
                </div>
              </div>

              {selectedEvent.location_lat && selectedEvent.location_lng && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Location
                  </Label>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://maps.google.com/?q=${selectedEvent.location_lat},${selectedEvent.location_lng}`,
                          "_blank"
                        )
                      }
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Google Maps
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                value={emailData.to}
                onChange={(e) =>
                  setEmailData({ ...emailData, to: e.target.value})
                }
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData({ ...emailData, subject: e.target.value})
                }
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailData.message}
                onChange={(e) =>
                  setEmailData({ ...emailData, message: e.target.value})
                }
                placeholder="Your message..."
                rows={5}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => sendEmail()}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
