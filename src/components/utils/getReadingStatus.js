// src/utils/getReadingStatus.js
export function getReadingStatus(value) {
  if (typeof value !== 'number') {
    value = Number(value);
    if (Number.isNaN(value)) return 'Indefinido';
  }

  if (value < 54) return 'Perigosamente Baixo';
  if (value >= 54 && value < 70) return 'Baixo';
  if (value >= 70 && value <= 140) return 'Normal';
  if (value > 140 && value <= 180) return 'Elevado';
  if (value > 180) return 'Perigosamente Alto';
  return 'Indefinido';
}
