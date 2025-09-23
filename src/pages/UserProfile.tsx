import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Edit,
  Save,
  X,
  CreditCard,
  Shield,
  Building,
  MapPin,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import "@/index.css";

const UserProfile = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<string>("free");
  const [user_profile, setProfile] = useState<any>(null);
  const { username } = useParams();

  React.useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    if (!username) return;

    setLoading(true);

    try {
      const { data: profiledata, error: profileErr } = await supabase
        .from("profiles")
        .select(
          "id, first_name, last_name, job_title, location_city, dining_style, dietary_preferences, gender_identity, profile_photo_url, role"
        )
        .eq("username", username)
        .single();

      if (profileErr) throw profileErr;

      let paymentStatusResult = "free";

      if (profiledata?.id) {
        const { data: subData, error: subErr } = await supabase
          .from("payments")
          .select("status")
          .eq("user_id", profiledata.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (subErr) {
          console.error("Error fetching payment status:", subErr);
        } else {
          paymentStatusResult = subData?.[0]?.status || "free";
        }
      }

      setProfile(profiledata);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user_profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded w-48 mb-8"></div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          </div>

          <Card className="shadow-card border-border">
            <CardContent className="space-y-6 mt-4">
              <div className="flex items-center space-x-6" id="profileWrapper">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user_profile.profile_photo_url || ""} />
                    <AvatarFallback className="bg-peach-gold text-background text-xl">
                      {user_profile.first_name?.[0]}
                      {user_profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h3 className="text-xl text-primary font-semibold text-foreground py-1 ">
                    {user_profile.first_name} {user_profile.last_name}
                  </h3>
                  {user_profile.job_title && (
                    <p className="text-muted-foreground py-1 ">
                      {user_profile.job_title}
                    </p>
                  )}
                  <p>
                    {user_profile.role === "user" &&
                      (paymentStatus === "completed" ? (
                        <span className="px-3 py-1 text-xs font-semibold text-black bg-yellow-400 rounded-full">
                          🌟 Premium
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold text-white bg-[rgb(0,30,83)] rounded-full">
                          🆓 Freemium
                        </span>
                      ))}
                    {user_profile.role === "admin" && (
                      <span className="px-3 py-1 text-primary font-semibold bg-[#9dc0b3] rounded-full">
                        🌟 Admin
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground py-1 ">
                    {user_profile?.location_city}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Dining Style</Label>
                <p className="text-foreground text-primary p-2 mt-1">
                  {user_profile.dining_style
                    ? user_profile.dining_style.replace("_", " ")
                    : "Not set"}
                </p>
              </div>

              <div>
                <Label>Dietary Preferences</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user_profile.dietary_preferences &&
                  user_profile.dietary_preferences.length > 0 ? (
                    user_profile.dietary_preferences.map((pref) => (
                      <Badge key={pref} variant="secondary">
                        {pref.replace("_", " ")}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">None set</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Gender Identity</Label>
                <p className="text-foreground text-primary p-2 mt-1">
                  {user_profile.gender_identity
                    ? user_profile.gender_identity.replace("_", " ")
                    : "Not set"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
