import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { LoaderText } from "@/components/loader/Loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Eye,
  Trash2,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Heart,
  UserCheck,
  Share2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useNavigate, Link } from "react-router-dom";

interface RSVP {
  id: string;
  user_id: string;
  event_id: string;
  response_status: string;
  date: string;
  status: string;
  created_at: string;
  events: {
    id: string;
    name: string;
    description: string;
    date_time: string;
    location_name: string;
    location_address: string;
    max_attendees: number;
    creator_id: string;
    status: string;
    cover_photo_url?: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

const RSVPs = () => {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchRSVPs();
    }
  }, [user]);

  const fetchRSVPs = async () => {
    if (!user) return;

    try {
      console.log("Fetching RSVPs for user:", user.id);

      // Get user's profile ID first
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      console.log("Found profile ID:", profile.id);

      const { data, error } = await supabase
        .from("rsvps")
        .select(
          `
          *,
          events (
            id,
            name,
            description,
            date_time,
            location_name,
            location_address,
            max_attendees,
            creator_id,
            status,
            cover_photo_url,
            profiles!events_creator_id_fkey (
              first_name,
              last_name
            )
          )
        `
        )
        .eq("user_id", profile.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("RSVPs query error:", error);
        throw error;
      }

      console.log("Found RSVPs:", data);
      setRsvps(data || []);
    } catch (error) {
      console.error("Error fetching RSVPs:", error);
      toast({
        title: "Error",
        description: "Failed to load your RSVPs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelRSVP = async (rsvpId: string, eventId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this RSVP?"
    );
    if (!confirmed) return;

    try {
      // Get user's profile ID first
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (profileError) throw profileError;

      // Delete RSVP
      const { error: rsvpError } = await supabase
        .from("rsvps")
        .delete()
        .eq("id", rsvpId);

      if (rsvpError) throw rsvpError;

      // Also delete from reservations table if it exists
      const { error: reservationError } = await supabase
        .from("reservations")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", profile.id);

      if (reservationError) console.log("No reservation found to delete");

      toast({
        title: "RSVP Cancelled",
        description: "Your RSVP has been cancelled successfully.",
      });

      fetchRSVPs();
    } catch (error) {
      console.error("Error cancelling RSVP:", error);
      toast({
        title: "Error",
        description: "Failed to cancel RSVP",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // -----------------------DEVELOPMENT DUMMY COMMENTS, SHOULD BE UMCOMMENTED ON LIVE ---------------------------------------------------
  const filteredRsvps = rsvps.filter((rsvp) => {
    const matchesSearch =
      searchTerm === "" ||
      rsvp.events.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase().trim()) ||
      rsvp.events.description.includes(searchTerm.toLowerCase().trim()) ||
      rsvp.events.location_name
        .trim()
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase().trim());

    const matchesStatus =
      statusFilter === "all" || rsvp.status === statusFilter;

    const eventDate = new Date(rsvp.events.date_time);
    const now = new Date();
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "upcoming" && eventDate > now) ||
      (dateFilter === "past" && eventDate <= now);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-script">
              My RSVPs
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your event reservations and attendance
            </p>
          </div>

          {filteredRsvps.length === 0 ? (
            // rsvps.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No RSVPs found</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't RSVP'd to any events yet. Explore events to find
                  something interesting!
                </p>
                <Link to="/events">
                  <Button variant="outline" className="">
                    Browse Events
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total RSVPs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold  ">{rsvps.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Confirmed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {rsvps.filter((r) => r.status === "confirmed").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {rsvps.filter((r) => r.status === "pending").length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filter Controls */}
              <Card className="p-6 w-full">
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filter RSVPs
                    </h3>
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Status Filter */}
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Date Filter */}
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="upcoming">
                          Upcoming Events
                        </SelectItem>
                        <SelectItem value="past">Past Events</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filter Results Summary */}
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredRsvps.length} of {rsvps.length} RSVPs
                  </div>
                </div>
              </Card>

              {/* Filtered Results */}
              {filteredRsvps.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No RSVPs match your filters
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search criteria or clear the filters to
                      see all RSVPs.
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="grid" className="space-y-6">
                  <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="grid">Grid View</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                  </TabsList>

                  <TabsContent value="grid">
                    <div className="flex flex-wrap justify-center gap-5 my-5">
                      {filteredRsvps.map((rsvp) => {
                        const eventDate = new Date(rsvp.events.date_time);
                        const isUpcoming = eventDate > new Date();

                        return (
                          // <Card
                          //   key={rsvp.id}
                          //   className="overflow-hidden hover:shadow-lg transition-shadow"
                          // >
                          //   {/* Event Image */}
                          //   {rsvp.events.cover_photo_url && (
                          //     <div className="h-48 overflow-hidden">
                          //       <img
                          //         src={rsvp.events.cover_photo_url}
                          //         alt={rsvp.events.name}
                          //         className="w-full h-full object-cover"
                          //       />
                          //     </div>
                          //   )}

                          //   <CardHeader className="pb-3">
                          //     <div className="flex flex-wrap items-center gap-4">
                          //       <CardTitle className="text-lg leading-tight">
                          //         {rsvp.events.name}
                          //       </CardTitle>
                          //       <div className="flex gap-1 ml-2">
                          //         <Badge
                          //           variant={
                          //             isUpcoming ? "default" : "secondary"
                          //           }
                          //           className="text-xs"
                          //         >
                          //           {isUpcoming ? "Upcoming" : "Past"}
                          //         </Badge>
                          //         <Badge
                          //           className={`text-xs ${getStatusColor(
                          //             rsvp.status
                          //           )}`}
                          //         >
                          //           {rsvp.status}
                          //         </Badge>
                          //       </div>
                          //     </div>

                          //     <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          //       {rsvp.events.description}
                          //     </p>
                          //   </CardHeader>

                          //   <CardContent className="pt-0 space-y-4">
                          //     {/* Date & Time */}
                          //     <div className="space-y-2">
                          //       <div className="flex items-center space-x-2">
                          //         <Calendar className="h-4 w-4 text-muted-foreground" />
                          //         <span className="text-sm">
                          //           {format(eventDate, "PPP")}
                          //         </span>
                          //       </div>
                          //       <div className="flex items-center space-x-2">
                          //         <Clock className="h-4 w-4 text-muted-foreground" />
                          //         <span className="text-sm">
                          //           {format(eventDate, "p")}
                          //         </span>
                          //       </div>
                          //     </div>

                          //     {/* Location */}
                          //     <div className="flex items-center space-x-2">
                          //       <MapPin className="h-4 w-4 text-muted-foreground" />
                          //       <span className="text-sm truncate">
                          //         {rsvp.events.location_name}
                          //       </span>
                          //     </div>

                          //     {/* Host */}
                          //     <div className="flex items-center space-x-2">
                          //       <Avatar className="h-6 w-6">
                          //         <AvatarFallback className="text-xs">
                          //           {rsvp.events.profiles?.first_name?.[0] ||
                          //             "H"}
                          //         </AvatarFallback>
                          //       </Avatar>
                          //       <span className="text-sm truncate">
                          //         {rsvp.events.profiles?.first_name}{" "}
                          //         {rsvp.events.profiles?.last_name}
                          //       </span>
                          //     </div>

                          //     {/* RSVP Date */}
                          //     <div className="text-xs text-muted-foreground">
                          //       RSVP'd on{" "}
                          //       {format(new Date(rsvp.created_at), "PPP")}
                          //     </div>

                          //     {/* Actions */}
                          //     <div className="flex gap-2 pt-2">
                          //       <Link to={`/event/${rsvp.events.id}/details`}>
                          //         <Button
                          //           variant="outline"
                          //           size="sm"
                          //           className="flex-1"
                          //         >
                          //           <Eye className="h-4 w-4 mr-2" />
                          //           View Event
                          //         </Button>
                          //       </Link>
                          //       <Button
                          //         variant="outline"
                          //         size="sm"
                          //         className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          //         onClick={() => cancelRSVP(rsvp.id, rsvp.events.id)}
                          //       >
                          //         <Trash2 className="h-4 w-4" />
                          //       </Button>
                          //     </div>
                          //   </CardContent>
                          // </Card>
                          <Link
                            key={rsvp.id}
                            to={`/event/${rsvp.events.id}/details`}
                            className="block rounded-lg overflow-hidden shadow-md border border-gray-200 hover:border-gray-700 hover:bg-white/10 hover:cursor-pointer transition-all duration-300 w-full sm:w-[90%] md:w-[45%] lg:w-[30%] max-w-[420px] no-underline"
                          >
                            {/* <div
                            key={rsvp.id}
                            className=" rounded-lg overflow-hidden shadow-md border border-gray-200 hover:border-gray-700 hover:bg-white/10 hover:cursor-pointer transition-all duration-300 w-full sm:w-[90%] md:w-[45%] lg:w-[30%] max-w-[420px]"
                          > */}
                            <div className="relative">
                              <div className="absolute top-3 right-3 z-20">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="bg-black/40 text-white hover:bg-black/60 transition-colors rounded-full"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-5 w-5" />
                                    </Button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent
                                    align="end"
                                    className="w-40"
                                  >
                                    {/* {isCreator && (
                                    <DropdownMenuItem asChild>
                                      <Link
                                        to={`/event/${rsvp.events.id}/edit`}
                                        className="flex items-center w-full"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit Event</span>
                                      </Link>
                                    </DropdownMenuItem>
                                     )}  */}

                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelRSVP(rsvp.id, rsvp.events.id);
                                      }}
                                      className="flex items-center "
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span>Cancel RSVP</span>
                                    </DropdownMenuItem>

                                     {/* {isCreator && (
                                    <DropdownMenuItem
                                      // onClick={(e) => {
                                      //   e.stopPropagation();
                                      //   deleteEvent && deleteEvent(event.id);
                                      // }}
                                      className="text-red-500 focus:text-red-600 flex items-center"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                    )}   */}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {/* Image */}
                              <img
                                className="w-full object-cover"
                                style={{ height: "35rem" }}
                                src={rsvp.events.cover_photo_url}
                                alt={rsvp.events.name}
                              />

                              {/* Title container with black bg + gradient top */}
                              <div className="absolute inset-x-0 bottom-0">
                                <div className="relative bg-black pr-4">
                                  <div className="absolute -top-[17.5rem] left-0 right-0 h-[17.5rem] bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
                                  {/* <div className="flex gap-2 absolute -top-12 left-5 text-white text-sm z-20">
                                    <div className="border border-white/20 rounded shadow-md flex-1">
                                      <span className="px-3 py-2">
                                        {new Date(eventDate).toLocaleDateString(
                                          "en-US",
                                          {
                                            month: "short",
                                            day: "numeric",
                                          }
                                        )}
                                        {" - "}
                                        {new Date(eventDate).toLocaleTimeString(
                                          "en-US",
                                          {
                                            hour: "numeric",
                                            minute: "2-digit",
                                          }
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                      <Badge
                                        variant={
                                          isUpcoming ? "default" : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {isUpcoming ? "Upcoming" : "Past"}
                                      </Badge>
                                      <Badge
                                        className={`text-xs ${getStatusColor(
                                          rsvp.status
                                        )}`}
                                      >
                                        {rsvp.status}
                                      </Badge>
                                    </div>
                                  </div> */}
                                  <div className="flex items-center justify-between  gap-2 absolute -top-12 left-5 right-5 z-20 text-white text-sm">
                                    {/* Date & Time Box */}
                                    <div className="border border-white/25 bg-black/40 backdrop-blur-sm rounded px-3 py-1.5 shadow-md">
                                      <span className="tracking-wide">
                                        {new Date(rsvp.date).toLocaleDateString(
                                          "en-US",
                                          {
                                            month: "short",
                                            day: "numeric",
                                          }
                                        )}
                                        {" • "}
                                        {new Date(rsvp.date).toLocaleTimeString(
                                          "en-US",
                                          {
                                            hour: "numeric",
                                            minute: "2-digit",
                                          }
                                        )}
                                      </span>
                                    </div>

                                    {/* Status Badges */}
                                    <div className="flex items-center gap-1.5 ml-1">
                                      <Badge
                                        variant={
                                          isUpcoming ? "default" : "secondary"
                                        }
                                        className="text-md px-2 py-0.5 rounded-full"
                                      >
                                        {isUpcoming ? "Upcoming" : "Ended"}
                                      </Badge>
                                      <Badge
                                        className={`text-md px-2 py-0.5 rounded-full ${getStatusColor(
                                          rsvp.status
                                        )}`}
                                      >
                                        {rsvp.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>

                                  <div className="pl-5 pr-2 pt-1 flex flex-col gap-2 relative z-10">
                                    <h3 className="text-2xl text-white font-script">
                                      {rsvp.events.name}
                                    </h3>
                                    {rsvp.events.description && (
                                      <p className="text-white text-sm mt-1 line-clamp-1">
                                        {rsvp.events.description}
                                      </p>
                                    )}
                                    <div className="flex items-center space-x-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                          {rsvp.events.profiles
                                            ?.first_name?.[0] || "H"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm truncate text-primary">
                                        {rsvp.events.profiles?.first_name}{" "}
                                        {rsvp.events.profiles?.last_name}
                                      </span>
                                    </div>
                                    <div className="text-xs text-secondary">
                                      RSVP'd on{" "}
                                      {format(new Date(rsvp.created_at), "PPP")}
                                    </div>
                                    <p className="text-sm flex flex-col text-secondary pb-3">
                                      <span className="">
                                        {rsvp.events.location_name ||
                                          "Location not specified"}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* </div> */}
                          </Link>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="list">
                    <div className="space-y-4">
                      {filteredRsvps.map((rsvp) => {
                        const eventDate = new Date(rsvp.events.date_time);
                        const isUpcoming = eventDate > new Date();

                        return (
                          <Link
                            key={rsvp.id}
                            to={`/event/${rsvp.events.id}/details`}
                            className="block rounded-lg border hover:shadow-lg transition-shadow hover:bg-secondary transition-all duration-300"
                          >
                            <CardContent className="p-6">
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                                  {rsvp.events.cover_photo_url && (
                                    <div className="w-16 shrink-0">
                                      <img
                                        src={rsvp.events.cover_photo_url}
                                        alt={rsvp.events.name}
                                        className="w-16 h-16 object-cover rounded-lg"
                                      />
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                      <div className="min-w-0">
                                        <h3 className="font-semibold text-lg mb-1 font-script">
                                          {rsvp.events.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                          {rsvp.events.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                              {format(rsvp.date, "PPP")}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>
                                              {format(rsvp.date, "p")}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            <span className="truncate max-w-[200px] sm:max-w-full">
                                              {rsvp.events.location_name}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                  <div className="flex items-center justify-between gap-2">
                                    <Badge
                                      variant={
                                        isUpcoming ? "default" : "secondary"
                                      }
                                      className="text-sm bg-primary text-primary-foreground hover:bg-secondary"
                                    >
                                      {isUpcoming ? "Upcoming" : "Ended"}
                                    </Badge>
                                    <Badge
                                      className={`text-sm ${getStatusColor(
                                        rsvp.status
                                      )}`}
                                    >
                                      {rsvp.status}
                                    </Badge>
                                  </div>
                                  {/* <Link to={`/event/${rsvp.events.id}/details`}>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="hover:bg-secondary-700"
                                    >
                                      <Eye className="h-4 w-4 " />
                                      View
                                    </Button>
                                  </Link> */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      cancelRSVP(rsvp.id, rsvp.events.id)
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Link>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RSVPs;
