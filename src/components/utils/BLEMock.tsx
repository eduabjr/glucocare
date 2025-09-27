// src/utils/BLEMock.ts
/**
 * Mock simples para BLE quando o módulo nativo não está presente.
 * Uso: import BLEMock e chamar BLEMock.startScan() que resolve com lista simulada.
 */

// Definindo a tipagem dos dispositivos mock
interface Device {
  id: string;
  name: string;
}

const mockDevices: Device[] = [
  { id: 'MOCK-1', name: 'Glicômetro Simulado 1' },
  { id: 'MOCK-2', name: 'Glicômetro Simulado 2' },
];

const BLEMock = {
  // Tipando a função startScan para retornar uma Promise com um array de dispositivos
  startScan: async (timeoutMs: number = 1500): Promise<Device[]> =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDevices);
      }, timeoutMs);
    }),

  stopDeviceScan: () => {
    /* noop */
  },

  destroy: () => {
    /* noop */
  },
};

export default BLEMock;
