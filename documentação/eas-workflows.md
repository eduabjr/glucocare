# EAS Workflows - GlucoCare

## Configuração de Workflows Automatizados

Este projeto inclui workflows EAS para automatizar builds, updates e submissões do app GlucoCare.

## Workflows Disponíveis

### 1. Build Android Preview
**Arquivo:** `.eas/workflows/build-android-preview.yml`

**Trigger:**
- Push para branches `main` ou `develop`
- Execução manual via `workflow_dispatch`

**Comando manual:**
```bash
eas workflow:run build-android-preview.yml
```

**Uso:** Para testes internos e validação de funcionalidades.

### 2. Build Android Production
**Arquivo:** `.eas/workflows/build-android-production.yml`

**Trigger:**
- Push para branch `main`
- Execução manual via `workflow_dispatch`

**Comando manual:**
```bash
eas workflow:run build-android-production.yml
```

**Uso:** Para builds de produção que serão enviados para a Play Store.

### 3. Publish Update (Over-the-Air)
**Arquivo:** `.eas/workflows/publish-update.yml`

**Trigger:**
- Push para qualquer branch
- Execução manual via `workflow_dispatch`

**Comando manual:**
```bash
eas workflow:run publish-update.yml
```

**Uso:** Para enviar atualizações OTA sem precisar de nova versão na store.

### 4. Submit Android to Play Store
**Arquivo:** `.eas/workflows/submit-android.yml`

**Trigger:**
- Push para branch `main`
- Execução manual via `workflow_dispatch`

**Comando manual:**
```bash
eas workflow:run submit-android.yml
```

**Uso:** Para enviar automaticamente o app para a Play Store.

## Como Usar

### 1. Configuração Inicial

1. **Conectar repositório GitHub:**
   - Vá para [GitHub settings](https://expo.dev/accounts/[account]/projects/[projectName]/github)
   - Instale o GitHub App
   - Conecte o repositório do GlucoCare

2. **Configurar credenciais:**
   ```bash
   eas credentials
   ```

### 2. Execução Automática

Os workflows são executados automaticamente quando você faz push para as branches configuradas:

- **Desenvolvimento:** Push para `develop` → Build Preview
- **Produção:** Push para `main` → Build Production + Submit + Update

### 3. Execução Manual

Para executar workflows manualmente:

```bash
# Build de preview
eas workflow:run build-android-preview.yml

# Build de produção
eas workflow:run build-android-production.yml

# Publicar update OTA
eas workflow:run publish-update.yml

# Enviar para Play Store
eas workflow:run submit-android.yml
```

## Fluxo de Desenvolvimento Recomendado

### 1. Desenvolvimento
```bash
# Fazer mudanças no código
git add .
git commit -m "feat: nova funcionalidade"
git push origin develop
# → Build Preview automático
```

### 2. Release
```bash
# Merge para main
git checkout main
git merge develop
git push origin main
# → Build Production + Submit + Update automáticos
```

### 3. Hotfix
```bash
# Update OTA para correções rápidas
eas workflow:run publish-update.yml
```

## Monitoramento

- **Logs:** Acesse [expo.dev](https://expo.dev) → Seu projeto → Workflows
- **Status:** Cada workflow mostra status de sucesso/falha
- **Notificações:** Configure notificações no Expo Dashboard

## Troubleshooting

### Build falha
1. Verifique logs no Expo Dashboard
2. Confirme credenciais: `eas credentials`
3. Teste localmente: `eas build --platform android --profile preview`

### Submit falha
1. Verifique se o app está aprovado na Play Console
2. Confirme certificados: `eas credentials`
3. Verifique metadados do app no `app.json`

### Update não funciona
1. Confirme se o usuário tem a versão mais recente
2. Verifique logs de update no Expo Dashboard
3. Teste em dispositivo físico

## Comandos Úteis

```bash
# Ver status dos builds
eas build:list

# Ver status dos updates
eas update:list

# Ver credenciais
eas credentials

# Configurar projeto
eas build:configure

# Login no EAS
eas login
```

## Próximos Passos

1. **Configure notificações** no Expo Dashboard
2. **Teste os workflows** com commits de teste
3. **Configure branches de proteção** no GitHub
4. **Adicione testes automatizados** (opcional)
5. **Configure CI/CD** para validações adicionais (opcional)
