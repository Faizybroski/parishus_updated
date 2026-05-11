import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Calendar, Search, TrendingUp, Users, Building, MessageCircle, Mail, Hash, Globe } from 'lucide-react';
import {LoaderText} from "@/components/loader/Loader";
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CrossedPathAnalytics {
  id: string;
  user_a_id: string;
  user_b_id: string;
  restaurant_name: string;
  cross_count: number;
  date_crossed: string;
  location_lat: number;
  location_lng: number;
  user_a: {
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
    email: string;
  };
  user_b: {
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
    email: string;
  };
}

interface RestaurantDetails {
  id: string;
  name: string;
  country: string;
  state_province: string;
  city: string;
  full_address: string;
  longitude?: number;
  latitude?: number;
}

interface AnalyticsStats {
  totalCrossedPaths: number;
  activePaths: number;
  topRestaurants: { name: string; count: number }[];
  recentActivity: number;
}

const AdminCrossedPaths = () => {
  const [crossedPaths, setCrossedPaths] = useState<CrossedPathAnalytics[]>([]);
  const [filteredPaths, setFilteredPaths] = useState<CrossedPathAnalytics[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalCrossedPaths: 0,
    activePaths: 0,
    topRestaurants: [],
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minCrossCount, setMinCrossCount] = useState('1');
  const [selectedPath, setSelectedPath] = useState<CrossedPathAnalytics | null>(null);
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const { user } = useAuth();

  const filterAndSortPaths = useCallback(() => {
    let filtered = [...crossedPaths];

    if (searchTerm) {
      filtered = filtered.filter(path =>
        path.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        path.user_a.first_name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        path.user_a.last_name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        path.user_b.first_name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        path.user_b.last_name?.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }

    const minCount = parseInt(minCrossCount);
    filtered = filtered.filter(path => path.cross_count >= minCount);

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date_crossed).getTime() - new Date(a.date_crossed).getTime();
        case 'oldest':
          return new Date(a.date_crossed).getTime() - new Date(b.date_crossed).getTime();
        case 'most_crosses':
          return b.cross_count - a.cross_count;
        case 'restaurant':
          return (a.restaurant_name || '').localeCompare(b.restaurant_name || '');
        default:
          return 0;
      }
    });

    setFilteredPaths(filtered);
  }, [crossedPaths, searchTerm, sortBy, minCrossCount]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    filterAndSortPaths();
  }, [filterAndSortPaths]);

  const fetchAnalytics = async () => {
    try {
      // Fetch crossed paths with user profiles using proper foreign key joins
      const { data: pathsData, error: pathsError } = await supabase
        .from('crossed_paths_filtered')
        .select(`
          *,
          user_a:profiles!crossed_paths_log_user_a_id_fkey(
            user_id, first_name, last_name, profile_photo_url, email
          ),
          user_b:profiles!crossed_paths_log_user_b_id_fkey(
            user_id, first_name, last_name, profile_photo_url, email
          )
        `)
        .order('date_crossed', { ascending: false });

      if (pathsError) throw pathsError;

      setCrossedPaths((pathsData || []) as CrossedPathAnalytics[]);

      // Calculate stats
      const totalPaths = pathsData?.length || 0;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentActivity = pathsData?.filter(path => 
        new Date(path.date_crossed) >= sevenDaysAgo
      ).length || 0;

      // Get restaurant frequency
      const restaurantCount: { [key: string]: number } = {};
      pathsData?.forEach(path => {
        if (path.restaurant_name) {
          restaurantCount[path.restaurant_name] = (restaurantCount[path.restaurant_name] || 0) + 1;
        }
      });

      const topRestaurants = Object.entries(restaurantCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setStats({
        totalCrossedPaths: totalPaths,
        activePaths: totalPaths, // All paths are considered active for now
        topRestaurants,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load crossed paths analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  

  const openPathDetails = async (path: CrossedPathAnalytics) => {
    setSelectedPath(path);
    setRestaurantDetails(null);
    if (path.restaurant_name) {
      setRestaurantLoading(true);
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, country, state_province, city, full_address, longitude, latitude')
          .ilike('name', path.restaurant_name)
          .limit(1)
          .maybeSingle();

        if (!error && data) setRestaurantDetails(data);
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
      } finally {
        setRestaurantLoading(false);
      }
    }
  };

  const createPrivateDinnerSuggestion = async (userAId: string, userBId: string, restaurantName: string) => {
    try {
      // This could create an admin suggestion or notification
      toast({
        title: "Suggestion Created",
        description: `Private dinner suggestion created for users at ${restaurantName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create dinner suggestion",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

return (
  <>
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 sm:space-y-8">

        {/* Header */}
        <header>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground font-script">
            Crossed Paths Analytics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Monitor user interactions and restaurant visit patterns
          </p>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: "Total Crossed Paths", value: stats.totalCrossedPaths, icon: Users },
            { label: "Active Paths", value: stats.activePaths, icon: TrendingUp },
            { label: "Recent Activity", value: stats.recentActivity, icon: Calendar },
            { label: "Top Restaurants", value: stats.topRestaurants.length, icon: Building },
          ].map((stat, index) => (
            <Card key={index} className="shadow-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">{stat.label}</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className="h-6 w-6 sm:h-8 sm:w-8   flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Top Restaurants */}
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Top Restaurants for Crossed Paths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topRestaurants.map((restaurant, index) => (
                <div
                  key={restaurant.name}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="truncate text-sm sm:text-base">
                    #{index + 1} {restaurant.name}
                  </span>
                  <Badge variant="secondary" className="mt-1 sm:mt-0">
                    {restaurant.count} crosses
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="shadow-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row flex-wrap gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users or restaurants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Select Filters */}
              <Select value={minCrossCount} onValueChange={setMinCrossCount}>
                <SelectTrigger className="w-full sm:w-auto min-w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+ Crosses</SelectItem>
                  <SelectItem value="2">2+ Crosses</SelectItem>
                  <SelectItem value="3">3+ Crosses</SelectItem>
                  <SelectItem value="5">5+ Crosses</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-auto min-w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most_crosses">Most Crosses</SelectItem>
                  <SelectItem value="restaurant">By Restaurant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Crossed Paths */}
        {filteredPaths.length === 0 ? (
          <Card className="shadow-card border-border">
            <CardContent className="py-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                No crossed paths found
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredPaths.map((path) => (
              <Card
                key={path.id}
                className="shadow-card border-border cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => openPathDetails(path)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6 flex-wrap">
                    
                    {/* Users Info */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-center sm:items-start sm:space-x-6 flex-1">
                      
                      {/* User A */}
                      <div className="flex items-center space-x-2 min-w-[140px]">
                        <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                          <AvatarImage src={path.user_a.profile_photo_url} />
                          <AvatarFallback className="text-background">
                            {path.user_a.first_name?.[0]}
                            {path.user_a.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left">
                          <p className="text-xs sm:text-sm font-medium truncate max-w-[120px]">
                            {path.user_a.first_name} {path.user_a.last_name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[140px]">
                            {path.user_a.email}
                          </p>
                        </div>
                      </div>

                      {/* Cross Count */}
                      <div className="flex flex-col items-center justify-center mx-2 my-2 sm:my-0">
                        <Badge variant="secondary" className="mb-1 text-[10px] sm:text-xs">
                          {path.cross_count} crosses
                        </Badge>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">↔</div>
                      </div>

                      {/* User B */}
                      <div className="flex items-center space-x-2 min-w-[140px]">
                        <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                          <AvatarImage src={path.user_b.profile_photo_url} />
                          <AvatarFallback className="text-background">
                            {path.user_b.first_name?.[0]}
                            {path.user_b.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left">
                          <p className="text-xs sm:text-sm font-medium truncate max-w-[120px]">
                            {path.user_b.first_name} {path.user_b.last_name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[140px]">
                            {path.user_b.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Restaurant & Action */}
                    <div className="flex flex-col items-center sm:items-end space-y-2 w-full sm:w-auto">
                      <div className="text-center sm:text-right">
                        <div className="text-xs sm:text-sm font-medium flex items-center justify-center sm:justify-end truncate max-w-[200px]">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {path.restaurant_name || "Unknown location"}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center justify-center sm:justify-end mt-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {new Date(path.date_crossed).toLocaleDateString()}
                        </div>
                      </div>
                      {/* <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          createPrivateDinnerSuggestion(path.user_a_id, path.user_b_id, path.restaurant_name);
                        }}
                      >
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Suggest Dinner
                      </Button> */}
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

  {/* Crossed Path Detail Modal */}
  <Dialog open={!!selectedPath} onOpenChange={(open) => !open && setSelectedPath(null)}>
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Crossed Path Details
        </DialogTitle>
      </DialogHeader>

      {selectedPath && (
        <div className="space-y-5">
          {/* Cross count & date */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {selectedPath.cross_count} {selectedPath.cross_count === 1 ? 'cross' : 'crosses'}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(selectedPath.date_crossed).toLocaleString()}
            </span>
          </div>

          {/* Users */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[selectedPath.user_a, selectedPath.user_b].map((user, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {i === 0 ? 'User A' : 'User B'}
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={user.profile_photo_url} />
                    <AvatarFallback>{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.first_name} {user.last_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Restaurant */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Restaurant</p>
            {restaurantLoading ? (
              <p className="text-sm text-muted-foreground">Loading restaurant details…</p>
            ) : restaurantDetails ? (
              <div className="space-y-1">
                <p className="font-medium">{restaurantDetails.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {restaurantDetails.full_address}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3 flex-shrink-0" />
                  {restaurantDetails.city}, {restaurantDetails.state_province}, {restaurantDetails.country}
                </p>
                {restaurantDetails.latitude && restaurantDetails.longitude && (
                  <p className="text-xs text-muted-foreground">
                    {restaurantDetails.latitude.toFixed(5)}, {restaurantDetails.longitude.toFixed(5)}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-medium">{selectedPath.restaurant_name || 'Unknown location'}</p>
                {(selectedPath.location_lat || selectedPath.location_lng) && (
                  <p className="text-xs text-muted-foreground">
                    {selectedPath.location_lat?.toFixed(5)}, {selectedPath.location_lng?.toFixed(5)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground italic">No additional details found</p>
              </div>
            )}
          </div>

          {/* <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                createPrivateDinnerSuggestion(selectedPath.user_a_id, selectedPath.user_b_id, selectedPath.restaurant_name);
                setSelectedPath(null);
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Suggest Dinner
            </Button>
          </div> */}
        </div>
      )}
    </DialogContent>
  </Dialog>
  </>
);

};

export default AdminCrossedPaths;