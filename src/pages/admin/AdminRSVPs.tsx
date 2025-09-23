import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Search, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';

interface RSVP {
  id: string;
  event_id: string;
  user_id: string;
  response_status: string;
  is_running_late: boolean;
  created_at: string;
  event: {
    name: string;
    date_time: string;
    location_name: string;
  };
  profile: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const AdminRSVPs = () => {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRSVPs();
  }, []);

  const fetchRSVPs = async () => {
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select(`
          *,
          event:events(name, date_time, location_name),
          profile:profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRsvps(data || []);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch RSVPs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'declined': return 'destructive';
      case 'maybe': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'declined': return <XCircle className="h-4 w-4" />;
      case 'maybe': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredRSVPs = rsvps.filter(rsvp =>
    rsvp.event?.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    `${rsvp.profile?.first_name} ${rsvp.profile?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const getStatsByStatus = () => {
    const confirmed = rsvps.filter(r => r.response_status === 'confirmed').length;
    const declined = rsvps.filter(r => r.response_status === 'declined').length;
    const maybe = rsvps.filter(r => r.response_status === 'maybe').length;
    const pending = rsvps.filter(r => r.response_status === 'pending').length;
    
    return { confirmed, declined, maybe, pending };
  };

  const stats = getStatsByStatus();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">RSVP Management</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading RSVPs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center space-x-2">
      <UserCheck className="h-6 w-6" />
      <h1 className="text-xl sm:text-2xl font-semibold">RSVP Management</h1>
    </div>
    <Badge variant="outline" className="w-fit self-start sm:self-auto">
      {rsvps.length} Total RSVPs
    </Badge>
  </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card>
      <CardContent className="p-4 flex items-center space-x-3">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-xl sm:text-2xl font-bold">{stats.confirmed}</p>
          <p className="text-sm text-muted-foreground">Confirmed</p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 flex items-center space-x-3">
        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div>
          <p className="text-xl sm:text-2xl font-bold">{stats.declined}</p>
          <p className="text-sm text-muted-foreground">Declined</p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 flex items-center space-x-3">
        <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
        <div>
          <p className="text-xl sm:text-2xl font-bold">{stats.maybe}</p>
          <p className="text-sm text-muted-foreground">Maybe</p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 flex items-center space-x-3">
        <Clock className="h-5 w-5 text-gray-600 flex-shrink-0" />
        <div>
          <p className="text-xl sm:text-2xl font-bold">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Search */}
  <Card>
    <CardContent className="p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search RSVPs by event name or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
    </CardContent>
  </Card>

  {/* Tabs */}
  <Tabs defaultValue="all" className="space-y-4">
    <TabsList className="flex justify-start flex-wrap gap-2">
      <TabsTrigger value="all">All RSVPs</TabsTrigger>
      <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
      <TabsTrigger value="declined">Declined</TabsTrigger>
      <TabsTrigger value="maybe">Maybe</TabsTrigger>
      <TabsTrigger value="pending">Pending</TabsTrigger>
    </TabsList>

    {/* All RSVPs Table */}
    <TabsContent value="all" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>All RSVPs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Running Late</TableHead>
                <TableHead>RSVP Date</TableHead>
                <TableHead>Event Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRSVPs.map((rsvp) => (
                <TableRow key={rsvp.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rsvp.event?.name}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {rsvp.event?.location_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium truncate max-w-[150px]">
                        {rsvp.profile?.first_name} {rsvp.profile?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {rsvp.profile?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(rsvp.response_status)}
                      className="flex items-center space-x-1 w-fit"
                    >
                      {getStatusIcon(rsvp.response_status)}
                      <span>{rsvp.response_status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rsvp.is_running_late ? (
                      <Badge variant="secondary">Running Late</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(rsvp.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {rsvp.event?.date_time
                      ? new Date(rsvp.event.date_time).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>

    {/* Other Status Tabs */}
    {["confirmed", "declined", "maybe", "pending"].map((status) => (
      <TabsContent key={status} value={status} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {status.charAt(0).toUpperCase() + status.slice(1)} RSVPs
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>RSVP Date</TableHead>
                  <TableHead>Event Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRSVPs
                  .filter((rsvp) => rsvp.response_status === status)
                  .map((rsvp) => (
                    <TableRow key={rsvp.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rsvp.event?.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                            {rsvp.event?.location_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium truncate max-w-[150px]">
                            {rsvp.profile?.first_name} {rsvp.profile?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                            {rsvp.profile?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(rsvp.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {rsvp.event?.date_time
                          ? new Date(rsvp.event.date_time).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    ))}
  </Tabs>
</div>

  );
};

export default AdminRSVPs;