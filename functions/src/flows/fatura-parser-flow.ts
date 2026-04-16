import { z } from 'zod';
import { ai } from '../genkit';

const CategoriaSchema = z.enum([
  'alimentacao', 'transporte', 'lazer', 'saude',
  'moradia', 'educacao', 'vestuario', 'outros',
]);

const TransacaoSchema = z.object({
  data: z.string(),
  descricao: z.string(),
  categoria: CategoriaSchema,
  valor: z.number(),
  parcelaAtual: z.number().nullable(),
  parcelaTotal: z.number().nullable(),
  isInternacional: z.boolean(),
});

export const faturaInputSchema = z.object({
  textoFatura: z.string().min(1),
});

export const faturaOutputSchema = z.object({
  titular: z.string(),
  totalFatura: z.number(),
  vencimento: z.string(),
  transacoes: z.array(TransacaoSchema),
});

export type FaturaOutput = z.infer<typeof faturaOutputSchema>;

export const faturaParserFlow = ai.defineFlow(
  {
    name: 'faturaParserFlow',
    inputSchema: faturaInputSchema,
    outputSchema: faturaOutputSchema,
  },
  async ({ textoFatura }) => {
    const response = await ai.generate({
      prompt: `Extraia TODAS as transações de compra desta fatura de cartão de crédito.

IGNORE: estornos, pagamentos, boletos, PIX, anuidade, encargos, IOF, "próximas faturas".
INCLUA: compras em lojas, sites, apps, assinaturas, serviços.

Regras:
- Categorias válidas: alimentacao, transporte, lazer, saude, moradia, educacao, vestuario, outros
- Campo "data": SEMPRE no formato DD/MM (sem ano). Ex: "15/03", "02/11"
- Campo "vencimento": SEMPRE no formato DD/MM/AAAA. Ex: "10/04/2026"
- Parcela "XX/YY" → parcelaAtual=XX, parcelaTotal=YY. Sem parcela → null para ambos
- Limpe nomes de estabelecimentos: "MERCADOLIVRE*3PROD"→"Mercado Livre", "AMAZONMKTPLC*X"→"Amazon", "PAG*JoseSilva"→"Pag José Silva", "IFOOD*IFOOD"→"iFood"
- Valores SEMPRE positivos em reais: "298,31"→298.31, "1.234,56"→1234.56
- isInternacional: true se moeda estrangeira (USD, EUR, etc.)
- titular: primeiro nome do titular do cartão
- totalFatura: valor total da fatura (número positivo)

Fatura:
${textoFatura}`,
      output: { schema: faturaOutputSchema },
    });

    if (!response.output) {
      throw new Error('Não foi possível extrair os dados da fatura. Verifique o arquivo.');
    }

    return response.output;
  }
);
