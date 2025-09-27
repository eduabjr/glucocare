// src/utils/getReadingStatus.ts

export function getReadingStatus(value: number | string): string {
  // Garantir que o valor seja do tipo number
  if (typeof value !== 'number') {
    value = Number(value);
    if (Number.isNaN(value)) return 'Indefinido'; // Se não for um número válido, retorna "Indefinido"
  }

  // Verificação dos intervalos de valores
  if (value < 54) return 'Perigosamente Baixo';
  if (value >= 54 && value < 70) return 'Baixo';
  if (value >= 70 && value <= 140) return 'Normal';
  if (value > 140 && value <= 180) return 'Elevado';
  if (value > 180) return 'Perigosamente Alto';

  return 'Indefinido'; // Retorna "Indefinido" caso o valor não se enquadre nos intervalos
}
