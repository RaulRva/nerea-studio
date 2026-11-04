import "server-only";

import { createClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@/lib/supabase/env";

export function createAdminClient() {
  const key = secretKey();
  const url = supabaseUrl();
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
