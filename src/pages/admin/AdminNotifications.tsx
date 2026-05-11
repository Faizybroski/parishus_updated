import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Bell, Eye, Trash2, RefreshCw } from 'lucide-react';
import { LoaderText } from '@/components/loader/Loader';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profile:profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const openNotification = async (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);

        if (error) throw error;

        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setSelectedNotification({ ...notification, is_read: true });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast({
        title: "Success",
        description: "Notification deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      });
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'rsvp_received': return 'default';
      case 'event_reminder': return 'secondary';
      case 'system_alert': return 'destructive';
      default: return 'outline';
    }
  };

  const getStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    const rsvpNotifications = notifications.filter(n => n.type === 'rsvp_received').length;
    const systemAlerts = notifications.filter(n => n.type === 'system_alert').length;
    
    return { total, unread, rsvpNotifications, systemAlerts };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center space-x-2">
      <Bell className="h-6 w-6" />
      <h1 className="text-xl sm:text-2xl font-semibold font-script">Notification Center</h1>
    </div>
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="w-fit">
        {stats.total} Total
      </Badge>
      <Button onClick={fetchNotifications} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
        <p className="text-sm text-muted-foreground">Total Notifications</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.unread}</p>
        <p className="text-sm text-muted-foreground">Unread</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.rsvpNotifications}</p>
        <p className="text-sm text-muted-foreground">RSVP Notifications</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.systemAlerts}</p>
        <p className="text-sm text-muted-foreground">System Alerts</p>
      </CardContent>
    </Card>
  </div>

  {/* Tabs */}
  <Tabs defaultValue="all" className="space-y-4">
    <TabsList className="flex justify-start flex-wrap gap-2">
      <TabsTrigger value="all">All Notifications</TabsTrigger>
      <TabsTrigger value="unread">Unread</TabsTrigger>
      <TabsTrigger value="rsvp_received">RSVP Notifications</TabsTrigger>
      <TabsTrigger value="system_alert">System Alerts</TabsTrigger>
    </TabsList>

    {/* All Notifications */}
    <TabsContent value="all" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow
                  key={notification.id}
                  className={!notification.is_read ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(notification.type)}>
                      {notification.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <div>
                      <div className="font-medium truncate">{notification.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {notification.message}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">
                    {notification.profile ? (
                      <div>
                        <div className="font-medium truncate">
                          {notification.profile.first_name} {notification.profile.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {notification.profile.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={notification.is_read ? 'outline' : 'default'}>
                      {notification.is_read ? 'Read' : 'Unread'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(notification.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNotification(notification)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
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

    {/* Filtered Tabs */}
    {['unread', 'rsvp_received', 'system_alert'].map((filter) => (
      <TabsContent key={filter} value={filter} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'unread'
                ? 'Unread Notifications'
                : filter === 'rsvp_received'
                ? 'RSVP Notifications'
                : 'System Alerts'}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications
                  .filter((notification) =>
                    filter === 'unread' ? !notification.is_read : notification.type === filter
                  )
                  .map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="max-w-[200px] truncate">
                        <div>
                          <div className="font-medium truncate">{notification.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {notification.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {notification.profile ? (
                          <div>
                            <div className="font-medium truncate">
                              {notification.profile.first_name} {notification.profile.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {notification.profile.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(notification.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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

  {/* Notification Detail Modal */}

  <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Details
        </DialogTitle>
      </DialogHeader>
      {selectedNotification && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getTypeBadgeVariant(selectedNotification.type)}>
              {selectedNotification.type.replace(/_/g, ' ')}
            </Badge>
            <Badge variant={selectedNotification.is_read ? 'outline' : 'default'}>
              {selectedNotification.is_read ? 'Read' : 'Unread'}
            </Badge>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Title</p>
            <p className="font-semibold">{selectedNotification.title}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Message</p>
            <p className="text-sm leading-relaxed">{selectedNotification.message}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">User</p>
            {selectedNotification.profile ? (
              <div>
                <p className="font-medium">
                  {selectedNotification.profile.first_name} {selectedNotification.profile.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{selectedNotification.profile.email}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">System</p>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date</p>
            <p className="text-sm">
              {new Date(selectedNotification.created_at).toLocaleString()}
            </p>
          </div>

          {/* {selectedNotification.data && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Additional Data</p>
              <pre className="text-xs bg-muted rounded p-3 overflow-x-auto">
                {JSON.stringify(selectedNotification.data, null, 2)}
              </pre>
            </div>
          )} */}

          <div className="flex justify-end pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                deleteNotification(selectedNotification.id);
                setSelectedNotification(null);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
    </>
  );
};

export default AdminNotifications;