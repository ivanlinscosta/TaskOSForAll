import { onCallGenkit } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import { assistantFlow } from './flows/assistant-flow';
import { assistantImageFlow } from './flows/assistant-image-flow';
import { faturaParserFlow } from './flows/fatura-parser-flow';
import { extratoParserFlow } from './flows/extrato-parser-flow';
import { insightsFlow } from './flows/insights-flow';
import { carreiraFlow } from './flows/carreira-flow';
import { viagemPlanningFlow } from './flows/viagem-planning-flow';
import { curriculoParserFlow } from './flows/curriculo-parser-flow';
import { investmentInsightsFlow } from './flows/investment-insights-flow';
import { investmentProjectionFlow } from './flows/investment-projection-flow';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

export const assistantFlowCallable = onCallGenkit(
  {
    secrets: [geminiApiKey],
  },
  assistantFlow
);

export const assistantImageFlowCallable = onCallGenkit(
  {
    secrets: [geminiApiKey],
  },
  assistantImageFlow
);

export const faturaParserCallable = onCallGenkit(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    memory: '512MiB',
  },
  faturaParserFlow
);

export const extratoParserCallable = onCallGenkit(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    memory: '512MiB',
  },
  extratoParserFlow
);

export const financasInsightsCallable = onCallGenkit(
  {
    secrets: [geminiApiKey],
  },
  insightsFlow
);

export const carreiraAnaliseCallable = onCallGenkit(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 180,
    memory: '512MiB',
  },
  carreiraFlow
);

export const viagemPlanningCallable = onCallGenkit(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    memory: '512MiB',
    cors: true,
  },
  viagemPlanningFlow
);

export const curriculoParserCallable = onCallGenkit(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 180,
    memory: '512MiB',
    cors: true,
  },
  curriculoParserFlow
);

export const investmentInsightsCallable = onCallGenkit(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 120,
  },
  investmentInsightsFlow
);

export const investmentProjectionCallable = onCallGenkit(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 180,
    memory: '512MiB',
  },
  investmentProjectionFlow
);
