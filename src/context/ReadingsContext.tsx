import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Reading, 
  listReadings, 
  addReading as dbAddReading, 
  deleteReading as dbDeleteReading, 
  initDB 
} from '../services/dbService';
import { syncOfflineData } from '../services/syncService';


interface ReadingsContextData {
  readings: Reading[];
  loading: boolean;
  loadReadings: () => Promise<void>;
  addReading: (reading: Omit<Reading, 'id'>) => Promise<void>;
  deleteReading: (id: string) => Promise<void>;
}

const ReadingsContext = createContext<ReadingsContextData>({} as ReadingsContextData);

export const ReadingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadReadings = useCallback(async () => {
    try {
      setLoading(true);
      await initDB();
      const data = (await listReadings()) || [];
      const sortedData = data.sort((a, b) => new Date(b.measurement_time).getTime() - new Date(a.measurement_time).getTime());
      setReadings(sortedData);
      await syncOfflineData();
    } catch (error) {
      console.error("Erro ao carregar medições no contexto:", error);
      setReadings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addReading = async (readingData: Omit<Reading, 'id'>) => {
    try {
      const newReading: Reading = {
        id: uuidv4(),
        ...readingData,
      };
      await dbAddReading(newReading);
      await loadReadings();
      await syncOfflineData();
    } catch (error) {
      console.error("Erro ao adicionar medição no contexto:", error);
      throw error;
    }
  };
  
  const deleteReading = async (id: string) => {
    try {
      await dbDeleteReading(id);
      await loadReadings();
      await syncOfflineData();
    } catch (error) {
      console.error("Erro ao deletar medição no contexto:", error);
      throw error;
    }
  };

  return (
    <ReadingsContext.Provider value={{ readings, loading, loadReadings, addReading, deleteReading }}>
      {children}
    </ReadingsContext.Provider>
  );
};

export const useReadings = () => {
  return useContext(ReadingsContext);
};
