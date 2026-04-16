import * as pdfjs from 'pdfjs-dist';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase-config';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export type CategoriaCusto =
  | 'alimentacao'
  | 'transporte'
  | 'lazer'
  | 'saude'
  | 'moradia'
  | 'educacao'
  | 'vestuario'
  | 'outros';

export interface FaturaTransacao {
  data: string;
  descricao: string;
  categoria: CategoriaCusto;
  valor: number;
  parcelaAtual: number | null;
  parcelaTotal: number | null;
  isInternacional: boolean;
}

export interface FaturaResult {
  titular: string;
  totalFatura: number;
  vencimento: string;
  transacoes: FaturaTransacao[];
}

/**
 * Extrai texto do PDF agrupando itens por linha (coordenada Y),
 * produzindo texto mais legível para o modelo de linguagem.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const allLines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const byY = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items) {
      if (!('str' in item) || !(item as any).str.trim()) continue;
      const { transform, str } = item as any;
      const y = Math.round(transform[5]);
      const x = transform[4];
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push({ x, str });
    }

    const sortedYs = [...byY.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const line = byY.get(y)!
        .sort((a, b) => a.x - b.x)
        .map(i => i.str)
        .join(' ')
        .trim();
      if (line) allLines.push(line);
    }

    allLines.push('');
  }

  return allLines.join('\n');
}

/**
 * Envia o texto da fatura para o faturaParserCallable (Gemini com schema estruturado).
 */
/**
 * Limpa o texto bruto do PDF antes de enviar à IA.
 * Remove seções irrelevantes (avisos legais, rodapés, SAC, etc.)
 * e linhas que claramente não são transações.
 */
function limparTextoFatura(raw: string): string {
  const linhas = raw.split('\n');
  const filtradas = linhas.filter((l) => {
    const t = l.trim().toLowerCase();
    if (!t) return false;
    // Remover apenas linhas claramente irrelevantes (SAC, ouvidoria, termos legais)
    if (t.includes('sac ') || t.includes('ouvidoria') || t.includes('0800')) return false;
    if (t.includes('regulamento') || t.includes('cláusula')) return false;
    if (t.includes('central de atendimento')) return false;
    if (t.includes('informe de rendimentos')) return false;
    // Bloquear apenas blocos de texto muito grandes (provavelmente termos)
    if (t.length > 500) return false;
    return true;
  });
  return filtradas.join('\n');
}

export async function parseFatura(textoFatura: string): Promise<FaturaResult> {
  const functions = getFunctions(app, 'us-central1');
  const call = httpsCallable<{ textoFatura: string }, FaturaResult>(
    functions,
    'faturaParserCallable',
    { timeout: 300_000 },
  );
  // Pre-processar: limpar linhas irrelevantes e limitar tamanho
  const textoLimpo = limparTextoFatura(textoFatura);
  // Gemini suporta inputs grandes — manter limite generoso para não perder transações
  const textoLimitado = textoLimpo.substring(0, 30000);
  const result = await call({ textoFatura: textoLimitado });
  return result.data;
}
