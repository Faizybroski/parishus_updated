import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Plus,
  Heart,
  UserCheck,
  Edit,
  Trash2,
  Eye,
  Share2,
} from "lucide-react";

interface Event {
  id: string;
  name: string;
  description: string;
  date_time: string;
  location_name: string;
  location_address: string;
  max_attendees: number;
  status: "active" | "cancelled" | "completed";
  creator_id: string;
  cover_photo_url: string;
  restaurant_id?: string;
  is_paid?: boolean;
  event_fee?: number;
  restaurants?: {
    name: string;
    city: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
  rsvps: Array<{
    id: string;
    status: string;
  }>;
}

const AdminEvents = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          profiles:creator_id (
            first_name,
            last_name
          ),
          restaurants (
            name,
            city
          ),
          rsvps (
            id,
            status
          )
        `
        )
        .order("date_time", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!eventId) return;
    if (
      !confirm(
        "Are you sure you want to delete this Event? This action cannot be undone."
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
      setEvents(events.filter((event) => event.id !== eventId));
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setEventToDelete(null);
    }
  };
  const shareEvent = async (
    name: string,
    description: string,
    eventId: string
  ) => {
    try {
      await navigator.share({
        title: name,
        text: description,
        url: window.location.origin + `/event/${eventId}/details`,
      });
    } catch (error) {
      navigator.clipboard.writeText(
        window.location.origin + `/event/${eventId}/details`
      );
      toast({
        title: "Link copied!",
        description: "Event link copied to clipboard",
      });
    }
  };
  // const handleDeleteEvent = (eventId: string) => {
  //   setEventToDelete(eventId);
  //   toast({
  //     title: 'Confirm Delete',
  //     description: 'Are you sure you want to delete this event?',
  //     action: (
  //       <div className="flex space-x-2">
  //         <Button variant="destructive" size="sm" onClick={confirmDeleteEvent}>
  //           Yes
  //         </Button>
  //         <Button
  //           variant="outline"
  //           size="sm"
  //           onClick={() => {
  //             setEventToDelete(null);
  //             toast.dismiss();
  //           }}
  //         >
  //           Cancel
  //         </Button>
  //       </div>
  //     )
  //   });
  // };

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      event.location_name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      (event.restaurants?.name &&
        event.restaurants.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim())) ||
      (event.profiles?.first_name &&
        event.profiles.first_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim())) ||
      (event.profiles?.last_name &&
        event.profiles.last_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim()))
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Event Management</h1>
          <div className="text-center py-8">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Event Management</h1>
            <p className="text-muted-foreground">
              Manage all events in the system
            </p>
          </div>
          <Button
            onClick={() => navigate("/admin/events/create")}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-10">
              {searchTerm ? "No events match your search." : "No events found."}
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isCreator = profile?.id === event.creator_id;
              return (
                <Card
                  key={event.id}
                  className="flex flex-col h-full bg-[#0A0A0A] border border-primary rounded-sm overflow-hidden shadow-sm"
                >
                  <div className="relative w-full flex items-center justify-center bg-black flex-shrink-0 h-48">
                    <img
                      src={event.cover_photo_url}
                      alt={event.name}
                      className="w-full h-full object-contain"
                    />
                    {/* <div className="absolute inset-0 bg-black/70 z-10" /> */}
                  </div>

                  <CardContent className="flex flex-col flex-grow space-y-3 p-4">
                    <div className=" inset-0 flex flex-col justify-end">
                      <h3 className="text-primary text-xl font-bold line-clamp-1">
                        {event.name}
                      </h3>
                      {event.description && (
                        <p className="text-primary/90 text-sm mt-1 line-clamp-1">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="text-sm flex items-center pl-2 pt-4 pb-1 text-white border-t-2 border-[#1E1E1E]">
                      <Calendar className="h-5 w-5 text-primary/90 mr-3" />
                      <span>
                        {new Date(event.date_time).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {" - "}
                        {new Date(event.date_time).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {event.max_attendees && (
                      <div className="text-sm font-medium py-4 px-2 border-t-2 border-b-2 border-[#1E1E1E] text-white">
                        {/* Top content */}
                        <div className="flex items-center mb-2">
                          <Users className="h-5 w-5 text-primary/90 mr-3" />
                          {event.rsvps?.length || 0}/{event.max_attendees}{" "}
                          RSVPed
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                ((event.rsvps?.length || 0) /
                                  event.max_attendees) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {typeof event.is_paid !== "undefined" && (
                      <div className="text-sm font-medium py-2 text-white">
                        {event.is_paid
                          ? `💵 Paid Event – $${event.event_fee}`
                          : "🆓 Free Event"}
                      </div>
                    )}

                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-primary/90 mr-3" />

                      {/* Location */}
                      <div className="text-sm flex flex-col text-white">
                        <span className="">
                          {event.location_name || "Location not specified"}
                        </span>
                        {event.restaurants && (
                          <span className="text-sm text-gray-400 line-clamp-1">
                            {event.restaurants.name} - {event.restaurants.city}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-grow" />

                    <div className="flex space-x-2">
                      <Button
                        onClick={() =>
                          navigate(`/admin/event/${event.id}/details`)
                        }
                        className="flex-1 bg-primary hover:bg-primary/90 text-black rounded-sm"
                      >
                        See details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/admin/event/${event.id}/edit`)
                        }
                        className="text-white border-[#1E1E1E]"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-500 hover:text-red-600 border-[#1E1E1E]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          shareEvent(event.name, event.description, event.id)
                        }
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEvents;
