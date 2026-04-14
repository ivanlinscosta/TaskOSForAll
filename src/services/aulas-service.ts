import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';

export interface MaterialAula {
  id: string;
  tipo: 'pdf' | 'ppt' | 'link' | 'video' | 'doc';
  nome: string;
  url: string;
}

export interface AtividadeAula {
  id: string;
  titulo: string;
  descricao: string;
  data?: string;
}

export interface AvaliacaoAula {
  id: string;
  titulo: string;
  descricao: string;
  peso?: number;
  data?: string;
}

export interface AulaDisciplina {
  id?: string;
  titulo: string;
  disciplina: string;
  data: string;
  duracao: number;
  descricao: string;
  planoDeAula: string;
  objetivos: string[];
  topicos: string[];
  materiais: MaterialAula[];
  atividades: AtividadeAula[];
  avaliacoes: AvaliacaoAula[];
  createdAt?: any;
  updatedAt?: any;
}

export interface DisciplinaComAulas {
  id: string;
  nome: string;
  descricao?: string;
  aulas: AulaDisciplina[];
}

export type EventoCronogramaTipo = 'aula' | 'atividade' | 'avaliacao';

export interface EventoCronograma {
  id: string;
  tipo: EventoCronogramaTipo;
  titulo: string;
  descricao: string;
  data: string;
  disciplina: string;
  aulaId?: string;
  aulaTitulo?: string;
  duracao?: number;
  badgeLabel: string;
}

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function criarOuAtualizarDisciplina(nome: string, descricao = '') {
  const disciplinaId = slugify(nome);
  const disciplinaRef = doc(db, 'disciplinas', disciplinaId);

  await setDoc(
    disciplinaRef,
    {
      nome,
      descricao,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return disciplinaId;
}

export async function criarAula(data: AulaDisciplina) {
  const disciplinaId = await criarOuAtualizarDisciplina(data.disciplina);

  const aulaPayload = {
    titulo: data.titulo,
    disciplina: data.disciplina,
    data: data.data,
    duracao: Number(data.duracao),
    descricao: data.descricao,
    planoDeAula: data.planoDeAula,
    objetivos: data.objetivos || [],
    topicos: data.topicos || [],
    materiais: data.materiais || [],
    atividades: data.atividades || [],
    avaliacoes: data.avaliacoes || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const aulasRef = collection(db, 'disciplinas', disciplinaId, 'aulas');
  const docRef = await addDoc(aulasRef, aulaPayload);
  return docRef.id;
}

export async function listarDisciplinasComAulas(): Promise<DisciplinaComAulas[]> {
  const disciplinasSnapshot = await getDocs(collection(db, 'disciplinas'));

  const disciplinas = await Promise.all(
    disciplinasSnapshot.docs.map(async (disciplinaDoc) => {
      const disciplinaData = disciplinaDoc.data();
      const aulasSnapshot = await getDocs(
        query(collection(db, 'disciplinas', disciplinaDoc.id, 'aulas'))
      );

      const aulas = aulasSnapshot.docs.map((aulaDoc) => ({
        id: aulaDoc.id,
        ...(aulaDoc.data() as Omit<AulaDisciplina, 'id'>),
      }));

      aulas.sort((a, b) => {
        const da = new Date(a.data || '').getTime();
        const dbb = new Date(b.data || '').getTime();
        return da - dbb;
      });

      return {
        id: disciplinaDoc.id,
        nome: disciplinaData.nome || disciplinaDoc.id,
        descricao: disciplinaData.descricao || '',
        aulas,
      };
    })
  );

  disciplinas.sort((a, b) => a.nome.localeCompare(b.nome));
  return disciplinas;
}

export async function buscarAulaPorId(
  disciplinaId: string,
  aulaId: string
): Promise<AulaDisciplina | null> {
  const aulaRef = doc(db, 'disciplinas', disciplinaId, 'aulas', aulaId);
  const snap = await getDoc(aulaRef);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<AulaDisciplina, 'id'>),
  };
}

export async function atualizarAula(
  disciplinaId: string,
  aulaId: string,
  data: AulaDisciplina
) {
  const disciplinaAtualId = slugify(disciplinaId);
  const disciplinaNovaId = slugify(data.disciplina);

  await criarOuAtualizarDisciplina(data.disciplina);

  const payload = {
    titulo: data.titulo,
    disciplina: data.disciplina,
    data: data.data,
    duracao: Number(data.duracao),
    descricao: data.descricao,
    planoDeAula: data.planoDeAula,
    objetivos: data.objetivos || [],
    topicos: data.topicos || [],
    materiais: data.materiais || [],
    atividades: data.atividades || [],
    avaliacoes: data.avaliacoes || [],
    updatedAt: serverTimestamp(),
  };

  if (disciplinaAtualId === disciplinaNovaId) {
    const aulaRef = doc(db, 'disciplinas', disciplinaAtualId, 'aulas', aulaId);
    await updateDoc(aulaRef, payload);
    return;
  }

  const aulaRefNova = doc(db, 'disciplinas', disciplinaNovaId, 'aulas', aulaId);
  await setDoc(
    aulaRefNova,
    {
      ...payload,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deletarAula(disciplinaId: string, aulaId: string) {
  const aulaRef = doc(db, 'disciplinas', disciplinaId, 'aulas', aulaId);
  await deleteDoc(aulaRef);
}

export async function listarEventosCronograma(): Promise<EventoCronograma[]> {
  const disciplinas = await listarDisciplinasComAulas();
  const eventos: EventoCronograma[] = [];

  disciplinas.forEach((disciplina) => {
    disciplina.aulas.forEach((aula) => {
      if (aula.data) {
        eventos.push({
          id: `aula-${disciplina.id}-${aula.id}`,
          tipo: 'aula',
          titulo: aula.titulo,
          descricao: aula.descricao || aula.planoDeAula || 'Aula cadastrada',
          data: aula.data,
          disciplina: disciplina.nome,
          aulaId: aula.id,
          aulaTitulo: aula.titulo,
          duracao: aula.duracao,
          badgeLabel: 'Aula',
        });
      }

      (aula.atividades || []).forEach((atividade) => {
        if (!atividade.data) return;

        eventos.push({
          id: `atividade-${disciplina.id}-${aula.id}-${atividade.id}`,
          tipo: 'atividade',
          titulo: atividade.titulo || `Atividade - ${aula.titulo}`,
          descricao: atividade.descricao || 'Atividade cadastrada',
          data: atividade.data,
          disciplina: disciplina.nome,
          aulaId: aula.id,
          aulaTitulo: aula.titulo,
          badgeLabel: 'Atividade',
        });
      });

      (aula.avaliacoes || []).forEach((avaliacao) => {
        if (!avaliacao.data) return;

        eventos.push({
          id: `avaliacao-${disciplina.id}-${aula.id}-${avaliacao.id}`,
          tipo: 'avaliacao',
          titulo: avaliacao.titulo || `Avaliação - ${aula.titulo}`,
          descricao: avaliacao.descricao || 'Avaliação cadastrada',
          data: avaliacao.data,
          disciplina: disciplina.nome,
          aulaId: aula.id,
          aulaTitulo: aula.titulo,
          badgeLabel: 'Avaliação',
        });
      });
    });
  });

  eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  return eventos;
}