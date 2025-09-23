import { supabase } from "@/integrations/supabase/client";

export async function getEmailsFromIds(userIds: string[]) {
  const { data, error } = await supabase
    .from("profiles") // or "users" depending on your schema
    .select("email")
    .in("id", userIds);

  if (error) throw error;
  return data.map((u) => u.email).filter(Boolean);
}
