import React, { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import GlobalSearchBar from "@/components/searchBar/GlobalSearchBar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Search,
  User,
  LogOut,
  Heart,
  Star,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  UtensilsCrossed,
  Receipt,
  Menu,
  X,
} from "lucide-react";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useProfile } from "@/hooks/useProfile";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getNavItems = () => {
    const baseItems = [
      { icon: Calendar, label: "My Events", path: "/events" },
      { icon: Search, label: "Explore", path: "/explore" },
      { icon: UtensilsCrossed, label: "Restaurants", path: "/restaurants" },
      { icon: Heart, label: "RSVPs", path: "/rsvps" },
      { icon: MessageSquare, label: "Feedback", path: "/feedback" },
      { icon: Star, label: "Crossed Paths", path: "/crossed-paths" },
    ];

    if (profile?.role === "admin") {
      baseItems.push({
        icon: CreditCard,
        label: "Subscription",
        path: "/subscription",
      });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-dark-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link
            to={"/"}
            className="cursor-pointer flex items-center space-x-1 shrink-0"
          >
            <img
              className="w-10 h-8 mr-2 object-contain"
              src="/Parishus logo.png"
              alt="Logo"
            />
            <h1
              className="text-2xl font-bold bg-gradient-primary bg-clip-text text-black whitespace-nowrap font-script"
              style={{ fontSize: "30px" }}
            >
              Parish
            </h1>
          </Link>
          {!user ? (
            <div className="flex items-center space-x-4">
              <Button onClick={() => navigate("/")} variant="outline">
                Sign In
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Menu */}
              <div className="hidden nav:flex items-center space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center"
                    >
                      <Button
                        variant="ghost"
                        className={`flex items-center group space-x-1 ${
                          isActive
                            ? ""
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5 icon-animate" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-4">
                <Button
                  ref={searchButtonRef}
                  className="group"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchVisible((prev) => !prev)}
                  aria-label="Search"
                >
                  <Search className="h-5 w-5 icon-animate" />
                </Button>
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.profile_photo_url || ""} />
                        <AvatarFallback className="text-black font-serif">
                          {profile?.first_name?.[0]}
                          {profile?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 font-serif "
                    align="end"
                    forceMount
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        to={"/profile"}
                        className="flex items-center w-full group"
                      >
                        <User className="mr-2 h-4 w-4 icon-animate" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to={"/subscription"}
                        className="flex items-center group w-full"
                      >
                        <Receipt className="mr-2 h-4 w-4 icon-animate" />
                        Subscription
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to={"/user/dashboard"}
                        className="flex items-center w-full group"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4 icon-animate" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="group">
                      <LogOut className="mr-2 h-4 w-4 icon-animate" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Hamburger Icon */}
                <div className="nav:hidden">
                  <Button
                  className="group"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    {isOpen ? (
                      <X className="h-6 w-6 icon-animate" />
                    ) : (
                      <Menu className="h-6 w-6 icon-animate" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="nav:hidden mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center"
                >
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                    }}
                    className={`w-full flex justify-start items-center px-4 py-2 text-left ${
                      isActive
                        ? ""
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      {searchVisible && (
        <GlobalSearchBar
          isVisible={searchVisible}
          onClose={() => setSearchVisible(false)}
          navItems={navItems.map((i) => ({
            label: i.label,
            path: i.path,
            type: "page",
            icon: i.icon,
          }))}
          searchButtonRef={searchButtonRef} // 👈 pass this down
        />
      )}
    </nav>
  );
};

export default Navigation;
