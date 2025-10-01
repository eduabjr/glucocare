# Configuração Google OAuth para Produção - GlucoCare

## Configuração Atual (app.json)

### Client IDs Configurados:
- **expoClientId/webClientId**: `360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com`
- **androidClientId**: `360317541807-19cbu2121eftbm4d9p50mk3okma4bhtj.apps.googleusercontent.com`
- **iosClientId**: `360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com`

## Configuração no Google Cloud Console

### 1. Web Application Client (para Expo Go e desenvolvimento)
- **Client ID**: `360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com`
- **Authorized JavaScript Origins**:
  - `https://auth.expo.io`
- **Authorized Redirect URIs**:
  - `https://auth.expo.io/@eduabjr/glucocare`

### 2. Android Client (para builds nativos)
- **Client ID**: `360317541807-19cbu2121eftbm4d9p50mk3okma4bhtj.apps.googleusercontent.com`
- **Package Name**: `com.eduabjr.glucocare`
- **SHA-1 Fingerprints** (adicione TODOS):

#### Para Desenvolvimento (Expo Go):
```
DF:6E:9E:11:2F:5C:A8:50:50:74:2A:CA:05:05:8D:46:AF:FD:8B:4C
```

#### Para Produção (EAS Build):
Execute este comando para obter o SHA-1 do seu build de produção:
```bash
eas credentials
```
Ou verifique nos logs do build EAS.

### 3. iOS Client (se necessário)
- **Client ID**: `360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com`
- **Bundle ID**: `com.eduabjr.glucocare`

## Passos para Resolver o Erro 404

### 1. Adicionar SHA-1 do Expo Go
No Google Cloud Console, no Android Client:
1. Vá para "Clientes OAuth 2.0"
2. Edite o cliente Android
3. Adicione este SHA-1: `DF:6E:9E:11:2F:5C:A8:50:50:74:2A:CA:05:05:8D:46:AF:FD:8B:4C`
4. Salve as alterações

### 2. Verificar Package Name
Confirme que o package name no Google Console é exatamente: `com.eduabjr.glucocare`

### 3. Aguardar Propagação
As configurações podem levar 5-10 minutos para propagar.

## Para Produção (EAS Build)

### 1. Obter SHA-1 do Build de Produção
```bash
# Instalar EAS CLI se não tiver
npm install -g @expo/eas-cli

# Fazer login
eas login

# Verificar credenciais
eas credentials
```

### 2. Adicionar SHA-1 de Produção
No Google Cloud Console, adicione o SHA-1 obtido do EAS Build ao Android Client.

### 3. Build de Produção
```bash
# Build para Android
eas build --platform android

# Build para iOS (se necessário)
eas build --platform ios
```

## Verificação Final

### Teste em Desenvolvimento:
1. Execute `npx expo start --android`
2. Teste o login com Google no Expo Go
3. Deve funcionar sem erro 404

### Teste em Produção:
1. Faça o build com EAS
2. Instale o APK/IPA gerado
3. Teste o login com Google
4. Deve funcionar normalmente

## Troubleshooting

### Erro 404 Persistente:
1. Verifique se o SHA-1 está correto
2. Confirme o package name
3. Aguarde mais tempo para propagação
4. Limpe cache do app

### Erro de Client ID:
1. Verifique se os Client IDs no app.json correspondem aos do Google Console
2. Confirme se está usando o Client ID correto para cada plataforma

## Notas Importantes

- **Domínios estáveis**: `auth.expo.io` é gerenciado pelo Expo e não vai mudar
- **Configuração única**: Uma vez configurado corretamente, funciona para desenvolvimento e produção
- **SHA-1 múltiplos**: Você pode ter vários SHA-1 no mesmo cliente (desenvolvimento + produção)
- **Propagação**: Mudanças no Google Console podem levar até algumas horas para propagar

