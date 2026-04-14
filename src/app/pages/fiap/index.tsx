import { BookOpen, Users, Calendar, Kanban } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { mockAlunos, mockAulas, mockTarefas } from '../../../lib/mock-data';

export function FIAPIndex() {
  const tarefasFIAP = mockTarefas.filter(t => t.contexto === 'fiap');

  const modules = [
    {
      title: 'Aulas',
      description: 'Gerencie materiais e conteúdos das aulas',
      icon: BookOpen,
      path: '/fiap/aulas',
      count: mockAulas.length,
    },
    {
      title: 'Alunos',
      description: 'Acompanhe performance e evolução dos alunos',
      icon: Users,
      path: '/fiap/alunos',
      count: mockAlunos.length,
    },
    {
      title: 'Cronograma',
      description: 'Visualize calendário de aulas e eventos',
      icon: Calendar,
      path: '/fiap/cronograma',
      count: mockAulas.length,
    },
    {
      title: 'Kanban',
      description: 'Organize tarefas acadêmicas',
      icon: Kanban,
      path: '/fiap/kanban',
      count: tarefasFIAP.length,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">FIAP - Education Mode</h1>
        <p className="text-[var(--theme-muted-foreground)] mt-1">
          Gestão completa de atividades acadêmicas
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
