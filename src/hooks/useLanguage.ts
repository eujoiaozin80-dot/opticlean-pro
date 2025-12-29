import { useState, useEffect } from 'react';

type Language = 'pt-BR' | 'en-US' | 'es-ES';

interface Translation {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translation = {
  // Dashboard
  'dashboard.title': {
    'pt-BR': 'Dashboard',
    'en-US': 'Dashboard',
    'es-ES': 'Panel'
  },
  'dashboard.subtitle': {
    'pt-BR': 'Monitore e otimize o sistema',
    'en-US': 'Monitor and optimize the system',
    'es-ES': 'Monitorea y optimiza el sistema'
  },
  
  // Settings
  'settings.title': {
    'pt-BR': 'Configurações',
    'en-US': 'Settings',
    'es-ES': 'Configuración'
  },
  'settings.subtitle': {
    'pt-BR': 'Personalize sua experiência com o Byte Latency',
    'en-US': 'Customize your experience with Byte Latency',
    'es-ES': 'Personaliza tu experiencia con Byte Latency'
  },
  
  // Profile
  'profile.title': {
    'pt-BR': 'Perfil',
    'en-US': 'Profile',
    'es-ES': 'Perfil'
  },
  'profile.photo': {
    'pt-BR': 'Foto de Perfil',
    'en-US': 'Profile Photo',
    'es-ES': 'Foto de Perfil'
  },
  'profile.photoDesc': {
    'pt-BR': 'Adicione uma foto personalizada ao seu perfil',
    'en-US': 'Add a personalized photo to your profile',
    'es-ES': 'Añade una foto personalizada a tu perfil'
  },
  'profile.personalInfo': {
    'pt-BR': 'Informações Pessoais',
    'en-US': 'Personal Information',
    'es-ES': 'Información Personal'
  },
  'profile.name': {
    'pt-BR': 'Nome',
    'en-US': 'Name',
    'es-ES': 'Nombre'
  },
  'profile.email': {
    'pt-BR': 'E-mail',
    'en-US': 'Email',
    'es-ES': 'Correo'
  },
  
  // Appearance
  'appearance.title': {
    'pt-BR': 'Aparência',
    'en-US': 'Appearance',
    'es-ES': 'Apariencia'
  },
  'appearance.theme': {
    'pt-BR': 'Tema',
    'en-US': 'Theme',
    'es-ES': 'Tema'
  },
  'appearance.themeDesc': {
    'pt-BR': 'Escolha o tema visual que prefere',
    'en-US': 'Choose your preferred visual theme',
    'es-ES': 'Elige tu tema visual preferido'
  },
  'appearance.light': {
    'pt-BR': 'Claro',
    'en-US': 'Light',
    'es-ES': 'Claro'
  },
  'appearance.dark': {
    'pt-BR': 'Escuro',
    'en-US': 'Dark',
    'es-ES': 'Oscuro'
  },
  'appearance.system': {
    'pt-BR': 'Sistema',
    'en-US': 'System',
    'es-ES': 'Sistema'
  },
  
  // Notifications
  'notifications.title': {
    'pt-BR': 'Notificações',
    'en-US': 'Notifications',
    'es-ES': 'Notificaciones'
  },
  'notifications.system': {
    'pt-BR': 'Notificações do Sistema',
    'en-US': 'System Notifications',
    'es-ES': 'Notificaciones del Sistema'
  },
  'notifications.systemDesc': {
    'pt-BR': 'Configure como e quando receber alertas',
    'en-US': 'Configure how and when to receive alerts',
    'es-ES': 'Configura cómo y cuándo recibir alertas'
  },
  
  // System
  'system.title': {
    'pt-BR': 'Sistema',
    'en-US': 'System',
    'es-ES': 'Sistema'
  },
  'system.automation': {
    'pt-BR': 'Automação',
    'en-US': 'Automation',
    'es-ES': 'Automatización'
  },
  'system.automationDesc': {
    'pt-BR': 'Configure tarefas automáticas do sistema',
    'en-US': 'Configure automatic system tasks',
    'es-ES': 'Configura tareas automáticas del sistema'
  },
  
  // Common
  'common.save': {
    'pt-BR': 'Salvar',
    'en-US': 'Save',
    'es-ES': 'Guardar'
  },
  'common.cancel': {
    'pt-BR': 'Cancelar',
    'en-US': 'Cancel',
    'es-ES': 'Cancelar'
  },
  'common.restore': {
    'pt-BR': 'Restaurar Padrão',
    'en-US': 'Restore Default',
    'es-ES': 'Restaurar Predeterminado'
  }
};

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.language || 'pt-BR';
      }
      return 'pt-BR';
    }
    return 'pt-BR';
  });

  useEffect(() => {
    // Salvar no localStorage através das configurações do app
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appSettings');
      const settings = saved ? JSON.parse(saved) : {};
      settings.language = language;
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // Atualizar o atributo lang do HTML
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return { language, setLanguage, t };
};
