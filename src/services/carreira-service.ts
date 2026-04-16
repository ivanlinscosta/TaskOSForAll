import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app, db, COLLECTIONS } from '../lib/firebase-config';

export interface CarreiraInput {
  cargo?: string;
  area?: string;
  anos_experiencia?: string;
  objetivos?: string;
  habilidades_atuais?: string;
  curriculo_texto?: string;
  // Contexto enriquecido (opcional)
  soft_skills_contexto?: string;
  financas_contexto?: string;
  objetivos_financeiros?: string[];
  objetivos_pessoais?: string[];
}

export type RecomendacaoCategoria = 'profissional' | 'financas' | 'pessoal';

export interface Highlight {
  categoria: RecomendacaoCategoria;
  titulo: string;
  mensagem: string;
  acao_sugerida?: string;
}

export interface HardSkill {
  skill: string;
  nivel: 'basico' | 'intermediario' | 'avancado';
  gap: string;
}

export interface SoftSkill {
  skill: string;
  avaliacao: string;
}

export interface RecomendacaoCarreira {
  tipo: 'livro' | 'curso' | 'video';
  categoria?: RecomendacaoCategoria; // novo: profissional / financas / pessoal
  titulo: string;
  autor_ou_canal: string;
  descricao: string;
  motivo: string;
}

export interface VagaCarreira {
  titulo: string;
  empresa: string;
  localidade: string;
  regime: string;
  resumo: string;
  link: string;
}

export interface CarreiraOutput {
  analise_perfil: string;
  pontos_fortes: string[];
  pontos_melhorar: string[];
  hard_skills: HardSkill[];
  soft_skills: SoftSkill[];
  recomendacoes: RecomendacaoCarreira[];
  highlights?: Highlight[];
  mostrar_vagas?: boolean;
  vagas?: VagaCarreira[];
}

export interface CarreiraAnalise {
  input: CarreiraInput;
  output: CarreiraOutput;
  analisadoEm: Date;
}

// ── AI callable ──────────────────────────────────────────────────────────────

export async function analisarCarreira(input: CarreiraInput): Promise<CarreiraOutput> {
  const functions = getFunctions(app, 'us-central1');
  // Default do client SDK é 70s. Com contexto enriquecido (currículo + finanças
  // + soft skills) o LLM pode levar 1-3min. Server está configurado com 120s.
  const call = httpsCallable<CarreiraInput, CarreiraOutput>(
    functions,
    'carreiraAnaliseCallable',
    { timeout: 180_000 }, // 3min — alinhado com o server
  );
  const result = await call(input);
  return result.data;
}

// ── Persistence ──────────────────────────────────────────────────────────────

export async function salvarAnaliseCarreira(
  uid: string,
  input: CarreiraInput,
  output: CarreiraOutput
): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.CARREIRA_ANALISES, uid), {
    input,
    output,
    analisadoEm: serverTimestamp(),
  });
}

export async function carregarAnaliseCarreira(uid: string): Promise<CarreiraAnalise | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.CARREIRA_ANALISES, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    input: data.input ?? {},
    output: data.output ?? {},
    analisadoEm: data.analisadoEm?.toDate?.() ?? new Date(),
  };
}

// ── Link generation ──────────────────────────────────────────────────────────

export function gerarLinkRecomendacao(rec: RecomendacaoCarreira): string {
  const tituloEnc = encodeURIComponent(rec.titulo);
  const autorEnc  = encodeURIComponent(rec.autor_ou_canal);
  const queryEnc  = encodeURIComponent(`${rec.titulo} ${rec.autor_ou_canal}`);

  if (rec.tipo === 'video') {
    return `https://www.youtube.com/results?search_query=${queryEnc}`;
  }

  if (rec.tipo === 'livro') {
    return `https://www.amazon.com.br/s?k=${encodeURIComponent(rec.titulo + ' ' + rec.autor_ou_canal)}`;
  }

  const canal = rec.autor_ou_canal.toLowerCase();
  if (canal.includes('alura'))     return `https://www.alura.com.br/busca?query=${tituloEnc}`;
  if (canal.includes('udemy'))     return `https://www.udemy.com/courses/search/?q=${tituloEnc}`;
  if (canal.includes('coursera'))  return `https://www.coursera.org/search?query=${tituloEnc}`;
  if (canal.includes('dio') || canal.includes('digital innovation'))
    return `https://www.dio.me/courses?q=${tituloEnc}`;
  if (canal.includes('linkedin'))  return `https://www.linkedin.com/learning/search?keywords=${tituloEnc}`;
  if (canal.includes('rocketseat') || canal.includes('rocket'))
    return `https://app.rocketseat.com.br/discover/search?search=${tituloEnc}`;
  if (canal.includes('hotmart'))   return `https://hotmart.com/pt-BR/discover?q=${tituloEnc}`;
  if (canal.includes('youtube') || canal.includes('yt'))
    return `https://www.youtube.com/results?search_query=${queryEnc}+curso`;

  return `https://www.google.com/search?q=${tituloEnc}+${autorEnc}+curso`;
}

// ── Job link ─────────────────────────────────────────────────────────────────
export function gerarLinkVaga(vaga: VagaCarreira): string {
  if (vaga.link && vaga.link.startsWith('http')) return vaga.link;
  const q = encodeURIComponent(`${vaga.titulo} ${vaga.empresa}`);
  return `https://www.linkedin.com/jobs/search/?keywords=${q}`;
}

// ── Detect transition ─────────────────────────────────────────────────────────
export function objetivoImplicaTransicao(objetivo: string): boolean {
  const kws = [
    'mudar de área','mudar de empresa','mudar de carreira','recolocação',
    'transição','nova empresa','novo emprego','buscar emprego','novo trabalho',
    'sair da empresa','processo seletivo','nova oportunidade','migrar para',
    'entrar em','recolocação profissional','mercado de trabalho',
    'emprego','vaga','oportunidade','recrutamento',
  ];
  const lower = objetivo.toLowerCase();
  return kws.some((kw) => lower.includes(kw));
}
