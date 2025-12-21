import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, Search, Shield, UserCheck, UserX, Trash2, 
  RefreshCw, Mail, Calendar, Clock, Filter, Download,
  Crown, User as UserIcon, MoreVertical, Edit, Eye, Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'founder' | 'user';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface UserManagementProps {
  currentUserId: string;
}

export const UserManagement = ({ currentUserId }: UserManagementProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'founder' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', role: 'user' as 'founder' | 'user' });
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode desativar sua própria conta',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: currentStatus ? 'Usuário desativado' : 'Usuário ativado',
        description: `Status alterado com sucesso`,
      });
      
      loadUsers(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar status',
        variant: 'destructive',
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'founder' | 'user') => {
    if (userId === currentUserId) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode alterar sua própria função',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Função atualizada',
        description: `Usuário agora é ${newRole === 'founder' ? 'Fundador' : 'Usuário'}`,
      });
      
      loadUsers(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar função',
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === currentUserId) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode deletar sua própria conta',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First delete from profiles (this will cascade)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      toast({
        title: 'Usuário removido',
        description: 'Perfil do usuário foi deletado',
      });
      
      loadUsers(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar usuário',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      role: user.role,
    });
    setShowEditDialog(true);
  };

  const saveUserEdit = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name || null,
          role: editForm.role,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Usuário atualizado',
        description: 'Dados salvos com sucesso',
      });
      
      setShowEditDialog(false);
      loadUsers(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar',
        variant: 'destructive',
      });
    }
  };

  const openEmailDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setEmailForm({ subject: '', message: '' });
    setShowEmailDialog(true);
  };

  const sendEmail = async () => {
    if (!selectedUser || !emailForm.subject || !emailForm.message) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    setSendingEmail(true);
    try {
      // Get current user's name for sender
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', currentUserId)
        .single();

      const senderName = currentProfile?.full_name || currentProfile?.email || 'Administrador';

      const { data, error } = await supabase.functions.invoke('send-admin-email', {
        body: {
          to: selectedUser.email,
          toName: selectedUser.full_name,
          subject: emailForm.subject,
          message: emailForm.message,
          senderName,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: 'Email enviado',
        description: `Email enviado para ${selectedUser.email}`,
      });
      
      setShowEmailDialog(false);
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Não foi possível enviar o email',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const exportUsers = () => {
    const csv = [
      ['ID', 'Email', 'Nome', 'Função', 'Status', 'Último Login', 'Criado em'],
      ...filteredUsers.map(u => [
        u.id,
        u.email,
        u.full_name || '-',
        u.role === 'founder' ? 'Fundador' : 'Usuário',
        u.is_active ? 'Ativo' : 'Inativo',
        u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : '-',
        new Date(u.created_at).toLocaleString('pt-BR'),
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Exportado', description: 'Lista de usuários exportada' });
  };

  // Filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? user.is_active : !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const founders = users.filter(u => u.role === 'founder').length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Ativos</p>
                <p className="text-2xl font-bold text-emerald-500">{activeUsers}</p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <UserCheck className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Fundadores</p>
                <p className="text-2xl font-bold text-secondary">{founders}</p>
              </div>
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Crown className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="metric-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
              <SelectTrigger className="w-[150px]">
                <Shield className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Funções</SelectItem>
                <SelectItem value="founder">Fundadores</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => loadUsers(false)} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={exportUsers}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="metric-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Usuários ({filteredUsers.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Gerencie os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 bg-background/50 rounded-lg border transition-all hover:border-primary/20 ${
                    !user.is_active ? 'opacity-60' : ''
                  } ${user.id === currentUserId ? 'border-primary/30 bg-primary/5' : 'border-border/50'}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(user.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {user.full_name || user.email}
                      </p>
                      {user.id === currentUserId && (
                        <Badge variant="outline" className="text-[10px]">Você</Badge>
                      )}
                      {user.role === 'founder' && (
                        <Badge className="bg-secondary/20 text-secondary text-[10px]">
                          <Crown className="w-3 h-3 mr-1" />
                          Fundador
                        </Badge>
                      )}
                      {!user.is_active && (
                        <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.created_at).split(',')[0]}
                      </span>
                      {user.last_login && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Último: {formatDate(user.last_login)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={() => toggleUserStatus(user.id, user.is_active)}
                      disabled={user.id === currentUserId}
                    />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEmailDialog(user)}>
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar Email
                        </DropdownMenuItem>
                        {user.role === 'user' ? (
                          <DropdownMenuItem 
                            onClick={() => updateUserRole(user.id, 'founder')}
                            disabled={user.id === currentUserId}
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Promover a Fundador
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => updateUserRole(user.id, 'user')}
                            disabled={user.id === currentUserId}
                          >
                            <UserIcon className="w-4 h-4 mr-2" />
                            Rebaixar a Usuário
                          </DropdownMenuItem>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive"
                              disabled={user.id === currentUserId}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deletar usuário?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O usuário {user.email} será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select 
                value={editForm.role} 
                onValueChange={(v: 'founder' | 'user') => setEditForm(prev => ({ ...prev, role: v }))}
                disabled={selectedUser?.id === currentUserId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="founder">Fundador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveUserEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Enviar Email
            </DialogTitle>
            <DialogDescription>
              Enviar mensagem para {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Para</Label>
              <Input
                value={selectedUser?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Assunto *</Label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Ex: Atualização importante"
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem *</Label>
              <Textarea
                value={emailForm.message}
                onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Digite sua mensagem aqui..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)} disabled={sendingEmail}>
              Cancelar
            </Button>
            <Button onClick={sendEmail} disabled={sendingEmail || !emailForm.subject || !emailForm.message}>
              {sendingEmail ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
