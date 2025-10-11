import { Reading } from './dbService';
import * as FileSystem from 'expo-file-system';

// Interface para configuração do repositório Git
export interface GitRepositoryConfig {
  repositoryUrl: string;
  branch: string;
  filePath: string;
  authentication?: {
    token: string;
    username?: string;
  };
}

// Interface para resultado da importação
export interface GitImportResult {
  success: boolean;
  readings: Reading[];
  errors: string[];
  metadata: {
    repository: string;
    branch: string;
    filePath: string;
    totalRows: number;
    validRows: number;
    importDate: string;
  };
}

// Interface para dados de commit do Git
interface GitCommitInfo {
  sha: string;
  message: string;
  date: string;
  author: string;
}

class GitImportService {
  private readonly githubApiBase = 'https://api.github.com';
  private readonly rawContentBase = 'https://raw.githubusercontent.com';

  /**
   * Importa dados de glicose de um repositório Git
   */
  async importFromGit(config: GitRepositoryConfig, userId: string): Promise<GitImportResult> {
    try {
      console.log('🔄 Iniciando importação do Git:', config.repositoryUrl);
      
      // 1. Valida a configuração
      this.validateConfig(config);
      
      // 2. Extrai informações do repositório
      const repoInfo = this.parseRepositoryUrl(config.repositoryUrl);
      
      // 3. Busca o arquivo no repositório
      const fileContent = await this.fetchFileFromRepository(repoInfo, config);
      
      // 4. Processa o conteúdo do arquivo
      const readings = await this.processFileContent(fileContent, config.filePath, userId);
      
      // 5. Retorna o resultado
      return {
        success: true,
        readings,
        errors: [],
        metadata: {
          repository: config.repositoryUrl,
          branch: config.branch,
          filePath: config.filePath,
          totalRows: readings.length,
          validRows: readings.length,
          importDate: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Erro na importação do Git:', error);
      return {
        success: false,
        readings: [],
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        metadata: {
          repository: config.repositoryUrl,
          branch: config.branch,
          filePath: config.filePath,
          totalRows: 0,
          validRows: 0,
          importDate: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Busca informações dos últimos commits de um arquivo
   */
  async getFileCommitHistory(config: GitRepositoryConfig): Promise<GitCommitInfo[]> {
    try {
      const repoInfo = this.parseRepositoryUrl(config.repositoryUrl);
      
      const response = await fetch(
        `${this.githubApiBase}/repos/${repoInfo.owner}/${repoInfo.repo}/commits?path=${config.filePath}&sha=${config.branch}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(config.authentication?.token && {
              'Authorization': `token ${config.authentication.token}`
            })
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar histórico: ${response.status}`);
      }

      const commits = await response.json();
      
      return commits.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        date: commit.commit.author.date,
        author: commit.commit.author.name
      }));

    } catch (error) {
      console.error('Erro ao buscar histórico de commits:', error);
      return [];
    }
  }

  /**
   * Valida a configuração do repositório
   */
  private validateConfig(config: GitRepositoryConfig): void {
    if (!config.repositoryUrl) {
      throw new Error('URL do repositório é obrigatória');
    }
    
    if (!config.branch) {
      throw new Error('Branch é obrigatória');
    }
    
    if (!config.filePath) {
      throw new Error('Caminho do arquivo é obrigatório');
    }

    // Valida se é uma URL válida do GitHub
    if (!config.repositoryUrl.includes('github.com')) {
      throw new Error('Apenas repositórios do GitHub são suportados');
    }
  }

  /**
   * Extrai informações do repositório da URL
   */
  private parseRepositoryUrl(repositoryUrl: string): { owner: string; repo: string } {
    // Remove .git se presente
    const cleanUrl = repositoryUrl.replace('.git', '');
    
    // Extrai owner/repo da URL
    const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    
    if (!match) {
      throw new Error('URL do repositório inválida');
    }

    return {
      owner: match[1],
      repo: match[2]
    };
  }

  /**
   * Busca o conteúdo do arquivo no repositório
   */
  private async fetchFileFromRepository(
    repoInfo: { owner: string; repo: string },
    config: GitRepositoryConfig
  ): Promise<string> {
    // Tenta buscar via API do GitHub primeiro
    try {
      const apiUrl = `${this.githubApiBase}/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${config.filePath}?ref=${config.branch}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(config.authentication?.token && {
            'Authorization': `token ${config.authentication.token}`
          })
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.content && data.encoding === 'base64') {
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          console.log('✅ Arquivo obtido via API do GitHub');
          return content;
        }
      }
    } catch (error) {
      console.log('⚠️ Falha na API do GitHub, tentando raw content...');
    }

    // Fallback para raw content
    const rawUrl = `${this.rawContentBase}/${repoInfo.owner}/${repoInfo.repo}/${config.branch}/${config.filePath}`;
    
    const response = await fetch(rawUrl);
    
    if (!response.ok) {
      throw new Error(`Arquivo não encontrado: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    console.log('✅ Arquivo obtido via raw content');
    return content;
  }

  /**
   * Processa o conteúdo do arquivo e extrai leituras
   */
  private async processFileContent(
    fileContent: string,
    fileName: string,
    userId: string
  ): Promise<Reading[]> {
    const readings: Reading[] = [];
    const lines = fileContent.split('\n').filter(line => line.trim());
    const idGenerator = (index: number) => `git-import-${userId}-${Date.now()}-${index}`;

    console.log(`📊 Processando ${lines.length} linhas do arquivo: ${fileName}`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('#')) { // Ignora linhas vazias e comentários
        continue;
      }

      try {
        // Tenta diferentes formatos de parsing
        const reading = this.parseLine(line, i, idGenerator, userId);
        
        if (reading) {
          readings.push(reading);
        }
      } catch (error) {
        console.warn(`Linha ${i + 1} ignorada: ${error}`);
      }
    }

    console.log(`✅ Processadas ${readings.length} leituras válidas`);
    return readings;
  }

  /**
   * Faz o parse de uma linha do arquivo
   */
  private parseLine(
    line: string,
    index: number,
    idGenerator: (index: number) => string,
    userId: string
  ): Reading | null {
    // Múltiplos formatos suportados
    
    // Formato 1: CSV - "data,hora,valor,contexto"
    if (line.includes(',')) {
      return this.parseCsvLine(line, index, idGenerator, userId);
    }
    
    // Formato 2: TSV - "data	hora	valor	contexto"
    if (line.includes('\t')) {
      return this.parseTsvLine(line, index, idGenerator, userId);
    }
    
    // Formato 3: JSON
    if (line.startsWith('{') && line.endsWith('}')) {
      return this.parseJsonLine(line, index, idGenerator, userId);
    }
    
    // Formato 4: Espaços - "data hora valor contexto"
    if (line.includes(' ')) {
      return this.parseSpaceDelimitedLine(line, index, idGenerator, userId);
    }

    return null;
  }

  /**
   * Parse de linha CSV
   */
  private parseCsvLine(
    line: string,
    index: number,
    idGenerator: (index: number) => string,
    userId: string
  ): Reading | null {
    const parts = line.split(',').map(part => part.trim());
    
    if (parts.length < 2) {
      return null;
    }

    // Tenta diferentes combinações de colunas
    let dateStr: string;
    let timeStr: string | undefined;
    let glucoseStr: string;
    let contextStr: string | undefined;

    if (parts.length === 2) {
      // Formato: data,valor
      dateStr = parts[0];
      glucoseStr = parts[1];
    } else if (parts.length === 3) {
      // Formato: data,hora,valor OU data,valor,contexto
      if (parts[1].includes(':')) {
        dateStr = parts[0];
        timeStr = parts[1];
        glucoseStr = parts[2];
      } else {
        dateStr = parts[0];
        glucoseStr = parts[1];
        contextStr = parts[2];
      }
    } else {
      // Formato: data,hora,valor,contexto
      dateStr = parts[0];
      timeStr = parts[1].includes(':') ? parts[1] : undefined;
      glucoseStr = timeStr ? parts[2] : parts[1];
      contextStr = timeStr ? parts[3] : parts[2];
    }

    return this.createReadingFromParsedData(
      dateStr,
      timeStr,
      glucoseStr,
      contextStr,
      index,
      idGenerator,
      userId,
      'CSV'
    );
  }

  /**
   * Parse de linha TSV
   */
  private parseTsvLine(
    line: string,
    index: number,
    idGenerator: (index: number) => string,
    userId: string
  ): Reading | null {
    const parts = line.split('\t').map(part => part.trim());
    
    if (parts.length < 2) {
      return null;
    }

    // Similar ao CSV, mas com tabs
    let dateStr: string;
    let timeStr: string | undefined;
    let glucoseStr: string;
    let contextStr: string | undefined;

    if (parts.length === 2) {
      dateStr = parts[0];
      glucoseStr = parts[1];
    } else if (parts.length === 3) {
      if (parts[1].includes(':')) {
        dateStr = parts[0];
        timeStr = parts[1];
        glucoseStr = parts[2];
      } else {
        dateStr = parts[0];
        glucoseStr = parts[1];
        contextStr = parts[2];
      }
    } else {
      dateStr = parts[0];
      timeStr = parts[1].includes(':') ? parts[1] : undefined;
      glucoseStr = timeStr ? parts[2] : parts[1];
      contextStr = timeStr ? parts[3] : parts[2];
    }

    return this.createReadingFromParsedData(
      dateStr,
      timeStr,
      glucoseStr,
      contextStr,
      index,
      idGenerator,
      userId,
      'TSV'
    );
  }

  /**
   * Parse de linha JSON
   */
  private parseJsonLine(
    line: string,
    index: number,
    idGenerator: (index: number) => string,
    userId: string
  ): Reading | null {
    try {
      const data = JSON.parse(line);
      
      const glucoseLevel = parseFloat(data.glucose || data.value || data.glucose_level);
      const dateStr = data.date || data.timestamp || data.measurement_time;
      const contextStr = data.context || data.meal_context || data.contexto;
      
      if (!dateStr || isNaN(glucoseLevel)) {
        return null;
      }

      return this.createReadingFromParsedData(
        dateStr,
        data.time,
        glucoseLevel.toString(),
        contextStr,
        index,
        idGenerator,
        userId,
        'JSON'
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse de linha delimitada por espaços
   */
  private parseSpaceDelimitedLine(
    line: string,
    index: number,
    idGenerator: (index: number) => string,
    userId: string
  ): Reading | null {
    const parts = line.split(/\s+/);
    
    if (parts.length < 2) {
      return null;
    }

    // Procura por padrões comuns
    let dateStr: string;
    let timeStr: string | undefined;
    let glucoseStr: string;
    let contextStr: string | undefined;

    // Tenta encontrar data no início
    const datePattern = /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/;
    const timePattern = /^\d{1,2}:\d{2}$/;
    const glucosePattern = /^\d{2,3}$/;

    let dateIndex = -1;
    let timeIndex = -1;
    let glucoseIndex = -1;

    for (let i = 0; i < parts.length; i++) {
      if (datePattern.test(parts[i]) && dateIndex === -1) {
        dateIndex = i;
      } else if (timePattern.test(parts[i]) && timeIndex === -1) {
        timeIndex = i;
      } else if (glucosePattern.test(parts[i]) && glucoseIndex === -1) {
        glucoseIndex = i;
      }
    }

    if (dateIndex === -1 || glucoseIndex === -1) {
      return null;
    }

    dateStr = parts[dateIndex];
    if (timeIndex !== -1) {
      timeStr = parts[timeIndex];
    }
    glucoseStr = parts[glucoseIndex];
    
    // Contexto seria o resto
    if (parts.length > glucoseIndex + 1) {
      contextStr = parts.slice(glucoseIndex + 1).join(' ');
    }

    return this.createReadingFromParsedData(
      dateStr,
      timeStr,
      glucoseStr,
      contextStr,
      index,
      idGenerator,
      userId,
      'SPACE'
    );
  }

  /**
   * Cria uma leitura a partir dos dados parseados
   */
  private createReadingFromParsedData(
    dateStr: string,
    timeStr: string | undefined,
    glucoseStr: string,
    contextStr: string | undefined,
    index: number,
    idGenerator: (index: number) => string,
    userId: string,
    format: string
  ): Reading | null {
    try {
      // Converte valor de glicose
      const glucoseLevel = parseFloat(glucoseStr.replace(',', '.'));
      
      if (isNaN(glucoseLevel) || glucoseLevel < 20 || glucoseLevel > 600) {
        return null;
      }

      // Combina data e hora
      const dateTimeString = timeStr ? `${dateStr} ${timeStr}` : dateStr;
      const timestamp = new Date(dateTimeString).getTime();
      
      if (isNaN(timestamp)) {
        return null;
      }

      const measurementTime = new Date(timestamp).toISOString();

      return {
        id: idGenerator(index),
        user_id: userId,
        measurement_time: measurementTime,
        timestamp: timestamp,
        glucose_level: glucoseLevel,
        meal_context: contextStr || 'importado',
        time_since_meal: null,
        notes: `Importado do Git (${format})`,
        updated_at: new Date().toISOString(),
        deleted: false,
        pending_sync: true,
      };

    } catch (error) {
      console.warn(`Erro ao criar leitura: ${error}`);
      return null;
    }
  }
}

export const gitImportService = new GitImportService();




