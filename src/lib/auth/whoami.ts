import { supabaseBrowser } from '@/lib/supabase/browser';

export interface CurrentUser {
  id: string;
  email: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = supabaseBrowser();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
