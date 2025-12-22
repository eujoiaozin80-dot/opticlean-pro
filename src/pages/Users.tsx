import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users as UsersIcon, Shield, UserCheck, UserX, Calendar, Activity, TrendingUp, 
  Search, Edit, ArrowUpDown, Trash2, Download, FileText, CheckSquare, Square,
  CalendarDays, BarChart3, RefreshCw, GitCompare, Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OutletContext } from '@/types/outlet-context';
import { logAdminAction } from '@/utils/adminLogs';
import { Badge } from '@/components/ui/badge';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { UserComparison } from '@/components/UserComparison';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'founder' | 'user';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  operations_count?: number;
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
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at' | 'last_login' | 'operations'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'founder' | 'user'>('user');
  
  // Novos estados para melhorias
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  const [dateFilterType, setDateFilterType] = useState<'created' | 'login'>('created');
  const [refreshing, setRefreshing] = useState(false);
  
  const itemsPerPage = 20;
  const { toast } = useToast();

  const loadStats = async () => {
    try {
      const { count: opCount } = await supabase
        .from('operation_history')
        .select('*', { count: 'exact', head: true });

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
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar contagem de operações por usuário
      const usersWithOperations = await Promise.all(
        (profilesData || []).map(async (user) => {
          const { count } = await supabase
            .from('operation_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          return {
            ...user,
            operations_count: count || 0
          };
        })
      );

      setUsers(usersWithOperations);
    } catch (error) {
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

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    await loadStats();
    setRefreshing(false);
    toast({ title: 'Atualizado', description: 'Lista de usuários atualizada' });
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

    // Filtro de data
    if (dateFilterStart || dateFilterEnd) {
      filtered = filtered.filter(user => {
        const dateField = dateFilterType === 'created' ? user.created_at : user.last_login;
        if (!dateField) return false;
        
        const date = new Date(dateField);
        const start = dateFilterStart ? new Date(dateFilterStart) : null;
        const end = dateFilterEnd ? new Date(dateFilterEnd + 'T23:59:59') : null;
        
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aVal: string | undefined, bVal: string | undefined;

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
        case 'operations':
          aVal = a.operations_count || 0;
          bVal = b.operations_count || 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder, dateFilterStart, dateFilterEnd, dateFilterType]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedUsers.slice(start, end);
  }, [filteredAndSortedUsers, currentPage]);

  // Seleção em massa
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  // Ações em massa
  const bulkToggleStatus = async (newStatus: boolean) => {
    if (selectedUsers.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .in('id', Array.from(selectedUsers));

      if (error) throw error;

      await logAdminAction(userId, 'bulk_toggle_status', 'users', 'bulk', {
        count: selectedUsers.size,
        newStatus
      });

      toast({
        title: 'Atualizado',
        description: `${selectedUsers.size} usuário(s) ${newStatus ? 'ativado(s)' : 'desativado(s)'}`
      });

      setSelectedUsers(new Set());
      loadUsers();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os usuários',
        variant: 'destructive'
      });
    }
  };

  // Exportar CSV
  const exportToCSV = () => {
    try {
      const csv = [
        ['Nome', 'Email', 'Role', 'Status', 'Operações', 'Último Login', 'Cadastro'],
        ...filteredAndSortedUsers.map(u => [
          u.full_name || 'Sem nome',
          u.email,
          u.role,
          u.is_active ? 'Ativo' : 'Inativo',
          String(u.operations_count || 0),
          u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : '-',
          new Date(u.created_at).toLocaleString('pt-BR')
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

      toast({ title: 'Exportado', description: 'Lista exportada para CSV' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao exportar', variant: 'destructive' });
    }
  };

  // Exportar PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Relatório de Usuários', 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
      doc.text(`Total: ${filteredAndSortedUsers.length} usuários`, 14, 36);

      autoTable(doc, {
        startY: 42,
        head: [['Nome', 'Email', 'Role', 'Status', 'Ops', 'Último Login']],
        body: filteredAndSortedUsers.map(u => [
          u.full_name || 'Sem nome',
          u.email,
          u.role,
          u.is_active ? 'Ativo' : 'Inativo',
          String(u.operations_count || 0),
          u.last_login ? new Date(u.last_login).toLocaleDateString('pt-BR') : '-'
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      doc.save(`usuarios_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: 'Exportado', description: 'Relatório PDF gerado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao gerar PDF', variant: 'destructive' });
    }
  };

  const toggleUserStatus = async (targetUserId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', targetUserId);

      if (error) throw error;

      await logAdminAction(userId, 'toggle_user_status', 'user', targetUserId, {
        newStatus: !currentStatus,
      });

      toast({
        title: 'Atualizado',
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'}`
      });

      loadUsers();
    } catch (error) {
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
    setEditRole(user.role);
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;

    try {
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

      const updates: { full_name: string | null; role?: 'founder' | 'user' } = {
        full_name: editName || null,
      };

      if (userRole === 'founder' && editRole !== editingUser.role) {
        updates.role = editRole;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', editingUser.id);

      if (error) throw error;

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Não foi possível atualizar o usuário';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (targetUserId: string, targetUserEmail: string, targetUserRole: string) => {
    try {
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

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { targetUserId, targetUserEmail },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao deletar usuário');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao deletar usuário');
      }

      await logAdminAction(userId, 'modify_user', 'user', targetUserId, {
        action: 'delete',
        email: targetUserEmail,
      });

      toast({
        title: 'Usuário deletado',
        description: `A conta de ${targetUserEmail} foi removida permanentemente`,
      });

      loadUsers();
    } catch (error: unknown) {
      console.error('Erro ao deletar usuário:', error);
      const message = error instanceof Error ? error.message : 'Não foi possível deletar o usuário';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const activeUsers = users.filter(u => u.is_active).length;
  const totalOperationsByUsers = users.reduce((sum, u) => sum + (u.operations_count || 0), 0);

  return (
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Usuários</h1>
          <p className="text-muted-foreground text-sm">Gerencie todos os usuários do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <div className="flex items-center gap-2 text-sm text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
            <Shield className="w-3 h-3" />
            <span className="font-medium">Admin</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="glass-strong border border-border/50">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            Comparação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
        <Card className="metric-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Média Ops/User</p>
              <p className="text-2xl font-bold text-blue-500">
                {users.length > 0 ? (totalOperationsByUsers / users.length).toFixed(1) : 0}
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="metric-card">
        <CardContent className="p-4 space-y-4">
          {/* Linha 1: Busca e filtros básicos */}
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
            <Select value={roleFilter} onValueChange={(v: 'all' | 'founder' | 'user') => {
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
            <Select value={statusFilter} onValueChange={(v: 'all' | 'active' | 'inactive') => {
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
          </div>

          {/* Linha 2: Filtro de data */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <Select value={dateFilterType} onValueChange={(v: 'created' | 'login') => setDateFilterType(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Data Cadastro</SelectItem>
                  <SelectItem value="login">Último Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">De:</Label>
              <Input
                type="date"
                value={dateFilterStart}
                onChange={(e) => setDateFilterStart(e.target.value)}
                className="w-[150px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Até:</Label>
              <Input
                type="date"
                value={dateFilterEnd}
                onChange={(e) => setDateFilterEnd(e.target.value)}
                className="w-[150px]"
              />
            </div>
            {(dateFilterStart || dateFilterEnd) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFilterStart(''); setDateFilterEnd(''); }}>
                Limpar datas
              </Button>
            )}
          </div>

          {/* Linha 3: Ordenação e exportação */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v: string) => {
              const [field, order] = v.split('-');
              setSortBy(field as 'name' | 'email' | 'created_at' | 'last_login' | 'operations');
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="w-[200px]">
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
                <SelectItem value="operations-desc">Mais operações</SelectItem>
                <SelectItem value="operations-asc">Menos operações</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <Card className="metric-card border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedUsers.size} usuário(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => bulkToggleStatus(true)}>
                <UserCheck className="w-4 h-4 mr-2" />
                Ativar todos
              </Button>
              <Button variant="outline" size="sm" onClick={() => bulkToggleStatus(false)}>
                <UserX className="w-4 h-4 mr-2" />
                Desativar todos
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUsers(new Set())}>
                Limpar seleção
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card className="metric-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Usuários Cadastrados ({filteredAndSortedUsers.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedUsers.size === paginatedUsers.length ? (
                <CheckSquare className="w-4 h-4 mr-2" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              {selectedUsers.size === paginatedUsers.length ? 'Desmarcar todos' : 'Selecionar todos'}
            </Button>
          </div>
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
                    className={`flex items-center justify-between p-3 bg-background/50 rounded-lg border transition-all animate-fade-up ${
                      selectedUsers.has(user.id) ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/20'
                    }`}
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => handleSelectUser(user.id)}
                      />
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
                    <div className="flex items-center gap-4">
                      {/* Métricas de engajamento */}
                      <div className="text-center px-3">
                        <p className="text-lg font-bold text-primary">{user.operations_count || 0}</p>
                        <p className="text-[10px] text-muted-foreground">operações</p>
                      </div>
                      
                      <Badge
                        variant={user.role === 'founder' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {user.role}
                      </Badge>
                      <Badge
                        variant={user.is_active ? 'outline' : 'destructive'}
                        className={`text-[10px] ${user.is_active ? 'text-emerald-500 border-emerald-500/50' : ''}`}
                      >
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? (
                            <UserX className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                          )}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Usuário</DialogTitle>
                              <DialogDescription>
                                Altere os dados do usuário {editingUser?.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Nome completo</Label>
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Nome do usuário"
                                />
                              </div>
                              {userRole === 'founder' && (
                                <div className="space-y-2">
                                  <Label>Role</Label>
                                  <Select
                                    value={editRole}
                                    onValueChange={(v: 'founder' | 'user') => setEditRole(v)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="founder">Founder</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button onClick={saveUserEdit}>Salvar</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        {user.id !== userId && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deletar usuário?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação é irreversível. Todos os dados de {user.email} serão
                                  removidos permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUser(user.id, user.email, user.role)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Deletar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} de{' '}
                    {filteredAndSortedUsers.length}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      {'<<'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {'<'}
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      {'>'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      {'>>'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

        </TabsContent>

        {/* Tab: Timeline */}
        <TabsContent value="timeline">
          <ActivityTimeline />
        </TabsContent>

        {/* Tab: Comparison */}
        <TabsContent value="comparison">
          <UserComparison users={users} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Users;
