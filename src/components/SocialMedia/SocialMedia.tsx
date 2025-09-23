import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ParishLogo from "@/components/ui/logo";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const SocialLinks = () => {
  const navigate = useNavigate();
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Pre-fill if user already has socials
  useEffect(() => {
    if (profile) {
      setInstagram(profile.instagram_username || "");
      setLinkedin(profile.linkedin_username || "");
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!linkedin && !instagram) {
      toast({
        title: "Social Media is Required",
        description: "Please enter Instagram or LinkedIn.",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.id) {
      toast({
        title: "Error",
        description: "Profile not found.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        instagram_username: instagram || null,
        linkedin_username: linkedin || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Social media accounts updated.",
      });
      navigate('/dashboard');

    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md p-6 bg-gradient-card border-border shadow-card animate-fade-in">
        <div className="flex items-center justify-center mb-6">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <ParishLogo />
            </div>
            <div>
              <h1
                className="text-2xl font-extrabold font-playfair text-primary"
                style={{
                  fontSize: "60px",
                  color: "#9dc0b3",
                  fontFamily: 'Sergio Trendy'
                }}
              >
                Parish
              </h1>
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold">Share your socials</h2>
        <p className="text-muted-foreground mb-4">
          Add your LinkedIn or Instagram to make it easier to connect with others.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* LinkedIn */}
          <div>
            <Label htmlFor="linkedin">LinkedIn Profile</Label>
            <Input
              id="linkedin"
              type="text"
              placeholder="Enter your LinkedIn username*"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value.trim())}
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
              onChange={(e) => setInstagram(e.target.value.trim())}
              className="mt-2"
            />
          </div>

          <Button type="submit" className="w-full">
            Save Socials
          </Button>
        </form>
      </Card>
    </div>
  );
};
