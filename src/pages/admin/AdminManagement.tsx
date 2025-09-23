import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { Shield, UserPlus, Search, Edit, Trash2, Crown } from 'lucide-react';

interface Admin {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface CreateAdminForm {
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin'; // Restrict to admin only
}

const AdminManagement = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateAdminForm>({
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      role: 'admin'
    }
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (data: CreateAdminForm) => {
    try {
      // In a real implementation, you would create the admin user through Supabase Auth
      // and then create the admin record in the admins table
      const { error } = await supabase
        .from('admins')
        .insert([{
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: 'admin', 
          password_hash: 'to_be_set', // This would be handled by auth system
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin user created successfully"
      });

      setShowCreateDialog(false);
      form.reset();
      fetchAdmins();
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: "Failed to create admin user",
        variant: "destructive"
      });
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ is_active: !currentStatus })
        .eq('id', adminId);

      if (error) throw error;

      setAdmins(admins.map(admin => 
        admin.id === adminId 
          ? { ...admin, is_active: !currentStatus }
          : admin
      ));

      toast({
        title: "Success",
        description: `Admin ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive"
      });
    }
  };

  const deleteAdmin = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      setAdmins(admins.filter(admin => admin.id !== adminId));
      
      toast({
        title: "Success",
        description: "Admin user deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        title: "Error",
        description: "Failed to delete admin user",
        variant: "destructive"
      });
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    `${admin.first_name} ${admin.last_name}`.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const getRoleBadgeVariant = (role: string) => {
    return 'default'
  };

  const getStats = () => {
    const total = admins.length;
    const active = admins.filter(a => a.is_active).length;
    const Admins = admins.filter(a => a.role === 'admin').length;
    
    return { total, active, Admins };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin Management</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading admin users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center space-x-2">
      <Shield className="h-6 w-6" />
      <h1 className="text-xl sm:text-2xl font-semibold">Admin Management</h1>
    </div>

    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Create Admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Admin</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(createAdmin)} className="space-y-4">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* First Name */}
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Last Name */}
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">Create Admin</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold">{stats.total}</p>
        <p className="text-sm text-muted-foreground">Total Admins</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        <p className="text-sm text-muted-foreground">Active</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold text-purple-600">{stats.Admins}</p>
        <p className="text-sm text-muted-foreground">Admins</p>
      </CardContent>
    </Card>
  </div>

  {/* Search */}
  <Card>
    <CardContent className="p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search admins by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
    </CardContent>
  </Card>

  {/* Admins Table */}
  <Card>
    <CardHeader>
      <CardTitle>Admin Users</CardTitle>
    </CardHeader>
    <CardContent className="overflow-x-auto">
      <Table className="min-w-[750px]">
        <TableHeader>
          <TableRow>
            <TableHead>Admin</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAdmins.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="truncate max-w-[120px]">
                    <div className="font-medium">{admin.first_name} {admin.last_name}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="truncate max-w-[150px]">{admin.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(admin.role)}>
                  Admin
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={admin.is_active ? 'default' : 'destructive'}>
                  {admin.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                  >
                    {admin.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAdmin(admin.id)}
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
</div>

  );
};

export default AdminManagement;