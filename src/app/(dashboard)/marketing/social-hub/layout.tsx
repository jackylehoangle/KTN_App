import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/supabase/queries';

export default async function SocialHubLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login');
  if (!['admin', 'giam_doc'].includes(profile.role)) redirect('/');

  return children;
}
