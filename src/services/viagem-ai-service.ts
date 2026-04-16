/**
 * Serviço de Planejamento de Viagem com IA
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase-config';

export type ModoViagem = 'destino_sem_data' | 'sem_destino' | 'destino_com_budget';
export type TipoViagem = 'nacional' | 'internacional';
export type MeioTransporte = 'carro' | 'onibus' | 'aviao';

export interface ViagemPlanInput {
  modo: ModoViagem;
  destino?: string;
  budget?: number;
  datasPreferidas?: string;
  duracaoDias?: number;
  interesses?: string[];
  numViajantes?: number;
  observacoes?: string;
  origem?: string;
  tipoViagem?: TipoViagem;
  meioTransporte?: MeioTransporte;
}

export interface AtividadeSugerida {
  nome: string;
  data: string;
  horario: string;
}

export interface OrcamentoItem {
  categoria: 'passagem' | 'hospedagem' | 'passeios' | 'alimentacao' | 'transporte';
  valor: number;
  formaPagamento: 'a_vista' | 'a_prazo';
  parcelas?: number;
  sugestao?: string;
}

export interface ViagemPlanResult {
  destino: string;
  descricao: string;
  dataIda: string;
  dataVolta: string;
  orcamentoTotal: number;
  orcamentoDetalhado: OrcamentoItem[];
  atividades: AtividadeSugerida[];
  notas: string;
  explicacao: string;
}

export async function planejarViagem(input: ViagemPlanInput): Promise<ViagemPlanResult> {
  const functions = getFunctions(app, 'us-central1');
  const fn = httpsCallable<ViagemPlanInput, ViagemPlanResult>(
    functions,
    'viagemPlanningCallable',
    { timeout: 300_000 }
  );
  const res = await fn(input);
  return res.data;
}
