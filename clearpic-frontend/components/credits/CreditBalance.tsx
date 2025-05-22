import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function CreditBalance() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user?.id)
      .single();

    if (data) {
      setCredits(data.credits);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">Available Credits</h3>
      <p className="text-3xl font-bold text-blue-600">{credits}</p>
    </div>
  );
}
