import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Crown, Shield, User, LogIn, UserPlus } from 'lucide-react';

const TestAuthSystem = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [testAccounts] = useState([
    {
      role: 'user',
      email: 'user@test.com',
      password: 'test123',
      name: 'Test User',
      icon: User,
      color: 'bg-blue-500'
    },
    {
      role: 'admin',
      email: 'admin@test.com', 
      password: 'admin123',
      name: 'Test Admin',
      icon: Shield,
      color: 'bg-green-500'
    },
  ]);

  if (user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">
              {profile?.role || 'Loading...'}
            </Badge>
            Authentication Test
          </CardTitle>
          <CardDescription>
            Currently logged in as: {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>User:</strong> {user.email}<br/>
                <strong>Role:</strong> {profile?.role || 'Loading...'}<br/>
                <strong>Name:</strong> {profile?.first_name} {profile?.last_name}
              </p>
            </div>
            <Button onClick={signOut} variant="outline" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Test Authentication System</CardTitle>
        <CardDescription>
          Test the unified role-based authentication system with these pre-configured accounts.
          <br/>
          <strong>Note:</strong> You'll need to sign up these accounts first, then sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {testAccounts.map((account) => {
            const Icon = account.icon;
            return (
              <div key={account.role} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${account.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold">{account.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {account.email} | Role: {account.role}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Password: {account.password}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            🎯 Expected Behavior After Login:
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li><strong>User:</strong> → Main Dashboard (/)</li>
            <li><strong>Admin:</strong> → Admin Dashboard (/admin/dashboard)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestAuthSystem;