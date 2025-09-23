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
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { sendEventInvite } from "@/lib/sendInvite";

type WithdrawRequest = {
  id: string;
  creator_id: string;
  note: string;
  total_amount: number;
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

  useEffect(() => {
    if (profile) {
      fetchWithdrawRequests();
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
        }
      );

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
          `
        }
      );

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
          `
        } 
      );

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">
        Wallet Withdraw Requests
      </h1>

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
            <table className="min-w-full text-sm text-left border border-border rounded-lg overflow-hidden">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 whitespace-nowrap">User</th>
                  <th className="p-3 whitespace-nowrap">Email</th>
                  <th className="p-3 whitespace-nowrap">Note</th>
                  <th className="p-3 whitespace-nowrap">Payment Method</th>
                  <th className="p-3 whitespace-nowrap">Account Username</th>
                  <th className="p-3 whitespace-nowrap">Amount</th>
                  <th className="p-3 whitespace-nowrap">Status</th>
                  <th className="p-3 whitespace-nowrap">Date</th>
                  <th className="p-3 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {withdrawRequests.map((req) => (
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
                    <td className="p-3 text-green-600">${req.total_amount}</td>
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
                    <td className="p-3 text-right">
                      <Menu
                        as="div"
                        className="relative inline-block text-left"
                      >
                        <Menu.Button className="p-2 rounded-full hover:bg-muted/50 focus:outline-none">
                          <MoreVertical size={20} />
                        </Menu.Button>

                        <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-background border border-border shadow-lg rounded-md focus:outline-none z-50">
                          {/* Approve */}
                          <Menu.Item as="button">
                            {({ active }) => (
                              <button
                                onClick={() => handleApprove(req.id, req.profiles?.email)}
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

                          {/* Reject */}
                          <Menu.Item as="button">
                            {({ active }) => (
                              <button
                                onClick={() => handleReject(req.id, req.profiles?.email)}
                                disabled={loading === req.id}
                                className={`flex items-center gap-2 px-3 py-2 w-full text-left text-sm ${
                                  active ? "bg-muted/50" : ""
                                } text-red-600`}
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            )}
                          </Menu.Item>

                          {/* On Hold */}
                          <Menu.Item as="button">
                            {({ active }) => (
                              <button
                                onClick={() => handleOnHold(req.id, req.profiles?.email)}
                                disabled={loading === req.id}
                                className={`flex items-center gap-2 px-3 py-2 w-full text-left text-sm ${
                                  active ? "bg-muted/50" : ""
                                } text-yellow-600`}
                              >
                                <PauseCircle size={16} /> On Hold
                              </button>
                            )}
                          </Menu.Item>

                          {/* Delete */}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWalletRequests;
