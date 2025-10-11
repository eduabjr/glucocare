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
- 📱 **Dashboard Intuitivo**: Visão geral das leituras recentes com estatísticas em tempo real
- 📊 **Gráficos e Análises**: Visualização de tendências glicêmicas com múltiplos tipos de gráficos
- 🔔 **Sistema de Alertas**: Notificações personalizáveis e lembretes de medicação
- 📱 **Integração Bluetooth**: Conectividade com dispositivos de medição
- 📄 **Relatórios Detalhados**: Geração de relatórios em PDF com proteção biométrica
- ☁️ **Sincronização em Nuvem**: Backup automático dos dados com Firebase
- 🔐 **Autenticação Segura**: Login com Google OAuth e biometria
- 🤖 **IA para Nutrição**: Sugestões alimentares personalizadas com múltiplos provedores de IA
- 🔒 **Segurança Avançada**: Autorização biométrica para relatórios e dados sensíveis
- 📱 **Funcionamento Offline**: Acesso completo aos dados mesmo sem internet
- 🔄 **Sincronização Inteligente**: Atualização automática entre dispositivos

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

### 🤖 **Integração com Inteligência Artificial**
- **Google Gemini API**: Provedor principal de IA (gratuito e generoso)
- **OpenAI GPT**: Provedor alternativo (premium)
- **Hugging Face**: Provedor de fallback
- **Sistema de Fallback**: Sugestões pré-definidas se APIs falharem
- **Personalização Completa**: Baseado em perfil médico do usuário
- **Múltiplas Sugestões**: Cardápio, receitas, alimentos recomendados/evitados

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

### 📱 **TELAS DO APLICATIVO - GUIA COMPLETO**

O GlucoCare possui **18 telas principais** organizadas em diferentes fluxos de navegação. Cada tela possui funcionalidades específicas para oferecer uma experiência completa de monitoramento de glicemia.

---

## 🔐 **TELAS DE AUTENTICAÇÃO**

### 1. **LoginScreen** 
**Arquivo**: `src/screens/LoginScreen.tsx`
**Função**: Tela principal de login com múltiplas opções de autenticação.

**Funcionalidades**:
- ✅ **Login com Email/Senha**: Autenticação tradicional
- ✅ **Login com Google**: Integração OAuth completa
- ✅ **Login Biométrico**: Autenticação por impressão digital/reconhecimento facial
- ✅ **Verificação de Email**: Sistema de confirmação de email
- ✅ **Recuperação de Senha**: Link para reset de senha
- ✅ **Auto-login**: Login automático com biometria configurada

**Como usar**:
1. Digite email e senha ou toque em "Login com Google"
2. Para biometria: configure uma vez, depois login automático
3. Se esqueceu a senha: toque em "Esqueci minha senha"
4. Verifique email se solicitado

### 2. **RegisterScreen**
**Arquivo**: `src/screens/RegisterScreen.tsx`
**Função**: Criação de nova conta de usuário.

**Funcionalidades**:
- ✅ **Cadastro com Email/Senha**: Criação de conta tradicional
- ✅ **Validação de Formulário**: Verificação de campos obrigatórios
- ✅ **Confirmação de Senha**: Validação de senhas iguais
- ✅ **Navegação para Login**: Redirecionamento após cadastro

### 3. **ForgotPasswordScreen**
**Arquivo**: `src/screens/ForgotPasswordScreen.tsx`
**Função**: Recuperação de senha via email.

**Funcionalidades**:
- ✅ **Reset por Email**: Envio de link de recuperação
- ✅ **Validação de Email**: Verificação de formato válido
- ✅ **Feedback Visual**: Confirmação de envio

### 4. **ResetPasswordScreen**
**Arquivo**: `src/screens/ResetPasswordScreen.tsx`
**Função**: Criação de nova senha após recuperação.

**Funcionalidades**:
- ✅ **Nova Senha**: Criação de senha segura
- ✅ **Confirmação**: Validação de senhas iguais
- ✅ **Redirecionamento**: Volta ao login após sucesso

---

## 👤 **TELAS DE ONBOARDING**

### 5. **LoadingScreen**
**Arquivo**: `src/screens/LoadingScreen.tsx`
**Função**: Tela de carregamento durante inicialização.

**Funcionalidades**:
- ✅ **Indicador de Progresso**: Loading animado
- ✅ **Verificação de Estado**: Checa autenticação e dados
- ✅ **Redirecionamento Inteligente**: Direciona para tela correta

### 6. **ProfileSetupScreen**
**Arquivo**: `src/screens/ProfileSetupScreen.tsx`
**Função**: Configuração inicial do perfil do usuário.

**Funcionalidades**:
- ✅ **Dados Pessoais**: Nome, email, data de nascimento
- ✅ **Informações Médicas**: Tipo de diabetes, peso, altura
- ✅ **Restrições Alimentares**: Alergias e preferências
- ✅ **Validação Completa**: Verificação de todos os campos
- ✅ **Navegação Progressiva**: Fluxo guiado de configuração

### 7. **BiometricSetupScreen**
**Arquivo**: `src/screens/BiometricSetupScreen.tsx`
**Função**: Configuração de autenticação biométrica.

**Funcionalidades**:
- ✅ **Verificação de Hardware**: Checa disponibilidade de biometria
- ✅ **Configuração de Biometria**: Ativa impressão digital/reconhecimento facial
- ✅ **Armazenamento Seguro**: Salva credenciais criptografadas
- ✅ **Teste de Funcionamento**: Validação da configuração
- ✅ **Fallback para Senha**: Opção de usar senha se biometria falhar

### 8. **GlycemicGoalScreen**
**Arquivo**: `src/screens/GlycemicGoalScreen.tsx`
**Função**: Configuração de metas glicêmicas personalizadas.

**Funcionalidades**:
- ✅ **Metas por Período**: Jejum, pré-refeição, pós-refeição, antes de dormir
- ✅ **Valores Personalizáveis**: Limites mínimos e máximos
- ✅ **Lembretes de Medicação**: Agendamento de alertas
- ✅ **Validação de Valores**: Verificação de ranges seguros
- ✅ **Salvamento Automático**: Persistência das configurações

---

## 🏠 **TELAS PRINCIPAIS**

### 9. **DashboardScreen** ⭐
**Arquivo**: `src/screens/DashboardScreen.tsx`
**Função**: Tela principal com visão geral das leituras e estatísticas.

**Funcionalidades**:
- ✅ **Leituras Recentes**: Lista das últimas 5 leituras
- ✅ **Estatísticas em Tempo Real**: Média, máximo, mínimo, tendências
- ✅ **Cards de Status**: Indicadores visuais de controle glicêmico
- ✅ **Ações Rápidas**: Botões para adicionar leitura, ver gráficos
- ✅ **Recomendações Inteligentes**: Sugestões baseadas em padrões
- ✅ **Atualização Automática**: Dados sempre atualizados
- ✅ **Navegação Rápida**: Acesso direto a todas as funcionalidades

**Como usar**:
1. Visualize leituras recentes no topo
2. Monitore estatísticas nos cards coloridos
3. Use botões de ação para funcionalidades rápidas
4. Toque em leituras para editar ou deletar

### 10. **AddReadingScreen**
**Arquivo**: `src/screens/AddReadingScreen.tsx`
**Função**: Adicionar novas leituras de glicemia manualmente.

**Funcionalidades**:
- ✅ **Entrada de Valor**: Campo numérico para glicemia
- ✅ **Contexto de Refeição**: Jejum, pré/pós-refeição, antes de dormir, madrugada
- ✅ **Notas Personalizadas**: Campo de texto livre
- ✅ **Validação de Dados**: Verificação de valores válidos
- ✅ **Data/Hora Automática**: Timestamp automático
- ✅ **Salvamento Local**: Persistência imediata no SQLite
- ✅ **Sincronização**: Upload automático para Firebase

**Como usar**:
1. Digite o valor da glicemia (ex: 120)
2. Selecione o contexto da refeição
3. Adicione notas se necessário
4. Toque em "Salvar"
5. A leitura aparece imediatamente no Dashboard

### 11. **ChartsScreen**
**Arquivo**: `src/screens/ChartsScreen.tsx`
**Função**: Visualização de gráficos e análises das leituras.

**Funcionalidades**:
- ✅ **Gráficos Interativos**: Linha, barras, área
- ✅ **Períodos Flexíveis**: 7 dias, 30 dias, 90 dias, personalizado
- ✅ **Filtros Avançados**: Por contexto de refeição, horário
- ✅ **Zoom e Pan**: Navegação detalhada nos gráficos
- ✅ **Exportação**: Salvar imagens dos gráficos
- ✅ **Análise de Tendências**: Identificação de padrões
- ✅ **Comparação de Períodos**: Análise comparativa

**Como usar**:
1. Selecione o período desejado
2. Escolha o tipo de gráfico
3. Use gestos para zoom e navegação
4. Toque em pontos para ver detalhes
5. Exporte gráficos se necessário

### 12. **NutritionScreen** 🤖 **COM INTEGRAÇÃO IA**
**Arquivo**: `src/screens/NutritionScreen.tsx`
**Função**: Sugestões alimentares personalizadas com inteligência artificial.

**🤖 Funcionalidades de IA**:
- ✅ **Múltiplos Provedores**: Google Gemini, OpenAI GPT, Hugging Face
- ✅ **Fallback Inteligente**: Sugestões pré-definidas se APIs falharem
- ✅ **Personalização Completa**: Baseado em idade, condição, peso, altura, IMC
- ✅ **Cardápio Diário**: Café, almoço, jantar, lanches personalizados
- ✅ **Receitas Rápidas**: Pratos fáceis de preparar (≤15min)
- ✅ **Alimentos Recomendados**: Lista específica por condição médica
- ✅ **Alimentos a Evitar**: Baseado na condição do usuário
- ✅ **Justificativa das Escolhas**: Explicação das recomendações
- ✅ **Atualização em Tempo Real**: Regenerar sugestões com um toque

**📊 Dados Considerados pela IA**:
- **Condição Médica**: Diabetes tipo 1/2, pré-diabetes
- **Características Físicas**: Peso, altura, idade, IMC
- **Restrições Alimentares**: Alergias, preferências
- **Objetivos**: Controle glicêmico, perda de peso, etc.

**🔄 Como usar**:
1. Configure seu perfil completo (peso, altura, condição)
2. Toque em "Atualizar" para gerar sugestões com IA
3. Visualize cardápio personalizado
4. Veja receitas rápidas e fáceis
5. Consulte alimentos recomendados e a evitar
6. Use as sugestões como guia (não substitui orientação médica)

**🎯 Exemplos de Sugestões por Condição**:
- **Diabetes Tipo 1**: Controle rigoroso de carboidratos
- **Diabetes Tipo 2**: Foco em alimentos de baixo índice glicêmico
- **Pré-diabetes**: Prevenção com alimentação saudável

### 13. **ReportScreen** 🔐 **COM AUTORIZAÇÃO BIOMÉTRICA**
**Arquivo**: `src/screens/ReportScreen.tsx`
**Função**: Geração de relatórios detalhados em PDF com proteção biométrica.

**Funcionalidades**:
- ✅ **Geração de PDF**: Relatórios profissionais em PDF
- ✅ **Períodos Flexíveis**: Semanal, mensal, trimestral, anual
- ✅ **Tipos de Relatório**: Resumo, detalhado, médico
- ✅ **Compartilhamento**: Email, WhatsApp, salvar local
- ✅ **Download Direto**: Salvar no dispositivo
- ✅ **Autorização Biométrica**: Proteção por impressão digital/reconhecimento facial
- ✅ **Dados Estatísticos**: Médias, tendências, padrões
- ✅ **Visualizações**: Gráficos incluídos nos relatórios

**🔐 Segurança**:
- **Proteção por Biometria**: Acesso apenas com autenticação biométrica
- **Verificação de Hardware**: Checa disponibilidade de biometria
- **Fallback para Senha**: Opção de usar senha se biometria não disponível

**Como usar**:
1. Toque em "Gerar Relatório"
2. Autorize com biometria quando solicitado
3. Selecione período e tipo de relatório
4. Aguarde geração do PDF
5. Compartilhe ou salve o relatório

### 14. **SettingsScreen**
**Arquivo**: `src/screens/SettingsScreen.tsx`
**Função**: Configurações gerais do aplicativo.

**Funcionalidades**:
- ✅ **Metas Glicêmicas**: Personalização de limites
- ✅ **Notificações**: Configuração de alertas
- ✅ **Sincronização**: Controle de backup em nuvem
- ✅ **Privacidade**: Configurações de dados
- ✅ **Perfil**: Edição de informações pessoais
- ✅ **Sobre**: Informações do aplicativo
- ✅ **Logout**: Sair da conta

---

## 🔗 **TELAS DE INTEGRAÇÃO**

### 15. **DeviceConnectionScreen**
**Arquivo**: `src/screens/DeviceConnectionScreen.tsx`
**Função**: Conexão com dispositivos Bluetooth de medição.

**Funcionalidades**:
- ✅ **Busca de Dispositivos**: Escaneamento Bluetooth
- ✅ **Conexão Automática**: Pairing simplificado
- ✅ **Importação de Dados**: Leituras automáticas
- ✅ **Histórico de Dispositivos**: Lista de dispositivos conectados
- ✅ **Configuração Avançada**: Parâmetros de conexão
- ✅ **Status de Conexão**: Indicador visual de conectividade

**Como usar**:
1. Ative o Bluetooth no dispositivo
2. Toque em "Buscar Dispositivos"
3. Selecione seu medidor de glicemia
4. Toque em "Conectar"
5. As leituras serão importadas automaticamente

### 16. **ProfileEditScreen**
**Arquivo**: `src/screens/ProfileEditScreen.tsx`
**Função**: Edição completa do perfil do usuário.

**Funcionalidades**:
- ✅ **Dados Pessoais**: Nome, email, data de nascimento
- ✅ **Informações Médicas**: Condição, peso, altura
- ✅ **Restrições**: Alergias e preferências alimentares
- ✅ **Validação de Email**: Verificação de novo email
- ✅ **Salvamento Automático**: Sincronização em tempo real
- ✅ **Histórico de Alterações**: Log de modificações

---

## 📧 **TELAS DE GERENCIAMENTO**

### 17. **ChangeEmailScreen**
**Arquivo**: `src/screens/ChangeEmailScreen.tsx`
**Função**: Alteração do email da conta.

**Funcionalidades**:
- ✅ **Validação de Email**: Verificação de formato
- ✅ **Confirmação de Senha**: Segurança adicional
- ✅ **Verificação de Email**: Confirmação por email
- ✅ **Atualização Segura**: Processo validado

### 18. **ViewReportScreen**
**Arquivo**: `src/screens/ViewReportScreen.tsx`
**Função**: Visualização de relatórios gerados.

**Funcionalidades**:
- ✅ **Visualização de PDF**: Leitor integrado
- ✅ **Compartilhamento**: Envio por diferentes canais
- ✅ **Histórico**: Lista de relatórios gerados
- ✅ **Filtros**: Busca por período ou tipo

---

## 🎯 **FLUXO DE NAVEGAÇÃO**

### **Fluxo de Primeiro Uso**:
```
LoginScreen → ProfileSetupScreen → BiometricSetupScreen → GlycemicGoalScreen → DashboardScreen
```

### **Fluxo de Usuário Logado**:
```
DashboardScreen ↔ ChartsScreen ↔ AddReadingScreen ↔ NutritionScreen ↔ ReportScreen ↔ SettingsScreen
```

### **Fluxo de Configuração**:
```
SettingsScreen → ProfileEditScreen / GlycemicGoalScreen / DeviceConnectionScreen
```

---

## 📊 **RESUMO DAS FUNCIONALIDADES**

| Tela | Funcionalidade Principal | IA | Biometria | Offline |
|------|-------------------------|----|-----------|---------| 
| **DashboardScreen** | Visão geral e estatísticas | ❌ | ❌ | ✅ |
| **AddReadingScreen** | Adicionar leituras | ❌ | ❌ | ✅ |
| **ChartsScreen** | Gráficos e análises | ❌ | ❌ | ✅ |
| **NutritionScreen** | Sugestões alimentares | ✅ | ❌ | ✅ |
| **ReportScreen** | Relatórios em PDF | ❌ | ✅ | ✅ |
| **SettingsScreen** | Configurações gerais | ❌ | ❌ | ✅ |
| **DeviceConnectionScreen** | Bluetooth e importação | ❌ | ❌ | ✅ |

**Legenda**: ✅ = Disponível | ❌ = Não disponível

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

### Passo 4.5: Configurar Coleções do Firestore

**📊 RESUMO DAS 5 COLEÇÕES NECESSÁRIAS:**

| # | Coleção | Tipo | Localização |
|---|---------|------|-------------|
| 1 | `users` | **Coleção Principal** | Raiz do Firestore |
| 2 | `readings` | **Subcoleção** | Dentro do documento `users` |
| 3 | `notifications` | **Coleção Principal** | Raiz do Firestore |
| 4 | `reports` | **Coleção Principal** | Raiz do Firestore |
| 5 | `sync_meta` | **Coleção Principal** | Raiz do Firestore |

**🎯 ESTRUTURA FINAL:**
```
Firestore Database/
├── users/ (coleção principal)
│   └── [ID_auto_gerado]/
│       ├── campos do usuário...
│       └── readings/ (subcoleção)
│           └── [ID_auto_gerado]/
│               └── campos da leitura...
├── notifications/ (coleção principal)
├── reports/ (coleção principal)
└── sync_meta/ (coleção principal)
```

---

#### 4.5.1 Criar Coleção `users` (Coleção Principal)

1. **Acessar Firestore Database**
   - No console Firebase, vá para "Firestore Database"
   - Clique na aba "Dados"

2. **Criar Coleção `users`**
   - Clique em "+ Iniciar coleção"
   - **ID da coleção**: `users`
   - **ID do primeiro documento**: Deixe vazio (Firebase gera automaticamente)

3. **Adicionar Campos do Documento `users`**
   
   | Campo | Tipo | Valor |
   |-------|------|-------|
   | `id` | String | `9Fz97YAMUNgZwmGRMISN` |
   | `full_name` | String | `Eduardo Família` |
   | `email` | String | `eduardofamilia01@gmail.com` |
   | `google_id` | String | `google_123456789` |
   | `onboarding_completed` | Boolean | `true` |
   | `biometric_enabled` | Boolean | `true` |
   | `weight` | Number | `70.5` |
   | `height` | Number | `175` |
   | `birth_date` | String | `1990-01-15T00:00:00Z` |
   | `diabetes_condition` | String | `Type 1` |
   | `restriction` | String | `Sem lactose` |
   | `glycemic_goals` | String | `{"fasting": [70, 100]}` |
   | `medication_reminders` | String | `[{"time": "08:00", "med": "Insulina"}]` |
   | `updated_at` | String | `2024-01-15T14:30:05Z` |
   | `email_verified` | Boolean | `true` |
   | `pending_sync` | Boolean | `false` |

#### 4.5.2 Criar Subcoleção `readings` (dentro do documento do usuário)

**⚠️ IMPORTANTE:** `readings` é uma **SUBSCOLEÇÃO**, não uma coleção principal!

1. **Navegar para o Documento do Usuário**
   - Clique no documento que você criou na coleção `users`
   - Você verá os campos do usuário

2. **Criar Subcoleção `readings`**
   - **DENTRO do documento do usuário**, clique em "+ Iniciar coleção"
   - **ID da coleção**: `readings`
   - **ID do primeiro documento**: Deixe vazio (Firebase gera automaticamente)

3. **Adicionar Campos do Documento `readings`**
   
   | Campo | Tipo | Valor |
   |-------|------|-------|
   | `id` | String | `reading_abc123` |
   | `user_id` | String | `9Fz97YAMUNgZwmGRMISN` |
   | `measurement_time` | String | `2024-01-15T08:30:00Z` |
   | `glucose_level` | Number | `120` |
   | `meal_context` | String | `jejum` |
   | `time_since_meal` | String | `2 horas` |
   | `notes` | String | `Antes do exercício` |
   | `updated_at` | String | `2024-01-15T08:30:05Z` |
   | `deleted` | Boolean | `false` |
   | `pending_sync` | Boolean | `false` |

**🎯 RESULTADO ESPERADO:**
```
users/
  └── [ID_do_usuario]/
      ├── campos do usuário...
      └── readings/ (subcoleção)
          └── [ID_auto_gerado]/
              └── campos da leitura...
```

#### 4.5.3 Criar Coleção `notifications` (Coleção Principal)

1. **Voltar para Lista de Coleções**
   - Clique em "Firestore Database" no menu lateral
   - Você verá a lista de coleções

2. **Criar Coleção `notifications`**
   - Clique em "+ Iniciar coleção"
   - **ID da coleção**: `notifications`
   - **ID do primeiro documento**: Deixe vazio (Firebase gera automaticamente)

3. **Adicionar Campos do Documento `notifications`**
   
   | Campo | Tipo | Valor |
   |-------|------|-------|
   | `id` | String | `notification_123456` |
   | `user_id` | String | `9Fz97YAMUNgZwmGRMISN` |
   | `type` | String | `medication_reminder` |
   | `message` | String | `Hora de medir a glicemia` |
   | `scheduled_time` | String | `2024-01-15T14:30:00Z` |
   | `sent_time` | String | `2024-01-15T14:30:05Z` |
   | `status` | String | `scheduled` |
   | `updated_at` | String | `2024-01-15T14:30:05Z` |
   | `deleted` | Boolean | `false` |
   | `pending_sync` | Boolean | `false` |

#### 4.5.4 Criar Coleção `reports` (Coleção Principal)

1. **Criar Coleção `reports`**
   - Clique em "+ Iniciar coleção"
   - **ID da coleção**: `reports`
   - **ID do primeiro documento**: Deixe vazio (Firebase gera automaticamente)

2. **Adicionar Campos do Documento `reports`**
   
   | Campo | Tipo | Valor |
   |-------|------|-------|
   | `id` | String | `report_abc789` |
   | `user_id` | String | `9Fz97YAMUNgZwmGRMISN` |
   | `type` | String | `monthly` |
   | `title` | String | `Relatório Mensal - Janeiro 2024` |
   | `start_date` | String | `2024-01-01T00:00:00Z` |
   | `end_date` | String | `2024-01-31T23:59:59Z` |
   | `file_url` | String | `gs://bucket/relatorio.pdf` |
   | `summary_data` | Map | `{"avg_glucose": 120, "total_readings": 45}` |
   | `created_at` | String | `2024-01-31T23:59:59Z` |
   | `updated_at` | String | `2024-01-31T23:59:59Z` |
   | `deleted` | Boolean | `false` |
   | `pending_sync` | Boolean | `false` |

#### 4.5.5 Criar Coleção `sync_meta` (Coleção Principal)

1. **Criar Coleção `sync_meta`**
   - Clique em "+ Iniciar coleção"
   - **ID da coleção**: `sync_meta`
   - **ID do primeiro documento**: `9Fz97YAMUNgZwmGRMISN` (use o user_id)

2. **Adicionar Campos do Documento `sync_meta`**
   
   | Campo | Tipo | Valor |
   |-------|------|-------|
   | `id` | String | `9Fz97YAMUNgZwmGRMISN` |
   | `user_id` | String | `9Fz97YAMUNgZwmGRMISN` |
   | `last_sync` | String | `2024-01-15T14:30:00Z` |
   | `last_pull` | String | `2024-01-15T14:25:00Z` |
   | `last_push` | String | `2024-01-15T14:30:00Z` |
   | `sync_status` | String | `success` |
   | `updated_at` | String | `2024-01-15T14:30:05Z` |
   | `error_message` | **(deixe vazio)** | **null** |

#### 4.5.6 Configurar Regras de Segurança

1. **Acessar Regras do Firestore**
   - No console Firebase, vá para "Firestore Database"
   - Clique na aba "Regras"

2. **Substituir Regras Existentes**
   - Substitua o conteúdo por:

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

3. **Publicar Regras**
   - Clique em "Publicar"

#### 4.5.7 Verificar Estrutura Final

**Sua estrutura final deve ficar assim:**

```
Firestore Database
├── users (coleção principal)
│   └── [ID_auto_gerado] (documento do usuário)
│       ├── campos do usuário...
│       └── readings (subcoleção)
│           └── [ID_auto_gerado] (documento de leitura)
│               └── campos da leitura...
├── notifications (coleção principal)
│   └── [ID_auto_gerado] (documento de notificação)
│       └── campos da notificação...
├── reports (coleção principal)
│   └── [ID_auto_gerado] (documento de relatório)
│       └── campos do relatório...
└── sync_meta (coleção principal)
    └── 9Fz97YAMUNgZwmGRMISN (documento com ID = user_id)
        └── campos de sincronização...
```

### ⚠️ **IMPORTANTE - DICAS PARA CONFIGURAÇÃO:**

1. **IDs Automáticos**: Para `users`, `notifications` e `reports`, deixe o Firebase gerar IDs automaticamente
2. **ID Manual**: Para `sync_meta`, use o `user_id` como ID do documento
3. **Subcoleção**: `readings` deve ser criada DENTRO do documento do usuário
4. **Campo `error_message`**: Deixe vazio para que seja `null`
5. **Valores de Exemplo**: Use os valores da tabela, mas adapte para seus dados reais
6. **Regras de Segurança**: Configure as regras para proteger os dados de cada usuário

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

#### 5.3 Configurar Chaves de IA (Opcional)
Para ativar as funcionalidades de IA na NutritionScreen, adicione as chaves de API:

```env
# Google Gemini (Recomendado - Gratuito)
EXPO_PUBLIC_GEMINI_API_KEY=sua_chave_gemini_aqui

# OpenAI GPT (Opcional - Pago)
EXPO_PUBLIC_OPENAI_API_KEY=sua_chave_openai_aqui

# Hugging Face (Opcional - Limitado)
EXPO_PUBLIC_HUGGINGFACE_API_KEY=sua_chave_huggingface_aqui
```

**🔑 Como obter as chaves**:
- **Google Gemini**: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- **OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Hugging Face**: [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

**⚠️ Nota**: Se não configurar as chaves, a NutritionScreen funcionará com sugestões pré-definidas baseadas na condição médica do usuário.

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

## Configuração do Google Login (Expo Go)

### 📋 **Informações Importantes para Desenvolvimento**

#### 1. Porta do Servidor Expo

Para que o Google Login funcione corretamente no Expo Go, é recomendado usar a **porta 8098**:

```bash
npx expo start --clear --port 8098
```

**Portas utilizadas:**
- **Porta Expo (recomendada):** `8098`
- **Porta Web (desenvolvimento):** `19006` (padrão do Expo para web)

### 🔑 **Credenciais do Google Cloud Console**

#### Web Client ID (Principal)
Este é o Client ID usado no código do aplicativo para autenticação:

```
360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com
```

**Onde é usado:** `src/services/authService.ts` no campo `androidClientId` (compatibilidade com Expo Go)

#### Android Client ID (Configuração)
Este Client ID é específico para a plataforma Android no Google Cloud Console:

```
360317541807-19cbu2121eftbm4d9p50mk3okma4bhtj.apps.googleusercontent.com
```

**Configuração Android:**
- **Nome do Pacote:** `com.eduabjr.glucocare`
- **SHA-1:** `DF:6E:9E:11:2F:5C:A8:50:50:74:2A:CA:05:05:8D:46:AF:FD:8B:4C`

### 🌐 **APIs Necessárias no Google Cloud**

Ative as seguintes APIs no seu projeto `glucocare-e68c8`:

1. **Google People API** ✅
   - Essencial para obter informações do perfil do usuário
   - Ativação: Google Cloud Console > APIs e serviços > Biblioteca

2. **Google+ API** (opcional)
   - Funcionalidades adicionais de perfil
   - Geralmente ativada automaticamente

### ⚙️ **Configuração no Google Cloud Console**

#### URIs de Redirecionamento Autorizadas

No OAuth 2.0 Client ID "Glucocare Expo Client", adicione:

```
https://auth.expo.io/@eduabjr/glucocare
https://auth.expo.io/@anonymous/glucocare
```

**✅ Configuração Atual:**
- ✅ `https://auth.expo.io/@eduabjr/glucocare` (projeto publicado)
- ✅ `https://auth.expo.io/@anonymous/glucocare` (Expo Go em desenvolvimento)

#### Origens JavaScript Autorizadas

Adicione as seguintes origens:

```
https://auth.expo.io
https://localhost:19006
```

### 💻 **Configuração no Código**

#### `src/services/authService.ts`

```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
    // Web Client ID do Google Cloud Console
    androidClientId: "360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com",
    scopes: ["profile", "email"],
    redirectUri: "https://auth.expo.io/@anonymous/glucocare"
});
```

**Importante:**
- O `androidClientId` usa o **Web Client ID** para compatibilidade com Expo Go
- O `redirectUri` aponta para `@anonymous` quando não logado no Expo CLI

#### `app.config.js`

```javascript
export default {
  expo: {
    name: "GlucoCare",
    slug: "glucocare",
    scheme: "glucocare",
    android: {
      package: "com.glucocare.app",
      config: {
        googleSignIn: {
          androidClientId: "360317541807-19cbu2121eftbm4d9p50mk3okma4bhtj.apps.googleusercontent.com"
        }
      }
    }
  }
};
```

### 🔧 **Diferença: Web vs Android Client ID**

| Configuração | Client ID Usado | Onde |
|-------------|-----------------|------|
| **Expo Go (Android)** | Web Client ID | `authService.ts` |
| **Expo Go (iOS)** | Web Client ID | `authService.ts` |
| **Build Nativo (Android)** | Android Client ID | `app.config.js` |
| **Web Browser** | Web Client ID | Automático |

### ✅ **Checklist de Configuração**

- [ ] Web Client ID adicionado em `authService.ts`
- [ ] Android Client ID configurado no Google Cloud Console
- [ ] URIs de redirecionamento adicionadas no Google Cloud Console
- [ ] Origens JavaScript autorizadas no Google Cloud Console
- [ ] Google People API ativada
- [ ] Porta 8098 disponível para o Expo
- [ ] `app.config.js` configurado corretamente

### 🚨 **Problemas Comuns e Soluções**

#### Erro: "redirect_uri_mismatch"
**Causa:** URI de redirecionamento não autorizada no Google Cloud Console  
**Solução:** Adicionar `https://auth.expo.io/@anonymous/glucocare` nas URIs autorizadas

#### Erro: "Client Id property must be defined"
**Causa:** `androidClientId` não configurado corretamente  
**Solução:** Usar o Web Client ID em `authService.ts`

#### Erro: "Something went wrong trying to finish signing in"
**Causa:** Origens JavaScript não autorizadas  
**Solução:** Adicionar `https://auth.expo.io` nas origens autorizadas

### 🎨 **Configuração da Tela de Consentimento OAuth (Branding)**

Esta seção detalha as informações de branding e domínio do seu aplicativo, que são exibidas aos usuários na tela de consentimento do Google.

#### Informações do Aplicativo

- **Nome do Aplicativo:** `GlucoCare`
  - *Onde configurar:* Google Cloud Console > APIs e serviços > Tela de consentimento OAuth > Informações do aplicativo
- **Logotipo do Aplicativo:**
  - *Descrição:* Um logotipo com o texto "GlucoCare" e um ícone de folha/gota verde
  - *Onde configurar:* Google Cloud Console > APIs e serviços > Tela de consentimento OAuth > Logotipo do aplicativo
- **E-mail para suporte do usuário:** `eduardo.junior1@uscsonline.com.br`
  - *Onde configurar:* Google Cloud Console > APIs e serviços > Tela de consentimento OAuth > E-mail para suporte do usuário

#### Domínio do Aplicativo

Estes URLs são exibidos na tela de consentimento e devem ser acessíveis:

- **Página inicial do aplicativo:** `https://glucocare.com`
  - *Onde configurar:* Google Cloud Console > APIs e serviços > Tela de consentimento OAuth > Domínio do aplicativo > Página inicial
- **Link da Política de Privacidade:** `https://glucocare.com/privacy`
  - *Onde configurar:* Google Cloud Console > APIs e serviços > Tela de consentimento OAuth > Domínio do aplicativo > Link da Política de Privacidade
- **Link dos Termos de Serviço:** `https://glucocare.com/terms`
  - *Onde configurar:* Google Cloud Console > APIs e serviços > Tela de consentimento OAuth > Domínio do aplicativo > Link dos Termos de Serviço

#### Domínios Autorizados

Estes domínios são usados para validar os redirecionamentos:

- `expo.lo` (para desenvolvimento Expo)
- `glucocare.com` (domínio principal)
  - *Onde configurar:* Google Cloud Console > APIs e serviços > Tela de consentimento OAuth > Domínios autorizados

#### Dados de Contato do Desenvolvedor

- **Endereço de e-mail:** `eduardo.junior1@uscsonline.com.br`
  - *Onde configurar:* Google Cloud Console > APIs e serviços > Tela de consentimento OAuth > Dados de contato do desenvolvedor

#### Status da Verificação

- **Status atual:** "A verificação não é obrigatória"
- **Recomendação:** Para aplicações de produção, considere verificar o domínio para aumentar a confiança dos usuários

### 📋 **Checklist Completo de Configuração OAuth**

- [ ] ✅ Web Client ID configurado em `authService.ts`
- [ ] ✅ Android Client ID configurado no Google Cloud Console
- [ ] ✅ URIs de redirecionamento autorizadas
- [ ] ✅ Origens JavaScript autorizadas
- [ ] ✅ Google People API ativada
- [ ] ✅ Porta 8098 disponível para o Expo
- [ ] ✅ `app.config.js` configurado corretamente
- [ ] ✅ **NOME DO APLICATIVO** configurado na tela de consentimento
- [ ] ✅ **LOGOTIPO** adicionado na tela de consentimento
- [ ] ✅ **DOMÍNIO DO APLICATIVO** configurado (página inicial, política de privacidade, termos)
- [ ] ✅ **DOMÍNIOS AUTORIZADOS** adicionados (`expo.lo`, `glucocare.com`)
- [ ] ✅ **E-MAIL DE SUPORTE** configurado
- [ ] ✅ **DADOS DE CONTATO** do desenvolvedor preenchidos

## Configuração do Firebase - Passo a Passo Completo

### 📋 **Pré-requisitos**

Antes de começar, você precisa de:
- ✅ Conta Google ativa
- ✅ Nome do projeto: `GlucoCare`
- ✅ Pacote Android: `com.glucocare.app`
- ✅ Bundle iOS: `com.glucocare.app`

### 🚀 **PASSO 1: Criar Projeto Firebase**

#### 1.1 Acessar o Firebase Console
1. **Abra o navegador** e acesse: https://console.firebase.google.com/
2. **Faça login** com sua conta Google
3. **Clique em** "Criar um projeto" ou "Adicionar projeto"

#### 1.2 Configurar o Projeto
1. **Nome do projeto:** Digite `GlucoCare`
2. **ID do projeto:** Deixe o Firebase gerar automaticamente (ex: `glucocare-e68c8`)
3. **Google Analytics:** ✅ **Marque "Habilitar"** (recomendado)
4. **Clique em** "Criar projeto"
5. **Aguarde** a criação (pode levar alguns minutos)

### 🔐 **PASSO 2: Configurar Authentication**

#### 2.1 Habilitar Authentication
1. **No painel lateral**, clique em "Authentication"
2. **Clique em** "Começar"
3. **Vá para a aba** "Sign-in method"

#### 2.2 Configurar Google Sign-In
1. **Clique em** "Google" na lista de provedores
2. **Ative** o toggle "Habilitar"
3. **Nome do projeto:** `GlucoCare`
4. **E-mail de suporte:** `eduardo.junior1@uscsonline.com.br`
5. **Clique em** "Salvar"

#### 2.3 Configurar Email/Senha (Opcional)
1. **Clique em** "Email/senha"
2. **Ative** o toggle "Habilitar"
3. **Clique em** "Salvar"

### 🗄️ **PASSO 3: Configurar Firestore Database**

#### 3.1 Criar o Banco de Dados
1. **No painel lateral**, clique em "Firestore Database"
2. **Clique em** "Criar banco de dados"
3. **Modo de início:** Selecione "Iniciar no modo de teste" (para desenvolvimento)
4. **Localização:** Escolha `us-central1` (Iowa) ou `southamerica-east1` (São Paulo)
5. **Clique em** "Concluído"

#### 3.2 Configurar Regras de Segurança
1. **Na aba "Regras"**, substitua o código por:

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

3. **Clique em** "Publicar"

### 📱 **PASSO 4: Adicionar Aplicativo Android**

#### 4.1 Registrar App Android
1. **Na página inicial** do projeto Firebase, clique no ícone **Android** (🟢)
2. **Nome do pacote Android:** Digite `com.glucocare.app`
3. **Apelido do app:** `GlucoCare Android`
4. **Chave de assinatura SHA-1:** Digite `DF:6E:9E:11:2F:5C:A8:50:50:74:2A:CA:05:05:8D:46:AF:FD:8B:4C`
5. **Clique em** "Registrar app"

#### 4.2 Baixar google-services.json
1. **Clique em** "Baixar google-services.json"
2. **Salve o arquivo** na pasta `android/app/` do seu projeto
3. **Clique em** "Próxima"

#### 4.3 Configurar Gradle
1. **Siga as instruções** do Firebase (geralmente já configurado)
2. **Clique em** "Próxima"
3. **Clique em** "Continuar no console"

### 🍎 **PASSO 5: Adicionar Aplicativo iOS (Opcional)**

#### 5.1 Registrar App iOS
1. **Na página inicial** do projeto Firebase, clique no ícone **iOS** (🍎)
2. **ID do pacote iOS:** Digite `com.glucocare.app`
3. **Apelido do app:** `GlucoCare iOS`
4. **Clique em** "Registrar app"

#### 5.2 Baixar GoogleService-Info.plist
1. **Clique em** "Baixar GoogleService-Info.plist"
2. **Adicione ao projeto** iOS (se usando)
3. **Clique em** "Próxima"

### 🌐 **PASSO 6: Adicionar Aplicativo Web**

#### 6.1 Registrar App Web
1. **Na página inicial** do projeto Firebase, clique no ícone **Web** (</>)
2. **Apelido do app:** `GlucoCare Web`
3. **Marque** "Também configurar o Firebase Hosting" (opcional)
4. **Clique em** "Registrar app"

#### 6.2 Configurar SDK
1. **Copie o código** de configuração do Firebase
2. **Cole no arquivo** `src/config/firebase-config.ts`

### 📊 **PASSO 7: Configurar Coleções do Firestore**

#### 7.1 Criar Coleção `users`
1. **Vá para** Firestore Database > Dados
2. **Clique em** "+ Iniciar coleção"
3. **ID da coleção:** `users`
4. **ID do documento:** Deixe vazio (Firebase gera automaticamente)
5. **Adicione campos** conforme a estrutura definida na documentação

#### 7.2 Criar Coleção `notifications`
1. **Clique em** "+ Iniciar coleção"
2. **ID da coleção:** `notifications`
3. **Configure campos** conforme documentação

#### 7.3 Criar Coleção `reports`
1. **Clique em** "+ Iniciar coleção"
2. **ID da coleção:** `reports`
3. **Configure campos** conforme documentação

#### 7.4 Criar Coleção `sync_meta`
1. **Clique em** "+ Iniciar coleção"
2. **ID da coleção:** `sync_meta`
3. **ID do documento:** Use o `user_id` (ex: `9Fz97YAMUNgZwmGRMISN`)
4. **Configure campos** conforme documentação

### 🔑 **PASSO 8: Obter Chaves de Configuração**

#### 8.1 Acessar Configurações do Projeto
1. **Clique no ícone** de configurações (⚙️) ao lado de "Visão geral do projeto"
2. **Vá para** "Seus apps"
3. **Encontre seu app** Android/iOS/Web

#### 8.2 Copiar Configurações
Para cada app, copie as seguintes chaves:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCvVmOXpVZsV6Bs3k73SUr-0G0j2tu7aLQ",
  authDomain: "glucocare-e68c8.firebaseapp.com",
  projectId: "glucocare-e68c8",
  storageBucket: "glucocare-e68c8.appspot.com",
  messagingSenderId: "501715449083",
  appId: "1:501715449083:android:8b781286cf0f02d752ac5e"
};
```

### ✅ **PASSO 9: Verificar Configuração**

#### 9.1 Testar Authentication
1. **Vá para** Authentication > Usuários
2. **Teste o login** com Google no app
3. **Verifique se** o usuário aparece na lista

#### 9.2 Testar Firestore
1. **Vá para** Firestore Database > Dados
2. **Adicione uma leitura** no app
3. **Verifique se** os dados aparecem no Firestore

#### 9.3 Verificar Regras
1. **Vá para** Firestore Database > Regras
2. **Teste as regras** no simulador
3. **Certifique-se** de que apenas dados próprios são acessíveis

### 🚨 **Problemas Comuns e Soluções**

#### Erro: "Firebase App named '[DEFAULT]' already exists"
**Causa:** Firebase já foi inicializado  
**Solução:** Verifique se não há múltiplas inicializações no código

#### Erro: "Permission denied"
**Causa:** Regras do Firestore bloqueando acesso  
**Solução:** Verifique se o usuário está autenticado e se as regras estão corretas

#### Erro: "google-services.json not found"
**Causa:** Arquivo não está na pasta correta  
**Solução:** Coloque o arquivo em `android/app/google-services.json`

### 📋 **Checklist de Configuração Firebase**

- [ ] ✅ Projeto Firebase criado
- [ ] ✅ Authentication configurado (Google + Email/Senha)
- [ ] ✅ Firestore Database criado
- [ ] ✅ Regras de segurança configuradas
- [ ] ✅ App Android registrado
- [ ] ✅ google-services.json baixado e colocado em `android/app/`
- [ ] ✅ App iOS registrado (se necessário)
- [ ] ✅ App Web registrado
- [ ] ✅ Chaves de configuração copiadas
- [ ] ✅ Coleções do Firestore criadas
- [ ] ✅ Teste de Authentication realizado
- [ ] ✅ Teste de Firestore realizado
- [ ] ✅ Regras de segurança testadas

### 🔧 **Configurações Avançadas**

#### Storage (Opcional)
1. **Vá para** Storage
2. **Clique em** "Começar"
3. **Configure** para armazenar relatórios PDF

#### Analytics (Opcional)
1. **Vá para** Analytics
2. **Configure** eventos personalizados
3. **Monitore** uso do app

#### Functions (Opcional)
1. **Vá para** Functions
2. **Configure** funções serverless
3. **Implemente** lógica de backend

### 📚 **Estrutura de Segurança Final**

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
- **Google**: Login com conta Google ✅
- **Email/Senha**: Login tradicional ✅

#### Configurações de Domínio
- **Domínios autorizados**: Configurados automaticamente ✅
- **Redirecionamento**: Configurado para o app ✅

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