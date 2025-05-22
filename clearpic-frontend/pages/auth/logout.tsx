import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Logout() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Call the logout endpoint
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Clear the Supabase session
        await supabase.auth.signOut();

        // Redirect to login page
        router.push('/auth/login');
      } catch (error) {
        console.error('Logout failed:', error);
        // Still redirect to login page even if logout fails
        router.push('/auth/login');
      }
    };

    handleLogout();
  }, [router, supabase.auth]);

  return null;
} 