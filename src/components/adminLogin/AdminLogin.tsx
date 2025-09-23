import React, { useState } from "react";
import { Button } from "@/components/OnboardingCarousel/ui/button";
import { Input } from "@/components/OnboardingCarousel/ui/input";
import { Label } from "@/components/OnboardingCarousel/ui/label";
import { Card } from "@/components/OnboardingCarousel/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import ParishLogo from "../ui/logo";

export const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { error } = await signIn(email.trim(), password.trim(), 'admin');
        error
          ? toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            })
          : toast({
              title: "Welcome back!",
              description: "Signed in successfully.",
            });
    } catch {
      toast({
        title: "Error",
        description: "Unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md p-6 bg-gradient-card border-border shadow-card animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="w-6" />
            <div className="flex items-center">
              <img className='max-w-8 mr-2' src='/Parishus logo.png' alt="Parish Logo" />
              <h1 className="text-2xl font-extrabold font-playfair text-primary" style={{fontFamily: 'Sergio Trendy'}}>
                Parish
              </h1>
            </div>
            <div className="w-6" />
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
                required
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
                required
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
            <Button
              type="submit"
              className="w-full py-3 bg-secondary hover:bg-secondary/70 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : ("Log In")}
            </Button>
          </form>
        </Card>
      </div>
    );
};
