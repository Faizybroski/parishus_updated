import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu } from "@headlessui/react";
import {
  MoreVertical,
  CheckCircle,
  XCircle,
  PauseCircle,
  Trash2,
  Loader2,
  Settings,
  Save,
  Percent,
} from "lucide-react";
import { LoaderText } from "@/components/loader/Loader";
import { useToast } from "@/components/ui/use-toast";
import { sendEventInvite } from "@/lib/sendInvite";
import { Input } from "@/components/ui/input";
import { invalidateAdminFeeCache } from "@/hooks/useAdminFee";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type WithdrawRequest = {
  id: string;
  creator_id: string;
  note: string;
  total_amount: number;
  feePercentage: number;
  account_details: string;
  payment_method: string;
  status: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

const AdminWalletRequests = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>(
    []
  );
  const [loading, setLoading] = useState<string | null>(null);

  // Admin Fee Settings State
  const [adminFeePercentage, setAdminFeePercentage] = useState<number>(10);
  const [adminFeeInput, setAdminFeeInput] = useState<string>("10");
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeSaving, setFeeSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      fetchWithdrawRequests();
      fetchAdminFee();
      fetchAuditLogs();
    }
  }, [profile]);

  const fetchWithdrawRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("wallet_withdraw_requests")
        .select(
          `
          id,
          creator_id,
          note,
          total_amount,
          payment_method,
          account_details,
          feePercentage,
          status,
          created_at,
          profiles:creator_id (
            first_name,
            last_name,
            email
          )
        `
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      setWithdrawRequests(data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch wallet withdraw requests.",
        variant: "destructive",
      });
    }
  };

  const fetchAdminFee = async () => {
    setFeeLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "admin_fee_percentage")
        .single();

      if (!error && data) {
        setAdminFeePercentage(Number(data.value));
        setAdminFeeInput(String(data.value));
      }
    } catch (err) {
      console.error("Failed to fetch admin fee:", err);
    } finally {
      setFeeLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("action", "admin_fee_update")
        .order("created_at", { ascending: false })
        .limit(5);
      setAuditLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  const handleSaveAdminFee = async () => {
    const newFee = parseFloat(adminFeeInput);
    if (isNaN(newFee) || newFee < 0 || newFee > 100) {
      toast({
        title: "Invalid Value",
        description: "Admin fee must be between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    setFeeSaving(true);
    try {
      const oldValue = adminFeePercentage;

      const { error } = await supabase
        .from("system_settings")
        .update({
          value: newFee,
          updated_at: new Date().toISOString(),
        })
        .eq("key", "admin_fee_percentage");

      if (error) throw error;

      // Insert audit log
      await supabase.from("audit_logs").insert({
        action: "admin_fee_update",
        details: JSON.stringify({
          old_value: oldValue,
          new_value: newFee,
          updated_by: profile?.email || user?.email,
        }),
      });

      invalidateAdminFeeCache();
      setAdminFeePercentage(newFee);

      toast({
        title: "✅ Admin Fee Updated",
        description: `Fee changed from ${oldValue}% to ${newFee}%`,
      });

      fetchAuditLogs();
    } catch (err) {
      console.error("Failed to save admin fee:", err);
      toast({
        title: "Error",
        description: "Failed to update admin fee.",
        variant: "destructive",
      });
    } finally {
      setFeeSaving(false);
    }
  };

  const handleApprove = async (id: string, email) => {
    setLoading(id);
    try {
      const { data: wallet, error: walletError } = await supabase
        .from("wallet_withdraw_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (walletError) throw walletError;

      const { error: updateError } = await supabase
        .from("events_payments")
        .update({ withdraw_status: true })
        .eq("creator_id", wallet.creator_id)
        .eq("withdraw_status", false);

      if (updateError) throw updateError;

      const { error: approveError } = await supabase
        .from("wallet_withdraw_requests")
        .update({ status: "approved" })
        .eq("id", id);

      if (approveError) throw approveError;

      await sendEventInvite({
        to: email,
        subject: "Your Withdrawal Request Has Been Approved",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>Withdrawal Approved</title>
            </head>
            <body style="margin:0; padding:0; background-color:#f9fafb; font-family:Arial, sans-serif; color:#333;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; padding:20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                      
                      <!-- Header -->
                      <tr>
                        <td align="center" style="background-color:#111827; padding:40px 20px;">
                          <h1 style="margin:0; font-size:26px; color:#ffffff;">Withdrawal Approved ✅</h1>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding:30px; font-size:16px; line-height:1.6; color:#444;">
                          <p>Hi there,</p>
                          <p>
                            We’re pleased to let you know that your <strong>withdrawal request</strong> has been 
                            <span style="color:#16a34a; font-weight:bold;">approved</span>.
                          </p>

                          <p>
                            The funds will be processed and transferred to your registered payout method shortly.  
                            Depending on your bank or payment provider, this may take <strong>1–3 business days</strong>.
                          </p>

                          <p style="margin-top:20px;">
                            You can check your wallet history anytime in your <a href="https://your-app-link.com/dashboard" style="color:#7c3aed; text-decoration:none; font-weight:bold;">dashboard</a>.
                          </p>

                          <p style="margin-top:30px; font-size:14px; color:#888;">
                            – The Parish Finance Team
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td align="center" style="background-color:#f3f4f6; padding:20px; font-size:12px; color:#666;">
                          <p style="margin:0;">Parish • Secure Withdrawals</p>
                          <p style="margin:5px 0 0;">If you did not request this withdrawal, please contact support immediately.</p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
          `,
      });

      toast({
        title: "Success",
        description: "Request approved successfully!",
      });

      fetchWithdrawRequests();
    } catch {
      toast({
        title: "Error",
        description: "Failed to approve request.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Reject
  const handleReject = async (id: string, email) => {
    setLoading(id);
    try {
      // Fetch the withdraw request first
      const { data: wallet, error: walletError } = await supabase
        .from("wallet_withdraw_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (walletError) throw walletError;

      // Update status to rejected
      const { error: rejectError } = await supabase
        .from("wallet_withdraw_requests")
        .update({ status: "rejected" })
        .eq("id", id);
      if (rejectError) throw rejectError;

      await sendEventInvite({
        to: email,
        subject: "Your Withdrawal Request Has Been Rejected",
        html: `
          <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>Withdrawal Rejected</title>
              </head>
              <body style="margin:0; padding:0; background-color:#f9fafb; font-family:Arial, sans-serif; color:#333;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; padding:20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <tr>
                          <td align="center" style="background-color:#991b1b; padding:40px 20px;">
                            <h1 style="margin:0; font-size:26px; color:#ffffff;">Withdrawal Rejected ❌</h1>
                          </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                          <td style="padding:30px; font-size:16px; line-height:1.6; color:#444;">
                            <p>Hi there,</p>
                            <p>
                              We regret to inform you that your <strong>withdrawal request</strong> has been 
                              <span style="color:#dc2626; font-weight:bold;">rejected</span>.
                            </p>

                            <p>
                              This could be due to one of the following reasons:
                            </p>
                            <ul style="margin:10px 0 20px 20px; color:#555;">
                              <li>Insufficient funds in your wallet</li>
                              <li>Incorrect or incomplete payout details</li>
                              <li>Request did not meet compliance requirements</li>
                            </ul>

                            <p>
                              Please review your account and try again.  
                              If you believe this is a mistake, reach out to our support team for clarification.
                            </p>

                            <p style="margin-top:20px; text-align:center;">
                              <a href="https://your-app-link.com/support" 
                                style="display:inline-block; background-color:#dc2626; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:8px; font-weight:bold; font-size:16px;">
                                Contact Support
                              </a>
                            </p>

                            <p style="margin-top:30px; font-size:14px; color:#888;">
                              – The Parish Finance Team
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td align="center" style="background-color:#f3f4f6; padding:20px; font-size:12px; color:#666;">
                            <p style="margin:0;">Parish • Secure Withdrawals</p>
                            <p style="margin:5px 0 0;">If you did not request this withdrawal, please ignore this email.</p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
      });

      toast({
        title: "Success",
        description: "Request rejected successfully!",
      });

      fetchWithdrawRequests();
    } catch {
      toast({
        title: "Error",
        description: "Failed to reject request.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // On Hold
  const handleOnHold = async (id: string, email) => {
    setLoading(id);
    try {
      const { data: wallet, error: walletError } = await supabase
        .from("wallet_withdraw_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (walletError) throw walletError;

      const { error: holdError } = await supabase
        .from("wallet_withdraw_requests")
        .update({ status: "onhold" })
        .eq("id", id);
      if (holdError) throw holdError;

      await sendEventInvite({
        to: email,
        subject: "Your Withdrawal Request is On Hold",
        html: `
          <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>Withdrawal On Hold</title>
              </head>
              <body style="margin:0; padding:0; background-color:#f9fafb; font-family:Arial, sans-serif; color:#333;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; padding:20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <tr>
                          <td align="center" style="background-color:#ca8a04; padding:40px 20px;">
                            <h1 style="margin:0; font-size:26px; color:#ffffff;">Withdrawal On Hold ⏳</h1>
                          </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                          <td style="padding:30px; font-size:16px; line-height:1.6; color:#444;">
                            <p>Hi there,</p>
                            <p>
                              Your <strong>withdrawal request</strong> is currently 
                              <span style="color:#ca8a04; font-weight:bold;">on hold</span> while our team reviews it.
                            </p>

                            <p>
                              This may happen if additional verification is required, or if we need to confirm certain account details before proceeding.
                            </p>

                            <p>
                              We’ll notify you once the review is complete.  
                              This process typically takes <strong>1–2 business days</strong>.
                            </p>

                            <p style="margin-top:20px; text-align:center;">
                              <a href="https://your-app-link.com/support" 
                                style="display:inline-block; background-color:#ca8a04; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:8px; font-weight:bold; font-size:16px;">
                                Contact Support
                              </a>
                            </p>

                            <p style="margin-top:30px; font-size:14px; color:#888;">
                              – The Parish Finance Team
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td align="center" style="background-color:#f3f4f6; padding:20px; font-size:12px; color:#666;">
                            <p style="margin:0;">Parish • Secure Withdrawals</p>
                            <p style="margin:5px 0 0;">If you did not request this withdrawal, please contact support immediately.</p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
      });

      toast({
        title: "Success",
        description: "Request put on hold successfully!",
      });

      fetchWithdrawRequests();
    } catch {
      toast({
        title: "Error",
        description: "Failed to put request on hold.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this request? This cannot be undone."
      )
    )
      return;

    setLoading(id);
    try {
      const { data: wallet, error: walletError } = await supabase
        .from("wallet_withdraw_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (walletError) throw walletError;

      const { error: deleteError } = await supabase
        .from("wallet_withdraw_requests")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: "Request deleted successfully!",
      });

      fetchWithdrawRequests();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete request.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6 font-script">
        Wallet Withdraw Requests
      </h1>

      {/* Admin Fee Settings */}
      <Card className="mb-6 shadow-card border-border bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#c4b0a2]" />
            Platform Fee Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Admin Fee Percentage
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={adminFeeInput}
                  onChange={(e) => setAdminFeeInput(e.target.value)}
                  className="pr-10 text-lg font-semibold"
                  disabled={feeSaving || feeLoading}
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current: <span className="font-semibold text-foreground">{adminFeePercentage}%</span> • Range: 0–100%
              </p>
            </div>
            <Button
              onClick={handleSaveAdminFee}
              disabled={feeSaving || feeLoading || adminFeeInput === String(adminFeePercentage)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#c4b0a2] to-[#a89282] hover:from-[#b5a193] hover:to-[#998373] text-white"
            >
              {feeSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Fee
                </>
              )}
            </Button>
          </div>

          {/* Audit Log */}
          {auditLogs.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Changes</h4>
              <div className="space-y-2">
                {auditLogs.map((log) => {
                  const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
                  return (
                    <div key={log.id} className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                      <span>•</span>
                      <span>
                        {details?.old_value}% → <span className="font-semibold text-foreground">{details?.new_value}%</span>
                      </span>
                      <span>•</span>
                      <span className="truncate">{details?.updated_by}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {profile && (
        <Card className="mb-6 shadow-card border-border">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Name:</strong> {profile.first_name} {profile.last_name}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle>All Wallet Requests</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          {withdrawRequests.length === 0 ? (
            <p className="text-muted-foreground">No withdraw requests found.</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="min-w-full text-sm text-left overflow-visible">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="p-3 whitespace-nowrap">User</th>
                    <th className="p-3 whitespace-nowrap">Email</th>
                    <th className="p-3 whitespace-nowrap">Note</th>
                    <th className="p-3 whitespace-nowrap">Payment Method</th>
                    <th className="p-3 whitespace-nowrap">Account Username</th>
                    <th className="p-3 whitespace-nowrap">Req. Amount</th>
                    <th className="p-3 whitespace-nowrap">Admin %</th>
                    <th className="p-3 whitespace-nowrap">Actual Amount</th>
                    <th className="p-3 whitespace-nowrap">Status</th>
                    <th className="p-3 whitespace-nowrap">Date</th>
                    <th className="p-3 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawRequests.map((req) => {
                    const actualAmount = req.total_amount / (1 - req.feePercentage / 100);
const feeAmount = actualAmount - req.total_amount;
                    return (
                    <tr
                      key={req.id}
                      className="border-t border-border hover:bg-muted/50 transition"
                    >
                      <td className="p-3">
                        {req.profiles?.first_name} {req.profiles?.last_name}
                      </td>
                      <td className="p-3">{req.profiles?.email}</td>
                      <td className="p-3">{req.note}</td>
                      <td className="p-3">{req.payment_method}</td>
                      <td className="p-3">{req.account_details}</td>
                      <td className="p-3 text-green-600">
                        ${req.total_amount}
                      </td>
                      <td className="p-3 text-green-600">
                        ${feeAmount.toFixed(2)}
                      </td>
                      <td className="p-3 text-green-600">
                        ${actualAmount.toFixed(2)}
                      </td>
                      <td className="p-3 capitalize">{req.status}</td>
                      <td className="p-3">
                        {format(new Date(req.created_at), "MMM dd, yyyy")}
                      </td>
                      {/* <td className="p-3">
                      {req.status === "pending" && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(req.id)}
                          disabled={loading === req.id}
                          className="flex items-center gap-2"
                        >
                          {loading === req.id ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} /> Approve
                            </>
                          )}
                        </Button>
                      )}
                    </td> */}
                      {/* <td className="p-3 text-right relative overflow-visible z-50">
                        <Menu
                          as="div"
                          className="relative inline-block text-left"
                        >
                          <Menu.Button className="p-2 rounded-full hover:bg-muted/50 focus:outline-none">
                            <MoreVertical size={20} />
                          </Menu.Button>

                          <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-background border border-border shadow-lg rounded-md focus:outline-none z-50">
                            
                            <Menu.Item as="button">
                              {({ active }) => (
                                <button
                                  onClick={() =>
                                    handleApprove(req.id, req.profiles?.email)
                                  }
                                  disabled={loading === req.id}
                                  className={`flex items-center gap-2 px-3 py-2 w-full text-left text-sm ${
                                    active ? "bg-muted/50" : ""
                                  }`}
                                >
                                  {loading === req.id ? (
                                    <>
                                      <Loader2
                                        size={16}
                                        className="animate-spin"
                                      />{" "}
                                      Approving...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle size={16} /> Approve
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            <Menu.Item as="button">
                              {({ active }) => (
                                <button
                                  onClick={() =>
                                    handleReject(req.id, req.profiles?.email)
                                  }
                                  disabled={loading === req.id}
                                  className={`flex items-center gap-2 px-3 py-2 w-full text-left text-sm ${
                                    active ? "bg-muted/50" : ""
                                  } text-red-600`}
                                >
                                  <XCircle size={16} /> Reject
                                </button>
                              )}
                            </Menu.Item>

                            <Menu.Item as="button">
                              {({ active }) => (
                                <button
                                  onClick={() =>
                                    handleOnHold(req.id, req.profiles?.email)
                                  }
                                  disabled={loading === req.id}
                                  className={`flex items-center gap-2 px-3 py-2 w-full text-left text-sm ${
                                    active ? "bg-muted/50" : ""
                                  } text-yellow-600`}
                                >
                                  <PauseCircle size={16} /> On Hold
                                </button>
                              )}
                            </Menu.Item>

                            <Menu.Item as="button">
                              {({ active }) => (
                                <button
                                  onClick={() => handleDelete(req.id)}
                                  disabled={loading === req.id}
                                  className={`flex items-center gap-2 px-3 py-2 w-full text-left text-sm ${
                                    active ? "bg-muted/50" : ""
                                  } text-red-700`}
                                >
                                  <Trash2 size={16} /> Delete
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </td> */}
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-black transition-colors hover:bg-primary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={20} />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                              <Button
                                onClick={() =>
                                  handleApprove(req.id, req.profiles?.email)
                                }
                                disabled={loading === req.id}
                                className="w-full bg-transparent justify-start"
                              >
                                {loading === req.id ? (
                                  <>
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />{" "}
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={16} /> Approve
                                  </>
                                )}
                              </Button>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Button
                                onClick={() =>
                                  handleReject(req.id, req.profiles?.email)
                                }
                                disabled={loading === req.id}
                                className="text-red-600 w-full bg-transparent justify-start"
                              >
                                <XCircle size={16} />
                                Reject
                              </Button>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Button
                                onClick={() =>
                                  handleOnHold(req.id, req.profiles?.email)
                                }
                                disabled={loading === req.id}
                                className="text-yellow-600 w-full bg-transparent justify-start"
                              >
                                <PauseCircle size={16} />
                                On Hold
                              </Button>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Button
                                onClick={() => handleDelete(req.id)}
                                disabled={loading === req.id}
                                className="text-red-700 w-full bg-transparent justify-start"
                              >
                                <Trash2 size={16} />
                                Delete
                              </Button>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWalletRequests;
