import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MYSTERY-DINNER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Mystery dinner automation started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get users who are eligible for mystery dinners (have completed onboarding)
    const { data: eligibleUsers, error: usersError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('onboarding_completed', true)
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null);

    if (usersError) {
      throw new Error(`Failed to get eligible users: ${usersError.message}`);
    }

    logStep("Eligible users found", { count: eligibleUsers?.length || 0 });

    if (!eligibleUsers || eligibleUsers.length < 2) {
      return new Response(JSON.stringify({
        success: true,
        message: "Not enough eligible users for mystery dinners"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create mystery dinner groups based on location and preferences
    const mysteryGroups = createMysteryGroups(eligibleUsers);
    logStep("Mystery groups created", { groupCount: mysteryGroups.length });

    const createdEvents = [];

    for (const group of mysteryGroups) {
      try {
        // Create mystery dinner event
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + 7); // Next week

        const { data: event, error: eventError } = await supabaseClient
          .from('events')
          .insert({
            creator_id: group[0].id, // First user as creator
            name: "Mystery Dinner Experience",
            description: "A curated mystery dinner experience with fellow food enthusiasts in your area.",
            date_time: eventDate.toISOString(),
            location_name: getRandomLocation(group[0].location_city || 'City Center'),
            max_attendees: group.length,
            is_mystery_dinner: true,
            dietary_theme: getMostCommonDietaryPreference(group),
            dining_style: getMostCommonDiningStyle(group),
            tags: ['mystery', 'curated', 'local']
          })
          .select()
          .single();

        if (eventError) {
          logStep("Failed to create event", { error: eventError.message });
          continue;
        }

        // Auto-RSVP all group members
        const rsvpInserts = group.map(user => ({
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed'
        }));

        const { error: rsvpError } = await supabaseClient
          .from('rsvps')
          .insert(rsvpInserts);

        if (rsvpError) {
          logStep("Failed to create RSVPs", { error: rsvpError.message });
          continue;
        }

        // Send notifications to all participants
        const notificationInserts = group.map(user => ({
          user_id: user.id,
          title: "Mystery Dinner Invitation! 🍽️",
          message: `You've been matched for a mystery dinner experience on ${eventDate.toLocaleDateString()}. Check your events for details!`,
          type: 'rsvp_confirmation' as const,
          data: { eventId: event.id, type: 'mystery_dinner' }
        }));

        await supabaseClient
          .from('notifications')
          .insert(notificationInserts);

        // Create crossed paths for participants
        const crossedPathsInserts = [];
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            crossedPathsInserts.push({
              user1_id: group[i].id,
              user2_id: group[j].id,
              location_name: event.location_name,
              location_lat: group[i].location_lat,
              location_lng: group[i].location_lng,
              matched_at: new Date().toISOString()
            });
          }
        }

        if (crossedPathsInserts.length > 0) {
          await supabaseClient
            .from('crossed_paths')
            .insert(crossedPathsInserts);
        }

        createdEvents.push({
          eventId: event.id,
          participantCount: group.length,
          location: event.location_name
        });

        logStep("Mystery dinner created successfully", { 
          eventId: event.id, 
          participants: group.length 
        });

      } catch (error) {
        logStep("Error creating mystery dinner", { error: error.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Created ${createdEvents.length} mystery dinner events`,
      events: createdEvents
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in mystery-dinner-automation", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper functions
function createMysteryGroups(users: any[]): any[][] {
  const groups: any[][] = [];
  const usedUsers = new Set();
  
  // Group users by location proximity and preferences
  for (const user of users) {
    if (usedUsers.has(user.id)) continue;
    
    const group = [user];
    usedUsers.add(user.id);
    
    // Find compatible users for this group (max 6 per group)
    for (const otherUser of users) {
      if (usedUsers.has(otherUser.id) || group.length >= 6) continue;
      
      // Check location proximity (within ~50km)
      const distance = calculateDistance(
        user.location_lat, user.location_lng,
        otherUser.location_lat, otherUser.location_lng
      );
      
      if (distance <= 50) { // Within 50km
        // Check preference compatibility
        const compatibility = calculateCompatibility(user, otherUser);
        if (compatibility > 0.3) { // 30% compatibility threshold
          group.push(otherUser);
          usedUsers.add(otherUser.id);
        }
      }
    }
    
    // Only create groups with at least 2 people
    if (group.length >= 2) {
      groups.push(group);
    }
  }
  
  return groups;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateCompatibility(user1: any, user2: any): number {
  let score = 0;
  
  // Dining style compatibility
  if (user1.dining_style === user2.dining_style) {
    score += 0.4;
  }
  
  // Dietary preferences compatibility
  const diet1 = user1.dietary_preferences || [];
  const diet2 = user2.dietary_preferences || [];
  const commonDiets = diet1.filter((d: string) => diet2.includes(d));
  score += (commonDiets.length / Math.max(diet1.length, diet2.length, 1)) * 0.3;
  
  // Age group compatibility (if available)
  // Location compatibility already checked
  score += 0.3; // Base compatibility for being in same area
  
  return score;
}

function getMostCommonDietaryPreference(group: any[]): string | null {
  const allPrefs: string[] = [];
  group.forEach(user => {
    if (user.dietary_preferences) {
      allPrefs.push(...user.dietary_preferences);
    }
  });
  
  if (allPrefs.length === 0) return null;
  
  const prefCounts: { [key: string]: number } = {};
  allPrefs.forEach(pref => {
    prefCounts[pref] = (prefCounts[pref] || 0) + 1;
  });
  
  return Object.keys(prefCounts).sort((a, b) => prefCounts[b] - prefCounts[a])[0];
}

function getMostCommonDiningStyle(group: any[]): string | null {
  const styles = group.map(user => user.dining_style).filter(Boolean);
  if (styles.length === 0) return null;
  
  const styleCounts: { [key: string]: number } = {};
  styles.forEach(style => {
    styleCounts[style] = (styleCounts[style] || 0) + 1;
  });
  
  return Object.keys(styleCounts).sort((a, b) => styleCounts[b] - styleCounts[a])[0];
}

function getRandomLocation(city: string): string {
  const venues = [
    `Cozy Bistro in ${city}`,
    `Garden Restaurant ${city}`,
    `Historic Dining Room ${city}`,
    `Rooftop Terrace ${city}`,
    `Local Chef's Table ${city}`,
    `Artisan Kitchen ${city}`,
    `Vintage Wine Bar ${city}`,
    `Farm-to-Table ${city}`,
    `Culinary Studio ${city}`,
    `Secret Supper Club ${city}`
  ];
  
  return venues[Math.floor(Math.random() * venues.length)];
}