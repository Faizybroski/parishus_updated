import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2, Settings, TrendingUp, DollarSign, Percent } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAdminFee, calculateFeeBreakdown } from "@/hooks/useAdminFee";

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
  const { feePercentage, loading: feeLoading } = useAdminFee();
  const [walletPayments, setWalletPayments] = useState<WalletPayment[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalGross, setTotalGross] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [paymentNote, setPaymentNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "Venmo" | "CashApp" | "PayPal" | ""
  >("");
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

          toast({
            title: "Withdrawal Update",
            description: `Your withdrawal request is now "${newStatus}".`,
          });

          const { error } = await supabase.from("notifications").insert([
            {
              user_id: profile.id,
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
    if (profile && !feeLoading) {
      fetchWalletPayments();
    }
  }, [profile, feeLoading, feePercentage]);

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
        .eq("event_id", eventIds)
        .eq("withdraw_status", false)
        .eq("payment_status", "succeeded")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setWalletPayments(data || []);

      let grossSum = 0;
      let feeSum = 0;
      let netSum = 0;

      for (const payment of data || []) {
        const gross = payment.events?.event_fee || 0;
        const { fee, payout } = calculateFeeBreakdown(gross, feePercentage);
        grossSum += gross;
        feeSum += fee;
        netSum += payout;
      }

      setTotalGross(grossSum);
      setTotalFees(feeSum);
      setTotalPayments(netSum);
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
    <div className="container mx-auto px-4 py-8 pt-16">
      <h1 className="text-3xl font-bold text-foreground mb-6 font-script">
        Welcome back, {profile?.first_name || user?.email}!
      </h1>

      {/* Revenue Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-card border-border bg-gradient-to-br from-background to-muted/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${totalGross.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border bg-gradient-to-br from-background to-muted/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-red-500" />
              </div>
              <span className="text-sm text-muted-foreground">
                Admin Fee ({feePercentage}%)
              </span>
            </div>
            <p className="text-2xl font-bold text-red-500">
              -${totalFees.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border bg-gradient-to-br from-background to-muted/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">You Receive</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ${totalPayments.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

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
                  <th className="p-3 whitespace-nowrap">
                    Admin Fee ({feePercentage}%)
                  </th>
                  <th className="p-3 whitespace-nowrap">You Got</th>
                </tr>
              </thead>
              <tbody>
                {walletPayments.map((payment) => {
                  const gross = payment.events?.event_fee || 0;
                  const { fee, payout } = calculateFeeBreakdown(
                    gross,
                    feePercentage,
                  );
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
                      <td className="p-3 text-green-600">
                        ${payout.toFixed(2)}
                      </td>
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
          <CardContent>
            {/* Payment Method Selection */}
            <div className="mb-3">
              <label className="block mb-1 font-medium">
                Select Payment Method:
              </label>
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
