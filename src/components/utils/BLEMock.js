// src/utils/BLEMock.js
/**
 * Mock simples para BLE quando o módulo nativo não está presente.
 * Uso: import BLEMock e chamar BLEMock.startScan() que resolve com lista simulada.
 */

const mockDevices = [
  { id: 'MOCK-1', name: 'Glicômetro Simulado 1' },
  { id: 'MOCK-2', name: 'Glicômetro Simulado 2' },
];

export default {
  startScan: async (timeoutMs = 1500) =>
    new Promise(resolve => {
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
