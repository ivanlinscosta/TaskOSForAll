import { z } from 'zod';
import { ai } from '../genkit';

export const assistantImageInputSchema = z.object({
  prompt: z.string().min(1),
  contextMode: z.enum(['fiap', 'itau']),
});

export const assistantImageOutputSchema = z.object({
  imageDataUrl: z.string(),
  caption: z.string().default(''),
});

function extractImageDataUrl(response: any): string {
  const candidate = response?.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  for (const part of parts) {
    const inlineData = part?.inlineData || part?.media;
    const mimeType = inlineData?.mimeType || inlineData?.contentType;
    const data = inlineData?.data || inlineData?.base64;

    if (mimeType?.startsWith('image/') && data) {
      return `data:${mimeType};base64,${data}`;
    }
  }

  throw new Error('Nenhuma imagem foi retornada pelo modelo.');
}

export const assistantImageFlow = ai.defineFlow(
  {
    name: 'assistantImageFlow',
    inputSchema: assistantImageInputSchema,
    outputSchema: assistantImageOutputSchema,
  },
  async ({ prompt, contextMode }) => {
    const themedPrompt =
      contextMode === 'fiap'
        ? `Crie uma imagem no contexto acadêmico/educacional FIAP. ${prompt}`
        : `Crie uma imagem no contexto corporativo/profissional do Itaú. ${prompt}`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
      prompt: themedPrompt,
    });

    const imageDataUrl = extractImageDataUrl(response);

    return {
      imageDataUrl,
      caption: 'Imagem gerada pelo AI Assistant',
    };
  }
);