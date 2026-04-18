import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';

const COLLECTION = 'notificacoes';

export type TipoNotificacao =
  | 'tarefa'
  | 'reuniao'
  | 'aula'
  | 'feedback'
  | 'sistema'
  | 'despesa'
  | 'receita'
  | 'viagem'
  | 'sugestao_ia';

export interface Notificacao {
  id?: string;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  data: Date;
  lida: boolean;
  contexto?: 'fiap' | 'itau' | 'pessoal';
  userId: string;
  refId?: string;
}

/**
 * Helper para criar notificação silenciosa (fire-and-forget).
 * Falhas são logadas mas não propagadas.
 */
export function notificarSilencioso(notif: Omit<Notificacao, 'data'>) {
  criarNotificacao(notif).catch((err) =>
    console.warn('[notificacao] falha silenciosa:', err)
  );
}

/**
 * Escuta notificações em tempo real
 */
export function ouvirNotificacoes(userId: string, callback: (data: Notificacao[]) => void) {
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const notificacoes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data?.toDate?.() || new Date()
    })) as Notificacao[];

    // ordenar no client
    notificacoes.sort((a, b) => b.data.getTime() - a.data.getTime());

    callback(notificacoes);
  });
}

/**
 * Criar notificação
 */
export async function criarNotificacao(notif: Omit<Notificacao, 'data'>) {
  await addDoc(collection(db, COLLECTION), {
    ...notif,
    data: Timestamp.now()
  });
}

/**
 * Marcar como lida
 */
export async function marcarComoLida(id: string) {
  await updateDoc(doc(db, COLLECTION, id), {
    lida: true
  });
}

/**
 * Marcar todas como lidas
 */
export async function marcarTodasComoLidas(notificacoes: Notificacao[]) {
  await Promise.all(
    notificacoes.map(n =>
      updateDoc(doc(db, COLLECTION, n.id!), { lida: true })
    )
  );
}

/**
 * Excluir
 */
export async function deletarNotificacao(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Verifica eventos da agenda próximos (hoje ou em até 3 dias)
 * e cria notificações no hub, evitando duplicatas via refId.
 */
export async function verificarEventosProximos(
  userId: string,
  eventos: Array<{ id: string; title: string; date: Date; type: string }>,
) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em3dias = new Date(hoje.getTime() + 3 * 24 * 864e5);

  // Busca refIds já existentes para evitar duplicatas
  const q = query(collection(db, COLLECTION), where('userId', '==', userId), where('refId', '!=', ''));
  const snap = await getDocs(q).catch(() => null);
  const existingRefs = new Set(snap?.docs.map(d => d.data().refId as string) ?? []);

  const tipoMap: Record<string, TipoNotificacao> = {
    reuniao: 'reuniao',
    tarefa: 'tarefa',
    viagem: 'viagem',
    google: 'reuniao',
    apple: 'reuniao',
  };

  for (const ev of eventos) {
    const evDate = new Date(ev.date);
    evDate.setHours(0, 0, 0, 0);
    if (evDate < hoje || evDate > em3dias) continue;

    const refId = `event-proximity-${ev.id}`;
    if (existingRefs.has(refId)) continue;

    const diffDays = Math.round((evDate.getTime() - hoje.getTime()) / 864e5);
    const quando = diffDays === 0 ? 'hoje' : diffDays === 1 ? 'amanhã' : `em ${diffDays} dias`;
    const tipo: TipoNotificacao = tipoMap[ev.type] ?? 'sistema';

    notificarSilencioso({
      titulo: `Compromisso ${quando}`,
      mensagem: `"${ev.title}" — ${evDate.toLocaleDateString('pt-BR')}`,
      tipo,
      lida: false,
      userId,
      refId,
    });
  }
}

/**
 * Verifica tarefas pessoais com data de vencimento próxima ou vencida
 * e cria notificações (se ainda não existirem para essa tarefa).
 * Chamado tipicamente no carregamento do dashboard.
 */
export async function verificarTarefasVencimentoProximo(
  userId: string,
  tarefas: Array<{
    id?: string;
    titulo: string;
    dataVencimento?: Date;
    status: string;
  }>
) {
  const hoje = new Date();
  const em3dias = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000);

  for (const t of tarefas) {
    if (!t.dataVencimento || t.status === 'done') continue;
    const venc = new Date(t.dataVencimento);
    if (venc < hoje) {
      notificarSilencioso({
        titulo: 'Tarefa em atraso!',
        mensagem: `"${t.titulo}" venceu em ${venc.toLocaleDateString('pt-BR')}`,
        tipo: 'tarefa',
        lida: false,
        contexto: 'pessoal',
        userId,
      });
    } else if (venc <= em3dias) {
      notificarSilencioso({
        titulo: 'Tarefa perto de vencer',
        mensagem: `"${t.titulo}" vence em ${venc.toLocaleDateString('pt-BR')}`,
        tipo: 'tarefa',
        lida: false,
        contexto: 'pessoal',
        userId,
      });
    }
  }
}