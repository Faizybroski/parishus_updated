import { Button } from "@/components/ui/button";
import { Card } from "@/components/OnboardingCarousel/ui/card";
import { Checkbox } from "@/components/OnboardingCarousel/ui/checkbox";
import { Input } from "@/components/OnboardingCarousel/ui/input";
import { Label } from "@/components/OnboardingCarousel/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ParishLogo from "../ui/logo";

export const Login = ({ startStep = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, resetPassword, signInWithGoogle, signInWithApple } =
    useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email.trim()) {
        toast({
          title: "Missing Email",
          description: "Please enter your email address.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!password.trim()) {
        toast({
          title: "Missing Password",
          description: "Please enter your password.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      // if (!linkedin.trim() && !instagram.trim()) {
      //   toast({
      //     title: "Social Media is Required",
      //     description: "Please enter Instagram or LinkedIn.",
      //     variant: "destructive",
      //   });
      //   return;
      // }

      const { error } = await signIn(email.trim(), password.trim(), "user");
      if (error) throw error;
      toast({
        title: "Welcome back!",
        description: "Signed in successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md p-6 bg-gradient-card border-border shadow-card animate-fade-in">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="mb-6 ">
            <ParishLogo />
          </div>
          <div>
            <h1
              className="text-2xl font-extrabold font-playfair text-black font-script"
              style={{
                fontSize: "60px",
              }}
            >
              Parish
            </h1>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email*"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1 relative">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password*"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div>
            <Label htmlFor="linkedin">LinkedIn Profile</Label>
            <Input
              id="linkedin"
              type="text"
              placeholder="Enter your LinkedIn username*"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-center">
            <div className="flex-grow border-t border-primary"></div>
            <span className="text-primary font-semibold px-2">OR</span>
            <div className="flex-grow border-t border-primary"></div>
          </div>

          {/* Instagram */}
          <div>
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              type="text"
              placeholder="Enter your Instagram username*"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="text-right">
            <Button
              variant="link"
              type="button"
              className="text-sm text-[#c4b0a2] underline bg-background p-0 m-0 hover:text-primary"
              onClick={async () => {
                if (!email) {
                  toast({
                    title: "Enter your email first",
                    description: "Please enter your email in the field above.",
                    variant: "destructive",
                  });
                  return;
                }
                const { error } = await resetPassword(email);
                if (error) {
                  toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                  });
                } else {
                  toast({
                    title: "Check your email",
                    description: "Password reset link sent.",
                  });
                }
              }}
            >
              Forgot Password?
            </Button>
          </div>
          <Button
            type="submit"
            className="w-full py-3 font-semibold"
            disabled={
              // (!linkedin && !instagram) || 
              loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                if (!linkedin && !instagram) {
                  toast({
                    title: "Social Media Required",
                    description:
                      "Please enter LinkedIn or Instagram before continuing.",
                    variant: "destructive",
                  });
                  return;
                }

                if (instagram)
                  localStorage.setItem("signup_instagram", instagram.trim());
                if (linkedin)
                  localStorage.setItem("signup_linkedin", linkedin.trim());

                const { error } = await signInWithGoogle();
                if (error) {
                  console.error("Google login error:", error.message);
                }
              }}
              className="flex-1 py-3 border hover:bg-secondary/40 text-foreground bg-transparent"
            >
              <SiGoogle size={22} color="black" /> Google
            </Button>
            <Button
              onClick={async () => {
                if (!linkedin && !instagram) {
                  toast({
                    title: "Social Media Required",
                    description:
                      "Please enter LinkedIn or Instagram before continuing.",
                    variant: "destructive",
                  });
                  return;
                }

                if (instagram)
                  localStorage.setItem("signup_instagram", instagram.trim());
                if (linkedin)
                  localStorage.setItem("signup_linkedin", linkedin.trim());

                const { error } = await signInWithApple();
                if (error) {
                  console.error("Apple login error:", error.message);
                }
              }}
              className="flex-1 py-3 text-foreground hover:bg-secondary/40 bg-transparent border"
            >
              <SiApple size={22} color="black" /> Apple
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
