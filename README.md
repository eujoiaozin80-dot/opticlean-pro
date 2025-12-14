# 🚀 OptiClean Pro

Aplicativo desktop para monitoramento e otimização de sistema Windows, desenvolvido com Electron, React e TypeScript.

## ✨ Funcionalidades

### 📊 Monitoramento em Tempo Real
- **CPU**: Uso total e por núcleo, velocidade, histórico
- **Memória RAM**: Uso, disponível, histórico
- **Disco**: Espaço usado/livre, percentual
- **Rede**: Download/Upload em tempo real
- **Temperatura**: Monitoramento de CPU (quando disponível)
- **Processos**: Lista completa com CPU e RAM por processo

### 🧹 Limpeza do Sistema
- Remoção de arquivos temporários
- Limpeza de cache de navegadores
- Esvaziamento da lixeira
- Limpeza de logs do Windows
- Relatório detalhado de arquivos removidos

### ⚡ Otimização
- Otimização de memória RAM
- Pausa de serviços desnecessários
- Finalização de processos com alto uso de memória
- Ajuste de prioridade de processos

### 📈 Análise Completa
- Verificação de saúde do sistema
- Detecção de problemas
- Sugestões de melhorias
- Relatórios detalhados

### 🔐 Segurança
- Autenticação via Supabase
- Controle de acesso por roles
- Validação e sanitização de inputs
- Proteção contra command injection

### 📅 Agendamento
- Tarefas agendadas
- Limpezas automáticas
- Notificações de conclusão

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Desktop**: Electron 39
- **Backend**: Supabase (Auth + Database)
- **UI Components**: Radix UI, shadcn/ui
- **Gráficos**: Recharts
- **Build**: Vite, Electron Builder

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Windows 10/11

### Desenvolvimento

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/opticlean-pro.git
cd opticlean-pro

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env.local com:
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_supabase

# Executar em desenvolvimento
npm run dev
```

### Build para Produção

```bash
# Build para Windows
npm run build:win

# O executável estará em: release/
```

## 🚀 Scripts Disponíveis

- `npm run dev` - Executa React e Electron em desenvolvimento
- `npm run dev:react` - Apenas React (Vite)
- `npm run dev:electron` - Apenas Electron
- `npm run build` - Build completo (React + Electron)
- `npm run build:win` - Build para Windows
- `npm run build:clean` - Limpa pastas de build
- `npm run lint` - Executa ESLint

## 📁 Estrutura do Projeto

```
opticlean-pro/
├── electron/           # Código do Electron (main process)
│   ├── main.js        # Processo principal
│   └── preload.js     # Preload script (IPC bridge)
├── src/
│   ├── components/    # Componentes React
│   ├── hooks/         # Custom hooks
│   ├── pages/         # Páginas/rotas
│   ├── utils/         # Utilitários
│   ├── integrations/  # Integrações (Supabase)
│   └── types/         # TypeScript types
├── public/            # Arquivos estáticos
└── supabase/          # Migrations do Supabase
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```

### Supabase Setup

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations em `supabase/migrations/`
3. Configure as políticas RLS conforme necessário

Primeira release automatizada 🚀


## 🎯 Uso

### Primeiro Acesso
1. Execute o aplicativo
2. Crie uma conta ou faça login
3. O dashboard mostrará métricas em tempo real (quando executado via Electron)

### Limpeza do Sistema
1. Vá para o Dashboard
2. Clique em "Limpeza do Sistema"
3. Aguarde a conclusão
4. Veja o relatório de arquivos removidos

### Monitoramento
1. Acesse a página "Monitoramento"
2. Visualize métricas em tempo real
3. Veja gráficos históricos
4. Gerencie processos ativos

## 🔒 Segurança

- ✅ Validação de inputs
- ✅ Sanitização de comandos shell
- ✅ Proteção contra command injection
- ✅ Error boundaries
- ✅ Logging estruturado
- ✅ Validação de processos críticos

## 🐛 Troubleshooting

### Aplicativo não inicia
- Verifique se Node.js está instalado
- Execute `npm install` novamente
- Verifique as variáveis de ambiente

### Métricas não aparecem
- Certifique-se de executar via Electron (`npm run dev`)
- Verifique permissões do Windows
- Veja os logs em `%APPDATA%/OptiClean Pro/logs/`

### Erro de autenticação
- Verifique as credenciais do Supabase
- Confirme que as migrations foram executadas
- Verifique a conexão com a internet

## 📝 Licença

Este projeto é privado e proprietário.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📧 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato via email.

## 🗺️ Roadmap

- [ ] Testes automatizados
- [ ] Auto-updater
- [ ] Backup automático antes de limpezas
- [ ] Whitelist de processos protegidos
- [ ] Relatórios avançados (CSV, Excel)
- [ ] Integração com Windows Defender
- [ ] Análise de disco por pasta
- [ ] Modo de segurança com preview

---
Release pipeline configurado com sucesso 🚀

**Desenvolvido com ❤️ usando Electron e React**

