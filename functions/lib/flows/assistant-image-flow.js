"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assistantImageFlow = exports.assistantImageOutputSchema = exports.assistantImageInputSchema = void 0;
const zod_1 = require("zod");
const genkit_1 = require("../genkit");
exports.assistantImageInputSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(1),
    contextMode: zod_1.z.enum(['fiap', 'itau']),
});
exports.assistantImageOutputSchema = zod_1.z.object({
    imageDataUrl: zod_1.z.string(),
    caption: zod_1.z.string().default(''),
});
function extractImageDataUrl(response) {
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
exports.assistantImageFlow = genkit_1.ai.defineFlow({
    name: 'assistantImageFlow',
    inputSchema: exports.assistantImageInputSchema,
    outputSchema: exports.assistantImageOutputSchema,
}, async ({ prompt, contextMode }) => {
    const themedPrompt = contextMode === 'fiap'
        ? `Crie uma imagem no contexto acadêmico/educacional FIAP. ${prompt}`
        : `Crie uma imagem no contexto corporativo/profissional do Itaú. ${prompt}`;
    const response = await genkit_1.ai.generate({
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
});
//# sourceMappingURL=assistant-image-flow.js.map