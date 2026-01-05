import { useAuth, AppRole } from './useAuth';

interface PermissionConfig {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canTransfer: boolean;
  canExport: boolean;
  canCreate: boolean;
}

interface UsePermissionsReturn {
  // Verificações de role
  isAdmin: boolean;
  isLider: boolean;
  isVendedor: boolean;
  isSdr: boolean;
  isCliente: boolean;
  role: AppRole;

  // Permissões por recurso
  leads: PermissionConfig;
  atendimentos: PermissionConfig;
  usuarios: PermissionConfig;
  clientes: PermissionConfig;
  times: PermissionConfig;
  metas: PermissionConfig;
  comissoes: PermissionConfig;
  relatorios: PermissionConfig;

  // Helpers
  canViewFinancials: boolean;
  canViewAllTeams: boolean;
  canManageSystem: boolean;
  canViewOwnDataOnly: boolean;

  // Função para verificar permissão específica
  checkPermission: (resource: string, action: 'view' | 'edit' | 'delete' | 'transfer' | 'export' | 'create') => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { role, isAdmin, isLider, isVendedor, isSdr } = useAuth();
  const isCliente = role === 'cliente';

  // Permissões para Leads
  const leadsPermissions: PermissionConfig = {
    canView: true, // Todos podem ver (filtrado por RLS)
    canEdit: isAdmin || isLider || isVendedor || isSdr,
    canDelete: isAdmin, // Só admin pode excluir permanentemente
    canTransfer: isAdmin || isLider,
    canExport: isAdmin || isLider || isVendedor || isSdr,
    canCreate: isAdmin || isLider || isVendedor || isSdr,
  };

  // Permissões para Atendimentos
  const atendimentosPermissions: PermissionConfig = {
    canView: true,
    canEdit: isAdmin || isLider || isVendedor,
    canDelete: isAdmin,
    canTransfer: isAdmin || isLider,
    canExport: isAdmin || isLider || isVendedor,
    canCreate: isAdmin || isLider || isVendedor || isSdr,
  };

  // Permissões para Usuários
  const usuariosPermissions: PermissionConfig = {
    canView: isAdmin,
    canEdit: isAdmin,
    canDelete: isAdmin,
    canTransfer: false,
    canExport: isAdmin,
    canCreate: isAdmin,
  };

  // Permissões para Clientes
  const clientesPermissions: PermissionConfig = {
    canView: isAdmin || isLider || isCliente,
    canEdit: isAdmin,
    canDelete: isAdmin,
    canTransfer: false,
    canExport: isAdmin,
    canCreate: isAdmin,
  };

  // Permissões para Times
  const timesPermissions: PermissionConfig = {
    canView: isAdmin || isLider,
    canEdit: isAdmin,
    canDelete: isAdmin,
    canTransfer: false,
    canExport: isAdmin,
    canCreate: isAdmin,
  };

  // Permissões para Metas
  const metasPermissions: PermissionConfig = {
    canView: true, // Cada um vê suas próprias metas
    canEdit: isAdmin,
    canDelete: isAdmin,
    canTransfer: false,
    canExport: isAdmin || isLider,
    canCreate: isAdmin,
  };

  // Permissões para Comissões
  const comissoesPermissions: PermissionConfig = {
    canView: isAdmin || isLider || isVendedor || isSdr,
    canEdit: isAdmin,
    canDelete: isAdmin,
    canTransfer: false,
    canExport: isAdmin || isLider,
    canCreate: isAdmin,
  };

  // Permissões para Relatórios
  const relatoriosPermissions: PermissionConfig = {
    canView: isAdmin || isLider || isCliente,
    canEdit: false,
    canDelete: false,
    canTransfer: false,
    canExport: isAdmin || isLider,
    canCreate: false,
  };

  // Helpers
  const canViewFinancials = isAdmin || isLider;
  const canViewAllTeams = isAdmin;
  const canManageSystem = isAdmin;
  const canViewOwnDataOnly = isVendedor || isSdr;

  // Função para verificar permissão específica
  const checkPermission = (
    resource: string,
    action: 'view' | 'edit' | 'delete' | 'transfer' | 'export' | 'create'
  ): boolean => {
    const permissionsMap: Record<string, PermissionConfig> = {
      leads: leadsPermissions,
      atendimentos: atendimentosPermissions,
      usuarios: usuariosPermissions,
      clientes: clientesPermissions,
      times: timesPermissions,
      metas: metasPermissions,
      comissoes: comissoesPermissions,
      relatorios: relatoriosPermissions,
    };

    const resourcePermissions = permissionsMap[resource];
    if (!resourcePermissions) return false;

    const actionMap: Record<string, keyof PermissionConfig> = {
      view: 'canView',
      edit: 'canEdit',
      delete: 'canDelete',
      transfer: 'canTransfer',
      export: 'canExport',
      create: 'canCreate',
    };

    return resourcePermissions[actionMap[action]] || false;
  };

  return {
    isAdmin,
    isLider,
    isVendedor,
    isSdr,
    isCliente,
    role,
    leads: leadsPermissions,
    atendimentos: atendimentosPermissions,
    usuarios: usuariosPermissions,
    clientes: clientesPermissions,
    times: timesPermissions,
    metas: metasPermissions,
    comissoes: comissoesPermissions,
    relatorios: relatoriosPermissions,
    canViewFinancials,
    canViewAllTeams,
    canManageSystem,
    canViewOwnDataOnly,
    checkPermission,
  };
}
