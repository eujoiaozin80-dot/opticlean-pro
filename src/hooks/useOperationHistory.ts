import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Operation {
  id: string;
  operation_type: string;
  operation_name: string;
  details: string | null;
  status: string;
  created_at: string;
}

export const useOperationHistory = (userId: string) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('operation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOperations(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const logOperation = async (
    operation_type: string,
    operation_name: string,
    details?: string,
    status: string = 'completed'
  ) => {
    try {
      const { error } = await supabase
        .from('operation_history')
        .insert({
          user_id: userId,
          operation_type,
          operation_name,
          details,
          status
        });

      if (error) throw error;
      loadOperations();
    } catch (error) {
      console.error('Erro ao registrar operação:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadOperations();
    }
  }, [userId]);

  return { operations, loading, logOperation, refresh: loadOperations };
};
