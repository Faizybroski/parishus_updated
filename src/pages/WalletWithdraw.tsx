import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type WalletPayment = {
  id: string;
  creator_id: string;
  event_id: string;
  created_at: string;
  withdraw_status: boolean;
  events?: {
    id: string;
    name: string;
    event_fee: number;
    date_time: string;
    location_name: string;
  };
};

const WalletWithdraw = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [walletPayments, setWalletPayments] = useState<WalletPayment[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [paymentNote, setPaymentNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Venmo" | "CashApp" | "PayPal" | "">("");  
  const [accountDetails, setAccountDetails] = useState("");

  useEffect(() => {
    if (!user?.id) return; 
  const channel = supabase
    .channel("wallet-withdraw-status")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "wallet_withdraw_requests",
        filter: `creator_id=eq.${user.id}`, 
      },
      async (payload) => {
        const newStatus = payload.new.status;

        // ✅ Toast works
        toast({
          title: "Withdrawal Update",
          description: `Your withdrawal request is now "${newStatus}".`,
        });

        // ✅ Insert into notifications
        const { error } = await supabase.from("notifications").insert([
          {
            user_id: profile.id,  // <- make sure this matches your Notification schema
            title: "Withdrawal Update",
            message: `Your withdrawal request is now "${newStatus}".`,
            type: "wallet_update",
            is_read: false,
            data: { withdraw_id: payload.new.id },
          },
        ]);

        if (error) console.error("Failed to insert notification:", error);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [profile?.id, user?.id, toast]);


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
      const total = (data || []).reduce((acc, payment) => {
        const gross = payment.events?.event_fee || 0;
        const fee = gross * 0.15;
        const net = gross - fee;
        return acc + net;
      }, 0);
      setTotalPayments(total);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch wallet payments.",
        variant: "destructive",
      });
    }
  };

  const handleSendWallet = async () => {
    if (!paymentNote.trim() || !paymentMethod || !accountDetails.trim()) {
      toast({
        title: "Missing Details",
        description: "Please enter details before sending.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from("wallet_withdraw_requests")
        .insert([
          {
            creator_id: profile?.user_id,
            note: paymentNote.trim(),
            total_amount: totalPayments,
            status: "pending",
            payment_method: paymentMethod.trim(),
            account_details: accountDetails.trim(),
          },
        ]);
      if (insertError) throw insertError;
      toast({
        title: "Success",
        description: "Wallet request sent to admin successfully!",
      });
      setPaymentNote("");
      setPaymentMethod("");
      setAccountDetails("");
      fetchWalletPayments();
    } catch {
      toast({
        title: "Error",
        description: "Failed to send wallet request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">
        Welcome back, {profile?.first_name || user?.email}!
      </h1>
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle>My Wallet</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          {walletPayments.length === 0 ? (
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-8">
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle>Total Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totalPayments.toFixed(2)}
            </p>
            <p className="text-muted-foreground text-sm">
              Withdraw status: Pending
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle>Send Wallet to Admin</CardTitle>
          </CardHeader>
          {/* <CardContent>
            <Input
              placeholder="Enter details for admin..."
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value.trim())}
              className="mb-3"
              disabled={loading}
            />
            <Button
              className="w-full flex items-center gap-2"
              onClick={handleSendWallet}
              disabled={loading || totalPayments === 0}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet size={18} /> Send Wallet to Admin
                </>
              )}
            </Button>
          </CardContent> */}
          <CardContent>
            {/* Payment Method Selection */}
            <div className="mb-3">
              <label className="block mb-1 font-medium">Select Payment Method:</label>
              <div className="flex gap-4">
                {["Venmo", "CashApp", "PayPal"].map((method) => (
                  <label key={method} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method as any)}
                      disabled={loading}
                      className="accent-primary"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>

            {/* Account Details */}
            {paymentMethod && (
              <Input
                placeholder={`Enter your ${paymentMethod} username/email`}
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                className="mb-3"
                disabled={loading}
              />
            )}

            {/* Notes */}
            <Input
              placeholder="Enter details for admin..."
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="mb-3"
              disabled={loading}
            />

            <Button
              className="w-full flex items-center gap-2"
              onClick={handleSendWallet}
              disabled={loading || totalPayments === 0}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet size={18} /> Send Wallet to Admin
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletWithdraw;
