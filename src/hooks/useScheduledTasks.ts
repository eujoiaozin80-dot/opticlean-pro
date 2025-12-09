import { useState, useEffect } from 'react';

export interface ScheduledTask {
  id: string;
  name: string;
  type: 'cleaning' | 'optimization' | 'analysis';
  schedule: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

const STORAGE_KEY = 'opticlean-scheduled-tasks';

export const useScheduledTasks = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: Omit<ScheduledTask, 'id' | 'nextRun'>) => {
    const newTask: ScheduledTask = {
      ...task,
      id: crypto.randomUUID(),
      nextRun: calculateNextRun(task),
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<ScheduledTask>) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, ...updates, nextRun: calculateNextRun({ ...task, ...updates }) } 
        : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, enabled: !task.enabled } : task
    ));
  };

  return { tasks, addTask, updateTask, deleteTask, toggleTask };
};

function calculateNextRun(task: Partial<ScheduledTask>): string {
  const now = new Date();
  const [hours, minutes] = (task.time || '09:00').split(':').map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    if (task.schedule === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (task.schedule === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (task.schedule === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next.toISOString();
}

export default useScheduledTasks;
