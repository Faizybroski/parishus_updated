import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate, useLocation } from "react-router-dom";
import AuthPage from "@/components/auth/AuthPage";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { LoaderText } from "@/components/loader/Loader";
import { Loader2 } from "lucide-react";
import { AdminLogin } from "@/components/adminLogin/AdminLogin";
import { ParishUsLanding } from "@/pages/LandingPage";
import { Login } from "@/components/login/Login";
import { SocialLinks } from "@/components/SocialMedia/SocialMedia";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const fun = async () => {
    const instagram = localStorage.getItem("signup_instagram");
    const linkedin = localStorage.getItem("signup_linkedin");

    const updateData: Record<string, any> = {};
    if (instagram) updateData.instagram_username = instagram;
    if (linkedin) updateData.linkedin_username = linkedin;

    if (Object.keys(updateData).length > 0) {
      const currentPath = location.pathname;

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) console.error("Upsert error:", error);

      localStorage.removeItem("signup_instagram");
      localStorage.removeItem("signup_linkedin");
    }
  };

  useEffect(() => {
    fun();
  });

  // ALL HOOKS MUST BE CALLED FIRST - before any conditional logic or early returns
  useEffect(() => {
    if (!authLoading && !profileLoading && profile) {
      if (
        profile.approval_status === "pending" &&
        profile.onboarding_completed
      ) {
        return navigate("/waiting-approval", { replace: true });
      }

      if (profile.approval_status === "rejected") {
        return navigate("/rejected-profile", { replace: true });
      }

      if (profile.is_suspended) {
        return navigate("/suspended-user", { replace: true });
      }
    }
    // Only run redirection logic when we have both user and profile data
    if (user && profile && !authLoading && !profileLoading) {
      const currentPath = location.pathname;

      if (
        profile.approval_status === "pending" &&
        profile.onboarding_completed &&
        currentPath !== "/waiting-approval"
      ) {
        navigate("/waiting-approval", { replace: true });
        return;
      }

      if (
        profile.approval_status === "rejected" &&
        currentPath !== "/rejected-profile"
      ) {
        navigate("/rejected-profile", { replace: true });
        return;
      }

      if (profile.is_suspended && currentPath !== "/suspended-user") {
        navigate("/suspended-user", { replace: true });
        return;
      }

      if (
        currentPath === "/waiting-approval" &&
        profile.approval_status !== "pending"
      ) {
        navigate("/", { replace: true });
        return;
      }

      if (
        currentPath === "/rejected-profile" &&
        profile.approval_status !== "rejected"
      ) {
        navigate("/", { replace: true });
        return;
      }

      if (currentPath === "/suspended-user" && !profile.is_suspended) {
        navigate("/", { replace: true });
        return;
      }

      // Skip redirection if we're already on auth pages
      if (currentPath.startsWith("/auth")) {
        navigate("/", { replace: true });
        return;
      }

      if (profile.role === "admin" && currentPath === "/admin/login") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      // Role-based redirection logic - Admins should ALWAYS be redirected to admin area
      if (profile.role === "admin") {
        // Admin should always go to /admin/dashboard unless already on admin routes
        if (!currentPath.startsWith("/admin")) {
          navigate("/admin/dashboard", { replace: true });
          return;
        }
      } else if (profile.role === "user") {
        // Prevent users from accessing admin routes
        if (currentPath.startsWith("/admin")) {
          navigate("/", { replace: true });
          return;
        }

        // Handle user onboarding flow - if not completed, show onboarding
        if (!profile.onboarding_completed) {
          // The onboarding check below will handle this
          return;
        }

        // User is completed and should stay on regular user routes
      }
    }
  }, [user, profile, navigate, location.pathname, authLoading, profileLoading]);

  // NOW we can do conditional logic and early returns
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

  if (!user) {
    if (location.pathname === "/admin/login") {
      return <AdminLogin />; // render AdminLogin component
    }
    return <ParishUsLanding />;
    // toast({
    //   title: "Login First",
    //   description: "Please login before accessing Parish.",
    //   variant: "destructive",
    // });
    // return <Login />
  }

  // if (profile  && profile.role === 'user' && !profile.instagram_username && !profile.linkedin_username) {
  //   return navigate('social-media');
  // }

  if (profile && !profile.onboarding_completed && profile.role === "user") {
    return <OnboardingFlow />;
  }

  // Admin don't need onboarding - they go directly to admin panel
  // The useEffect above handles their redirection

  return <>{children}</>;
};

export default ProtectedRoute;
