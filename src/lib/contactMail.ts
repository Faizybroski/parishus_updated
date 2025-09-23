import { supabase } from "@/integrations/supabase/client";

export const sendContactMail = async ({
  to,
  subject,
  text,
  html,
  replyTo
}: {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}) => {
  const { data, error } = await supabase.functions.invoke("send-event-invite", {
    body: { to, subject, text, html, replyTo },
  });

  if (error) {
    throw new Error(error.message || "Failed to send email");
  }

  return data;
};
