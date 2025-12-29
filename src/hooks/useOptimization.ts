import { useState, useEffect } from 'react';
import { getOptimizationCategories, executeOptimization, createBackup, restoreBackup, OptimizationCategory, OptimizationFile, OptimizationResult } from '@/services/optimizationService';

export const useOptimization = () => {
  const [categories, setCategories] = useState<OptimizationCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = getOptimizationCategories();
      setCategories(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const readTextFile = async (fileId: string, category: string): Promise<string> => {
    try {
      throw new Error('Função não implementada para desenvolvimento');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao ler arquivo');
    }
  };

  const getFilesByRisk = (risk: 'low' | 'medium' | 'high'): OptimizationFile[] => {
    return categories.flatMap(category => 
      category.files.filter(file => file.risk === risk)
    );
  };

  const getFilesByType = (type: 'reg' | 'bat' | 'txt'): OptimizationFile[] => {
    return categories.flatMap(category => 
      category.files.filter(file => file.type === type)
    );
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    loadCategories,
    executeOptimization,
    readTextFile,
    getFilesByRisk,
    getFilesByType
  };
};
