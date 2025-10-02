import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { sendEventInvite } from "@/lib/sendInvite";
import { createClient } from '@supabase/supabase-js';
import { format } from "date-fns";
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle,
  CreditCard,
  Edit,
  Eye,
  Filter,
  Mail,
  MapPin,
  Search,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

interface User {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  approval_status: string;
  linkedin_username: string;
  instagram_username: string;
  onboarding_completed: boolean;
  is_suspended: boolean;
  created_at: string;
  location_city: string;
  job_title: string;
  dining_style: string;
  dietary_preferences: string[];
  rsvps: Array<{
    id: string;
    response_status: string;
    created_at: string;
    events: {
      name: string;
      date_time: string;
    };
  }>;
  created_events: Array<{
    id: string;
    name: string;
    date_time: string;
    status: string;
  }>;
}

interface UserDetailsModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdate: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  open,
  onOpenChange,
  onUserUpdate,
}) => {
  const { user: currentUser } = useAuth();
  const { profile } = useProfile();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ subject: "", message: "" });

  if (!user) return null;

  const handleApproveUser = async () => {
    try {
      const { data: updatedProfiles, error: updateError } = await supabase
        .from("profiles")
        .update({ approval_status: "approved" })
        .eq("user_id", user.user_id)
        .select("email, first_name");

        if (updateError) throw updateError;

        const approvedUserEmail = updatedProfiles?.[0]?.email;
        const approvedUserName = updatedProfiles?.[0]?.first_name;
        if (!approvedUserEmail) throw new Error("User email not found");

      // await supabase.from("audit_logs").insert({
      //   admin_id: currentUser?.id,
      //   action: "approve_user",
      //   target_type: "user",
      //   target_id: user.user_id,
      //   notes: "User approved via admin panel",
      // });

      await sendEventInvite({
        to: approvedUserEmail,
        subject: "🎉 Welcome to Parish – You’re Officially Approved!",
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
      onUserUpdate();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error approving user", variant: "destructive" });
    }
  };

  const handleRejectUser = async () => {
    try {
      const { data: updatedProfiles, error: updateError } = await supabase
        .from("profiles")
        .update({ approval_status: "rejected" })
        .eq("user_id", user.user_id)
        .select("email, first_name");

      if (updateError) throw updateError;

      const approvedUserEmail = updatedProfiles?.[0]?.email;
      const approvedUserName = updatedProfiles?.[0]?.first_name;
      if (!approvedUserEmail) throw new Error("User email not found");

      // await supabase.from("audit_logs").insert({
      //   admin_id: currentUser?.id,
      //   action: "reject_user",
      //   target_type: "user",
      //   target_id: user.user_id,
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
      onUserUpdate();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error rejecting user", variant: "destructive" });
    }
  };

  const handleSuspendUser = async () => {
    if (!confirm("Are you sure you want to suspend this user?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: true })
        .eq("user_id", user.user_id);

      if (error) throw error;

      // Log audit action
      // await supabase.from("audit_logs").insert({
      //   admin_id: currentUser?.id,
      //   action: "suspend_user",
      //   target_type: "user",
      //   target_id: user.user_id,
      //   notes: "User suspended via admin panel",
      // });

      toast({ title: "User suspended successfully" });
      onUserUpdate();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error suspending user", variant: "destructive" });
    }
  };

  const handleReactivateUser = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: false })
        .eq("user_id", user.user_id);

      if (error) throw error;

      // Log audit action
      // await supabase.from("audit_logs").insert({
      //   admin_id: currentUser?.id,
      //   action: "reactivate_user",
      //   target_type: "user",
      //   target_id: user.user_id,
      //   notes: "User reactivated via admin panel",
      // });

      toast({ title: "User reactivated successfully" });
      onUserUpdate();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error reactivating user", variant: "destructive" });
    }
  };

  const handleDeleteUser = async () => {
    if ( !confirm("Are you sure you want to delete this user? This action cannot be undone." )) return;

    try {
              const { data, error } = await supabase.rpc("delete_user_account", {
  target_user: user.user_id
});
      if (error) {
        console.error("❌ Error deleting user:", error.message);
      } else {
        console.log("✅ User deleted successfully!");
        // Log audit action
        // await supabase.from("audit_logs").insert({
        //   admin_id: currentUser?.id,
        //   action: "delete_user",
        //   target_type: "user",
        //   target_id: user.user_id,
        //   notes: "User deleted via admin panel",
        // });

        toast({ title: "User deleted successfully" });
        onUserUpdate();
        onOpenChange(false);
      }
    } catch (error) {
      toast({ title: "Error deleting user", variant: "destructive" });
    }
  };

  const handleSendEmail = async (email: string) => {
    // This would integrate with your email service
    try {
      await sendEventInvite({
        to: [email],
        subject: `${emailData.subject.trim()}`,
        text: `${emailData.message.trim()}`,
          html: `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${emailData.subject}</title>
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
    setEmailData({ subject: "", message: "" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "yes":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "no":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "maybe":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>
                {user.first_name} {user.last_name}
              </span>
              {user.is_suspended && (
                <Badge variant="destructive">Suspended</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div>
                    <p>
                    <Label className="text-sm font-medium">LinkedIn: {" "}</Label>
                    {user.linkedin_username ? (
                      <a
                        href={`https://linkedin.com/in/${user.linkedin_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {user.linkedin_username}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>

                  <p>
                    <Label className="text-sm font-medium">Instagram: {" "}</Label>
                    {user.instagram_username ? (
                      <a
                        href={`https://instagram.com/${user.instagram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:underline"
                      >
                        {user.instagram_username}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role {" "}</Label>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Job Title:</Label>
                    <p className="text-sm">
                      {user.job_title || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {user.location_city || "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Member Since</Label>
                    <p className="text-sm">
                      {format(new Date(user.created_at), "PPP")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Dining Style</Label>
                    <p className="text-sm">
                      {user.dining_style || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Dietary Preferences
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.dietary_preferences?.length > 0 ? (
                        user.dietary_preferences.map((pref, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {pref}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          None specified
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Onboarding Status
                    </Label>
                    <div className="flex items-center space-x-2">
                      {user.onboarding_completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-sm">
                        {user.onboarding_completed ? "Completed" : "Incomplete"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Info (Stub) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Subscription Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Plan</Label>
                    <p className="text-sm">Free (Stub)</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Next Billing</Label>
                    <p className="text-sm">N/A</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RSVP History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>RSVP History ({user.rsvps?.length || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.rsvps?.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Response</TableHead>
                          <TableHead>RSVP Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.rsvps.map((rsvp) => (
                          <TableRow key={rsvp.id}>
                            <TableCell>{rsvp.events.name}</TableCell>
                            <TableCell>
                              {format(new Date(rsvp.events.date_time), "PPP")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusColor(rsvp.response_status)}
                              >
                                {rsvp.response_status || "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(rsvp.created_at), "PPP")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No RSVP history found.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Events Created */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>
                    Events Created ({user.created_events?.length || 0})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.created_events?.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.created_events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>{event.name}</TableCell>
                            <TableCell>
                              {format(new Date(event.date_time), "PPP")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{event.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No events created.</p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(true)}
                className="flex items-center space-x-2"
              >
                <Mail className="h-4 w-4" />
                <span>Send Email</span>
              </Button>
              {user.approval_status === "pending" ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproveUser()}
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>Approve User</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectUser()}
                  >
                    <UserX className="h-3 w-3" />
                    <span>Reject User</span>
                  </Button>
                </>
              ) : user.approval_status === "rejected" ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproveUser()}
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>Approve User</span>
                  </Button>
                </>
              ) : (
                <>
                  {user.is_suspended ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReactivateUser()}
                    >
                      <UserCheck className="h-3 w-3" />
                      <span>Reactivate User</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSuspendUser()}
                    >
                      <Ban className="h-3 w-3" />
                      <span>Suspend User</span>
                    </Button>
                  )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser()}
                    >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete User</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send Email to {user.first_name} {user.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, subject: e.target.value}))
                }
                placeholder="Enter email subject"
              />
            </div>
            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailData.message}
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, message: e.target.value}))
                }
                placeholder="Enter your message"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => handleSendEmail(user.email)}>Send Email</Button>
              {user.approval_status !== "pending" && (
                <>
                  {user.is_suspended ? (
                    <Button
                      onClick={handleReactivateUser}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Reactivate</span>
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={handleSuspendUser}
                      className="flex items-center space-x-2"
                    >
                      <Ban className="h-4 w-4" />
                      <span>Suspend</span>
                    </Button>
                  )}
                </>
              )}

              {user.approval_status === "pending" && (
                <>
                  <Button
                    onClick={handleApproveUser}
                    className="bg-green-600 text-white flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </Button>
                  <Button
                    onClick={handleRejectUser}
                    variant="destructive"
                    className="bg-red-600 text-white flex items-center space-x-2"
                  >
                    <UserX className="h-4 w-4" />
                    <span>Reject</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const AdminUsers = () => {
  const { profile } = useProfile();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
  const [editUserData, setEditUserData] = useState(null);

  useEffect(() => {
    if (
      profile &&
      (profile.role === "admin")
    ) {
      fetchUsers();
    }
  }, [profile]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          rsvps(*, events(name, date_time)),
          created_events:events!events_creator_id_fkey(id, name, date_time, status)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error loading users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getUserStatusColor = (user: User) => {
    if (user.is_suspended)
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (!user.onboarding_completed)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (user.approval_status === "pending")
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (user.approval_status === "rejected")
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };

const getUserStatus = (user: User) => {
  if (user.approval_status === "pending") return "Pending";
  if (user.approval_status === "rejected") return "Rejected";
  if (user.is_suspended) return "Suspended";
  if (!user.onboarding_completed) return "Incomplete";
  return "Active";
};

  const filteredUsers = users.filter((user) => {
    const matchesSearch = `${user.first_name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" &&
        !user.is_suspended &&
        user.onboarding_completed &&
        user.approval_status === "approved") ||
      (statusFilter === "suspended" &&
        user.is_suspended &&
        user.approval_status === "approved") ||
      (statusFilter === "incomplete" &&
        !user.onboarding_completed &&
        user.approval_status === "approved") ||
      (statusFilter === "pending" && user.approval_status === "pending") ||
      (statusFilter === "rejected" && user.approval_status === "rejected");

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
    );
  }


  return (
   <div className="p-4 sm:p-6 space-y-6 max-w-full mx-auto">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-script">
        User Management
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground">
        Manage user accounts and view detailed information
      </p>
    </div>
  </div>

  {/* Filters */}
  <Card>
    <CardContent className="p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Users Table */}
  <Card>
    <CardHeader>
      <CardTitle>Users ({filteredUsers.length})</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Events Created</TableHead>
              <TableHead>RSVPs</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium truncate max-w-[150px]">
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell className="truncate max-w-[8rem]">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge className={getUserStatusColor(user)}>
                    {getUserStatus(user)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>{user.created_events?.length || 0}</TableCell>
                <TableCell>{user.rsvps?.length || 0}</TableCell>
                <TableCell>
                  {format(new Date(user.created_at), "MMM d, yyyy")}
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
                      <Eye className="h-4 w-4" />
                    </Button>
                   <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditUserData(user);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>

  <UserDetailsModal
    user={selectedUser}
    open={showUserDetails}
    onOpenChange={setShowUserDetails}
    onUserUpdate={fetchUsers}
  />
  <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit User</DialogTitle>
    </DialogHeader>

    {editUserData && (
      <div className="space-y-4">
        <div>
          <Label>First Name</Label>
          <Input
            value={editUserData.first_name}
            onChange={(e) =>
              setEditUserData({ ...editUserData, first_name: e.target.value})
            }
          />
        </div>

        <div>
          <Label>Last Name</Label>
          <Input
            value={editUserData.last_name}
            onChange={(e) =>
              setEditUserData({ ...editUserData, last_name: e.target.value})
            }
          />
        </div>

        <div>
          <Label>Role</Label>
          <Select
            value={editUserData.role}
            onValueChange={(value) =>
              setEditUserData({ ...editUserData, role: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Job Title</Label>
          <Input
            value={editUserData.job_title || ""}
            onChange={(e) =>
              setEditUserData({ ...editUserData, job_title: e.target.value})
            }
          />
        </div>

        <div>
          <Label>City</Label>
          <Input
            value={editUserData.location_city || ""}
            onChange={(e) =>
              setEditUserData({ ...editUserData, location_city: e.target.value})
            }
          />
        </div>
          <Label>Instagram</Label>
        <Input
          value={editUserData.instagram_username || ""}
          onChange={(e) =>
            setEditUserData({
              ...editUserData,
              instagram_username: e.target.value,
            })
          }
          placeholder="Instagram Username"
        />
        <Label>LinkedIn</Label>
        <Input
          value={editUserData.linkedin_username || ""}
          onChange={(e) =>
            setEditUserData({
              ...editUserData,
              linkedin_username: e.target.value,
            })
          }
          placeholder="LinkedIn Username"
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!editUserData) return;
              if (!editUserData.first_name.trim() || !editUserData.last_name.trim()) {
                toast({ title: "First and Last name are required", variant: "destructive" });
                return;
              }
              if (!["user", "admin"].includes(editUserData.role)) {
                toast({ title: "Invalid role selected", variant: "destructive" });
                return;
              }
              if (editUserData.job_title && editUserData.job_title.length > 100) {
                toast({ title: "Job title is too long", variant: "destructive" });
                return;
              }
              if (!editUserData.job_title.trim()) {
                toast({ title: "Job title is required", variant: "destructive" });
                return;
              }
              if (!editUserData.location_city.trim()) {
                toast({ title: "City is required", variant: "destructive" });
                return;
              }
              if (editUserData.location_city && editUserData.location_city.length > 100) {
                toast({ title: "City name is too long", variant: "destructive" });
                return;
              }
              if (editUserData.instagram_username && editUserData.instagram_username.length > 30) {
                toast({ title: "Instagram username is too long", variant: "destructive" });
                return;
              }
              if (editUserData.linkedin_username && editUserData.linkedin_username.length > 30) {
                toast({ title: "LinkedIn username is too long", variant: "destructive" });
                return;
              }
              if (!editUserData.instagram_username.trim() && !editUserData.linkedin_username.trim()) {
                toast({ title: "At least one social link is required", variant: "destructive" });
                return;
              }
              const { error } = await supabase
                .from("profiles")
                .update({
                  first_name: editUserData.first_name.trim(),
                  last_name: editUserData.last_name.trim(),
                  role: editUserData.role.trim(),
                  job_title: editUserData.job_title.trim(),
                  location_city: editUserData.location_city.trim(),
                  instagram_username: editUserData.instagram_username.trim() || null,
                  linkedin_username: editUserData.linkedin_username.trim() || null,
                })
                .eq("id", editUserData.id);

              if (error) {
                toast({ title: "Error updating user", variant: "destructive" });
              } else {
                toast({ title: "User updated successfully" });
                setShowEditModal(false);
                fetchUsers();
              }
            }}
          >
            Save Changes
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
</div>

  );
};

export default AdminUsers;
