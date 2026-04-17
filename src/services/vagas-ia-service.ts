import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase-config';

export interface VagaRecomendada {
  titulo: string;
  empresa: string;
  localizacao: string;
  modeloTrabalho: 'Remoto' | 'Híbrido' | 'Presencial';
  salario?: string;
  descricao: string;
  skills: string[];
  fonte: string;
  link: string;
  area: string;
}

type VagasInput = {
  cargo?: string;
  areaAtuacao?: string;
  anosExperiencia?: string;
  habilidadesAtuais?: string;
  objetivoCarreira?: string;
  curriculoTexto?: string;
};

type VagasOutput = { vagas: VagaRecomendada[] };

function storageKey(uid: string) {
  return `taskos_vagas_recomendadas_${uid}`;
}

export function getVagasSalvas(uid: string): VagaRecomendada[] {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function salvarVagas(uid: string, vagas: VagaRecomendada[]) {
  localStorage.setItem(storageKey(uid), JSON.stringify(vagas));
}

export async function buscarVagasIA(profile: VagasInput): Promise<VagaRecomendada[]> {
  const functions = getFunctions(app, 'us-central1');
  const call = httpsCallable<VagasInput, VagasOutput>(
    functions,
    'vagasCallable',
    { timeout: 180_000 },
  );
  const result = await call(profile);
  const vagas = result.data?.vagas;
  if (!Array.isArray(vagas) || vagas.length === 0) throw new Error('Nenhuma vaga retornada');
  return vagas;
}
