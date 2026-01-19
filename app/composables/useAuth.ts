import { useSupabaseUser, useSupabaseClient } from '#imports';

export const useAuth = () => {
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    signOut,
  };
};
