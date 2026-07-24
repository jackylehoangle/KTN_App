import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let socialHubClient: SupabaseClient | null = null;

/**
 * Kết nối riêng tới project Supabase Automation_KTN.
 *
 * KTN App vẫn tiếp tục dùng NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 * cho đăng nhập và các module nghiệp vụ hiện có. Social Hub dùng project thứ hai
 * qua service-role key ở server để không làm ảnh hưởng hệ thống KTN App.
 */
export function createSocialHubClient(): SupabaseClient {
  const url = process.env.SOCIAL_HUB_SUPABASE_URL;
  const serviceRoleKey = process.env.SOCIAL_HUB_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Social Hub chưa được cấu hình kết nối Automation_KTN. Hãy thêm SOCIAL_HUB_SUPABASE_URL và SOCIAL_HUB_SUPABASE_SERVICE_ROLE_KEY trong Vercel.'
    );
  }

  if (!socialHubClient) {
    socialHubClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return socialHubClient;
}
