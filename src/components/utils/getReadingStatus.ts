// src/utils/getReadingStatus.ts

export function getReadingStatus(value: number | string): string {
    let numericValue: number;

    if (typeof value !== 'number') {
        numericValue = Number(value);
        if (Number.isNaN(numericValue)) return 'Indefinido';
    } else {
        numericValue = value;
    }

    // Intervalos de valores (mg/dL)
    if (numericValue < 54) return 'Perigosamente Baixo';
    if (numericValue >= 54 && numericValue < 70) return 'Baixo';
    if (numericValue >= 70 && numericValue <= 140) return 'Normal';
    if (numericValue > 140 && numericValue <= 180) return 'Elevado';
    if (numericValue > 180) return 'Perigosamente Alto';

    return 'Indefinido';
}