import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, Users, Calendar, UserCheck, Activity } from 'lucide-react';

interface AnalyticsData {
  totalEvents: number;
  totalUsers: number;
  totalRSVPs: number;
  activeEvents: number;
  recentSignups: number;
  rsvpRate: number;
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalEvents: 0,
    totalUsers: 0,
    totalRSVPs: 0,
    activeEvents: 0,
    recentSignups: 0,
    rsvpRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch events data
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, status, created_at');

      if (eventsError) throw eventsError;

      // Fetch users data
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at');

      if (usersError) throw usersError;

      // Fetch RSVPs data
      const { data: rsvpsData, error: rsvpsError } = await supabase
        .from('rsvps')
        .select('id, response_status, created_at');

      if (rsvpsError) throw rsvpsError;

      // Calculate analytics
      const totalEvents = eventsData?.length || 0;
      const totalUsers = usersData?.length || 0;
      const totalRSVPs = rsvpsData?.length || 0;
      const activeEvents = eventsData?.filter(e => e.status === 'active').length || 0;

      // Recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSignups = usersData?.filter(u => 
        new Date(u.created_at) > thirtyDaysAgo
      ).length || 0;

      // RSVP rate calculation
      const confirmedRSVPs = rsvpsData?.filter(r => r.response_status === 'yes').length || 0;
      const rsvpRate = totalRSVPs > 0 ? Math.round((confirmedRSVPs / totalRSVPs) * 100) : 0;

      setAnalytics({
        totalEvents,
        totalUsers,
        totalRSVPs,
        activeEvents,
        recentSignups,
        rsvpRate
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Analytics</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        </div>
        <Badge variant="outline">Real-time Data</Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeEvents} currently active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.recentSignups} this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RSVPs</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRSVPs}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.rsvpRate}% confirmation rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="rsvps">RSVPs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Platform Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Events</span>
                  <Badge variant="default">{analytics.activeEvents}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recent Signups (30d)</span>
                  <Badge variant="secondary">{analytics.recentSignups}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RSVP Confirmation Rate</span>
                  <Badge variant="outline">{analytics.rsvpRate}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Platform Activity</span>
                  <Badge variant="default">{analytics.totalEvents + analytics.totalRSVPs}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Growth Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>User Growth</span>
                    <span>{analytics.recentSignups > 0 ? '+' : ''}{analytics.recentSignups}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((analytics.recentSignups / analytics.totalUsers) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Event Activity</span>
                    <span>{analytics.activeEvents}/{analytics.totalEvents}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${analytics.totalEvents > 0 ? (analytics.activeEvents / analytics.totalEvents) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>RSVP Rate</span>
                    <span>{analytics.rsvpRate}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${analytics.rsvpRate}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalEvents}</div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.activeEvents}</div>
                  <div className="text-sm text-muted-foreground">Active Events</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{analytics.totalEvents - analytics.activeEvents}</div>
                  <div className="text-sm text-muted-foreground">Inactive Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analytics.recentSignups}</div>
                  <div className="text-sm text-muted-foreground">New Users (30 days)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rsvps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RSVP Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{analytics.totalRSVPs}</div>
                  <div className="text-sm text-muted-foreground">Total RSVPs</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.rsvpRate}%</div>
                  <div className="text-sm text-muted-foreground">Confirmation Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;