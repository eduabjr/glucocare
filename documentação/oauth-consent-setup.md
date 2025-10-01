# Configuração OAuth Consent Screen - GlucoCare

## Erro Atual
"Error 400: invalid_request" - App não está em conformidade com políticas OAuth 2.0

## Solução Passo a Passo

### 1. Configurar OAuth Consent Screen

**No Google Cloud Console → OAuth consent screen:**

#### App Information:
- **App name**: `GlucoCare`
- **User support email**: `eduardo.familia01@gmail.com`
- **App logo**: Upload do logo (opcional)
- **App domain**: `glucocare.com` (ou domínio que você tem)
- **Developer contact information**: `eduardo.familia01@gmail.com`

#### Authorized domains:
- `glucocare.com`
- `auth.expo.io`

#### Scopes:
- `email` - See your primary Google Account email address
- `profile` - See your personal info, including any personal info you've made publicly available
- `openid` - Associate you with your personal info on Google

#### Optional:
- **Privacy policy URL**: `https://glucocare.com/privacy`
- **Terms of service URL**: `https://glucocare.com/terms`

### 2. Adicionar Usuários de Teste

**Para desenvolvimento, adicione:**
- `eduardo.familia01@gmail.com`
- Outras contas que você quer testar

### 3. Verificar Clientes OAuth

#### Web Client:
- **Client ID**: `360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com`
- **Authorized JavaScript origins**: `https://auth.expo.io`
- **Authorized redirect URIs**: `https://auth.expo.io/@eduabjr/glucocare`

#### Android Client:
- **Client ID**: `360317541807-19cbu2121eftbm4d9p50mk3okma4bhtj.apps.googleusercontent.com`
- **Package name**: `com.eduabjr.glucocare`
- **SHA-1**: `DF:6E:9E:11:2F:5C:A8:50:50:74:2A:CA:05:05:8D:46:AF:FD:8B:4C`

### 4. Status de Publicação

**Para desenvolvimento:**
- Mantenha como "Testing"
- Adicione usuários de teste
- Funciona apenas para contas adicionadas

**Para produção:**
- Submeta para verificação do Google
- Pode levar semanas para aprovação
- Enquanto isso, use usuários de teste

## Solução Imediata

1. **Vá para OAuth consent screen**
2. **Adicione `eduardo.familia01@gmail.com` como usuário de teste**
3. **Preencha todos os campos obrigatórios**
4. **Salve as configurações**
5. **Aguarde 5-10 minutos**
6. **Teste novamente**

## Verificação Final

- ✅ App name preenchido
- ✅ Support email configurado
- ✅ Domínios autorizados
- ✅ Escopos corretos
- ✅ Usuários de teste adicionados
- ✅ Clientes OAuth configurados

## Próximos Passos

1. **Desenvolvimento**: Use usuários de teste
2. **Produção**: Submeta para verificação do Google
3. **Monitoramento**: Verifique logs de erro no Google Console

