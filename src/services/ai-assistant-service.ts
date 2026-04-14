import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallableFromURL,
} from 'firebase/functions';
import { firebaseConfig, app } from '../lib/firebase-config';

export type AssistantMessage = {
  role: 'user' | 'assistant';
  text: string;
};

export type AssistantResponse = {
  markdown: string;
  chart: {
    type: 'bar' | 'line' | 'pie';
    title: string;
    description?: string;
    xKey?: string;
    data: Record<string, any>[];
    series: Array<{ key: string; label: string }>;
  } | null;
  imageRequest: {
    shouldGenerate: boolean;
    prompt: string;
  };
};

function getProjectId() {
  const projectId = firebaseConfig?.projectId;
  if (!projectId) throw new Error('Project ID não encontrado no firebase-config.ts.');
  return projectId;
}

function getFunctionsInstance() {
  const functions = getFunctions(app, 'us-central1');

  if (import.meta.env.DEV) {
    connectFunctionsEmulator(functions, '127.0.0.1', 5002);
  }

  return functions;
}

function getCallableUrl(name: string) {
  const projectId = getProjectId();

  if (import.meta.env.DEV) {
    return `http://127.0.0.1:5002/${projectId}/us-central1/${name}`;
  }

  return `https://us-central1-${projectId}.cloudfunctions.net/${name}`;
}

export async function askAssistant(params: {
  prompt: string;
  contextMode: 'fiap' | 'itau' | 'pessoal';
  history: AssistantMessage[];
}) {
  const functions = getFunctionsInstance();

  const callable = httpsCallableFromURL<
    typeof params,
    AssistantResponse
  >(functions, getCallableUrl('assistantFlowCallable'));

  const result = await callable(params);
  return result.data;
}

export async function generateAssistantImage(params: {
  prompt: string;
  contextMode: 'fiap' | 'itau' | 'pessoal';
}) {
  const functions = getFunctionsInstance();

  const callable = httpsCallableFromURL<
    typeof params,
    { imageDataUrl: string; caption: string }
  >(functions, getCallableUrl('assistantImageFlowCallable'));

  const result = await callable(params);
  return result.data;
}