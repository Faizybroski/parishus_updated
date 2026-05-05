import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not set");

    const {
      rsvped,
      rsvpedSubject,
      rsvpedText,
      rsvpedHtml,
      replyTo,
      organizer,
      organizerSubject,
      organizerText,
      organizerHtml,
    } = await req.json();

    const sendEmail = async (
      to: string,
      subject: string,
      html: string,
      text: string,
    ) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Parish <noreply@parishus.com>",
          to: [to],
          subject,
          html,
          text,
          reply_to: replyTo || "support@parishus.com",
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Resend API error (${res.status}): ${errBody}`);
      }

      return res.json();
    };

    const results = await Promise.allSettled([
      rsvped ? sendEmail(rsvped, rsvpedSubject, rsvpedHtml, rsvpedText) : Promise.resolve(null),
      organizer ? sendEmail(organizer, organizerSubject, organizerHtml, organizerText) : Promise.resolve(null),
    ]);

    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.message);

    if (errors.length > 0) {
      console.error("Some emails failed:", errors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((r) => r.status === "fulfilled").length,
        failed: errors.length,
        errors,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
