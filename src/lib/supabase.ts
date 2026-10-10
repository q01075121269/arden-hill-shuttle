import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xwxhjurzhfwvpglbxjhs.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_u01i7lIuAgyzjFRwItca4w_M9VhIu1J";

/**
 * 서버 사이드 (Server Actions / Server Components) 전용 Supabase 클라이언트
 */
export function getSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
