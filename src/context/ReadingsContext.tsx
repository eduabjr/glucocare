import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
// ✅ 1. Importe a INTERFACE 'Reading' junto com as funções
import { 
  Reading, 
  listReadings, 
  addReading as dbAddReading, 
  deleteReading as dbDeleteReading, 
  initDB 
} from '../services/dbService';


// ❌ 2. REMOVA a definição duplicada da interface 'Reading' daqui.
/*
interface Reading {
  id: string;
  glucose_level: number;
  measurement_time: string;
  ...
}
*/


// Define o que o nosso contexto vai fornecer
interface ReadingsContextData {
  readings: Reading[];
  loading: boolean;
  loadReadings: () => Promise<void>;
  addReading: (reading: Omit<Reading, 'id'>) => Promise<void>;
  deleteReading: (id: string) => Promise<void>;
}

const ReadingsContext = createContext<ReadingsContextData>({} as ReadingsContextData);

export const ReadingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ✅ Agora este estado usa a interface importada, que é a correta.
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadReadings = useCallback(async () => {
    try {
      setLoading(true);
      await initDB();
      const data = (await listReadings()) || [];
      // ✅ O 'data' agora é 100% compatível com o tipo do estado 'readings'
      const sortedData = data.sort((a, b) => new Date(b.measurement_time).getTime() - new Date(a.measurement_time).getTime());
      setReadings(sortedData);
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
      // ✅ 'newReading' agora terá todas as propriedades obrigatórias, resolvendo o erro.
      await dbAddReading(newReading);
      await loadReadings();
    } catch (error) {
      console.error("Erro ao adicionar medição no contexto:", error);
      throw error;
    }
  };
  
  // O resto do seu código continua igual...
  const deleteReading = async (id: string) => { /* ... */ };

  return (
    <ReadingsContext.Provider value={{ readings, loading, loadReadings, addReading, deleteReading }}>
      {children}
    </ReadingsContext.Provider>
  );
};

export const useReadings = () => {
  return useContext(ReadingsContext);
};