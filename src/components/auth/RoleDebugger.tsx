import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { Crown, Shield, User, RefreshCw } from 'lucide-react';

const RoleDebugger = () => {
  const { user } = useAuth();
  const { profile, loading, refetch } = useProfile();
  const navigate = useNavigate();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getExpectedRoute = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>🔍 Role Debugger</CardTitle>
          <CardDescription>No user logged in</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Role Debugger
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          Debug current user role and expected behavior
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* User Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Current User</h3>
            <div className="text-sm space-y-1">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>User ID:</strong> {user.id}</div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Profile Information</h3>
            {loading ? (
              <div>Loading profile...</div>
            ) : profile ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <strong>Role:</strong>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getRoleIcon(profile.role)}
                    {profile.role}
                  </Badge>
                </div>
                <div><strong>Name:</strong> {profile.first_name} {profile.last_name}</div>
                <div><strong>Onboarding:</strong> {profile.onboarding_completed ? '✅ Complete' : '❌ Incomplete'}</div>
                <div><strong>Profile ID:</strong> {profile.id}</div>
              </div>
            ) : (
              <div className="text-red-500">❌ No profile found</div>
            )}
          </div>

          {/* Expected Behavior */}
          {profile && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                🎯 Expected Behavior
              </h3>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <div><strong>Should redirect to:</strong> {getExpectedRoute(profile.role)}</div>
                <div><strong>Should have access to:</strong> {
                  profile.role === 'user' ? 'User Dashboard only' : 'Admin Panel'
                }</div>
              </div>
            </div>
          )}

          {/* Test Buttons */}
          {profile && (
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Go to Home
              </Button>
              
              {(profile.role === 'admin') && (
                <Button 
                  variant="outline"
                  onClick={() => navigate('/admin/dashboard')}
                >
                  Go to Admin Dashboard
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleDebugger;