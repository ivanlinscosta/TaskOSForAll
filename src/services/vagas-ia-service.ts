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

const VAGAS_STORAGE_KEY = 'taskos_vagas_recomendadas';

export function getVagasSalvas(): VagaRecomendada[] {
  try {
    const raw = localStorage.getItem(VAGAS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function salvarVagas(vagas: VagaRecomendada[]) {
  localStorage.setItem(VAGAS_STORAGE_KEY, JSON.stringify(vagas));
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
