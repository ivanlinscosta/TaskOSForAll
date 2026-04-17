import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/login';
import { Dashboard } from './pages/dashboard';
import { Perfil } from './pages/perfil';
import { NotFound } from './pages/not-found';
import { AIAssistant } from './pages/ai-assistant';
import { OnboardingPage } from './pages/onboarding';
import { ChatGuiado } from './pages/chat';
import { ForAllEntityHub } from './pages/forall/entity-hub';
import { ForAllTasksBoard } from './pages/forall/tasks-board';
import { ForAllCommitmentsPage } from './pages/forall/commitments';
import { ForAllFinancePage } from './pages/forall/finance';
import { CarreiraPage } from './pages/forall/carreira';
import { MeuDesenvolvimentoPage } from './pages/forall/meu-desenvolvimento';
import { VagasParaMimPage } from './pages/forall/VagasParaMimPage';
import { Viagens } from './pages/pessoal/viagens';
import { NovaViagem } from './pages/pessoal/nova-viagem';
import { EditarViagem } from './pages/pessoal/editar-viagem';
import { DetalheViagem } from './pages/pessoal/detalhe-viagem';

export const router = createBrowserRouter([
  // ── Onboarding (SEM Layout: sem sidebar e sem header) ─────────────────
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute allowOnboarding>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
  // ── App principal (COM Layout) ────────────────────────────────────────
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: 'perfil', Component: Perfil },
      { path: 'ai', Component: AIAssistant },
      { path: 'chat', Component: ChatGuiado },
      { path: 'carreira', Component: CarreiraPage },
      { path: 'meu-desenvolvimento', Component: MeuDesenvolvimentoPage },
      { path: 'vagas-para-mim', Component: VagasParaMimPage },
      { path: 'tarefas', Component: ForAllTasksBoard },
      { path: 'planejamento', Component: ForAllCommitmentsPage },
      { path: 'financas', Component: ForAllFinancePage },
      { path: 'pessoal/viagens', Component: Viagens },
      { path: 'pessoal/viagens/nova', Component: NovaViagem },
      { path: 'pessoal/viagens/:id', Component: DetalheViagem },
      { path: 'pessoal/viagens/editar/:id', Component: EditarViagem },
      // Compat com rotas antigas de workspace
      { path: 'workspace/:workspace/tasks', Component: ForAllTasksBoard },
      { path: 'workspace/:workspace/commitments', Component: ForAllCommitmentsPage },
      { path: 'workspace/:workspace/finance', Component: ForAllFinancePage },
      { path: 'workspace/:workspace/:entity', Component: ForAllEntityHub },
      { path: '*', Component: NotFound },
    ],
  },
  {
    path: '/login',
    Component: Login,
  },
]);
