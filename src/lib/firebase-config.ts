import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: 'AIzaSyAs48tR2uFl8eY5ZPTEPxjp3AYajlLFECs',
  authDomain: 'taskos-forall.firebaseapp.com',
  projectId: 'taskos-forall',
  storageBucket: 'taskos-forall.firebasestorage.app',
  messagingSenderId: '963979254033',
  appId: '1:963979254033:web:4c891a22c46a36d4e814b0',
  measurementId: 'G-712CVX678B',
};

export const app = initializeApp(firebaseConfig);

let analytics;
try {
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error('Erro ao inicializar Analytics:', error);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const COLLECTIONS = {
  USUARIOS: 'usuarios',
  TAREFAS: 'tarefas',
  TAREFAS_PESSOAIS: 'tarefas_pessoais',
  FEEDBACKS: 'feedbacks',
  REUNIOES: 'reunioes',
  ALUNOS: 'alunos',
  AULAS: 'aulas',
  CUSTOS: 'custos',
  VIAGENS: 'viagens',
  RECEITAS: 'receitas',
  CHAT_LOGS: 'chat_logs',
  CARREIRA_ANALISES: 'carreira_analises',
  // Gamification & Development
  GAMIFICATION_PROFILES: 'gamification_profiles',
  DEVELOPMENT_ITEMS: 'development_items',
  USER_CHALLENGES: 'user_challenges',
  USER_GOALS_CAREER: 'user_goals_career',
  SAVED_JOBS: 'saved_jobs',
} as const;

export { analytics };
