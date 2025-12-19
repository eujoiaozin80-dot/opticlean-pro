import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Gauge, Plus, Trash2, Play, Save, Zap, Battery, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PerformanceProfile {
  id: string;
  name: string;
  description: string;
  icon: 'zap' | 'battery' | 'leaf';
  settings: {
    cpuPriority: 'high' | 'normal' | 'low';
    memoryLimit: number; // percentage
    autoClean: boolean;
    cleanInterval: number; // hours
    reducedAnimations: boolean;
    backgroundOptimization: boolean;
  };
}

const DEFAULT_PROFILES: PerformanceProfile[] = [
  {
    id: 'performance',
    name: 'Alto Desempenho',
    description: 'Máxima performance, maior consumo',
    icon: 'zap',
    settings: {
      cpuPriority: 'high',
      memoryLimit: 90,
      autoClean: true,
      cleanInterval: 1,
      reducedAnimations: false,
      backgroundOptimization: false,
    },
  },
  {
    id: 'balanced',
    name: 'Equilibrado',
    description: 'Balanço entre performance e economia',
    icon: 'battery',
    settings: {
      cpuPriority: 'normal',
      memoryLimit: 75,
      autoClean: true,
      cleanInterval: 6,
      reducedAnimations: false,
      backgroundOptimization: true,
    },
  },
  {
    id: 'economy',
    name: 'Economia',
    description: 'Mínimo consumo de recursos',
    icon: 'leaf',
    settings: {
      cpuPriority: 'low',
      memoryLimit: 50,
      autoClean: true,
      cleanInterval: 24,
      reducedAnimations: true,
      backgroundOptimization: true,
    },
  },
];

export const PerformanceProfiles = () => {
  const [profiles, setProfiles] = useState<PerformanceProfile[]>(DEFAULT_PROFILES);
  const [activeProfile, setActiveProfile] = useState<string>('balanced');
  const [isCreating, setIsCreating] = useState(false);
  const [newProfile, setNewProfile] = useState<PerformanceProfile>({
    id: '',
    name: '',
    description: '',
    icon: 'battery',
    settings: {
      cpuPriority: 'normal',
      memoryLimit: 75,
      autoClean: true,
      cleanInterval: 6,
      reducedAnimations: false,
      backgroundOptimization: true,
    },
  });
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('performance_profiles');
    const active = localStorage.getItem('active_profile');
    if (saved) setProfiles(JSON.parse(saved));
    if (active) setActiveProfile(active);
  }, []);

  const saveProfiles = (updated: PerformanceProfile[]) => {
    setProfiles(updated);
    localStorage.setItem('performance_profiles', JSON.stringify(updated));
  };

  const applyProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    setActiveProfile(profileId);
    localStorage.setItem('active_profile', profileId);
    
    // Apply settings
    localStorage.setItem('app_settings', JSON.stringify({
      ...JSON.parse(localStorage.getItem('app_settings') || '{}'),
      reducedMotion: profile.settings.reducedAnimations,
      autoClean: profile.settings.autoClean,
      autoCleanInterval: profile.settings.cleanInterval,
    }));

    toast({ 
      title: 'Perfil Aplicado', 
      description: `${profile.name} está ativo` 
    });
  };

  const createProfile = () => {
    if (!newProfile.name) {
      toast({ title: 'Erro', description: 'Digite um nome para o perfil', variant: 'destructive' });
      return;
    }

    const profile: PerformanceProfile = {
      ...newProfile,
      id: Date.now().toString(),
    };

    saveProfiles([...profiles, profile]);
    setNewProfile({
      id: '',
      name: '',
      description: '',
      icon: 'battery',
      settings: {
        cpuPriority: 'normal',
        memoryLimit: 75,
        autoClean: true,
        cleanInterval: 6,
        reducedAnimations: false,
        backgroundOptimization: true,
      },
    });
    setIsCreating(false);
    toast({ title: 'Perfil Criado' });
  };

  const deleteProfile = (id: string) => {
    if (DEFAULT_PROFILES.some(p => p.id === id)) {
      toast({ title: 'Erro', description: 'Não é possível deletar perfis padrão', variant: 'destructive' });
      return;
    }
    saveProfiles(profiles.filter(p => p.id !== id));
    if (activeProfile === id) {
      setActiveProfile('balanced');
      localStorage.setItem('active_profile', 'balanced');
    }
    toast({ title: 'Perfil Removido' });
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'zap': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'leaf': return <Leaf className="w-4 h-4 text-emerald-500" />;
      default: return <Battery className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-medium">Perfis de Performance</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsCreating(!isCreating)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isCreating && (
          <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                  placeholder="Meu Perfil"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={newProfile.description}
                  onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                  placeholder="Descrição curta"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Limite de Memória: {newProfile.settings.memoryLimit}%</Label>
              <Slider
                value={[newProfile.settings.memoryLimit]}
                onValueChange={([value]) => setNewProfile({
                  ...newProfile,
                  settings: { ...newProfile.settings, memoryLimit: value }
                })}
                min={30}
                max={95}
                step={5}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Auto Limpeza</Label>
              <Switch
                checked={newProfile.settings.autoClean}
                onCheckedChange={(value) => setNewProfile({
                  ...newProfile,
                  settings: { ...newProfile.settings, autoClean: value }
                })}
              />
            </div>
            <Button size="sm" onClick={createProfile} className="w-full">
              <Save className="w-4 h-4 mr-1" />
              Criar Perfil
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
                activeProfile === profile.id 
                  ? 'bg-primary/10 border border-primary/30' 
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {getIcon(profile.icon)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{profile.name}</span>
                    {activeProfile === profile.id && (
                      <Badge variant="default" className="text-[10px]">Ativo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {activeProfile !== profile.id && (
                  <Button variant="ghost" size="sm" onClick={() => applyProfile(profile.id)} className="h-7">
                    <Play className="w-3 h-3 mr-1" />
                    Aplicar
                  </Button>
                )}
                {!DEFAULT_PROFILES.some(p => p.id === profile.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteProfile(profile.id)}
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
