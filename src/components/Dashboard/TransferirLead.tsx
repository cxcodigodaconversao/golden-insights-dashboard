import { useState } from "react";
import { ArrowRightLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClosers, useSdrs } from "@/hooks/useAtendimentos";
import { useAuditLog } from "@/hooks/useAuditLog";
import { usePermissions } from "@/hooks/usePermissions";
import { useQueryClient } from "@tanstack/react-query";

interface TransferirLeadProps {
  leadId: string;
  leadNome: string;
  currentOwnerName?: string;
  currentOwnerType?: 'closer' | 'sdr';
  onTransferComplete?: () => void;
}

export function TransferirLead({
  leadId,
  leadNome,
  currentOwnerName,
  currentOwnerType,
  onTransferComplete,
}: TransferirLeadProps) {
  const { profile, isAdmin } = useAuth();
  const { leads: leadsPermissions } = usePermissions();
  const { data: closers } = useClosers();
  const { data: sdrs } = useSdrs();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [newOwnerType, setNewOwnerType] = useState<'closer' | 'sdr'>('closer');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [reason, setReason] = useState('');

  const activeClosers = closers?.filter(c => c.ativo) || [];
  const activeSdrs = sdrs?.filter(s => s.ativo) || [];

  const handleTransfer = async () => {
    if (!newOwnerId) {
      toast.error('Selecione o novo responsável');
      return;
    }

    setIsTransferring(true);

    try {
      // Get new owner name
      let newOwnerName = '';
      if (newOwnerType === 'closer') {
        newOwnerName = activeClosers.find(c => c.id === newOwnerId)?.nome || '';
      } else {
        newOwnerName = activeSdrs.find(s => s.id === newOwnerId)?.nome || '';
      }

      // Create ownership history record
      await supabase.from('lead_ownership_history').insert({
        lead_id: leadId,
        previous_owner_name: currentOwnerName,
        previous_owner_type: currentOwnerType,
        new_owner_id: newOwnerId,
        new_owner_name: newOwnerName,
        new_owner_type: newOwnerType,
        transferred_by: profile?.id,
        transferred_by_name: profile?.nome || 'Sistema',
        reason: reason || null,
      });

      // Update lead owner
      await supabase
        .from('leads')
        .update({
          owner_id: newOwnerId,
          owner_type: newOwnerType,
          sdr_primeiro: newOwnerType === 'sdr' ? newOwnerName : undefined,
        })
        .eq('id', leadId);

      // Log action
      await logAction({
        action: 'transfer',
        tableName: 'leads',
        recordId: leadId,
        oldData: { owner: currentOwnerName, type: currentOwnerType },
        newData: { owner: newOwnerName, type: newOwnerType, reason },
      });

      toast.success(`Lead "${leadNome}" transferido para ${newOwnerName}`);
      setIsOpen(false);
      setNewOwnerId('');
      setReason('');
      
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
      
      onTransferComplete?.();
    } catch (error) {
      console.error('Erro ao transferir lead:', error);
      toast.error('Erro ao transferir lead');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!leadsPermissions.canTransfer) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Transferir Lead">
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferir Lead
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Lead:</p>
            <p className="font-medium">{leadNome}</p>
            {currentOwnerName && (
              <>
                <p className="text-sm text-muted-foreground mt-2">Responsável atual:</p>
                <p className="font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {currentOwnerName} ({currentOwnerType === 'closer' ? 'Closer' : 'SDR'})
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo do novo responsável</Label>
            <Select value={newOwnerType} onValueChange={(v) => {
              setNewOwnerType(v as 'closer' | 'sdr');
              setNewOwnerId('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="closer">Closer</SelectItem>
                <SelectItem value="sdr">SDR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Novo responsável</Label>
            <Select value={newOwnerId} onValueChange={setNewOwnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {newOwnerType === 'closer' ? (
                  activeClosers.map(closer => (
                    <SelectItem key={closer.id} value={closer.id}>
                      {closer.nome}
                    </SelectItem>
                  ))
                ) : (
                  activeSdrs.map(sdr => (
                    <SelectItem key={sdr.id} value={sdr.id}>
                      {sdr.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Motivo da transferência (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleTransfer} 
              disabled={isTransferring || !newOwnerId}
            >
              {isTransferring ? 'Transferindo...' : 'Transferir'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
