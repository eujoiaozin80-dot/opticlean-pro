import { useOutletContext } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import { OutletContext } from '@/types/outlet-context';

const Settings = () => {
  const { userId } = useOutletContext<OutletContext>();
  
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Configurações
        </h1>
        <p className="text-muted-foreground text-sm">
          Gerencie suas informações pessoais
        </p>
      </div>

      <UserProfile userId={userId} />
    </div>
  );
};

export default Settings;
