/**
 * Serviço de parsing de currículo via IA
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase-config';

export interface CurriculoParsed {
  nome: string;
  cargo: string;
  empresa_atual: string;
  area: string;
  atividades_profissionais: string;
  anos_experiencia: string;
  habilidades_atuais: string;
  objetivo_carreira: string;
  profissao: string;
}

export async function parseCurriculo(textoCV: string): Promise<CurriculoParsed> {
  const functions = getFunctions(app, 'us-central1');
  const fn = httpsCallable<{ textoCV: string }, CurriculoParsed>(
    functions,
    'curriculoParserCallable',
    { timeout: 180_000 }
  );
  // Truncar para evitar payload excessivo
  const res = await fn({ textoCV: textoCV.slice(0, 15000) });
  return res.data;
}
