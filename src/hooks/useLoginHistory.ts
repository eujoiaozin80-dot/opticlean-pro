import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LoginRecord {
  id: string;
  user_id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  login_status: string;
  created_at: string;
}

// Parse user agent to extract device info
const parseUserAgent = (userAgent: string) => {
  const ua = userAgent.toLowerCase();
  
  // Device type
  let deviceType = 'Desktop';
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    deviceType = /tablet|ipad/i.test(ua) ? 'Tablet' : 'Mobile';
  }
  
  // Browser
  let browser = 'Unknown';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera';
  
  // OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os') || ua.includes('macos')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { deviceType, browser, os };
};

// Get IP address from external service
const getIPAddress = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
};

// Get location from IP
const getLocationFromIP = async (ip: string): Promise<{ country: string | null; city: string | null }> => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return {
      country: data.country_name || null,
      city: data.city || null,
    };
  } catch {
    return { country: null, city: null };
  }
};

export const useLoginHistory = (userId?: string, isAdmin = false) => {
  const [records, setRecords] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    if (!userId && !isAdmin) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('login_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords((data as LoginRecord[]) || []);
    } catch (error) {
      console.error('Erro ao carregar histórico de login:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin]);

  const logLogin = useCallback(async (
    userIdToLog: string,
    email: string,
    status: 'success' | 'failed' = 'success'
  ) => {
    try {
      const userAgent = navigator.userAgent;
      const { deviceType, browser, os } = parseUserAgent(userAgent);
      
      // Get IP and location
      const ip = await getIPAddress();
      let country = null;
      let city = null;
      
      if (ip) {
        const location = await getLocationFromIP(ip);
        country = location.country;
        city = location.city;
      }

      const { error } = await supabase
        .from('login_history')
        .insert({
          user_id: userIdToLog,
          email,
          ip_address: ip,
          user_agent: userAgent,
          device_type: deviceType,
          browser,
          os,
          country,
          city,
          login_status: status,
        });

      if (error) {
        console.error('Erro ao registrar login:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar login:', error);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return { records, loading, logLogin, refresh: loadRecords };
};
