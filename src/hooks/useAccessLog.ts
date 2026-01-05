import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCallback } from 'react';

type ActionType = 'view' | 'edit' | 'delete' | 'transfer' | 'export' | 'create' | 'login' | 'logout';
type ResourceType = 'lead' | 'atendimento' | 'usuario' | 'cliente' | 'time' | 'meta' | 'comissao' | 'relatorio' | 'sistema';

interface LogAccessParams {
  action: ActionType;
  resourceType: ResourceType;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export function useAccessLog() {
  const { user, profile, role } = useAuth();

  const logAccess = useCallback(async ({
    action,
    resourceType,
    resourceId,
    details,
  }: LogAccessParams) => {
    if (!user || !profile) return;

    try {
      await supabase.from('access_logs').insert([{
        user_id: user.id,
        user_name: profile.nome,
        user_role: role,
        action,
        resource_type: resourceType,
        resource_id: resourceId || null,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
      }]);
    } catch (error) {
      console.error('[useAccessLog] Error logging access:', error);
    }
  }, [user, profile, role]);

  return { logAccess };
}
