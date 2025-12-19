import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, Smartphone, Tablet, Globe, Clock, 
  Search, RefreshCw, MapPin, Chrome, Shield,
  CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { useLoginHistory, LoginRecord } from '@/hooks/useLoginHistory';

interface LoginHistoryPanelProps {
  userId?: string;
  isAdmin?: boolean;
}

export const LoginHistoryPanel = ({ userId, isAdmin = false }: LoginHistoryPanelProps) => {
  const { records, loading, refresh } = useLoginHistory(userId, isAdmin);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filteredRecords = records.filter(record => 
    record.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.ip_address?.includes(searchTerm) ||
    record.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getBrowserIcon = (browser: string | null) => {
    // Using Chrome as generic browser icon
    return <Chrome className="w-4 h-4" />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return formatDate(dateStr);
  };

  if (loading) {
    return (
      <Card className="metric-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Histórico de Logins
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 w-48"
                />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum login registrado</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredRecords.map((record) => (
              <LoginRecordCard key={record.id} record={record} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const LoginRecordCard = ({ record, isAdmin }: { record: LoginRecord; isAdmin: boolean }) => {
  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4 text-primary" />;
      case 'tablet': return <Tablet className="w-4 h-4 text-primary" />;
      default: return <Monitor className="w-4 h-4 text-primary" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-3 bg-background/50 rounded-lg border border-border/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getDeviceIcon(record.device_type)}
          <div>
            {isAdmin && (
              <p className="text-sm font-medium">{record.email}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{record.browser || 'Unknown'}</span>
              <span>•</span>
              <span>{record.os || 'Unknown'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {record.login_status === 'success' ? (
            <Badge variant="outline" className="text-success border-success/30 bg-success/10">
              <CheckCircle className="w-3 h-3 mr-1" />
              Sucesso
            </Badge>
          ) : (
            <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
              <XCircle className="w-3 h-3 mr-1" />
              Falha
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {record.ip_address && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>{record.ip_address}</span>
            </div>
          )}
          {(record.city || record.country) && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>
                {[record.city, record.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatDate(record.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default LoginHistoryPanel;
