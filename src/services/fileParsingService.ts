import * as FileSystem from 'expo-file-system';
// Importa a interface Reading do dbService para usar a mesma estrutura
import { Reading } from './dbService';
import Papa from 'papaparse';
import { fileAnalysisService, FileAnalysisResult } from './fileAnalysisService'; 

/**
 * Interface que representa um resultado de arquivo importado pelo DocumentPicker.
 */
interface DocumentPickerSuccessResult {
    assets: Array<{
        uri: string;
        name: string;
    }>;
}

// -------------------------------------------------------------
// FUNÇÃO CENTRAL DE PARSING
// -------------------------------------------------------------

/**
 * Lê o arquivo de cache local e tenta parsear o conteúdo usando IA para extrair leituras de glicose.
 * A IA faz gestão automática decidindo quando usar análise inteligente ou parsing tradicional.
 * @param result O resultado de sucesso do DocumentPicker.
 * @param userId O UID do usuário logado para atribuir a leitura.
 * @returns Um array de objetos Reading prontos para serem salvos.
 */
export async function parseFileForReadings(
    result: DocumentPickerSuccessResult, 
    userId: string
): Promise<Reading[]> {
    
    // CORREÇÃO: Extrai o asset de forma segura.
    const asset = result.assets?.[0];
    
    // CORREÇÃO: Verificação robusta para asset e fileUri
    const fileUri = asset?.uri;
    if (!asset || !fileUri) {
        throw new Error("Dados do arquivo ou URI não encontrados.");
    }

    try {
        // 1. Lê o conteúdo do arquivo (Expo File System)
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        const fileName = asset.name;

        let readings: Reading[] = [];

        // IA faz gestão automática: sempre tenta IA primeiro, com fallback inteligente
        console.log('🤖 Iniciando análise automática do arquivo:', fileName);
        
        try {
            // Primeiro, tenta análise com IA
            const aiResult: FileAnalysisResult = await fileAnalysisService.analyzeFileContent(
                fileContent, 
                fileName, 
                userId
            );
            
            if (aiResult.success && aiResult.readings.length > 0 && aiResult.confidence >= 70) {
                readings = aiResult.readings;
                console.log(`✅ IA extraiu ${readings.length} leituras com ${aiResult.confidence}% de confiança`);
                
                // Log das sugestões se houver
                if (aiResult.metadata?.suggestions) {
                    aiResult.metadata.suggestions.forEach(suggestion => {
                        console.log('💡 Sugestão IA:', suggestion);
                    });
                }
            } else {
                // Se IA falhou ou confiança baixa, tenta parsing tradicional
                console.log(`⚠️ IA não teve sucesso (confiança: ${aiResult.confidence}%), tentando parsing tradicional...`);
                readings = await parseFileTraditional(fileContent, fileName, userId);
                
                if (readings.length > 0) {
                    console.log(`✅ Parsing tradicional extraiu ${readings.length} leituras`);
                } else {
                    console.log('❌ Ambos os métodos falharam');
                }
            }
        } catch (aiError) {
            console.log('⚠️ Erro na IA, tentando parsing tradicional:', aiError);
            // Em caso de erro na IA, fallback para parsing tradicional
            readings = await parseFileTraditional(fileContent, fileName, userId);
        }

        return readings;

    } catch (error) {
        console.error("Erro ao analisar o arquivo:", error);
        throw new Error(`Falha ao processar o arquivo. Detalhes: ${(error as Error).message}`);
    }
}

// -------------------------------------------------------------
// FUNÇÃO DE PARSING TRADICIONAL (FALLBACK)
// -------------------------------------------------------------

/**
 * Função de parsing tradicional que mantém a funcionalidade original
 */
async function parseFileTraditional(
    fileContent: string, 
    fileName: string, 
    userId: string
): Promise<Reading[]> {
    const fileNameLower = fileName.toLowerCase();
    
    if (fileNameLower.endsWith('.csv')) {
        return parseCsv(fileContent, userId);
    } else if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
        return parseCsv(fileContent, userId);
    } else if (fileNameLower.endsWith('.xml')) {
        return parseXmlAsCsv(fileContent, userId);
    } else if (fileNameLower.endsWith('.pdf')) {
        return parsePdfAsCsv(fileContent, userId);
    } else {
        throw new Error("Formato de arquivo não suportado. Use CSV, Excel (.xlsx/.xls), XML ou PDF.");
    }
}

// -------------------------------------------------------------
// EXEMPLO DE PARSER DE CSV
// -------------------------------------------------------------

function parseCsv(csvContent: string, userId: string): Reading[] {
    // Tenta detectar o delimitador: , ou ;
    const delimiter = csvContent.includes(';') ? ';' : ',';

    const parseResult = Papa.parse(csvContent, {
        header: true, // Usa a primeira linha como cabeçalho
        skipEmptyLines: true,
        delimiter: delimiter, // Usa o delimitador detectado
    });

    const records = parseResult.data;

    const parsedReadings: Reading[] = [];
    const idGenerator = (index: number) => `import-${userId}-${Date.now()}-${index}`;

    // Mapeamento de colunas comuns (ajuste conforme a fonte do CSV)
    const possibleDateColumns = ['Data', 'Date', 'data', 'date', 'DATA', 'DATE'];
    const possibleTimeColumns = ['Hora', 'Time', 'hora', 'time', 'HORA', 'TIME'];
    const possibleGlucoseColumns = [
        'Glicose (mg/dL)', 'Glucose (mg/dL)', 'glicose (mg/dl)', 'glucose (mg/dl)',
        'Glicose', 'Glucose', 'glicose', 'glucose', 'GLICOSE', 'GLUCOSE',
        'Valor', 'Value', 'valor', 'value', 'VALOR', 'VALUE'
    ];
    
    // Função para encontrar a primeira coluna que corresponde
    const findColumn = (possibleNames: string[], record: any): string | null => {
        for (const name of possibleNames) {
            if (record[name] !== undefined) {
                return name;
            }
        }
        return null;
    };

    records.forEach((record: any, index: number) => {
        
        // Encontra as colunas corretas
        const glucoseColumn = findColumn(possibleGlucoseColumns, record);
        const dateColumn = findColumn(possibleDateColumns, record);
        const timeColumn = findColumn(possibleTimeColumns, record);
        
        if (!glucoseColumn || !dateColumn) {
            console.warn(`Linha ${index + 2} ignorada: Colunas essenciais não encontradas.`);
            return;
        }
        
        const glucoseStr = record[glucoseColumn];
        const dateStr = record[dateColumn];
        const timeStr = timeColumn ? record[timeColumn] : undefined; 

        // Verifica se os campos essenciais existem
        if (glucoseStr && dateStr) {
            // CORREÇÃO: Lida com formatos numéricos regionais (ex: 100,5 -> 100.5)
            const cleanedGlucoseStr = String(glucoseStr).replace(',', '.');
            const glucoseLevel = parseFloat(cleanedGlucoseStr);
            
            // Combina data e hora. O operador timeStr ? ... : ... garante que timeStr seja usado se existir.
            const dateTimeString = timeStr ? `${dateStr} ${timeStr}` : dateStr;
            const timestamp = new Date(dateTimeString).getTime(); 

            // Validação básica
            if (isNaN(glucoseLevel) || isNaN(timestamp) || glucoseLevel <= 0) {
                console.warn(`Linha ${index + 2} ignorada: Dados inválidos (glicose: ${cleanedGlucoseStr}, data/hora: ${dateTimeString}).`);
                return;
            }

            // Converte para o formato correto do banco de dados
            const measurementTime = new Date(timestamp).toISOString();
            
            parsedReadings.push({
                id: idGenerator(index), 
                measurement_time: measurementTime,
                timestamp: timestamp,
                glucose_level: glucoseLevel,
                meal_context: record.Contexto || 'Importado',
                time_since_meal: record['Tempo desde refeição'] || null,
                notes: record.Notas || `Importado via CSV`,
                updated_at: new Date().toISOString(),
                deleted: false,
                pending_sync: true,
            }); 
        } else {
            console.warn(`Linha ${index + 2} ignorada: Dados essenciais faltando (glicose: ${glucoseStr}, data: ${dateStr}).`);
        }
    });

    return parsedReadings;
}

// -------------------------------------------------------------
// PARSER PARA XML
// -------------------------------------------------------------

function parseXmlAsCsv(xmlContent: string, userId: string): Reading[] {
    // Tenta extrair dados tabulares do XML e converter para formato CSV
    // Esta é uma implementação básica que procura por padrões comuns
    
    try {
        // Procura por padrões de tabela em XML
        const tablePattern = /<table[^>]*>(.*?)<\/table>/gis;
        const rowPattern = /<tr[^>]*>(.*?)<\/tr>/gis;
        const cellPattern = /<td[^>]*>(.*?)<\/td>/gis;
        
        const tableMatch = xmlContent.match(tablePattern);
        if (!tableMatch) {
            throw new Error("Nenhuma tabela encontrada no arquivo XML");
        }
        
        const csvData: string[] = [];
        
        tableMatch.forEach(table => {
            const rows = table.match(rowPattern);
            if (rows) {
                rows.forEach(row => {
                    const cells = row.match(cellPattern);
                    if (cells) {
                        const cellValues = cells.map(cell => {
                            // Remove tags HTML e extrai apenas o texto
                            return cell.replace(/<[^>]*>/g, '').trim();
                        });
                        csvData.push(cellValues.join(','));
                    }
                });
            }
        });
        
        if (csvData.length === 0) {
            throw new Error("Nenhum dado tabular encontrado no XML");
        }
        
        // Converte para CSV e usa o parser existente
        const csvContent = csvData.join('\n');
        return parseCsv(csvContent, userId);
        
    } catch (error) {
        console.error("Erro ao processar XML:", error);
        throw new Error(`Falha ao processar arquivo XML: ${(error as Error).message}`);
    }
}

// -------------------------------------------------------------
// PARSER PARA PDF
// -------------------------------------------------------------

function parsePdfAsCsv(pdfContent: string, userId: string): Reading[] {
    // Para PDF, tentamos extrair dados tabulares do texto
    // Esta é uma implementação básica que procura por padrões comuns
    
    try {
        // Remove caracteres especiais e normaliza espaços
        const cleanedContent = pdfContent
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Procura por padrões de tabela em PDF
        // Padrão 1: Linhas com data, hora e valor de glicose
        const glucosePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*(\d{1,2}:\d{2})?\s*(\d{2,3}(?:[,\.]\d+)?)\s*(?:mg\/dl|mg\/dL|glicose|glucose)?/gi;
        
        const matches = cleanedContent.match(glucosePattern);
        
        if (!matches || matches.length === 0) {
            // Padrão 2: Procura por números que possam ser glicose (70-400 mg/dL)
            const numberPattern = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(\d{1,2}:\d{2})?\s+(\d{2,3})\b/g;
            const numberMatches = cleanedContent.match(numberPattern);
            
            if (!numberMatches || numberMatches.length === 0) {
                throw new Error("Nenhum padrão de dados de glicose encontrado no PDF");
            }
            
            return parsePdfMatches(numberMatches, userId, 'number');
        }
        
        return parsePdfMatches(matches, userId, 'glucose');
        
    } catch (error) {
        console.error("Erro ao processar PDF:", error);
        throw new Error(`Falha ao processar arquivo PDF: ${(error as Error).message}`);
    }
}

function parsePdfMatches(matches: string[], userId: string, type: 'glucose' | 'number'): Reading[] {
    const parsedReadings: Reading[] = [];
    const idGenerator = (index: number) => `import-pdf-${userId}-${Date.now()}-${index}`;
    
    matches.forEach((match, index) => {
        try {
            let dateStr: string;
            let timeStr: string | undefined;
            let glucoseStr: string;
            
            if (type === 'glucose') {
                // Extrai data, hora e valor de glicose
                const parts = match.trim().split(/\s+/);
                dateStr = parts[0];
                timeStr = parts[1]?.includes(':') ? parts[1] : undefined;
                glucoseStr = parts[timeStr ? 2 : 1] || parts[2];
            } else {
                // Extrai apenas data, hora e número
                const parts = match.trim().split(/\s+/);
                dateStr = parts[0];
                timeStr = parts[1]?.includes(':') ? parts[1] : undefined;
                glucoseStr = parts[timeStr ? 2 : 1] || parts[2];
            }
            
            if (!dateStr || !glucoseStr) {
                console.warn(`Linha ${index + 1} ignorada: Dados incompletos (${match})`);
                return;
            }
            
            // Normaliza o formato da data
            const normalizedDate = normalizeDateFormat(dateStr);
            const dateTimeString = timeStr ? `${normalizedDate} ${timeStr}` : normalizedDate;
            const timestamp = new Date(dateTimeString).getTime();
            
            // Limpa e converte o valor de glicose
            const cleanedGlucoseStr = String(glucoseStr).replace(/[^\d,\.]/g, '').replace(',', '.');
            const glucoseLevel = parseFloat(cleanedGlucoseStr);
            
            // Validação
            if (isNaN(glucoseLevel) || isNaN(timestamp) || glucoseLevel < 20 || glucoseLevel > 600) {
                console.warn(`Linha ${index + 1} ignorada: Dados inválidos (glicose: ${cleanedGlucoseStr}, data: ${dateTimeString})`);
                return;
            }
            
            // Cria a leitura
            const measurementTime = new Date(timestamp).toISOString();
            
            parsedReadings.push({
                id: idGenerator(index),
                measurement_time: measurementTime,
                timestamp: timestamp,
                glucose_level: glucoseLevel,
                meal_context: 'Importado',
                time_since_meal: null,
                notes: `Importado via PDF`,
                updated_at: new Date().toISOString(),
                deleted: false,
                pending_sync: true,
            });
            
        } catch (error) {
            console.warn(`Erro ao processar linha ${index + 1}: ${error}`);
        }
    });
    
    return parsedReadings;
}

function normalizeDateFormat(dateStr: string): string {
    // Tenta vários formatos de data comuns
    const formats = [
        /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/, // DD/MM/YYYY ou DD-MM-YYYY
        /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/,  // DD/MM/YY
        /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/,  // YYYY/MM/DD
    ];
    
    for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
            if (format.source.includes('YYYY')) {
                // Formato DD/MM/YYYY
                return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
            } else if (format.source.includes('\\d{4}')) {
                // Formato YYYY/MM/DD
                return `${match[2].padStart(2, '0')}/${match[3].padStart(2, '0')}/${match[1]}`;
            }
        }
    }
    
    // Se não conseguir parsear, retorna a data original
    return dateStr;
}

// -------------------------------------------------------------
// FUNÇÃO PARA PROCESSAR ARQUIVOS COMPARTILHADOS
// -------------------------------------------------------------

/**
 * Processa um arquivo compartilhado e extrai leituras de glicose.
 * @param fileContent O conteúdo do arquivo como string.
 * @param fileType O tipo MIME do arquivo.
 * @param userId O ID do usuário.
 * @returns Array de leituras de glicose.
 */
export async function parseFileContent(
    fileContent: string, 
    fileType: string, 
    userId: string
): Promise<Reading[]> {
    try {
        let readings: Reading[] = [];

        if (fileType === 'text/csv' || fileType === 'application/csv') {
            readings = parseCsv(fileContent, userId);
        } else if (fileType === 'application/vnd.ms-excel' || 
                   fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            // Para arquivos Excel, por enquanto, vamos tratar como CSV
            // Em uma implementação futura, seria necessário uma biblioteca específica para Excel
            throw new Error("Arquivos Excel ainda não são suportados. Use formato CSV.");
        } else if (fileType === 'application/xml' || fileType === 'text/xml') {
            // Para XML, seria necessário um parser de XML
            throw new Error("Arquivos XML ainda não são suportados. Use formato CSV.");
        } else if (fileType === 'application/pdf') {
            // Para PDF, seria necessário uma biblioteca para extrair texto
            throw new Error("Arquivos PDF ainda não são suportados. Use formato CSV.");
        } else {
            throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
        }

        return readings;
    } catch (error) {
        console.error("Erro ao processar arquivo compartilhado:", error);
        throw error;
    }
}
