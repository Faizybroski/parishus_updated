import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";
import { useNavigate } from "react-router-dom";

import { useProfile } from "@/hooks/useProfile";

interface AnalyticsData {
  metric: string;
  count: number;
}

interface EventAnalyticsDashboardProps {
    eventId: string;
    subscriptionStatus: 'loading' | 'free' | 'premium';   
}

export default function EventAnalyticsDashboard({ eventId, subscriptionStatus }: EventAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();
  const isFreeTier = subscriptionStatus === "free";
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchAnalytics().finally(() => setLoading(false));
  }, [eventId, subscriptionStatus, isFreeTier]);

  async function fetchAnalytics() {
    setLoading(true);
    const { data, error } = await supabase
      .from("event_analytics")
      .select("views_count, interests_count")
      .eq("event_id", eventId)
      .maybeSingle(); // <-- avoids throw when row not found

    console.log("Analytics fetch result:", { data, error }); // <--- debug

    if (error || !data) {
      setAnalyticsData([
        { metric: "Views", count: 0 },
        { metric: "Interests", count: 0 },
      ]);
      setLoading(false);
      return;
    }

    setAnalyticsData([
      { metric: "Views", count: data.views_count || 0 },
      { metric: "Interests", count: data.interests_count || 0 },
    ]);

    setLoading(false);
  }

  if (subscriptionStatus === "loading") {
    return (
      <p className="text-center text-muted-foreground mt-10 text-lg font-semibold">
        Checking subscription...
      </p>
    );
  }


  if (isFreeTier) {
    return (
      <Card className="bg-dark-surface shadow-lg rounded-lg max-w-3xl mx-auto p-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Upgrade to Premium</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto mb-6">
            Analytics are only available for Premium users.
          </p>
          <button
            onClick={() => navigate("/subscription")}
            className="bg-peach-gold text-dark-surface px-6 py-2 rounded-md font-semibold hover:bg-peach-gold/90 transition"
          >
            Go to Subscription
          </button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <p className="text-center text-muted-foreground mt-10 text-lg font-semibold animate-pulse">
        Loading analytics...
      </p>
    );
  }
  return (
    <Card className="bg-dark-surface shadow-lg rounded-lg max-w-3xl mx-auto p-6">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold mb-4">Event Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={analyticsData}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffbf69" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="colorInterests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis
              dataKey="metric"
              stroke="#bbb"
              tick={{ fontSize: 14, fontWeight: 600 }}
            />
            <YAxis
              stroke="#bbb"
              tick={{ fontSize: 14, fontWeight: 600 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e1e1e",
                border: "1px solid #444",
                color: "#fff",
                fontWeight: "600",
              }}
              labelStyle={{ color: "#ffbf69" }}
              cursor={{ fill: "rgba(255, 191, 105, 0.2)" }}
            />
            <Bar
              dataKey="count"
              fill="url(#colorViews)"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            >
              <LabelList dataKey="count" position="top" fill="#ffbf69" fontWeight="700" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
