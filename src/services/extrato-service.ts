/**
 * Serviço de parsing de EXTRATO bancário (entradas + saídas).
 * Reaproveita o extrator de texto do PDF do fatura-cartao-service.
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase-config';
import type { CategoriaCusto } from './custos-service';
import type { CategoriaReceita } from './receitas-service';

export type TipoTransacaoExtrato = 'entrada' | 'saida';

export interface ExtratoTransacao {
  data: string; // 'DD/MM/AAAA'
  descricao: string;
  tipo: TipoTransacaoExtrato;
  categoriaDespesa: CategoriaCusto | null;
  categoriaReceita: CategoriaReceita | null;
  valor: number; // sempre positivo
}

export interface ExtratoResult {
  banco: string | null;
  conta: string | null;
  periodo: string | null;
  saldoFinal: number | null;
  transacoes: ExtratoTransacao[];
}

export async function parseExtrato(textoExtrato: string): Promise<ExtratoResult> {
  const functions = getFunctions(app, 'us-central1');
  const call = httpsCallable<{ textoExtrato: string }, ExtratoResult>(
    functions,
    'extratoParserCallable',
    { timeout: 300_000 },
  );
  const textoLimitado = textoExtrato.substring(0, 20000);
  const result = await call({ textoExtrato: textoLimitado });
  return result.data;
}
