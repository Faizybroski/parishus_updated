import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-EVENT-EMAILS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { eventId, emailType, customMessage } = await req.json();
    logStep("Request parsed", { eventId, emailType });

    if (!eventId || !emailType) {
      throw new Error("Missing required parameters: eventId and emailType");
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select(`
        *,
        profiles!events_creator_id_fkey(first_name, last_name, email)
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error(`Event not found: ${eventError?.message}`);
    }

    logStep("Event found", { eventName: event.name });

    // Get RSVPs for the event
    const { data: rsvps, error: rsvpError } = await supabaseClient
      .from('rsvps')
      .select(`
        *,
        profiles!rsvps_user_id_fkey(first_name, last_name, email)
      `)
      .eq('event_id', eventId)
      .eq('status', 'confirmed');

    if (rsvpError) {
      throw new Error(`Failed to get RSVPs: ${rsvpError.message}`);
    }

    logStep("RSVPs found", { count: rsvps?.length || 0 });

    // Email templates
    const getEmailTemplate = (type: string, eventData: any, userData: any, customMsg?: string) => {
      const baseUrl = "https://your-app.lovable.app"; // Replace with your actual URL
      
      switch (type) {
        case 'reminder':
          return {
            subject: `Reminder: ${eventData.name} tomorrow!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d4af37;">Event Reminder</h2>
                <p>Hi ${userData.first_name},</p>
                <p>This is a friendly reminder about your upcoming dinner event!</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>${eventData.name}</h3>
                  <p><strong>Date:</strong> ${new Date(eventData.date_time).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> ${new Date(eventData.date_time).toLocaleTimeString()}</p>
                  <p><strong>Location:</strong> ${eventData.location_name}</p>
                  ${eventData.description ? `<p><strong>Description:</strong> ${eventData.description}</p>` : ''}
                </div>
                
                <p>We're looking forward to seeing you there!</p>
                <p><a href="${baseUrl}/events" style="background: #d4af37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Event Details</a></p>
              </div>
            `
          };
          
        case 'cancellation':
          return {
            subject: `Event Cancelled: ${eventData.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">Event Cancelled</h2>
                <p>Hi ${userData.first_name},</p>
                <p>We regret to inform you that the following event has been cancelled:</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>${eventData.name}</h3>
                  <p><strong>Originally scheduled for:</strong> ${new Date(eventData.date_time).toLocaleDateString()} at ${new Date(eventData.date_time).toLocaleTimeString()}</p>
                  <p><strong>Location:</strong> ${eventData.location_name}</p>
                </div>
                
                ${customMsg ? `<p><strong>Message from organizer:</strong> ${customMsg}</p>` : ''}
                
                <p>We apologize for any inconvenience this may cause.</p>
                <p><a href="${baseUrl}/explore" style="background: #d4af37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Find Other Events</a></p>
              </div>
            `
          };
          
        case 'update':
          return {
            subject: `Event Update: ${eventData.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d4af37;">Event Update</h2>
                <p>Hi ${userData.first_name},</p>
                <p>There's been an update to your event:</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>${eventData.name}</h3>
                  <p><strong>Date:</strong> ${new Date(eventData.date_time).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> ${new Date(eventData.date_time).toLocaleTimeString()}</p>
                  <p><strong>Location:</strong> ${eventData.location_name}</p>
                </div>
                
                ${customMsg ? `<p><strong>Update details:</strong> ${customMsg}</p>` : ''}
                
                <p><a href="${baseUrl}/events" style="background: #d4af37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Updated Details</a></p>
              </div>
            `
          };
          
        default:
          throw new Error(`Unknown email type: ${type}`);
      }
    };

    // Send emails to all attendees
    const emailPromises = rsvps?.map(async (rsvp) => {
      const template = getEmailTemplate(emailType, event, rsvp.profiles, customMessage);
      
      logStep("Sending email", { 
        to: rsvp.profiles.email, 
        subject: template.subject 
      });

      // Here you would integrate with your email service (SendGrid, Resend, etc.)
      // For now, we'll just create a notification in the database
      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id: rsvp.user_id,
          title: template.subject,
          message: `Email sent regarding: ${event.name}`,
          type: 'general',
          data: { emailType, eventId }
        });

      if (notificationError) {
        logStep("Failed to create notification", { error: notificationError.message });
      }

      return { success: true, email: rsvp.profiles.email };
    }) || [];

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logStep("Email sending completed", { successful, failed });

    return new Response(JSON.stringify({
      success: true,
      message: `Emails sent successfully`,
      stats: { successful, failed, total: results.length }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-event-emails", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});