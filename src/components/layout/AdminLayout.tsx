import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, LogOut, Sparkles } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { signOut } = useAuth();
  const { profile } = useProfile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-20 border-b border-border/50 bg-card/80 backdrop-blur-sm px-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-6">
              <SidebarTrigger className="h-10 w-10 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors" />
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                </div>
                <Badge 
                  variant='default'
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full"
                >
                <Shield className="h-3.5 w-3.5" />
                <span className="font-medium">
                  Admin
                </span>
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.email}
                </p>
              </div>
              <Button 
                onClick={signOut} 
                variant="outline" 
                size="sm"
                className="flex items-center space-x-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gradient-to-b from-background/50 to-muted/10 p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;