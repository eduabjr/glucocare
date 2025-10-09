# GlucoCare

Aplicativo móvel para monitoramento de glicemia desenvolvido com React Native e Expo.

## 📱 Sobre o Projeto

O GlucoCare é um aplicativo completo para gerenciamento de diabetes, oferecendo:

- 📊 Monitoramento de glicemia
- 📈 Gráficos e relatórios detalhados
- 🔗 Conexão Bluetooth com medidores
- 📁 Importação de dados via arquivos
- 🔐 Autenticação segura
- 🤖 Recomendações com IA
- 📱 Interface intuitiva e responsiva

## 🚀 Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento móvel
- **Expo** - Plataforma de desenvolvimento e deployment
- **TypeScript** - Linguagem de programação
- **Firebase** - Backend e autenticação
- **React Navigation** - Navegação entre telas
- **React Native BLE PLX** - Comunicação Bluetooth

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Expo CLI
- Android Studio (para desenvolvimento Android)
- Xcode (para desenvolvimento iOS)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/eduardofamilia01-hub/glucocare.git
cd glucocare
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm start
```

## 📱 Como Executar

### Expo Go
1. Instale o app Expo Go no seu dispositivo
2. Execute `npm start` no projeto
3. Escaneie o QR code com o Expo Go

### Desenvolvimento
- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Web**: `npm run web`

## 🏗️ Build

Para criar builds de produção:

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios

# Ambas as plataformas
eas build --platform all
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── dashboard/       # Componentes do dashboard
│   ├── device/          # Componentes de dispositivos
│   └── utils/           # Utilitários e helpers
├── config/              # Configurações
├── context/             # Contextos React
├── navigation/          # Configuração de navegação
├── screens/             # Telas do aplicativo
├── services/            # Serviços e APIs
└── utils/               # Utilitários gerais
```

## 🔧 Configuração

### Firebase
1. Configure o projeto Firebase
2. Adicione o arquivo `google-services.json` na raiz do projeto
3. Configure as variáveis de ambiente necessárias

### Expo
O projeto está configurado para usar o Expo com o owner `eduardofamilia01-hub`.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Contato

**Eduardo Família** - [@eduardofamilia01-hub](https://github.com/eduardofamilia01-hub)

Link do Projeto: [https://github.com/eduardofamilia01-hub/glucocare](https://github.com/eduardofamilia01-hub/glucocare)

---

Desenvolvido com ❤️ para ajudar no monitoramento da glicemia
