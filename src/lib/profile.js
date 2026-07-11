import { supabase } from '../supabase';

export async function ensureProfile(user) {
  if (!user) return null;

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return existing;

  const profile = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || 'User',
    role: user.user_metadata?.role || 'admin',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single();

  if (error) {
    console.error('Failed to create profile:', error);
    return {
      ...profile,
      full_name: profile.full_name,
    };
  }

  return data;
}

export function getUserRole(profile, user) {
  return profile?.role || user?.user_metadata?.role || null;
}
