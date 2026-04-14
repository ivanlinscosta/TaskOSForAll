import {
  addDoc,
  collection,
  getCountFromServer,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase-config';

export type ForAllEntity =
  | 'tasks'
  | 'feedbacks'
  | 'meetings'
  | 'students'
  | 'classes'
  | 'finance'
  | 'expenses'
  | 'trips';

const ENTITY_COLLECTION_MAP: Record<ForAllEntity, string[]> = {
  tasks: [COLLECTIONS.TAREFAS, COLLECTIONS.TAREFAS_PESSOAIS],
  feedbacks: [COLLECTIONS.FEEDBACKS],
  meetings: [COLLECTIONS.REUNIOES],
  students: [COLLECTIONS.ALUNOS],
  classes: [COLLECTIONS.AULAS],
  finance: [COLLECTIONS.CUSTOS, COLLECTIONS.RECEITAS],
  expenses: [COLLECTIONS.CUSTOS],
  trips: [COLLECTIONS.VIAGENS],
};

export async function countDocsByOwner(collectionName: string, ownerId: string) {
  try {
    const q = query(collection(db, collectionName), where('ownerId', '==', ownerId));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch (error) {
    console.error(`Erro ao contar documentos em ${collectionName}:`, error);
    return 0;
  }
}

export async function listWorkspaceEntity(
  ownerId: string,
  entity: ForAllEntity,
  workspace: 'work' | 'life',
) {
  const collectionNames = ENTITY_COLLECTION_MAP[entity] ?? [];
  const results: Array<Record<string, any>> = [];

  for (const collectionName of collectionNames) {
    try {
      const q = query(
        collection(db, collectionName),
        where('ownerId', '==', ownerId),
        where('workspaceType', '==', workspace),
      );
      const snap = await getDocs(q);
      snap.docs.forEach((doc) => {
        results.push({
          id: doc.id,
          collectionName,
          ...doc.data(),
        });
      });
    } catch (error) {
      console.error(`Erro ao listar ${collectionName}:`, error);
    }
  }

  return results.sort((a, b) => {
    const aDate = a.createdAt?.toDate?.()?.getTime?.() ?? 0;
    const bDate = b.createdAt?.toDate?.()?.getTime?.() ?? 0;
    return bDate - aDate;
  });
}

export async function createOwnedRecord(collectionName: string, payload: Record<string, any>) {
  const ref = await addDoc(collection(db, collectionName), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
