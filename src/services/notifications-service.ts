import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';

const COLLECTION = 'notificacoes';

export interface Notificacao {
  id?: string;
  titulo: string;
  mensagem: string;
  tipo: 'tarefa' | 'reuniao' | 'aula' | 'feedback' | 'sistema';
  data: Date;
  lida: boolean;
  contexto: 'fiap' | 'itau';
  userId: string;
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