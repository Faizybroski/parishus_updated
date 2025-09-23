import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search,
  Calendar,
  Clock,
  MapPin,
  Users,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import AdminLayout from '@/components/layout/AdminLayout';

interface Reservation {
  id: string;
  user_id: string;
  event_id: string;
  reservation_type: string;
  reservation_status: string;
  created_at: string;
  updated_at: string;
  events: {
    id: string;
    name: string;
    description: string;
    date_time: string;
    location_name: string;
    max_attendees: number;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

const AdminReservations = () => {
  const { profile } = useProfile();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (profile && (profile.role === 'admin')) {
      fetchReservations();
    }
  }, [profile]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          events (
            id,
            name,
            description,
            date_time,
            location_name,
            max_attendees,
            profiles!events_creator_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({
        title: "Error",
        description: "Failed to load reservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          reservation_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Reservation status has been updated to ${newStatus}`,
      });

      fetchReservations();
    } catch (error) {
      console.error('Error updating reservation status:', error);
      toast({
        title: "Error",
        description: "Failed to update reservation status",
        variant: "destructive",
      });
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.events.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      reservation.user_id.toLowerCase().includes(searchTerm.toLowerCase().trim());
    
    const matchesStatus = statusFilter === 'all' || reservation.reservation_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStats = () => {
    const total = reservations.length;
    const confirmed = reservations.filter(r => r.reservation_status === 'confirmed').length;
    const pending = reservations.filter(r => r.reservation_status === 'pending').length;
    const cancelled = reservations.filter(r => r.reservation_status === 'cancelled').length;
    
    return { total, confirmed, pending, cancelled };
  };

  const stats = getStats();

  if (!profile || (profile.role !== 'admin')) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to view reservations.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 animate-spin mx-auto border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Loading reservations...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reservations Management</h1>
          <p className="text-muted-foreground">Manage event reservations and RSVP statuses</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by event name or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reservations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reservations ({filteredReservations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReservations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No reservations found matching your criteria.</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">User ID: {reservation.user_id.substring(0, 8)}...</div>
                            <div className="text-sm text-muted-foreground">
                              Reservation #{reservation.id.substring(0, 8)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{reservation.events.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Host: {reservation.events.profiles.first_name} {reservation.events.profiles.last_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{format(new Date(reservation.events.date_time), 'PPP')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{format(new Date(reservation.events.date_time), 'p')}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{reservation.reservation_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(reservation.reservation_status)}>
                            {reservation.reservation_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{format(new Date(reservation.created_at), 'PPP')}</span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={reservation.reservation_status}
                            onValueChange={(value) => updateReservationStatus(reservation.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReservations;