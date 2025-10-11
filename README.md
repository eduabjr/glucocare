# GlucoCare - Aplicativo de Monitoramento de Glicemia

![GlucoCare Logo](./assets/icon.png)

**Licença** | **Teste Local** | **Teste Cloud** | **Membros do Grupo**

## Sumário

- [Sobre](#sobre)
- [Objetivos do Projeto](#objetivos-do-projeto)
- [Membros do Grupo](#membros-do-grupo)
- [Começando](#começando)
- [Tecnologias Empregadas](#tecnologias-empregadas)
- [Modelagem do Banco de Dados](#modelagem-do-banco-de-dados)
- [Collections e Estrutura](#collections-e-estrutura)
- [Instrução de Uso](#instrução-de-uso)
- [Pré-requisitos](#pré-requisitos)
- [Instrução de Instalação](#instrução-de-instalação)
- [Configuração do Firebase](#configuração-do-firebase)
- [Comandos e Scripts](#comandos-e-scripts)
- [Roteiro de Testes da Aplicação](#roteiro-de-testes-da-aplicação)
- [Build e Deploy](#build-e-deploy)
- [Suporte](#suporte)
- [Licença](#licença)
- [Referência](#referência)
- [Agradecimento](#agradecimento)

## Sobre

O **GlucoCare** é um aplicativo móvel desenvolvido em React Native com Expo que permite o monitoramento completo da glicemia. A aplicação oferece funcionalidades avançadas para usuários diabéticos, incluindo registro de leituras, análise de tendências, alertas personalizados e integração com dispositivos Bluetooth.

### Conhecendo as tecnologias empregadas

#### React Native com Expo

O React Native é um framework que permite desenvolver aplicações móveis nativas usando JavaScript e React. O Expo é uma plataforma que simplifica o desenvolvimento React Native, oferecendo ferramentas e serviços que aceleram o processo de desenvolvimento.

##### Principais Características:

1. **Desenvolvimento Multiplataforma**: Uma única base de código para iOS e Android
2. **Hot Reload**: Atualizações em tempo real durante o desenvolvimento
3. **Componentes Nativos**: Acesso a funcionalidades nativas do dispositivo
4. **Performance**: Aplicações com performance próxima ao nativo
5. **Comunidade Ativa**: Grande suporte da comunidade e documentação

#### Firebase

O Firebase é uma plataforma de desenvolvimento de aplicativos móveis e web que oferece uma variedade de serviços em nuvem.

##### Principais Características:

1. **Firestore**: Banco de dados NoSQL em tempo real
2. **Authentication**: Sistema de autenticação completo
3. **Storage**: Armazenamento de arquivos na nuvem
4. **Analytics**: Análise de uso da aplicação
5. **Cloud Functions**: Execução de código serverless

#### SQLite Local

O SQLite é um sistema de gerenciamento de banco de dados relacional embutido que permite armazenamento local de dados.

##### Principais Características:

1. **Armazenamento Local**: Dados disponíveis offline
2. **Performance**: Acesso rápido aos dados
3. **Sincronização**: Integração com serviços em nuvem
4. **Compatibilidade**: Funciona em todas as plataformas

#### Arquitetura Híbrida (Firestore + SQLite)

A aplicação utiliza uma arquitetura híbrida inteligente que combina o melhor dos dois mundos:

##### Vantagens da Arquitetura Híbrida:

1. **Offline-First**: SQLite garante funcionamento sem internet
2. **Performance Local**: Acesso instantâneo aos dados
3. **Backup Automático**: Firestore sincroniza dados na nuvem
4. **Multi-dispositivo**: Acesso de qualquer lugar
5. **Escalabilidade**: Suporte a milhões de usuários
6. **Confiabilidade**: Dados sempre seguros

## Objetivos do Projeto

### Objetivo Principal
Desenvolver uma aplicação móvel completa para monitoramento de glicemia que ofereça uma experiência intuitiva e funcionalidades avançadas para usuários diabéticos.

### Objetivos Específicos
1. **Registro de Leituras**: Permitir o registro manual e automático de leituras de glicemia
2. **Análise de Dados**: Fornecer gráficos e tendências baseadas nas leituras
3. **Alertas Inteligentes**: Sistema de notificações personalizáveis
4. **Integração Bluetooth**: Conectar com dispositivos de medição
5. **Relatórios**: Geração de relatórios detalhados
6. **Sincronização**: Backup e sincronização em nuvem
7. **Interface Intuitiva**: Design moderno e acessível

## Membros do Grupo

- **Eduardo Família** - Desenvolvedor Full Stack
  - GitHub: [@eduardofamilia01-hub](https://github.com/eduardofamilia01-hub)
  - Email: eduardofamilia01@gmail.com

## Começando

### Visão Geral
O GlucoCare é uma aplicação React Native que utiliza Expo para desenvolvimento multiplataforma. A aplicação integra Firebase para autenticação e armazenamento em nuvem, SQLite para armazenamento local, e oferece funcionalidades avançadas de monitoramento de glicemia.

### Funcionalidades Principais
- 📱 **Dashboard Intuitivo**: Visão geral das leituras recentes
- 📊 **Gráficos e Análises**: Visualização de tendências glicêmicas
- 🔔 **Sistema de Alertas**: Notificações personalizáveis
- 📱 **Integração Bluetooth**: Conectividade com dispositivos
- 📄 **Relatórios Detalhados**: Geração de relatórios em PDF
- ☁️ **Sincronização em Nuvem**: Backup automático dos dados
- 🔐 **Autenticação Segura**: Login com Google OAuth

## Tecnologias Empregadas

### Frontend
- **React Native**: Framework para desenvolvimento móvel
- **Expo**: Plataforma de desenvolvimento React Native
- **TypeScript**: Linguagem de programação tipada
- **React Navigation**: Navegação entre telas
- **React Native Charts**: Visualização de dados
- **Expo Vector Icons**: Ícones da aplicação

### Backend e Serviços
- **Firebase**: Plataforma de serviços em nuvem
  - Firestore: Banco de dados NoSQL
  - Authentication: Sistema de autenticação
  - Storage: Armazenamento de arquivos
- **SQLite**: Banco de dados local
- **Expo SQLite**: Integração SQLite com Expo

### Funcionalidades Específicas
- **Bluetooth Low Energy (BLE)**: Comunicação com dispositivos
- **Expo File System**: Manipulação de arquivos
- **Expo Print**: Geração de PDFs
- **Expo Notifications**: Sistema de notificações
- **Expo Secure Store**: Armazenamento seguro de dados

## Modelagem do Banco de Dados

### Arquitetura Híbrida

O GlucoCare utiliza uma arquitetura híbrida que combina SQLite (local) e Firestore (nuvem) para otimizar performance e confiabilidade.

#### Fluxo de Dados:

```
1. Usuário adiciona leitura → SQLite (instantâneo)
2. App sincroniza → Firestore (background)
3. Outro dispositivo → Firestore → SQLite local
4. Modo offline → SQLite funciona normalmente
```

### Estrutura do SQLite (Local)

#### Tabela: glucose_readings
```sql
CREATE TABLE glucose_readings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    value REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    meal_context TEXT CHECK(meal_context IN ('jejum', 'pre-refeicao', 'pos-refeicao', 'antes-dormir', 'madrugada')),
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    pending_sync BOOLEAN DEFAULT 1,
    ai_confidence REAL
);
```

#### Tabela: users
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

#### Tabela: glycemic_goals
```sql
CREATE TABLE glycemic_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    fasting_min INTEGER DEFAULT 70,
    fasting_max INTEGER DEFAULT 100,
    pre_meal_min INTEGER DEFAULT 70,
    pre_meal_max INTEGER DEFAULT 130,
    post_meal_min INTEGER DEFAULT 70,
    post_meal_max INTEGER DEFAULT 180,
    bedtime_min INTEGER DEFAULT 70,
    bedtime_max INTEGER DEFAULT 150,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### Estrutura do Firestore (Nuvem)

#### Collection: users
```json
{
  "id": "user_123",
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "createdAt": "2024-10-11T00:00:00.000Z",
  "updatedAt": "2024-10-11T00:00:00.000Z"
}
```

#### Collection: glucoseReadings
```json
{
  "id": "reading_123",
  "userId": "user_123",
  "value": 120,
  "timestamp": "2024-10-11T08:00:00.000Z",
  "mealContext": "jejum",
  "notes": "Leitura matinal",
  "createdAt": "2024-10-11T08:00:00.000Z",
  "updatedAt": "2024-10-11T08:00:00.000Z",
  "aiConfidence": 0.95
}
```

#### Collection: glycemicGoals
```json
{
  "id": "goals_123",
  "userId": "user_123",
  "fastingMin": 70,
  "fastingMax": 100,
  "preMealMin": 70,
  "preMealMax": 130,
  "postMealMin": 70,
  "postMealMax": 180,
  "bedtimeMin": 70,
  "bedtimeMax": 150,
  "createdAt": "2024-10-11T00:00:00.000Z",
  "updatedAt": "2024-10-11T00:00:00.000Z"
}
```

## Collections e Estrutura

### 🔥 **COLEÇÕES FIREBASE FIRESTORE - ESTRUTURA COMPLETA**

O GlucoCare utiliza **5 coleções principais** no Firebase Firestore para armazenar todos os dados da aplicação:

---

## 📋 **COLEÇÃO 1: `users` (Coleção Principal)**

**Propósito**: Armazenar dados dos usuários autenticados.

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `id` | **String** | ✅ Sim | ID único do usuário (Firebase Auth UID) | `"9Fz97YAMUNgZwmGRMISN"` |
| `full_name` | **String** | ✅ Sim | Nome completo do usuário | `"Eduardo Família"` |
| `email` | **String** | ✅ Sim | Email do usuário | `"eduardofamilia01@gmail.com"` |
| `google_id` | **String** | ❌ Opcional | ID do Google OAuth | `"google_123456789"` |
| `onboarding_completed` | **Boolean** | ✅ Sim | Se completou o onboarding | `true` |
| `biometric_enabled` | **Boolean** | ✅ Sim | Se biometria está habilitada | `true` |
| `weight` | **Number** | ❌ Opcional | Peso do usuário (kg) | `70.5` |
| `height` | **Number** | ❌ Opcional | Altura do usuário (cm) | `175` |
| `birth_date` | **String** | ❌ Opcional | Data de nascimento (ISO 8601) | `"1990-01-15T00:00:00Z"` |
| `diabetes_condition` | **String** | ❌ Opcional | Tipo de diabetes | `"Type 1"` |
| `restriction` | **String** | ❌ Opcional | Restrições alimentares | `"Sem lactose"` |
| `glycemic_goals` | **String** | ❌ Opcional | Metas glicêmicas (JSON) | `'{"fasting": [70, 100]}'` |
| `medication_reminders` | **String** | ❌ Opcional | Lembretes de medicação (JSON) | `'[{"time": "08:00", "med": "Insulina"}]'` |
| `updated_at` | **String** | ✅ Sim | Última atualização (ISO 8601) | `"2024-01-15T14:30:05Z"` |
| `email_verified` | **Boolean** | ✅ Sim | Se email foi verificado | `true` |
| `pending_sync` | **Boolean** | ✅ Sim | Se precisa sincronizar | `false` |

---

## 📚 **COLEÇÃO 2: `users/{userId}/readings` (Subcoleção)**

**Propósito**: Armazenar leituras de glicemia de cada usuário (subcoleção).

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `id` | **String** | ✅ Sim | ID único da leitura | `"reading_abc123"` |
| `user_id` | **String** | ✅ Sim | ID do usuário (referência) | `"9Fz97YAMUNgZwmGRMISN"` |
| `measurement_time` | **String** | ✅ Sim | Data/hora da medição (ISO 8601) | `"2024-01-15T08:30:00Z"` |
| `glucose_level` | **Number** | ✅ Sim | Nível de glicemia (mg/dL) | `120` |
| `meal_context` | **String** | ❌ Opcional | Contexto da refeição | `"jejum"` |
| `time_since_meal` | **String** | ❌ Opcional | Tempo desde última refeição | `"2 horas"` |
| `notes` | **String** | ❌ Opcional | Notas adicionais | `"Antes do exercício"` |
| `updated_at` | **String** | ✅ Sim | Última atualização (ISO 8601) | `"2024-01-15T08:30:05Z"` |
| `deleted` | **Boolean** | ✅ Sim | Se foi deletada | `false` |
| `pending_sync` | **Boolean** | ✅ Sim | Se precisa sincronizar | `false` |

---

## 📋 **COLEÇÃO 3: `notifications` (Coleção Principal)**

**Propósito**: Gerenciar notificações do aplicativo (lembretes, alertas).

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `id` | **String** | ✅ Sim | ID único da notificação | `"notification_123456"` |
| `user_id` | **String** | ✅ Sim | ID do usuário (Firebase Auth UID) | `"9Fz97YAMUNgZwmGRMISN"` |
| `type` | **String** | ✅ Sim | Tipo da notificação | `"medication_reminder"` |
| `message` | **String** | ✅ Sim | Mensagem da notificação | `"Hora de medir a glicemia"` |
| `scheduled_time` | **String** | ✅ Sim | Data/hora agendada (ISO 8601) | `"2024-01-15T14:30:00Z"` |
| `sent_time` | **String** | ❌ Opcional | Data/hora enviada (ISO 8601) | `"2024-01-15T14:30:05Z"` |
| `status` | **String** | ✅ Sim | Status da notificação | `"scheduled"` |
| `updated_at` | **String** | ✅ Sim | Última atualização (ISO 8601) | `"2024-01-15T14:30:05Z"` |
| `deleted` | **Boolean** | ✅ Sim | Se foi deletada | `false` |
| `pending_sync` | **Boolean** | ✅ Sim | Se precisa sincronizar | `false` |

---

## 📊 **COLEÇÃO 4: `reports` (Coleção Principal)**

**Propósito**: Armazenar metadados e referências aos relatórios gerados.

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `id` | **String** | ✅ Sim | ID único do relatório | `"report_abc789"` |
| `user_id` | **String** | ✅ Sim | ID do usuário (Firebase Auth UID) | `"9Fz97YAMUNgZwmGRMISN"` |
| `type` | **String** | ✅ Sim | Tipo do relatório | `"monthly"` |
| `title` | **String** | ✅ Sim | Título do relatório | `"Relatório Mensal - Janeiro 2024"` |
| `start_date` | **String** | ✅ Sim | Data início (ISO 8601) | `"2024-01-01T00:00:00Z"` |
| `end_date` | **String** | ✅ Sim | Data fim (ISO 8601) | `"2024-01-31T23:59:59Z"` |
| `file_url` | **String** | ❌ Opcional | URL do arquivo PDF | `"gs://bucket/relatorio.pdf"` |
| `summary_data` | **Map** | ❌ Opcional | Dados resumidos | `{"avg_glucose": 120, "total_readings": 45}` |
| `created_at` | **String** | ✅ Sim | Data criação (ISO 8601) | `"2024-01-31T23:59:59Z"` |
| `updated_at` | **String** | ✅ Sim | Última atualização (ISO 8601) | `"2024-01-31T23:59:59Z"` |
| `deleted` | **Boolean** | ✅ Sim | Se foi deletado | `false` |
| `pending_sync` | **Boolean** | ✅ Sim | Se precisa sincronizar | `false` |

---

## 🔄 **COLEÇÃO 5: `sync_meta` (Coleção Principal)**

**Propósito**: Armazenar metadados de sincronização entre SQLite local e Firebase.

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `id` | **String** | ✅ Sim | ID único (use o user_id) | `"9Fz97YAMUNgZwmGRMISN"` |
| `user_id` | **String** | ✅ Sim | ID do usuário (Firebase Auth UID) | `"9Fz97YAMUNgZwmGRMISN"` |
| `last_sync` | **String** | ✅ Sim | Última sincronização (ISO 8601) | `"2024-01-15T14:30:00Z"` |
| `last_pull` | **String** | ❌ Opcional | Último pull (ISO 8601) | `"2024-01-15T14:25:00Z"` |
| `last_push` | **String** | ❌ Opcional | Último push (ISO 8601) | `"2024-01-15T14:30:00Z"` |
| `sync_status` | **String** | ✅ Sim | Status da sincronização | `"success"` |
| `error_message` | **String** | ❌ Opcional | Mensagem de erro | `null` |
| `updated_at` | **String** | ✅ Sim | Última atualização (ISO 8601) | `"2024-01-15T14:30:05Z"` |

---

## 🔗 **RELACIONAMENTOS ENTRE COLEÇÕES**

```
users (1) ←→ (N) users/{userId}/readings (subcoleção)
users (1) ←→ (N) notifications
users (1) ←→ (N) reports  
users (1) ←→ (1) sync_meta
```

### **📊 Resumo das Coleções:**

| Coleção | Tipo | Quantidade de Campos | Finalidade |
|---------|------|---------------------|------------|
| `users` | Principal | 16 campos | Dados do usuário |
| `users/{userId}/readings` | Subcoleção | 10 campos | Leituras de glicemia |
| `notifications` | Principal | 10 campos | Notificações e alertas |
| `reports` | Principal | 12 campos | Metadados de relatórios |
| `sync_meta` | Principal | 8 campos | Controle de sincronização |
| **TOTAL** | **5 coleções** | **56 campos** | **Sistema completo** |

### **🔒 Regras de Segurança:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuários - apenas o próprio usuário
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Leituras - subcoleção do usuário
    match /users/{userId}/readings/{readingId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Notificações - apenas do próprio usuário
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Relatórios - apenas do próprio usuário
    match /reports/{reportId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Metadados de sincronização - apenas do próprio usuário
    match /sync_meta/{syncId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
  }
}
```

## Instrução de Uso

### Funcionalidades Disponíveis

#### 1. Dashboard
**O que faz**: Tela principal que mostra uma visão geral das leituras recentes e estatísticas importantes.

**Como usar**:
1. Abra o aplicativo
2. Faça login com sua conta Google
3. Visualize as leituras recentes no topo
4. Veja estatísticas como média, máximo e mínimo
5. Acesse funcionalidades rápidas pelos botões

**Elementos da tela**:
- **Leituras Recentes**: Lista das últimas 5 leituras
- **Estatísticas**: Cards com médias e tendências
- **Botões de Ação**: Adicionar leitura, ver gráficos, configurações

#### 2. Adicionar Leitura
**O que faz**: Permite registrar uma nova leitura de glicemia manualmente.

**Como usar**:
1. Toque no botão "+" no Dashboard
2. Digite o valor da glicemia
3. Selecione o contexto da refeição:
   - **Jejum**: Antes do café da manhã
   - **Pré-refeição**: Antes de comer
   - **Pós-refeição**: 2 horas após comer
   - **Antes de dormir**: À noite
   - **Madrugada**: Durante a madrugada
4. Adicione notas opcionais
5. Toque em "Salvar"

#### 3. Gráficos e Análises
**O que faz**: Mostra visualizações das leituras ao longo do tempo.

**Como usar**:
1. Toque em "Gráficos" no menu
2. Selecione o período desejado:
   - **7 dias**: Última semana
   - **30 dias**: Último mês
   - **90 dias**: Últimos 3 meses
3. Visualize diferentes tipos de gráficos:
   - **Linha**: Tendência temporal
   - **Barras**: Comparação por período
   - **Área**: Área sob a curva

#### 4. Configurações
**O que faz**: Permite personalizar metas glicêmicas e configurações do app.

**Como usar**:
1. Toque em "Configurações" no menu
2. Configure suas metas glicêmicas:
   - **Jejum**: 70-100 mg/dL (padrão)
   - **Pré-refeição**: 70-130 mg/dL (padrão)
   - **Pós-refeição**: 70-180 mg/dL (padrão)
   - **Antes de dormir**: 70-150 mg/dL (padrão)
3. Configure alertas de notificação
4. Ajuste configurações de sincronização

#### 5. Relatórios
**O que faz**: Gera relatórios detalhados em PDF das suas leituras.

**Como usar**:
1. Toque em "Relatórios" no menu
2. Selecione o período do relatório
3. Escolha o tipo de relatório:
   - **Resumo**: Estatísticas básicas
   - **Detalhado**: Lista completa de leituras
   - **Médico**: Relatório para consulta médica
4. Toque em "Gerar Relatório"
5. Compartilhe ou salve o PDF

#### 6. Conexão Bluetooth
**O que faz**: Conecta com dispositivos de medição de glicemia via Bluetooth.

**Como usar**:
1. Toque em "Dispositivos" no menu
2. Ative o Bluetooth no seu dispositivo
3. Toque em "Buscar Dispositivos"
4. Selecione seu dispositivo da lista
5. Toque em "Conectar"
6. As leituras serão importadas automaticamente

#### 7. Importação de Arquivos
**O que faz**: Importa leituras de arquivos CSV ou Excel.

**Como usar**:
1. Toque em "Importar" no menu
2. Selecione "Arquivo Local" ou "GitHub"
3. Para arquivo local:
   - Selecione o arquivo CSV/Excel
   - Confirme a importação
4. Para GitHub:
   - Digite a URL do repositório
   - Selecione o arquivo
   - Confirme a importação

## Pré-requisitos

### Desenvolvimento
- **Node.js**: Versão 18 ou superior
  - Download: [https://nodejs.org/](https://nodejs.org/)
  - Verificação: `node --version`
- **npm**: Gerenciador de pacotes (vem com Node.js)
  - Verificação: `npm --version`
- **Git**: Controle de versão
  - Download: [https://git-scm.com/](https://git-scm.com/)
  - Verificação: `git --version`
- **Expo CLI**: Ferramenta de desenvolvimento
  - Instalação: `npm install -g @expo/cli`
- **EAS CLI**: Para builds em nuvem
  - Instalação: `npm install -g eas-cli`

### Dispositivo
- **Android**: API 24 (Android 7.0) ou superior
- **iOS**: iOS 15.1 ou superior
- **Bluetooth**: Para integração com dispositivos
- **Espaço**: Pelo menos 100MB livres

### Contas e Serviços
- **Conta Google**: Para autenticação
- **Conta Expo**: Para builds e deploy
  - Criação: [https://expo.dev/](https://expo.dev/)
- **Conta Firebase**: Para serviços em nuvem
  - Criação: [https://console.firebase.google.com/](https://console.firebase.google.com/)

### Conhecimento Básico
- **JavaScript/TypeScript**: Conhecimento básico
- **React**: Conceitos fundamentais
- **Terminal/CMD**: Comandos básicos
- **Git**: Conceitos básicos

## Instrução de Instalação

### Passo 1: Preparar o Ambiente

#### 1.1 Instalar Node.js
1. Acesse [https://nodejs.org/](https://nodejs.org/)
2. Baixe a versão LTS (Long Term Support)
3. Execute o instalador
4. Siga as instruções na tela
5. Reinicie o terminal/CMD
6. Verifique a instalação:
   ```bash
   node --version
   npm --version
   ```

#### 1.2 Instalar Git
1. Acesse [https://git-scm.com/](https://git-scm.com/)
2. Baixe a versão para seu sistema operacional
3. Execute o instalador
4. Use as configurações padrão
5. Verifique a instalação:
   ```bash
   git --version
   ```

### Passo 2: Clonar o Repositório

#### 2.1 Abrir Terminal/CMD
- **Windows**: Pressione `Win + R`, digite `cmd`, pressione Enter
- **Mac**: Pressione `Cmd + Espaço`, digite `Terminal`, pressione Enter
- **Linux**: Pressione `Ctrl + Alt + T`

#### 2.2 Navegar para Pasta Desejada
```bash
cd C:\Users\SeuUsuario\Desktop
```

#### 2.3 Clonar o Repositório
```bash
git clone https://github.com/eduardofamilia01-hub/glucocare.git
cd glucocare
```

### Passo 3: Instalar Dependências

#### 3.1 Instalar Dependências do Projeto
```bash
npm install --legacy-peer-deps
```

#### 3.2 Instalar Expo CLI Globalmente
```bash
npm install -g @expo/cli
```

#### 3.3 Instalar EAS CLI Globalmente
```bash
npm install -g eas-cli
```

### Passo 4: Configurar Firebase

#### 4.1 Criar Projeto Firebase
1. Acesse [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Clique em "Criar um projeto"
3. Digite o nome: "GlucoCare"
4. Ative o Google Analytics (opcional)
5. Clique em "Criar projeto"

#### 4.2 Configurar Autenticação
1. No console Firebase, vá para "Authentication"
2. Clique em "Começar"
3. Vá para a aba "Sign-in method"
4. Habilite "Google"
5. Configure o nome do projeto
6. Salve as configurações

#### 4.3 Configurar Firestore
1. Vá para "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de teste"
4. Selecione uma localização (us-east1 recomendado)
5. Clique em "Concluído"

#### 4.4 Baixar Arquivos de Configuração
1. Vá para "Configurações do projeto"
2. Clique em "Adicionar app"
3. Selecione o ícone do Android
4. Digite o nome do pacote: `com.eduardofamilia01.glucocare`
5. Baixe o arquivo `google-services.json`
6. Coloque o arquivo na pasta `android/app/`

### Passo 5: Configurar Variáveis de Ambiente

#### 5.1 Criar Arquivo .env
Crie um arquivo `.env` na raiz do projeto:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key_aqui
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_domain_aqui
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id_aqui
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_bucket_aqui
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_aqui
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id_aqui
```

#### 5.2 Obter Chaves do Firebase
1. No console Firebase, vá para "Configurações do projeto"
2. Na seção "Seus apps", clique no ícone de configuração
3. Copie as chaves e cole no arquivo `.env`

### Passo 6: Executar a Aplicação

#### 6.1 Modo Desenvolvimento
```bash
npx expo start
```

#### 6.2 Para Android
```bash
npx expo run:android
```

#### 6.3 Para iOS
```bash
npx expo run:ios
```

### Passo 7: Testar a Instalação

#### 7.1 Verificar Funcionalidades
1. Abra o aplicativo no dispositivo/emulador
2. Faça login com sua conta Google
3. Adicione uma leitura de teste
4. Verifique se aparece no dashboard
5. Teste a navegação entre telas

#### 7.2 Verificar Sincronização
1. Adicione algumas leituras
2. Aguarde alguns segundos
3. Verifique no console Firebase se os dados aparecem
4. Teste em outro dispositivo (se disponível)

## Configuração do Firebase

### Estrutura de Segurança

#### Regras do Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Leituras de glicemia
    match /glucoseReadings/{readingId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Metas glicêmicas
    match /glycemicGoals/{goalId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### Configuração de Autenticação

#### Provedores Habilitados
- **Google**: Login com conta Google
- **Email/Senha**: Login tradicional (opcional)

#### Configurações de Domínio
- **Domínios autorizados**: Configurados automaticamente
- **Redirecionamento**: Configurado para o app

## Comandos e Scripts

### Scripts NPM Disponíveis

#### Comandos Básicos
```bash
# Iniciar aplicação em modo desenvolvimento
npm start

# Build para Android
npm run android

# Build para iOS
npm run ios

# Executar no navegador
npm run web

# Executar linting
npm run lint

# Formatar código
npm run format

# Executar testes
npm run test

# Push rápido para GitHub
npm run push:quick
```

### Scripts .bat Personalizados

#### 1. Build e Deploy
```bash
# Build APK local
.\build-apk.bat

# Build com EAS (nuvem)
.\build-with-eas.bat

# Build com Expo CLI
.\build-with-expo.bat

# Build simples
.\build-simple.bat
```

#### 2. Correção de Problemas
```bash
# Corrigir dependências
.\fix-dependencies-final.bat

# Corrigir package-lock.json
.\fix-package-lock-definitivo.bat

# Corrigir Gradle
.\fix-gradle-8.13.bat

# Corrigir plugins Expo
.\fix-expo-plugins.bat

# Sincronizar Git
.\fix-git-sync.bat
```

#### 3. Configuração
```bash
# Instalar EAS CLI
.\install-eas.bat

# Baixar Gradle Wrapper
.\download-gradle-wrapper.bat

# Limpar cache Gradle
.\clean-gradle-cache.bat

# Recriar pasta Android
.\recreate-android-folder.bat
```

#### 4. Git e Deploy
```bash
# Commit e push automático
.\commit.bat

# Push rápido
.\commit-quick.bat

# Configurar Git
.\setup-git.ps1
```

### Scripts PowerShell

#### Scripts Avançados
```powershell
# Baixar Gradle Wrapper
.\download-gradle-8.13.ps1

# Corrigir package-lock definitivamente
.\fix-package-lock-definitivo.ps1

# Baixar Gradle Wrapper
.\download-gradle-wrapper.ps1
```

### Como Usar os Scripts

#### Exemplo 1: Build Completo
```bash
# 1. Corrigir dependências
.\fix-dependencies-final.bat

# 2. Build com EAS
.\build-with-eas.bat

# 3. Push para GitHub
npm run push:quick
```

#### Exemplo 2: Desenvolvimento Diário
```bash
# 1. Iniciar desenvolvimento
npm start

# 2. Fazer mudanças no código
# 3. Testar no dispositivo
# 4. Commit e push
npm run push:quick
```

#### Exemplo 3: Resolver Problemas
```bash
# 1. Identificar problema
# 2. Usar script específico
.\fix-package-lock-definitivo.bat

# 3. Testar solução
npm start
```

## Roteiro de Testes da Aplicação

### Testes de Funcionalidades Básicas

#### 1. Autenticação
**Objetivo**: Verificar se o sistema de login funciona corretamente.

**Passos**:
1. Abrir aplicativo
2. Tocar em "Login com Google"
3. Selecionar conta Google
4. Aguardar redirecionamento
5. Verificar se chegou ao Dashboard

**Resultado Esperado**: Login bem-sucedido e acesso ao Dashboard.

**Resultado Obtido**: ✅ Login funcionando corretamente.

#### 2. Registro de Leituras
**Objetivo**: Testar a funcionalidade de adicionar leituras manualmente.

**Passos**:
1. Tocar no botão "+" no Dashboard
2. Digitar valor: "120"
3. Selecionar contexto: "Jejum"
4. Adicionar nota: "Teste matinal"
5. Tocar em "Salvar"

**Resultado Esperado**: Leitura salva e aparecendo no Dashboard.

**Resultado Obtido**: ✅ Leitura salva com sucesso.

#### 3. Visualização de Gráficos
**Objetivo**: Verificar se os gráficos são exibidos corretamente.

**Passos**:
1. Adicionar várias leituras com diferentes valores
2. Ir para tela "Gráficos"
3. Selecionar período "7 dias"
4. Verificar diferentes tipos de gráfico

**Resultado Esperado**: Gráficos exibidos com dados corretos.

**Resultado Obtido**: ✅ Gráficos funcionando perfeitamente.

#### 4. Configuração de Metas
**Objetivo**: Testar a personalização de metas glicêmicas.

**Passos**:
1. Ir para "Configurações"
2. Tocar em "Metas Glicêmicas"
3. Alterar meta de jejum para 80-110
4. Salvar configurações
5. Verificar se alertas são ajustados

**Resultado Esperado**: Metas salvas e alertas atualizados.

**Resultado Obtido**: ✅ Configurações salvas corretamente.

#### 5. Geração de Relatórios
**Objetivo**: Testar a criação de relatórios em PDF.

**Passos**:
1. Ir para "Relatórios"
2. Selecionar período "30 dias"
3. Escolher tipo "Resumo"
4. Tocar em "Gerar Relatório"
5. Verificar se PDF é criado

**Resultado Esperado**: PDF gerado com dados corretos.

**Resultado Obtido**: ✅ Relatório gerado com sucesso.

### Testes de Integração

#### 1. Sincronização com Firebase
**Objetivo**: Verificar se dados são sincronizados com a nuvem.

**Passos**:
1. Adicionar leitura no dispositivo
2. Aguardar 10 segundos
3. Verificar no console Firebase
4. Abrir app em outro dispositivo
5. Verificar se dados aparecem

**Resultado Esperado**: Dados sincronizados entre dispositivos.

**Resultado Obtido**: ✅ Sincronização funcionando.

#### 2. Modo Offline
**Objetivo**: Testar funcionamento sem conexão com internet.

**Passos**:
1. Desativar WiFi/dados móveis
2. Adicionar leitura
3. Verificar se é salva localmente
4. Reativar conexão
5. Verificar sincronização

**Resultado Esperado**: App funciona offline e sincroniza depois.

**Resultado Obtido**: ✅ Modo offline funcionando.

#### 3. Importação de Arquivos
**Objetivo**: Testar importação de dados de arquivos externos.

**Passos**:
1. Criar arquivo CSV com leituras
2. Ir para "Importar"
3. Selecionar arquivo
4. Confirmar importação
5. Verificar se dados aparecem

**Resultado Esperado**: Dados importados corretamente.

**Resultado Obtido**: ✅ Importação funcionando.

### Testes de Performance

#### 1. Carregamento de Dados
**Objetivo**: Verificar tempo de carregamento das telas.

**Passos**:
1. Medir tempo de abertura do Dashboard
2. Adicionar 100 leituras
3. Medir tempo de carregamento dos gráficos
4. Verificar uso de memória

**Resultado Esperado**: Carregamento rápido (< 2 segundos).

**Resultado Obtido**: ✅ Performance dentro do esperado.

#### 2. Responsividade
**Objetivo**: Testar responsividade em diferentes tamanhos de tela.

**Passos**:
1. Testar em smartphone pequeno
2. Testar em tablet
3. Verificar layout em orientação paisagem
4. Testar em diferentes resoluções

**Resultado Esperado**: Layout adaptável e funcional.

**Resultado Obtido**: ✅ Responsividade funcionando.

## Build e Deploy

### Build Local

#### Android
```bash
# Build de desenvolvimento
npx expo run:android

# Build de produção
eas build --platform android --profile production
```

#### iOS
```bash
# Build de desenvolvimento
npx expo run:ios

# Build de produção
eas build --platform ios --profile production
```

### Deploy

#### Google Play Store
1. Configure o projeto no Google Play Console
2. Gere o APK/AAB com EAS Build
3. Faça upload na Play Store
4. Configure metadados e screenshots
5. Publique a aplicação

#### Apple App Store
1. Configure o projeto no App Store Connect
2. Gere o IPA com EAS Build
3. Faça upload no App Store
4. Configure metadados e screenshots
5. Submeta para revisão

### Configuração EAS

#### eas.json
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

## Suporte

Para suporte técnico ou dúvidas sobre o projeto:

- **Email**: eduardofamilia01@gmail.com
- **GitHub**: [@eduardofamilia01-hub](https://github.com/eduardofamilia01-hub)
- **Issues**: [GitHub Issues](https://github.com/eduardofamilia01-hub/glucocare/issues)

### FAQ

**P: Como conectar um dispositivo Bluetooth?**
R: Vá para Configurações > Dispositivos > Conectar Novo Dispositivo

**P: Como gerar um relatório?**
R: Vá para Relatórios > Gerar Relatório > Selecione o período

**P: Como configurar alertas?**
R: Vá para Configurações > Alertas > Configure os limites

**P: Como importar dados de outro app?**
R: Use a funcionalidade de importação em Configurações > Importar

**P: Como sincronizar dados entre dispositivos?**
R: Faça login com a mesma conta Google em ambos os dispositivos

**P: Como fazer backup dos dados?**
R: Os dados são automaticamente sincronizados com o Firebase

## Licença

Este projeto está licenciado sob a licença MIT. Sinta-se à vontade para editar e distribuir este modelo como desejar.

Veja a [licença](./LICENSE) aqui para mais informações.

### Detalhes da Licença MIT

```
MIT License

Copyright (c) 2024 Eduardo Família

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Referência

### Documentação Oficial
- [Expo Documentation](https://docs.expo.dev/) - Acesso em: 11 out. 2024
- [React Native Documentation](https://reactnative.dev/) - Acesso em: 11 out. 2024
- [Firebase Documentation](https://firebase.google.com/docs) - Acesso em: 11 out. 2024
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - Acesso em: 11 out. 2024
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/) - Acesso em: 11 out. 2024

### Tutoriais e Guias
- [React Native Tutorial](https://reactnative.dev/docs/tutorial) - Acesso em: 11 out. 2024
- [Expo Getting Started](https://docs.expo.dev/get-started/installation/) - Acesso em: 11 out. 2024
- [Firebase Setup Guide](https://firebase.google.com/docs/android/setup) - Acesso em: 11 out. 2024
- [TypeScript with React Native](https://reactnative.dev/docs/typescript) - Acesso em: 11 out. 2024

### Comunidade
- [React Native Community](https://github.com/react-native-community) - Acesso em: 11 out. 2024
- [Expo Community](https://forums.expo.dev/) - Acesso em: 11 out. 2024
- [Firebase Community](https://firebase.google.com/community) - Acesso em: 11 out. 2024

### Ferramentas Utilizadas
- [Hackolade](https://hackolade.com/) - Para modelagem de banco de dados
- [Readme.so](https://readme.so/pt) - Editor de README
- [Thunder Client](https://www.thunderclient.com/) - Teste de APIs

## Agradecimento

Obrigado por esses recursos incríveis que foram usados durante o desenvolvimento do GlucoCare:

### Plataformas e Serviços:
- **Expo** - Plataforma de desenvolvimento React Native. [https://expo.dev/](https://expo.dev/)
- **Firebase** - Plataforma de serviços em nuvem do Google. [https://firebase.google.com/](https://firebase.google.com/)
- **React Native** - Framework para desenvolvimento móvel. [https://reactnative.dev/](https://reactnative.dev/)
- **TypeScript** - Linguagem de programação tipada. [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- **EAS Build** - Serviço de build em nuvem. [https://expo.dev/build](https://expo.dev/build)

### Ferramentas de Desenvolvimento:
- **Visual Studio Code** - Editor de código. [https://code.visualstudio.com/](https://code.visualstudio.com/)
- **GitHub** - Plataforma de desenvolvimento e versionamento. [https://github.com/](https://github.com/)
- **Hackolade** - Modelagem de banco de dados. [https://hackolade.com/](https://hackolade.com/)
- **Thunder Client** - Teste de APIs. [https://www.thunderclient.com/](https://www.thunderclient.com/)

### Comunidade e Recursos:
- **React Native Community** - Suporte e recursos da comunidade
- **Expo Community** - Documentação e exemplos
- **Firebase Community** - Guias e tutoriais
- **Stack Overflow** - Resolução de problemas
- **GitHub** - Código aberto e colaboração

### Inspiração:
- **MongoDB API RESTful** - [https://github.com/eduabjr/mongodb](https://github.com/eduabjr/mongodb) - Referência para documentação profissional
- **Comunidade Open Source** - Desenvolvedores que compartilham conhecimento
- **Usuários Diabéticos** - Inspiração para criar uma ferramenta útil

---

**Desenvolvido com ❤️ por Eduardo Família**

*GlucoCare - Monitoramento inteligente da glicemia*

---

## Sobre

Este projeto foi desenvolvido como uma solução completa para monitoramento de glicemia, combinando tecnologias modernas com uma interface intuitiva. A arquitetura híbrida (SQLite + Firestore) garante performance local e sincronização em nuvem, oferecendo a melhor experiência possível para usuários diabéticos.

### Características Técnicas:
- **Offline-First**: Funciona sem conexão com internet
- **Sincronização Inteligente**: Backup automático na nuvem
- **Performance Otimizada**: Acesso instantâneo aos dados
- **Escalabilidade**: Suporte a milhões de usuários
- **Segurança**: Autenticação e dados criptografados
- **Acessibilidade**: Interface adaptável e inclusiva

### Impacto Social:
O GlucoCare visa melhorar a qualidade de vida de pessoas com diabetes, oferecendo uma ferramenta completa para monitoramento e controle da glicemia, com insights baseados em dados e alertas personalizados.