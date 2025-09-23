import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Edit, Save, X, CreditCard, Shield, Building, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import '@/index.css';

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [editingSocials, setEditingSocials] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    location_city: ''
  });
  const [socialLinks, setSocialLinks] = useState({
    instagram_username: '',
    linkedin_username: ''
  });
  const [preferenceData, setPreferenceData] = useState({
    dining_style: '' as 'adventurous' | 'foodie_enthusiast' | 'local_lover' | 'comfort_food' | 'health_conscious' | 'social_butterfly' | '',
    dietary_preferences: [] as ('vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'keto' | 'paleo' | 'halal' | 'kosher' | 'no_restrictions')[],
    gender_identity: '' as 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | ''
  });
  const [privacySettings, setPrivacySettings] = useState({
    allow_crossed_paths_tracking: true
  });
  const { user, signOut } = useAuth();
  const { profile, refetch } = useProfile();
  const navigate = useNavigate();
   const [paymentStatus, setPaymentStatus] = useState("free");

  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name.trim() || '',
        last_name: profile.last_name.trim() || '',
        job_title: profile.job_title?.trim() || '',
        location_city: profile.location_city?.trim() || ''
      });
      setSocialLinks({
        instagram_username: profile.instagram_username?.trim() || '',
        linkedin_username: profile.linkedin_username?.trim() || ''
      });
      setPreferenceData({
        dining_style: profile.dining_style || '',
        dietary_preferences: profile.dietary_preferences || [],
        gender_identity: profile.gender_identity || ''
      });
      setPrivacySettings({
        allow_crossed_paths_tracking: profile.allow_crossed_paths_tracking ?? true
      });
    }
  }, [profile]);

  React.useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!user) return;
        const { data : profileId, error: ProfileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (ProfileError) {
        return;
      }

      const { data, error } = await supabase
        .from("payments")
        .select("status")
        .eq("user_id", profileId[0]?.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching payment status:", error);
      } else {
        setPaymentStatus(data?.[0]?.status || "free");
      }
    };

    fetchPaymentStatus();
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !profile) return;

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refetch();
      
      toast({
        title: "Photo updated!",
        description: "Your profile photo has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name cannot be empty.",
        variant: "destructive"
      });
      return;
    }
    if (!formData.job_title.trim()) {
      toast({
        title: "Validation Error",
        description: "Job title cannot be empty.",
        variant: "destructive"
      });
      return;
    }
    if (!formData.location_city.trim()) {
      toast({
        title: "Validation Error",
        description: "Location cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;

      await refetch();
      setEditing(false);
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name.trim() || '',
        last_name: profile.last_name.trim() || '',
        job_title: profile.job_title.trim() || '',
        location_city: profile.location_city.trim() || ''
      });
    }
    setEditing(false);
  };

  const handleSavePreferences = async () => {
    if (!profile) return;

    if (preferenceData.dietary_preferences.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one dietary preference.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const updateData: any = {
        dietary_preferences: preferenceData.dietary_preferences
      };
      
      if (preferenceData.dining_style && preferenceData.dining_style.length > 0) {
        updateData.dining_style = preferenceData.dining_style;
      }
      
      if (preferenceData.gender_identity && preferenceData.gender_identity.length > 0) {
        updateData.gender_identity = preferenceData.gender_identity;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      await refetch();
      setEditingPreferences(false);
      
      toast({
        title: "Preferences updated!",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSocials = async () => {
    if (!profile) return;

    if (!socialLinks.instagram_username.trim() && !socialLinks.linkedin_username.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide at least one social link.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(socialLinks)
        .eq('id', profile.id);

      if (error) throw error;

      await refetch();
      setEditingSocials(false);
      
      toast({
        title: "Social Links updated!",
        description: "Your social links has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update social links",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCancelPreferences = () => {
    if (profile) {
      setPreferenceData({
        dining_style: profile.dining_style || '',
        dietary_preferences: profile.dietary_preferences || [],
        gender_identity: profile.gender_identity || ''
      });
    }
    setEditingPreferences(false);
  };

  const handleCancelSocials = () => {
    if (profile) {
      setSocialLinks({
        instagram_username: profile.instagram_username || '',
        linkedin_username: profile.linkedin_username || ''
      });
    }
    setEditingSocials(false);
  }

  if (!profile) {
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
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Personal Information
                {!editing ? (
                  <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleSave} disabled={loading} size="sm" className="bg-peach-gold hover:bg-peach-gold/90 text-background">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6" id='profileWrapper'>
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.profile_photo_url || ''} />
                    <AvatarFallback className="bg-peach-gold text-background text-xl">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      asChild
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-peach-gold hover:bg-peach-gold/90 text-background cursor-pointer"
                      disabled={uploading}
                    >
                      <span>
                        <Camera className="h-4 w-4" />
                      </span>
                    </Button>
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <p className="text-muted-foreground">{profile.email}</p>
                  {profile.job_title && (
                    <p className="text-muted-foreground">{profile.job_title}</p>
                  )}
                </div>
                <p>
                      {profile.role === "user" &&
                      (paymentStatus === "completed" ? (
                        <span className="px-3 py-1 text-xs font-semibold text-black bg-yellow-400 rounded-full">
                          🌟 Premium
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold text-white bg-[rgb(0,30,83)] rounded-full">
                          🆓 Freemium
                        </span>
                      ))}
                      {profile.role === "admin" && (
                      <span className="px-3 py-1 text-primary font-semibold bg-[#9dc0b3] rounded-full">
                        🌟 Admin
                      </span>
                    )}
                    </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  {editing ? (
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value}))}
                    />
                  ) : (
                    <p className="text-foreground p-2 bg-muted rounded-md">{profile.first_name || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  {editing ? (
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value}))}
                    />
                  ) : (
                    <p className="text-foreground p-2 bg-muted rounded-md">{profile.last_name || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  {editing ? (
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value}))}
                    />
                  ) : (
                    <p className="text-foreground p-2 bg-muted rounded-md">{profile.job_title || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_city">Location</Label>
                  {editing ? (
                    <Input
                      id="location_city"
                      value={formData.location_city}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_city: e.target.value}))}
                    />
                  ) : (
                    <p className="text-foreground p-2 bg-muted rounded-md">{profile.location_city || 'Not set'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Social Links
                {!editingSocials ? (
                  <Button onClick={() => setEditingSocials(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveSocials} disabled={loading} size="sm" className="bg-peach-gold hover:bg-peach-gold/90 text-background">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={handleCancelSocials} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                {editingSocials ? (
                    <Input
                      id="linkedin"
                      value={socialLinks.linkedin_username}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin_username: e.target.value}))}
                    />
                  ) : (
                    <p className="text-foreground p-2 bg-muted rounded-md">{profile.linkedin_username || 'Not set'}</p>
                  )}
              </div>
              
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                {editingSocials ? (
                    <Input
                      id="instagram"
                      value={socialLinks.instagram_username}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram_username: e.target.value}))}
                    />
                  ) : (
                    <p className="text-foreground p-2 bg-muted rounded-md">{profile.instagram_username || 'Not set'}</p>
                  )}
              </div>

            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Preferences
                {!editingPreferences ? (
                  <Button onClick={() => setEditingPreferences(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleSavePreferences} disabled={loading} size="sm" className="bg-peach-gold hover:bg-peach-gold/90 text-background">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={handleCancelPreferences} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Dining Style</Label>
                {editingPreferences ? (
                  <Select value={preferenceData.dining_style} onValueChange={(value: any) => setPreferenceData(prev => ({ ...prev, dining_style: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select dining style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adventurous">Adventurous</SelectItem>
                      <SelectItem value="foodie_enthusiast">Foodie Enthusiast</SelectItem>
                      <SelectItem value="local_lover">Local Lover</SelectItem>
                      <SelectItem value="comfort_food">Comfort Food</SelectItem>
                      <SelectItem value="health_conscious">Health Conscious</SelectItem>
                      <SelectItem value="social_butterfly">Social Butterfly</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground p-2 bg-muted rounded-md mt-1">
                    {profile.dining_style ? profile.dining_style.replace('_', ' ') : 'Not set'}
                  </p>
                )}
              </div>
              
              <div>
                <Label>Dietary Preferences</Label>
                {editingPreferences ? (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'paleo', 'halal', 'kosher', 'no_restrictions'].map((pref) => (
                      <label key={pref} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={preferenceData.dietary_preferences.includes(pref as any)}
                           onChange={(e) => {
                            const typedPref = pref as 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'keto' | 'paleo' | 'halal' | 'kosher' | 'no_restrictions';
                            if (e.target.checked) {
                              setPreferenceData(prev => ({
                                ...prev,
                                dietary_preferences: [...prev.dietary_preferences, typedPref]
                              }));
                            } else {
                              setPreferenceData(prev => ({
                                ...prev,
                                dietary_preferences: prev.dietary_preferences.filter(p => p !== typedPref)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{pref.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.dietary_preferences && profile.dietary_preferences.length > 0 ? (
                      profile.dietary_preferences.map((pref) => (
                        <Badge key={pref} variant="secondary">
                          {pref.replace('_', ' ')}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">None set</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label>Gender Identity</Label>
                {editingPreferences ? (
                  <Select value={preferenceData.gender_identity} onValueChange={(value: any) => setPreferenceData(prev => ({ ...prev, gender_identity: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender identity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non_binary">Non-binary</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground p-2 bg-muted rounded-md mt-1">
                    {profile.gender_identity ? profile.gender_identity.replace('_', ' ') : 'Not set'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Visit History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">My Restaurant Visits</h3>
                  <p className="text-muted-foreground">Track your dining history and discover crossed paths</p>
                </div>
                <Button
                  onClick={() => navigate('/my-visits')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span>View History</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Crossed Paths Tracking</h3>
                  <p className="text-muted-foreground">
                    Allow Lovable to track your restaurant visits to enable Crossed Paths suggestions.
                    <span className="block mt-1 text-xs">
                      Visit restaurants, track your visits, and discover people you've crossed paths with within 14 days.
                    </span>
                  </p>
                </div>
                <Switch
                  checked={privacySettings.allow_crossed_paths_tracking}
                  onCheckedChange={async (checked) => {
                    setPrivacySettings(prev => ({ ...prev, allow_crossed_paths_tracking: checked }));
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ allow_crossed_paths_tracking: checked })
                        .eq('id', profile.id);
                      
                      if (error) throw error;
                      
                      toast({
                        title: "Privacy settings updated",
                        description: `Crossed paths tracking ${checked ? 'enabled' : 'disabled'}`,
                      });
                    } catch (error: any) {
                      setPrivacySettings(prev => ({ ...prev, allow_crossed_paths_tracking: !checked }));
                      toast({
                        title: "Error",
                        description: "Failed to update privacy settings",
                        variant: "destructive"
                      });
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {profile.role === "user" && (
<Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Manage Subscription</h3>
                  <p className="text-muted-foreground">View and manage your subscription plan</p>
                </div>
                <Button
                  onClick={() => navigate('/subscription')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Manage</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {/* <Button 
                  onClick={() => navigate('/rsvps')}
                  variant="outline"
                  className="flex-1"
                >
                  View RSVPs
                </Button> */}
                {/* <Button 
                  onClick={() => navigate('/my-visits')}
                  variant="outline"
                  className="flex-1"
                >
                  My Visits
                </Button> */}
                {/* <Button 
                  onClick={() => navigate('/crossed-paths')}
                  variant="outline"
                  className="flex-1"
                >
                  Crossed Paths
                </Button> */}
              </div>
            </CardContent>
          </Card>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default Profile;