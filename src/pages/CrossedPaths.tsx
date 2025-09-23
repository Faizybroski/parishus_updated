import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
interface CrossedPath {
  id: string;
  matched_at: string;
  location_name: string;
  is_active: boolean;
  user1_id: string;
  user2_id: string;
  total_crosses: number;
  locations: string[];
  location_details?: Array<{
    name: string;
    address?: string;
    cross_count: number;
  }>;
  matched_user: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    profile_photo_url: string;
    job_title: string;
    location_city: string;
    dining_style: string;
    dietary_preferences: string[];
    gender_identity: string;
  };
}

const CrossedPaths = () => {
  const [crossedPaths, setCrossedPaths] = useState<CrossedPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<CrossedPath['matched_user'] | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCrossedPath, setSelectedCrossedPath] = useState<CrossedPath | null>(null);
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      fetchCrossedPaths();
    }
  }, [profile]);

  const fetchCrossedPaths = async () => {
    if (!profile) return;

    try {
      // First get basic crossed paths using proper foreign key joins
  const { data: crossedPathsData, error } = await supabase
  .from('crossed_paths')
  .select(`
    *,
    user1:profiles!crossed_paths_user1_id_fkey(
      id, user_id, email,  username, first_name, last_name, profile_photo_url, job_title, 
      location_city, dining_style, dietary_preferences, gender_identity,
      payments:payments!payments_user_id_fkey (
        id, user_id, status, updated_at
      )
    ),
    user2:profiles!crossed_paths_user2_id_fkey(
      id, user_id,  email, username, first_name, last_name, profile_photo_url, job_title, 
      location_city, dining_style, dietary_preferences, gender_identity,
      payments:payments!payments_user_id_fkey (
        id, user_id, status, updated_at
      )
    )
  `)
  .or(`user1_id.eq.${profile.user_id},user2_id.eq.${profile.user_id}`)
  .eq('is_active', true)
  .order('matched_at', { ascending: false })
  // 👇 apply ordering+limit on the joined payments table
  .order('updated_at', { foreignTable: 'user1.payments', ascending: false })
  .limit(1, { foreignTable: 'user1.payments' })
  .order('updated_at', { foreignTable: 'user2.payments', ascending: false })
  .limit(1, { foreignTable: 'user2.payments' });

      if (error) {
        console.error('Error fetching crossed paths:', error);
        setCrossedPaths([]);
        return;
      }

      // Now get aggregated data from crossed_paths_log for each pair
      const enrichedPaths = await Promise.all(
        (crossedPathsData || []).map(async (path: any) => {
          const otherUserId = path.user1_id === profile.user_id ? path.user2.user_id : path.user1.user_id;
          const userAId = profile.user_id < otherUserId ? profile.user_id : otherUserId;
          const userBId = profile.user_id < otherUserId ? otherUserId : profile.user_id;

          // Get all crossed path logs for this user pair
          const { data: logData } = await supabase
            .from('crossed_paths_log')
            .select('restaurant_name, cross_count')
            .eq('user_a_id', userAId)
            .eq('user_b_id', userBId);

          const locations = logData?.map(log => log.restaurant_name).filter(Boolean) || [];
          const totalCrosses = logData?.reduce((sum, log) => sum + (log.cross_count || 1), 0) || 1;

          // Create location_details array with proper structure
          const locationDetails = logData?.reduce((acc, log) => {
            if (!log.restaurant_name) return acc;
            
            const existing = acc.find(item => item.name === log.restaurant_name);
            if (existing) {
              existing.cross_count += log.cross_count || 1;
            } else {
              acc.push({
                name: log.restaurant_name,
                cross_count: log.cross_count || 1
              });
            }
            return acc;
          }, [] as Array<{ name: string; cross_count: number }>) || [];

          return {
            ...path,
            matched_user: path.user1_id === profile.user_id ? path.user2 : path.user1,
            payment_status: path.user1_id === profile.user_id 
            ? path.user2.payments?.[0]?.status || 'free'
            : path.user1.payments?.[0]?.status || 'free',
            total_crosses: totalCrosses,
            locations: [...new Set(locations)], // Remove duplicates
            location_details: locationDetails
          };
        })
      );

      setCrossedPaths(enrichedPaths);
    } catch (error: any) {
      console.error('Error in fetchCrossedPaths:', error);
      setCrossedPaths([]);
      toast({
        title: "Error",
        description: "Failed to load crossed paths",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteToDinner = (path: CrossedPath) => {
    // console.log("Path:===>>", path.matched_user.email, path.matched_user.id,path.matched_user.first_name, path.matched_user.last_name);

    navigate("/explore", {
    state: {
      invitedUser: {
        id: path.matched_user.id,
        first_name: path.matched_user.first_name,
        last_name: path.matched_user.last_name,
        email: path.matched_user.email,
      },
    },
  });
    // setSelectedCrossedPath(path);
    // setShowInviteModal(true);
  };

  const viewProfile = (user: CrossedPath['matched_user']) => {
    setSelectedUserProfile(user);
    setShowProfileModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-background">
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Crossed Paths</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            People you've crossed paths with at restaurants within the last 14 days
          </p>
        </div>

        {crossedPaths.length === 0 ? (
          <Card className="shadow-card border-border w-full">
            <CardContent className="py-8 sm:py-12 px-4 sm:px-6 text-center">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                No crossed paths yet
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Visit restaurants to discover people you've crossed paths with. Enable tracking in your Profile settings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {crossedPaths.map((path) => (
              <Card key={path.id} className="shadow-card border-border w-full">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
                        <AvatarImage src={path.matched_user.profile_photo_url} />
                        <AvatarFallback className="bg-peach-gold text-background">
                          {path.matched_user.first_name?.[0]}
                          {path.matched_user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground">
                          {path.matched_user.first_name} {path.matched_user.last_name}
                           {path.payment_status === 'completed' ? (
                              <span className="px-3 py-1 text-xs font-semibold text-black bg-yellow-400 rounded-full ml-4">🌟 Paid</span>
                            ) : (
                              <span className="px-3 py-1 text-xs font-semibold text-white bg-[rgb(0,30,83)] rounded-full ml-4">🆓 Free</span>
                            )}
                                                  </h3>
                        {path.matched_user.job_title && (
                          <p className="text-sm sm:text-base text-muted-foreground truncate">
                            {path.matched_user.job_title}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(path.matched_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Cross count and locations */}
                        <div className="mt-3 space-y-2">
                          <Badge variant="outline" className="text-xs font-medium">
                            Crossed paths {path.total_crosses}x
                          </Badge>
                          {path.locations.length > 0 && (
                            <div className="flex items-start space-x-1">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                <span className="font-medium">Locations:</span>{' '}
                                {path.locations.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>

                        {path.matched_user.location_city && (
                          <Badge variant="secondary" className="mt-2">
                            {path.matched_user.location_city}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={() => navigate(`/profile/${path.matched_user.username}`)}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        View Profile
                      </Button>
                      <Button
                        onClick={() => handleInviteToDinner(path)}
                        className="bg-peach-gold hover:bg-peach-gold/90 text-background w-full sm:w-auto"
                        size="sm"
                      >
                        Invite to Dinner
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

};

export default CrossedPaths;