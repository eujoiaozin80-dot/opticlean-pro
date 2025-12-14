import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users as UsersIcon, Shield, UserCheck, UserX, Calendar, Activity, TrendingUp, Search, Edit, ArrowUpDown, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OutletContext } from '@/types/outlet-context';
import { logAdminAction } from '@/utils/adminLogs';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface UsersProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Users = ({ className, ...props }: UsersProps) => {
  const { userId, userRole } = useOutletContext<OutletContext>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalOperations: 0, codesUsed: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'founder' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at' | 'last_login'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'founder' | 'user'>('user');
  const itemsPerPage = 20;
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Total operations
      const { count: opCount } = await supabase
        .from('operation_history')
        .select('*', { count: 'exact', head: true });

      // Used activation codes
      const { count: codesCount } = await supabase
        .from('activation_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_used', true);

      setStats({
        totalOperations: opCount || 0,
        codesUsed: codesCount || 0
      });
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
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
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtros e ordenação
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    // Busca
    if (searchTerm) {
      filtered = filtered.filter(
        user =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filtro de status
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => !user.is_active);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'name':
          aVal = a.full_name || a.email;
          bVal = b.full_name || b.email;
          break;
        case 'email':
          aVal = a.email;
          bVal = b.email;
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'last_login':
          aVal = a.last_login ? new Date(a.last_login).getTime() : 0;
          bVal = b.last_login ? new Date(b.last_login).getTime() : 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedUsers.slice(start, end);
  }, [filteredAndSortedUsers, currentPage]);

  const toggleUserStatus = async (targetUserId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', targetUserId);

      if (error) throw error;

      // Log ação administrativa
      await logAdminAction(userId, 'toggle_user_status', 'user', targetUserId, {
        newStatus: !currentStatus,
      });

      toast({
        title: 'Atualizado',
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'}`
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive'
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditName(user.full_name || '');
    setEditRole(user.role as 'founder' | 'user');
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;

    try {
      // Verificar se é o último founder
      if (editRole !== 'founder' && editingUser.role === 'founder') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'founder');

        if (count === 1) {
          toast({
            title: 'Erro',
            description: 'Não é possível remover o último founder',
            variant: 'destructive',
          });
          return;
        }
      }

      const updates: any = {
        full_name: editName || null,
      };

      // Só permitir mudança de role se for founder
      if (userRole === 'founder' && editRole !== editingUser.role) {
        updates.role = editRole;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', editingUser.id);

      if (error) throw error;

      // Log ação administrativa
      if (updates.role) {
        await logAdminAction(userId, 'change_user_role', 'user', editingUser.id, {
          oldRole: editingUser.role,
          newRole: editRole,
        });
      }

      toast({
        title: 'Atualizado',
        description: 'Perfil do usuário atualizado com sucesso',
      });

      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o usuário',
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (targetUserId: string, targetUserEmail: string, targetUserRole: string) => {
    try {
      // Verificar se é o último founder
      if (targetUserRole === 'founder') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'founder');

        if (count === 1) {
          toast({
            title: 'Erro',
            description: 'Não é possível deletar o último founder',
            variant: 'destructive',
          });
          return;
        }
      }

      // Deletar perfil (cascade deletará o usuário do auth.users)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', targetUserId);

      if (profileError) throw profileError;

      // Tentar deletar do auth.users também (requer admin API)
      // Nota: Isso pode não funcionar sem admin API, mas o cascade deve funcionar
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(targetUserId);
        if (authError) {
          console.warn('Erro ao deletar do auth (pode precisar de admin API):', authError);
        }
      } catch (e) {
        console.warn('Não foi possível deletar do auth diretamente:', e);
      }

      // Log ação administrativa
      await logAdminAction(userId, 'modify_user', 'user', targetUserId, {
        action: 'delete',
        email: targetUserEmail,
      });

      toast({
        title: 'Usuário deletado',
        description: `A conta de ${targetUserEmail} foi removida permanentemente`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível deletar o usuário',
        variant: 'destructive',
      });
    }
  };

  const activeUsers = users.filter(u => u.is_active).length;

  return (
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Usuários</h1>
          <p className="text-muted-foreground text-sm">Gerencie todos os usuários do sistema</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
          <Shield className="w-3 h-3" />
          <span className="font-medium">Admin</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Usuários</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <UsersIcon className="w-5 h-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Ativos</p>
              <p className="text-2xl font-bold text-emerald-500">{activeUsers}</p>
            </div>
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Códigos Usados</p>
              <p className="text-2xl font-bold text-secondary">{stats.codesUsed}</p>
            </div>
            <Activity className="w-5 h-5 text-secondary" />
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Operações</p>
              <p className="text-2xl font-bold text-accent">{stats.totalOperations}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-accent" />
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="metric-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v: any) => {
              setRoleFilter(v);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os roles</SelectItem>
                <SelectItem value="founder">Founder</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: any) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v: string) => {
              const [field, order] = v.split('-');
              setSortBy(field as any);
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Mais recentes</SelectItem>
                <SelectItem value="created_at-asc">Mais antigos</SelectItem>
                <SelectItem value="name-asc">Nome A-Z</SelectItem>
                <SelectItem value="name-desc">Nome Z-A</SelectItem>
                <SelectItem value="email-asc">Email A-Z</SelectItem>
                <SelectItem value="last_login-desc">Último login</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="metric-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Usuários Cadastrados ({filteredAndSortedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum usuário</p>
            </div>
          ) : filteredAndSortedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-primary/20 transition-all animate-fade-up"
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.full_name || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.last_login && (
                          <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            Último login: {new Date(user.last_login).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={user.role === 'founder' ? 'default' : 'secondary'} className="text-xs">
                        {user.role === 'founder' ? 'Founder' : 'User'}
                      </Badge>
                      {userRole === 'founder' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Usuário</DialogTitle>
                              <DialogDescription>
                                Modifique as informações do usuário
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Nome do usuário"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                  value={editingUser?.email || ''}
                                  disabled
                                  className="bg-muted"
                                />
                              </div>
                              {editingUser && (
                                <div className="space-y-2">
                                  <Label>Role</Label>
                                  <Select
                                    value={editRole}
                                    onValueChange={(v: 'founder' | 'user') => setEditRole(v)}
                                    disabled={editingUser.role === 'founder' && users.filter(u => u.role === 'founder').length === 1}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="founder">Founder</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {editingUser.role === 'founder' && users.filter(u => u.role === 'founder').length === 1 && (
                                    <p className="text-xs text-muted-foreground">
                                      Não é possível alterar o role do último founder
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <DialogFooter className="flex items-center justify-between">
                              <div>
                                {editingUser && editingUser.role !== 'founder' && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="text-xs"
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Deletar Conta
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Deletar conta do usuário?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita. A conta de <strong>{editingUser.email}</strong> será removida permanentemente.
                                          <span className="block mt-2 text-destructive font-medium">
                                            ⚠️ Todos os dados do usuário serão perdidos.
                                          </span>
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => {
                                            deleteUser(editingUser.id, editingUser.email, editingUser.role);
                                            setEditingUser(null);
                                          }}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Deletar Permanentemente
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setEditingUser(null)}>
                                  Cancelar
                                </Button>
                                <Button onClick={saveUserEdit}>
                                  Salvar
                                </Button>
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        size="sm"
                        variant={user.is_active ? 'ghost' : 'default'}
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        disabled={user.role === 'founder'}
                        className={user.is_active ? 'text-destructive hover:bg-destructive/10' : 'btn-primary'}
                      >
                        {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} ({filteredAndSortedUsers.length} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
