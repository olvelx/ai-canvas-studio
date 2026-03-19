import { useState, useCallback } from 'react';

export interface HistoryRecord {
  id: string;
  type: 'image' | 'video' | 'chat';
  modelName: string;
  prompt: string;
  resultUrl?: string;
  taskId?: string;
  status: string;
  createdAt: number;
}

const STORAGE_KEY = 'artforge_history';
const MAX_RECORDS = 100;

function loadHistory(): HistoryRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: HistoryRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch {
    // localStorage full or unavailable
  }
}

export function useGenerationHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>(loadHistory);

  const addRecord = useCallback((record: Omit<HistoryRecord, 'id' | 'createdAt'>) => {
    const newRecord: HistoryRecord = {
      ...record,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
      createdAt: Date.now(),
    };
    setHistory(prev => {
      const updated = [newRecord, ...prev].slice(0, MAX_RECORDS);
      saveHistory(updated);
      return updated;
    });
    return newRecord;
  }, []);

  const updateRecord = useCallback((id: string, updates: Partial<HistoryRecord>) => {
    setHistory(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addRecord, updateRecord, deleteRecord, clearHistory };
}
