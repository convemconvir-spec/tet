# Sistema de Gestão Empresarial

Este é um sistema web para gestão de revendedores, produtos, kits, liquidações e finanças, desenvolvido com React e Vite.

## 📋 Funcionalidades

### Dashboard
- Visão geral dos dados principais
- Estatísticas e métricas do negócio
- Cards informativos com dados em tempo real

### Gestão de Revendedores
- Listagem, criação, edição e exclusão de revendedores
- Busca e filtros por diversos critérios
- Importação de dados

### Gestão de Produtos
- Cadastro e gerenciamento de produtos
- Controle de estoque e informações detalhadas
- Upload de imagens/arquivos

### Gestão de Kits
- Criação e administração de kits de produtos
- Associação de produtos a kits
- Gerenciamento de preços

### Gestão de Liquidações
- Registro e acompanhamento de liquidações
- Assinatura digital com canvas
- Histórico de transações

### Gestão Financeira
- Visualização de transações financeiras
- Relatórios e análises
- Gráficos de desempenho

### Mapa de Rotas
- Visualização de rotas e localizações
- Integração com mapas
- Rastreamento de entregas

### Outros Recursos
- Autenticação de usuários
- Upload de arquivos
- Interface responsiva com Tailwind CSS
- Componentes UI modernos com shadcn/ui
- Armazenamento local com localStorage

## 🔧 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior) - [Download](https://nodejs.org/)
- **npm** (incluído com Node.js) ou **yarn**
- **Git** (opcional, para clonar o repositório)
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

### Verificar Instalação

Para verificar se tudo está instalado corretamente:

```bash
node --version
npm --version
```

## 🚀 Instalação e Configuração

### 1. Clonagem do Repositório

Se você tiver o Git instalado:

```bash
git clone <url-do-repositorio>
cd tetse
```

Ou, se tiver um arquivo ZIP:

```bash
# Extraia o arquivo ZIP para uma pasta
cd tetse
```

### 2. Instalação de Dependências

Na raiz do projeto, execute:

```bash
npm install
```

Isso vai instalar todas as dependências listadas em `package.json`, incluindo React, Vite, Tailwind CSS, etc.

### 3. Configuração do Ambiente

**Não há variáveis de ambiente necessárias!** 

O sistema utiliza armazenamento local (localStorage) e não requer configurações externas. Todos os dados são salvos localmente no navegador.

### 4. Execução em Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em:
```
http://localhost:5173
```

A página será atualizada automaticamente quando você fizer alterações no código.

### 5. Build para Produção

Para criar a versão otimizada para produção:

```bash
npm run build
```

Os arquivos de produção serão gerados na pasta `dist/`.

### 6. Preview da Build

Para visualizar a build de produção localmente:

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
tetse/
├── src/
│   ├── api/                    # Camada de API (removido base44)
│   ├── components/
│   │   ├── layout/             # Layouts (Sidebar, AppLayout)
│   │   ├── settlements/        # Componentes de liquidações
│   │   ├── shared/             # Componentes compartilhados
│   │   └── ui/                 # Componentes UI (shadcn/ui)
│   ├── hooks/                  # Hooks customizados (use-mobile, etc)
│   ├── lib/
│   │   ├── localDb.js          # 🔑 Banco de dados local (substitui base44)
│   │   ├── AuthContext.jsx     # Contexto de autenticação
│   │   ├── app-params.js       # Parâmetros da aplicação
│   │   ├── query-client.js     # Configuração do React Query
│   │   └── utils.js            # Funções utilitárias
│   ├── pages/                  # Páginas da aplicação
│   │   ├── Dashboard.jsx       # Página inicial
│   │   ├── Finance.jsx         # Gestão financeira
│   │   ├── Kits.jsx            # Gestão de kits
│   │   ├── MapRoutes.jsx       # Mapa de rotas
│   │   ├── Products.jsx        # Gestão de produtos
│   │   ├── Resellers.jsx       # Gestão de revendedores
│   │   ├── Settlements.jsx     # Gestão de liquidações
│   │   ├── Backup.jsx          # Backup de dados
│   │   └── MapRoutes.jsx       # Mapeamento de rotas
│   ├── utils/                  # Utilitários gerais
│   ├── App.jsx                 # Componente raiz
│   ├── main.jsx                # Ponto de entrada
│   └── index.css               # Estilos globais
├── entities/                   # Definições de entidades
├── public/                     # Arquivos estáticos
├── package.json                # Dependências do projeto
├── vite.config.js              # Configuração do Vite
├── tailwind.config.js          # Configuração do Tailwind CSS
├── eslint.config.js            # Configuração do ESLint
├── postcss.config.js           # Configuração do PostCSS
├── jsconfig.json               # Configuração JavaScript
└── README.md                   # Este arquivo

```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Data Storage**: Local Storage (localStorage)
- **Linting**: ESLint
- **Package Manager**: npm

## 📖 Guia de Uso

### 🗂️ Navegação
Use a barra lateral à esquerda para navegar entre as diferentes seções do sistema:
- **Dashboard**: Visão geral
- **Revendedores**: Gerenciar revendedores
- **Produtos**: Gerenciar produtos
- **Kits**: Gerenciar kits
- **Liquidações**: Registrar liquidações
- **Finanças**: Visualizar dados financeiros
- **Mapa de Rotas**: Ver rotas

### 🔐 Autenticação
O sistema inclui autenticação básica. Dados de usuário são armazenados localmente no localStorage para persistência entre sessões.

### ⚙️ CRUD Operations
Cada módulo (Revendedores, Produtos, etc.) permite:
- **Criar** (C): Adicionar novos registros usando o botão "Novo"
- **Ler** (R): Visualizar listas e detalhes dos registros
- **Atualizar** (U): Editar informações existentes
- **Deletar** (D): Remover registros com confirmação

### 📤 Upload de Arquivos
A funcionalidade de upload está disponível em alguns módulos. Os arquivos são simados localmente, retornando URLs fake para demonstração.

### ✍️ Assinatura Digital
Na página de **Liquidações**, você pode:
1. Usar o canvas para desenhar a assinatura
2. Salvar a assinatura com a transação
3. Visualizar histórico de assinaturas

### 💾 Persistência de Dados
Todos os dados são salvos automaticamente em `localStorage`. Os dados persistem entre:
- Atualizações de página (F5)
- Fechamento e reabertura do navegador
- Sessões diferentes

**Nota**: Limpar o cache do navegador deletará todos os dados!

## 🔨 Desenvolvimento

### Scripts Disponíveis

```bash
# Inicia servidor de desenvolvimento
npm run dev

# Cria build de produção
npm run build

# Preview da build em produção
npm run preview

# Executa linting para verificar código
npm run lint

# Corrige problemas de linting automaticamente
npm run lint -- --fix
```

### 🎯 Adicionando Novos Recursos

#### 1. Adicionar Nova Entidade
Edite `src/lib/localDb.js` e adicione métodos no Proxy:

```javascript
// Exemplo: Adicionar entidade 'clientes'
const createEntityMethods = (entity) => ({
  filter: async (query = {}) => { /* ... */ },
  get: async (id) => { /* ... */ },
  create: async (itemData) => { /* ... */ },
  update: async (id, updates) => { /* ... */ },
  delete: async (id) => { /* ... */ }
});
```

#### 2. Criar Nova Página
- Crie um arquivo em `src/pages/NomePagina.jsx`
- Importe em `src/App.jsx`
- Adicione a rota em `MapRoutes.jsx`
- Atualize `Sidebar.jsx` com o link de navegação

#### 3. Criar Componente Compartilhado
- Coloque em `src/components/shared/`
- Importe onde necessário
- Documente props e comportamento

#### 4. Adicionar Hook Customizado
- Crie em `src/hooks/useNomeHook.jsx`
- Exporte e use em componentes

## 🐛 Troubleshooting

### "vite não é reconhecido"
**Solução**: Execute `npm install` novamente

### Dados não persistem
**Solução**: Verifique se o localStorage está habilitado no navegador

### Porta 5173 já em uso
**Solução**: Execute `npm run dev -- --port 3000` para usar outra porta

### Estilos Tailwind não carregam
**Solução**: Verifique se os caminhos em `tailwind.config.js` estão corretos

## 📝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é licenciado sob a MIT License.

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação acima
2. Abra uma issue no repositório
3. Consulte a seção de Troubleshooting

---

**Criado com ❤️ - Sistema de Gestão Empresarial**
