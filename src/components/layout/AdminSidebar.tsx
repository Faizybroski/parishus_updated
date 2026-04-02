import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  UserCheck,
  BarChart3,
  Shield,
  Crown,
  User,
  Bell,
  FileText,
  UtensilsCrossed,
  DollarSign,
  Receipt,
} from "lucide-react";

const AdminSidebar = () => {
  const location = useLocation();
  const { profile } = useProfile();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (isActive: boolean) =>
    isActive
      ? "bg-gradient-to-r from-primary/80 to-primary text-primary-foreground shadow-md font-medium"
      : "hover:bg-muted/50 hover:text-foreground transition-all duration-200";

  // Define navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "View all Events", url: "/admin/events", icon: Calendar },
      { title: "Plans", url: "/admin/plans", icon: DollarSign },
      {
        title: "Wallet Requests",
        url: "/admin/wallet/requests",
        icon: DollarSign,
      },
      {
        title: "Subscriptions",
        url: "/admin/manage-subscriptions",
        icon: Receipt,
      },
      {
        title: "Restaurants",
        url: "/admin/restaurants",
        icon: UtensilsCrossed,
      },
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Crossed Paths", url: "/admin/crossed-paths", icon: Users },
      { title: "RSVPs", url: "/admin/rsvps", icon: UserCheck },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
      { title: "Notifications", url: "/admin/notifications", icon: Bell },
      { title: "Reports", url: "/admin/reports", icon: FileText },
      { title: "Profile", url: "/admin/profile", icon: User },
      {
        title: "Admin Management",
        url: "/admin/admin-management",
        icon: Shield,
      },
      { title: "Global Settings", url: "/admin/settings", icon: Settings },
    ];

    return baseItems;
  };

  const navigationItems = getNavigationItems();
  const isExpanded = navigationItems.some((i) => isActive(i.url));

  return (
    <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-sm">
      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center space-x-3 px-4 py-3 mb-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg mx-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Admin Panel</span>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="px-3">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url} end>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`
                          flex items-center space-x-3 px-4 py-5 rounded-lg text-sm font-medium transition-all duration-200 border-none
                          ${
                            isActive
                              ? "bg-secondary text-primary font-bold text-md"
                              : "hover:bg-secondary hover:text-foreground"
                          }
                        `}
                      >
                        <div
                          className={`flex items-center space-x-3`}
                        >
                          <item.icon
                            className={`h-6 w-6 flex-shrink-0 text-muted-foreground ${
                              isActive
                                ? "h-8 w-8 text-primary font-bold"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`truncate text-md ${
                              isActive
                                ? "text-primary font-bold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
