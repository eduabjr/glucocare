# GlucoCare - Aplicativo de Monitoramento de Glicemia

![GlucoCare Logo](./assets/icon.png)

**Licença** | **Teste Local** | **Teste Cloud** | **Membros do Grupo**

## Sumário

- [Sobre](#sobre)
- [Objetivos do Projeto](#objetivos-do-projeto)
- [Membros do Grupo](#membros-do-grupo)
- [Começando](#começando)
- [Tecnologias Empregadas](#tecnologias-empregadas)
- [Instrução de Uso](#instrução-de-uso)
- [Pré-requisitos](#pré-requisitos)
- [Instrução de Instalação](#instrução-de-instalação)
- [Configuração do Firebase](#configuração-do-firebase)
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

## Instrução de Uso

### Funcionalidades Disponíveis

#### 1. Dashboard
- Visualização de leituras recentes
- Estatísticas rápidas
- Acesso rápido às funcionalidades principais

#### 2. Registro de Leituras
- Adição manual de leituras
- Seleção de contexto (jejum, pré-refeição, etc.)
- Adição de notas personalizadas

#### 3. Análise e Gráficos
- Visualização de tendências
- Gráficos de linha e barras
- Análise temporal dos dados

#### 4. Configurações
- Personalização de metas glicêmicas
- Configuração de alertas
- Gerenciamento de perfil

#### 5. Relatórios
- Geração de relatórios em PDF
- Compartilhamento de dados
- Histórico detalhado

## Pré-requisitos

### Desenvolvimento
- **Node.js**: Versão 18 ou superior
- **npm**: Gerenciador de pacotes
- **Expo CLI**: Ferramenta de desenvolvimento
- **Git**: Controle de versão

### Dispositivo
- **Android**: API 24 (Android 7.0) ou superior
- **iOS**: iOS 15.1 ou superior
- **Bluetooth**: Para integração com dispositivos

### Contas e Serviços
- **Conta Expo**: Para builds e deploy
- **Conta Google**: Para autenticação OAuth
- **Conta Firebase**: Para serviços em nuvem

## Instrução de Instalação

### 1. Clone o Repositório
```bash
git clone https://github.com/eduardofamilia01-hub/glucocare.git
cd glucocare
```

### 2. Instale as Dependências
```bash
npm install --legacy-peer-deps
```

### 3. Configure o Ambiente
```bash
# Instale o Expo CLI globalmente
npm install -g @expo/cli

# Instale o EAS CLI para builds
npm install -g eas-cli
```

### 4. Configure as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

### 5. Execute a Aplicação
```bash
# Modo desenvolvimento
npx expo start

# Para Android
npx expo run:android

# Para iOS
npx expo run:ios
```

## Configuração do Firebase

### 1. Crie um Projeto Firebase
1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Clique em "Criar um projeto"
3. Siga as instruções para configurar o projeto

### 2. Configure a Autenticação
1. No console Firebase, vá para "Authentication"
2. Clique em "Começar"
3. Habilite "Google" como provedor de autenticação
4. Configure os domínios autorizados

### 3. Configure o Firestore
1. Vá para "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha o modo de produção
4. Configure as regras de segurança

### 4. Baixe o arquivo de configuração
1. Vá para "Configurações do projeto"
2. Baixe o arquivo `google-services.json` (Android)
3. Baixe o arquivo `GoogleService-Info.plist` (iOS)
4. Coloque os arquivos nas pastas apropriadas

## Roteiro de Testes da Aplicação

### Testes de Funcionalidades Básicas

#### 1. Autenticação
- ✅ Login com Google OAuth
- ✅ Logout
- ✅ Persistência de sessão
- ✅ Recuperação de senha

#### 2. Registro de Leituras
- ✅ Adição manual de leituras
- ✅ Validação de campos obrigatórios
- ✅ Seleção de contexto glicêmico
- ✅ Adição de notas

#### 3. Dashboard
- ✅ Exibição de leituras recentes
- ✅ Cálculo de estatísticas
- ✅ Navegação entre seções

#### 4. Gráficos e Análises
- ✅ Visualização de tendências
- ✅ Filtros por período
- ✅ Gráficos responsivos

#### 5. Configurações
- ✅ Personalização de metas
- ✅ Configuração de alertas
- ✅ Gerenciamento de perfil

### Testes de Integração

#### 1. Bluetooth
- ✅ Descoberta de dispositivos
- ✅ Conexão com dispositivos
- ✅ Recebimento de dados
- ✅ Tratamento de erros

#### 2. Sincronização
- ✅ Backup para Firebase
- ✅ Restauração de dados
- ✅ Resolução de conflitos
- ✅ Modo offline

#### 3. Relatórios
- ✅ Geração de PDF
- ✅ Compartilhamento
- ✅ Diferentes formatos

### Testes de Performance

#### 1. Carregamento
- ✅ Tempo de inicialização
- ✅ Carregamento de dados
- ✅ Renderização de gráficos

#### 2. Memória
- ✅ Uso de memória
- ✅ Vazamentos de memória
- ✅ Garbage collection

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

#### Apple App Store
1. Configure o projeto no App Store Connect
2. Gere o IPA com EAS Build
3. Faça upload no App Store

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
    "production": {}
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

## Licença

Este projeto está licenciado sob a licença MIT. Sinta-se à vontade para editar e distribuir este modelo como desejar.

Veja a [licença](./LICENSE) aqui para mais informações.

## Referência

- [Expo Documentation](https://docs.expo.dev/) - Acesso em: 11 out. 2024
- [React Native Documentation](https://reactnative.dev/) - Acesso em: 11 out. 2024
- [Firebase Documentation](https://firebase.google.com/docs) - Acesso em: 11 out. 2024
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - Acesso em: 11 out. 2024
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/) - Acesso em: 11 out. 2024

## Agradecimento

Obrigado por esses recursos incríveis que foram usados durante o desenvolvimento do GlucoCare:

### Links Úteis:
- **Expo** - Plataforma de desenvolvimento React Native. [https://expo.dev/](https://expo.dev/)
- **Firebase** - Plataforma de serviços em nuvem do Google. [https://firebase.google.com/](https://firebase.google.com/)
- **React Native** - Framework para desenvolvimento móvel. [https://reactnative.dev/](https://reactnative.dev/)
- **TypeScript** - Linguagem de programação tipada. [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- **EAS Build** - Serviço de build em nuvem. [https://expo.dev/build](https://expo.dev/build)
- **Visual Studio Code** - Editor de código. [https://code.visualstudio.com/](https://code.visualstudio.com/)
- **GitHub** - Plataforma de desenvolvimento e versionamento. [https://github.com/](https://github.com/)

### Comunidade:
- **React Native Community** - Comunidade ativa de desenvolvedores
- **Expo Community** - Suporte e recursos da comunidade Expo
- **Firebase Community** - Documentação e exemplos da comunidade

---

**Desenvolvido com ❤️ por Eduardo Família**

*GlucoCare - Monitoramento inteligente da glicemia*