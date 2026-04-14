import { UserCircle, MessageSquare, Video, Kanban } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { mockAnalistas, mockFeedbacks, mockReunioes, mockTarefas } from '../../../lib/mock-data';

export function ItauIndex() {
  const tarefasItau = mockTarefas.filter(t => t.contexto === 'itau');

  const modules = [
    {
      title: 'Analistas',
      description: 'Gerencie seu time e acompanhe performance',
      icon: UserCircle,
      path: '/itau/analistas',
      count: mockAnalistas.length,
    },
    {
      title: 'Feedbacks',
      description: 'Registre e acompanhe feedbacks 1:1',
      icon: MessageSquare,
      path: '/itau/feedbacks',
      count: mockFeedbacks.length,
    },
    {
      title: 'Reuniões',
      description: 'Organize reuniões e acompanhe ações',
      icon: Video,
      path: '/itau/reunioes',
      count: mockReunioes.length,
    },
    {
      title: 'Kanban',
      description: 'Organize tarefas corporativas',
      icon: Kanban,
      path: '/itau/kanban',
      count: tarefasItau.length,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Itaú - Corporate Mode</h1>
        <p className="text-[var(--theme-muted-foreground)] mt-1">
          Gestão completa de atividades corporativas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map(module => {
          const Icon = module.icon;
          return (
            <Link key={module.path} to={module.path}>
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-[var(--theme-accent)]/10">
                      <Icon className="w-6 h-6 text-[var(--theme-accent)]" />
                    </div>
                    <div>
                      <CardTitle>{module.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {module.count} {module.count === 1 ? 'item' : 'itens'}
                      </CardDescription>
                    </div>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
