# DualOS - Personal Operating System

## 🎯 Visão Geral

**DualOS** é um sistema operacional pessoal de alta performance projetado para gestão híbrida entre contextos educacionais (FIAP) e corporativos (Itaú). O sistema permite alternância fluida entre contextos sem fricção cognitiva, mantendo produtividade e organização em ambos os ambientes.

## 👤 Persona

**Usuário Principal:**
- Professor na FIAP
- Gerente de Dados e IA no Itaú
- Necessidade: Gerenciar múltiplos contextos profissionais com eficiência

## 🎨 Design System

### Tema Itaú (Corporate Mode)
- **Cor Primária:** #EC7000 (Laranja Itaú)
- **Cor Secundária:** #003A8F (Azul Itaú)
- **Background:** Branco/Cinza claro
- **Estilo:** Dashboard executivo, denso em informação, tipografia forte

### Tema FIAP (Education Mode)
- **Cor Primária:** #6A0DAD (Roxo Neon)
- **Background:** #000000 (Preto absoluto)
- **Estilo:** Tech futurista, dark mode, efeitos de glow, interfaces respiradas

### Características
- Toggle instantâneo entre temas (sem reload)
- Componentes adaptativos por contexto
- Tokens de design separados por tema
- Transições suaves e fluidas

## 🏗️ Arquitetura Técnica

### Frontend
- **Framework:** React 18 + TypeScript
- **Roteamento:** React Router 7 (Data Mode)
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI + Custom Components
- **Charts:** Recharts
- **Animations:** Motion (Framer Motion)
- **Date Handling:** date-fns

### Estrutura de Código

```
/src
├── /app
│   ├── /components
│   │   ├── /ui (Componentes base)
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── layout.tsx
│   ├── /pages
│   │   ├── dashboard.tsx
│   │   ├── /fiap
│   │   │   ├── index.tsx
│   │   │   ├── alunos.tsx
│   │   │   ├── aulas.tsx
│   │   │   ├── cronograma.tsx
│   │   │   └── kanban.tsx
│   │   ├── /itau
│   │   │   ├── index.tsx
│   │   │   ├── analistas.tsx
│   │   │   ├── feedbacks.tsx
│   │   │   ├── reunioes.tsx
│   │   │   └── kanban.tsx
│   │   └── ai-assistant.tsx
│   ├── routes.tsx
│   └── App.tsx
├── /lib
│   ├── theme-context.tsx
│   ├── mock-data.ts
│   └── cn.ts
├── /types
│   └── index.ts
└── /styles
    ├── themes.css
    └── theme.css
```

## 📦 Módulos do Sistema

### 1. Dashboard Global

**Funcionalidades:**
- Score de Eficiência (0-100)
  - Algoritmo baseado em: tarefas concluídas, reuniões realizadas, feedbacks feitos, aulas ministradas
  - Gráfico de evolução semanal
  - Insights gerados por IA
- Agenda do Dia (timeline de eventos)
- Tarefas Urgentes
- Resumo de métricas (cards)

### 2. Módulo FIAP (Educação)

#### 2.1 Gestão de Aulas
- Upload de materiais (PDF, PPT, Links, Vídeos)
- Organização por disciplina
- Tags e filtros
- Preview de arquivos
- Sistema de ícones por tipo de arquivo

#### 2.2 Gestão de Alunos
- **Campos:** Nome, Foto, Email, Curso, Notas, Observações
- Perfil detalhado com histórico
- Gráfico de desempenho
- Sistema de avaliações
- Cálculo automático de médias

#### 2.3 Cronograma
- Calendário interativo
- Visualização mensal
- Eventos por dia
- Próximas aulas listadas

#### 2.4 Kanban Acadêmico
- Colunas: Backlog, Em Progresso, Concluído
- Drag-and-drop (preparado)
- Checklist com progresso visual
- Tags e prioridades
- Filtros por contexto

### 3. Módulo Itaú (Corporativo)

#### 3.1 Gestão de Analistas
- **Campos:** Nome, Foto, Email, Função, Salário, Data Admissão, Avaliações, Observações
- Perfil completo com histórico
- Métricas de performance
- Cálculo de tempo de casa
- Sistema de avaliações (trimestral, anual)

#### 3.2 Feedbacks
- Registro por data
- **Estrutura:**
  - Pontos Fortes
  - Pontos de Melhoria
  - Combinados
- Próxima revisão agendada
- Vínculo com analista

#### 3.3 Reuniões
- Criação e edição
- **Campos:** Título, Data, Duração, Participantes, Notas
- Lista de ações com status
- Resumo automático por IA
- Status: Agendada, Concluída, Cancelada

#### 3.4 Kanban Executivo
- Mesma estrutura do Kanban FIAP
- Focado em gestão corporativa
- Tarefas filtradas por contexto Itaú

### 4. Módulo de IA

**Ferramentas Disponíveis:**

#### 4.1 Gerador de Plano de Aula (FIAP)
- **Input:** Tema, Série, Objetivo
- **Output:** Plano completo estruturado (BNCC-style)
- Seções: Introdução, Desenvolvimento, Conclusão, Recursos, Avaliação

#### 4.2 Avaliação de Alunos (FIAP)
- **Input:** Notas, Comportamento
- **Output:** Diagnóstico + Recomendações pedagógicas

#### 4.3 Avaliação de Time (Itaú)
- **Input:** Nome do Time, Período
- **Output:**
  - Score geral
  - Fortalezas identificadas
  - Áreas de melhoria
  - Recomendações (curto, médio, longo prazo)
  - Tendência

#### 4.4 Resumo de Reunião (Itaú)
- **Input:** Notas da reunião
- **Output:**
  - Resumo executivo
  - Principais pontos
  - Decisões tomadas
  - Ações sugeridas
  - Participantes destaque

## 🗄️ Modelagem de Dados

### Types Principais

```typescript
// FIAP
interface Aluno {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  curso: string;
  notas: Nota[];
  observacoes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Aula {
  id: string;
  titulo: string;
  disciplina: string;
  descricao: string;
  data: Date;
  duracao: number;
  materiais: Material[];
  tags: string[];
  createdAt: Date;
}

// Itaú
interface Analista {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  funcao: string;
  salario?: number;
  dataAdmissao: Date;
  avaliacoes: Avaliacao[];
  observacoes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Reuniao {
  id: string;
  titulo: string;
  data: Date;
  duracao: number;
  participantes: string[];
  notas: string;
  acoes: Acao[];
  status: 'agendada' | 'concluida' | 'cancelada';
  resumoIA?: string;
  createdAt: Date;
}

// Compartilhado
interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  contexto: 'fiap' | 'itau';
  status: 'backlog' | 'doing' | 'done';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  checklist?: ChecklistItem[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

## 📊 Analytics & Métricas

### Score de Eficiência

**Fórmula:**
```
Score = (
  (tarefasConcluidas * 3) +
  (reunioesRealizadas * 2) +
  (feedbacksFeitos * 4) +
  (aulasMinistradas * 3)
) / maxPossivel * 100
```

**Insights Automáticos:**
- Alertas quando performance está abaixo da média
- Sugestões de priorização
- Elogios quando metas são superadas
- Análise de tendências semanais

## 🔐 Autenticação (Preparado para Supabase)

- Login com Google
- Controle de acesso por contexto
- Sessão persistente
- Perfil de usuário

## 🎨 Componentes UI Reutilizáveis

- **Button** (variants: default, outline, ghost, destructive, theme)
- **Card** (com Header, Content, Footer)
- **Input** (adaptativo por tema)
- **Badge** (variants por contexto)
- **Avatar** (com fallback)
- **Dialog** (modais adaptados)

## 🚀 Funcionalidades Avançadas

### Navegação
- Sidebar colapsável
- Navegação contextual por cor
- Breadcrumbs implícitos
- Active state em rotas

### Busca Global (Preparada)
- Busca cross-module
- Filtros inteligentes
- Resultados agrupados por tipo

### Notificações (Preparadas)
- Badge com contador
- Lista de notificações
- Marcação como lida

### Theme Switcher
- Toggle instantâneo FIAP ↔ Itaú
- Sem reload da página
- Persistência no localStorage
- Animações suaves de transição

## 🔄 Próximos Passos (Roadmap)

### Backend & Persistência
1. Integração com Supabase
   - Setup de collections/tables
   - Autenticação Firebase/Supabase
   - Realtime updates
   - File storage para uploads

### Integrações IA
2. OpenAI API
   - Configuração de API keys
   - Endpoints para cada funcionalidade
   - Rate limiting
   - Cache de resultados

### Features Adicionais
3. Drag & Drop Real (react-dnd)
4. Upload de Arquivos
5. Exportação de Relatórios (PDF)
6. Notificações Push
7. Mobile Responsive (PWA)
8. Dark/Light mode adicional

## 📱 Responsividade

- Desktop First (otimizado para desktop)
- Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- Sidebar colapsável em mobile
- Grid adaptativo

## 🎯 Performance

- Code splitting por rota
- Lazy loading de componentes
- Otimização de imagens
- Memoização de cálculos pesados
- Virtual scrolling (preparado para listas grandes)

## 🛠️ Desenvolvimento

### Comandos
```bash
# Instalar dependências
pnpm install

# Executar em dev
pnpm dev

# Build para produção
pnpm build
```

### Variáveis de Ambiente (Futuro)
```
VITE_OPENAI_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## 📄 Licença

Projeto acadêmico - FIAP + Itaú

---

**DualOS** - Sistema Operacional Pessoal de Alta Performance  
*Desenvolvido para gestão híbrida Educação + Corporativo*
