import { X, CheckCheck, Trash2, Bell } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../../lib/cn';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  ouvirNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  deletarNotificacao,
  Notificacao
} from '../../services/notifications-service';

interface Props {
  onClose: () => void;
  userId: string;
}

export function NotificationsHub({ onClose, userId }: Props) {
  const [notifications, setNotifications] = useState<Notificacao[]>([]);

  useEffect(() => {
    const unsubscribe = ouvirNotificacoes(userId, setNotifications);
    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.lida).length;

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, string> = {
      tarefa: '✓',
      reuniao: '📅',
      aula: '📚',
      feedback: '💬',
      sistema: '⚙️',
      despesa: '💸',
      receita: '💰',
      viagem: '✈️',
      sugestao_ia: '🤖',
    };
    return icons[tipo] || '•';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <Card className="relative w-full max-w-md max-h-[80vh] flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <h2 className="font-bold">Notificações</h2>

            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </div>

          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                size="sm"
                onClick={() => marcarTodasComoLidas(notifications)}
              >
                Marcar todas
              </Button>
            )}

            <Button size="icon" onClick={onClose}>
              <X />
            </Button>
          </div>
        </div>

        {/* LISTA */}
        <div className="flex-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="mx-auto mb-2 opacity-40" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "p-3 rounded-lg mb-2",
                  !n.lida && "bg-[var(--theme-accent)]/5"
                )}
              >
                <div className="flex gap-3">
                  <div>{getTipoIcon(n.tipo)}</div>

                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{n.titulo}</h3>
                    <p className="text-xs text-muted-foreground">{n.mensagem}</p>

                    <div className="flex justify-between mt-2">
                      <span className="text-xs">
                        {format(n.data, "d MMM HH:mm", { locale: ptBR })}
                      </span>

                      <div className="flex gap-1">
                        {!n.lida && (
                          <Button
                            size="icon"
                            onClick={() => marcarComoLida(n.id!)}
                          >
                            <CheckCheck className="w-3 h-3" />
                          </Button>
                        )}

                        <Button
                          size="icon"
                          onClick={() => deletarNotificacao(n.id!)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}