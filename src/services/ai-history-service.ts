import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';

export type ChatChart = {
  type: 'bar' | 'line' | 'pie';
  title: string;
  description?: string;
  xKey?: string;
  data: Record<string, any>[];
  series: Array<{ key: string; label: string }>;
} | null;

export type ChatMessage = {
  id?: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt?: any;
  imageUrl?: string;
  chart?: ChatChart;
};

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

function getConversationDocId(userId: string, contextMode: 'fiap' | 'itau' | 'pessoal') {
  return `${userId}_${contextMode}_${getMonthKey()}`;
}

export async function loadMonthlyChatHistory(
  userId: string,
  contextMode: 'fiap' | 'itau' | 'pessoal'
): Promise<ChatMessage[]> {
  const conversationId = getConversationDocId(userId, contextMode);

  const messagesRef = collection(db, 'ai_histories', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as ChatMessage),
  }));
}

export async function appendChatMessage(
  userId: string,
  contextMode: 'fiap' | 'itau' | 'pessoal',
  message: ChatMessage
) {
  const conversationId = getConversationDocId(userId, contextMode);

  const conversationRef = doc(db, 'ai_histories', conversationId);
  const messagesRef = collection(conversationRef, 'messages');

  await addDoc(messagesRef, {
    ...message,
    createdAt: serverTimestamp(),
  });
}