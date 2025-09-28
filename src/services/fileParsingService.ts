import * as FileSystem from 'expo-file-system';
// CORREÇÃO TEMPORÁRIA: Definindo a interface Reading localmente para resolver TS2307,
// pois o arquivo '../types' não está sendo reconhecido. Isso permite que o código compile.
export interface Reading {
    id: string;
    userId: string;
    glucoseLevel: number;
    timestamp: number;
    context?: 'Antes de Comer' | 'Depois de Comer' | 'Jejum' | 'Geral' | 'Importado';
    notes?: string;
    syncedAt: number | null;
}
// @ts-ignore
import { parse } from 'csv-parse/sync'; 

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
 * Lê o arquivo de cache local e tenta parsear o conteúdo como CSV para extrair leituras de glicose.
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

        // 2. Determina o tipo de arquivo e chama o parser apropriado
        // CORREÇÃO: Usa o asset verificado
        const fileName = asset.name.toLowerCase(); 
        
        let readings: Reading[] = [];

        if (fileName.endsWith('.csv')) {
            // Se for CSV, passa o conteúdo para a função de parsing
            readings = parseCsv(fileContent, userId);
        } else {
            // Adicionado suporte básico para identificar separadores comuns, se necessário
            throw new Error("Apenas o formato CSV é suportado para importação de dados no momento.");
        }

        return readings;

    } catch (error) {
        console.error("Erro ao analisar o arquivo:", error);
        throw new Error(`Falha ao processar o arquivo. Detalhes: ${(error as Error).message}`);
    }
}


// -------------------------------------------------------------
// EXEMPLO DE PARSER DE CSV
// -------------------------------------------------------------

function parseCsv(csvContent: string, userId: string): Reading[] {
    // Tenta detectar o delimitador: , ou ;
    const delimiter = csvContent.includes(';') ? ';' : ',';

    const records = parse(csvContent, {
        columns: true, // Usa a primeira linha como cabeçalho
        skip_empty_lines: true,
        trim: true, 
        delimiter: delimiter, // Usa o delimitador detectado
    });

    const parsedReadings: Reading[] = [];
    const idGenerator = (index: number) => `import-${userId}-${Date.now()}-${index}`;

    // Mapeamento de colunas comuns (ajuste conforme a fonte do CSV)
    const DATE_COLUMN = 'Data';
    const TIME_COLUMN = 'Hora';
    const GLUCOSE_COLUMN = 'Glicose (mg/dL)';

    records.forEach((record: any, index: number) => {
        
        const glucoseStr = record[GLUCOSE_COLUMN];
        const dateStr = record[DATE_COLUMN];
        
        // CORREÇÃO 1 do TS2532: Acessa a coluna 'Hora' com segurança usando o operador `?` 
        // e garante que o resultado seja tratado como string, ou null se não existir.
        const timeStr: string | undefined = record[TIME_COLUMN]; 

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

            // A 'Reading' de destino precisa ser compatível com o tipo definido
            parsedReadings.push({
                id: idGenerator(index), 
                userId: userId,
                glucoseLevel: glucoseLevel,
                timestamp: timestamp,
                // O contexto deve ser 'Importado' se não for especificado no arquivo
                context: record.Contexto || 'Importado', 
                notes: record.Notas || `Importado via CSV`,
                syncedAt: null, 
            }); 
        } else {
            console.warn(`Linha ${index + 2} ignorada: Colunas essenciais faltando (${GLUCOSE_COLUMN}, ${DATE_COLUMN}).`);
        }
    });

    return parsedReadings;
}
