import { X, Plus, BookOpen, Users, Calendar, MessageSquare, Video, Kanban } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useNavigate } from 'react-router';
import { useTheme } from '../../lib/theme-context';
import { cn } from '../../lib/cn';

interface QuickActionsProps {
  onClose: () => void;
}

export function QuickActions({ onClose }: QuickActionsProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const fiapActions = [
    { icon: BookOpen, label: 'Nova Aula', path: '/fiap/aulas', color: 'text-orange-500' },
    { icon: Users, label: 'Cadastrar Aluno', path: '/fiap/alunos', color: 'text-blue-500' },
    { icon: Calendar, label: 'Ver Cronograma', path: '/fiap/cronograma', color: 'text-green-500' },
    { icon: Kanban, label: 'Abrir Kanban', path: '/fiap/kanban', color: 'text-purple-500' },
  ];

  const itauActions = [
    { icon: Users, label: 'Cadastrar Analista', path: '/itau/analistas', color: 'text-blue-500' },
    { icon: Video, label: 'Nova Reunião', path: '/itau/reunioes', color: 'text-red-500' },
    { icon: MessageSquare, label: 'Dar Feedback', path: '/itau/feedbacks', color: 'text-green-500' },
    { icon: Kanban, label: 'Abrir Kanban', path: '/itau/kanban', color: 'text-purple-500' },
  ];

  const actions = theme === 'fiap' ? fiapActions : itauActions;

  const handleAction = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <Card className="relative w-full max-w-sm shadow-2xl border-2 border-[var(--theme-border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[var(--theme-accent)]" />
            <h2 className="text-base font-bold text-[var(--theme-foreground)]">
              Ações Rápidas
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleAction(action.path)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg transition-all",
                  "bg-[var(--theme-background-secondary)] hover:bg-[var(--theme-hover)]",
                  "border border-[var(--theme-border)] hover:border-[var(--theme-accent)]",
                  theme === 'fiap' && "hover:glow-effect"
                )}
              >
                <action.icon className={cn("w-6 h-6", action.color)} />
                <span className="text-xs font-medium text-[var(--theme-foreground)] text-center">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-[10px] text-[var(--theme-muted-foreground)]">
              Contexto: {theme === 'fiap' ? 'FIAP' : 'Itaú'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
