# 🔄 Sistema de Atualização Automática - OptiClean Pro

## 📋 Como Funciona

O OptiClean Pro agora possui um sistema de atualização automática integrado que verifica e instala atualizações automaticamente.

### ✨ Funcionalidades

1. **Verificação Automática**
   - Verifica atualizações ao iniciar o aplicativo (após 5 segundos)
   - Verifica atualizações periodicamente a cada 4 horas
   - Funciona apenas em produção (desabilitado em desenvolvimento)

2. **Notificações**
   - Notificação desktop quando há atualização disponível
   - Notificação quando a atualização é baixada
   - Interface visual para gerenciar atualizações

3. **Controle do Usuário**
   - Usuário escolhe quando baixar a atualização
   - Usuário escolhe quando instalar (reiniciar aplicativo)
   - Pode verificar atualizações manualmente nas Configurações

## 🚀 Como Usar

### Para o Usuário Final

1. **Verificação Automática**
   - O app verifica automaticamente ao iniciar
   - Se houver atualização, uma notificação aparecerá

2. **Verificação Manual**
   - Vá em **Configurações** → **Preferências**
   - Clique em **"Verificar Atualizações"**
   - O diálogo de atualização será aberto

3. **Instalar Atualização**
   - Quando uma atualização estiver disponível, clique em **"Baixar Atualização"**
   - Aguarde o download completar
   - Clique em **"Reiniciar e Instalar"**
   - O aplicativo será reiniciado e a nova versão será instalada

## 🔧 Para Desenvolvedores

### Publicar Nova Versão

1. **Atualizar versão no package.json**
   ```json
   {
     "version": "1.2.0"
   }
   ```

2. **Criar release no GitHub**
   ```bash
   # Build e publicar
   npm run build:win
   
   # O electron-builder criará automaticamente uma release no GitHub
   # Certifique-se de ter configurado o GITHUB_TOKEN
   ```

3. **Configurar GitHub Token**
   - Crie um Personal Access Token no GitHub com permissão `repo`
   - Configure a variável de ambiente:
     ```bash
     export GH_TOKEN=seu_token_aqui
     ```

### Estrutura de Release

O electron-builder precisa de um arquivo `latest.json` ou `latest.yml` na release do GitHub com informações sobre a versão mais recente.

### Configuração do electron-builder

O `package.json` já está configurado com:
```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "eujoiaozin80-dot",
        "repo": "opticlean-pro",
        "releaseType": "release"
      }
    ]
  }
}
```

## 📝 Notas Importantes

1. **Desenvolvimento**: As atualizações são desabilitadas automaticamente em modo desenvolvimento
2. **GitHub Releases**: As atualizações são baixadas das releases do GitHub
3. **Reinicialização**: A atualização só é instalada quando o usuário reinicia o aplicativo
4. **Versão**: A versão atual é exibida nas Configurações

## 🐛 Troubleshooting

### Atualizações não aparecem
- Verifique se há uma release no GitHub com versão maior que a atual
- Verifique se o `latest.yml` ou `latest.json` foi gerado corretamente
- Verifique os logs em `%APPDATA%/OptiClean Pro/logs/system-monitor.log`

### Erro ao baixar atualização
- Verifique sua conexão com a internet
- Verifique se o GitHub está acessível
- Verifique se a release existe e está pública

### Atualização não instala
- Certifique-se de que o aplicativo tem permissões de administrador
- Verifique se o antivírus não está bloqueando a instalação

## 📦 Dependências

- `electron-updater`: ^6.1.7 (adicionado ao package.json)

---

**Última atualização:** 2025-01-28
