import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        router.push('/auth/login');
      } else {
        router.push('/dashboard');
      }
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  return null;
}
