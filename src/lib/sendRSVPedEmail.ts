import { supabase } from "@/integrations/supabase/client";

interface RSVPEmailParams {
  // RSVP user email fields
  rsvpedUserEmail: string;
  rsvpedUserName: string;

  // Event details
  eventName: string;
  eventDateTime: string;
  eventLocation: string;
  eventLocationAddress?: string;

  // Tracking
  trackCode: string;
  qrCodeUrl: string; // Public URL from Supabase Storage

  // Payment info
  isPaid: boolean;
  paymentStatus: string; // 'paid' | 'unpaid' | 'pending'
  pricePaid?: string;

  // Event owner email fields
  organizerEmail: string;
  organizerName: string;

  // Reply-to
  replyTo?: string;
}

/**
 * Sends dual RSVP confirmation emails:
 * 1. To the RSVP user — event details + QR code (hosted image) + track code
 * 2. To the event owner — user info + RSVP details + payment status
 */
export const sendRSVPedEmail = async (params: RSVPEmailParams) => {
  const session = supabase.auth.getSession
    ? (await supabase.auth.getSession()).data.session
    : null;

  if (!session) {
    throw new Error("User session not found");
  }

  const {
    rsvpedUserEmail,
    rsvpedUserName,
    eventName,
    eventDateTime,
    eventLocation,
    eventLocationAddress,
    trackCode,
    qrCodeUrl,
    isPaid,
    paymentStatus,
    pricePaid,
    organizerEmail,
    organizerName,
    replyTo,
  } = params;

  const formattedDate = new Date(eventDateTime).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const trackingUrl = `${window.location.origin}/track/${trackCode}`;

  // --- Email to RSVP User ---
  const rsvpedSubject = `🎟 Your RSVP is Confirmed — ${eventName}`;
  const rsvpedHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; background-color: #faf9f7;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #c4b0a2 0%, #a89282 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 0.5px;">🎉 You're In!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Your RSVP has been confirmed</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px; background: #fff;">
        <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
          Hi <strong>${rsvpedUserName}</strong>,<br>
          You're all set for <strong>${eventName}</strong>!
        </p>

        <!-- Event Details Card -->
        <div style="background: #f7f5f3; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #c4b0a2;">
          <h3 style="color: #333; margin: 0 0 12px; font-size: 18px;">📅 Event Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #666; width: 100px;">Event</td><td style="padding: 6px 0; color: #333; font-weight: 600;">${eventName}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Date & Time</td><td style="padding: 6px 0; color: #333;">${formattedDate}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Location</td><td style="padding: 6px 0; color: #333;">${eventLocation}${eventLocationAddress ? ` — ${eventLocationAddress}` : ""}</td></tr>
            ${isPaid ? `<tr><td style="padding: 6px 0; color: #666;">Payment</td><td style="padding: 6px 0; color: #2d8a4e; font-weight: 600;">✅ ${paymentStatus} ${pricePaid ? `($${pricePaid})` : ""}</td></tr>` : ""}
          </table>
        </div>

        <!-- Track Code -->
        <div style="background: #333; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
          <p style="color: #aaa; margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Tracking Code</p>
          <p style="color: #c4b0a2; font-family: monospace; font-size: 28px; margin: 0; letter-spacing: 4px; font-weight: 700;">${trackCode}</p>
        </div>

        <!-- QR Code -->
        <div style="text-align: center; margin-bottom: 24px;">
          <p style="color: #666; margin-bottom: 12px; font-size: 14px;">📱 Present this QR code at entry</p>
          <img src="${qrCodeUrl}" alt="RSVP QR Code" width="200" height="200" style="width: 200px; height: 200px; border-radius: 8px; border: 2px solid #e5e5e5; display: block; margin: 0 auto;" />
        </div>

        <!-- Important Note -->
        <div style="background: #fff8ed; border: 1px solid #f0d9a8; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="color: #8b6914; margin: 0; font-size: 14px;">
            ⚠️ <strong>Important:</strong> Please present this QR code or tracking code when you arrive at the event.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #333; padding: 20px 24px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          Sent by Parish • <a href="${window.location.origin}" style="color: #c4b0a2; text-decoration: none;">parishus.com</a>
        </p>
      </div>
    </div>
  `;

  // --- Email to Event Owner ---
  const organizerSubject = `📩 New RSVP: ${rsvpedUserName} for ${eventName}`;
  const organizerHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; background-color: #faf9f7;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #c4b0a2; margin: 0; font-size: 22px;">📩 New RSVP Received</h1>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px; background: #fff;">
        <p style="font-size: 16px; color: #333;">
          Hi <strong>${organizerName}</strong>, someone just RSVP'd to your event!
        </p>

        <!-- User Info -->
        <div style="background: #f7f5f3; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #333; margin: 0 0 12px; font-size: 16px;">👤 Attendee Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #666; width: 120px;">Name</td><td style="padding: 6px 0; color: #333; font-weight: 600;">${rsvpedUserName}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0; color: #333;">${rsvpedUserEmail}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">RSVP Time</td><td style="padding: 6px 0; color: #333;">${new Date().toLocaleString()}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Payment</td><td style="padding: 6px 0; color: ${isPaid ? "#2d8a4e" : "#666"}; font-weight: 600;">${isPaid ? `✅ Paid${pricePaid ? ` ($${pricePaid})` : ""}` : "Free Event"}</td></tr>
          </table>
        </div>

        <!-- Event Info -->
        <div style="background: #f7f5f3; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #333; margin: 0 0 12px; font-size: 16px;">📅 Event</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #666; width: 120px;">Event</td><td style="padding: 6px 0; color: #333; font-weight: 600;">${eventName}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Date & Time</td><td style="padding: 6px 0; color: #333;">${formattedDate}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Location</td><td style="padding: 6px 0; color: #333;">${eventLocation}</td></tr>
          </table>
        </div>

        <!-- Tracking Link -->
        <div style="text-align: center; margin-top: 20px;">
          <a href="${trackingUrl}" style="display: inline-block; background: #c4b0a2; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View RSVP Tracking Details
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #333; padding: 20px 24px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          Parish Event Management • <a href="${window.location.origin}" style="color: #c4b0a2; text-decoration: none;">parishus.com</a>
        </p>
      </div>
    </div>
  `;

  const { data, error } = await supabase.functions.invoke("event-rsvped", {
    body: {
      rsvped: rsvpedUserEmail,
      rsvpedSubject,
      rsvpedText: `Your RSVP for ${eventName} is confirmed. Track code: ${trackCode}. Present your QR code at entry.`,
      rsvpedHtml,
      replyTo: replyTo || "support@parishus.com",
      organizer: organizerEmail,
      organizerSubject,
      organizerText: `${rsvpedUserName} (${rsvpedUserEmail}) has RSVP'd to ${eventName}. Payment: ${paymentStatus}.`,
      organizerHtml,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to send RSVP emails");
  }

  return data;
};
