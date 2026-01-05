import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AuditAction = 'create' | 'update' | 'delete' | 'transfer';

interface AuditLogParams {
  action: AuditAction;
  tableName: string;
  recordId?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export function useAuditLog() {
  const { user, profile, role } = useAuth();

  const logAction = useCallback(async ({
    action,
    tableName,
    recordId,
    oldData,
    newData,
  }: AuditLogParams) => {
    if (!user || !profile) return;

    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        user_name: profile.nome,
        user_role: role,
        action,
        table_name: tableName,
        record_id: recordId || null,
        old_data: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        new_data: newData ? JSON.parse(JSON.stringify(newData)) : null,
      }]);
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  }, [user, profile, role]);

  return { logAction };
}
