import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault(), projectId: 'taskos-forall' });

const db = getFirestore();

const now = new Date();
const startAt = Timestamp.fromDate(new Date('2025-04-01T00:00:00Z'));
const endAt   = Timestamp.fromDate(new Date('2025-12-31T23:59:59Z'));

const campaign = {
  title: 'Novidades de Abril',
  subtitle: 'Atualização do produto',
  description: 'Tour das novidades lançadas em abril de 2025.',
  status: 'active',
  audienceType: 'all',
  audienceRules: {},
  triggerPage: 'dashboard',
  startAt,
  endAt,
  priority: 1,
  dismissible: true,
  repeatable: false,
  version: '1',
  themeVariant: 'update',
  createdBy: 'seed-script',
  createdAt: Timestamp.fromDate(now),
  updatedAt: Timestamp.fromDate(now),
  steps: [
    {
      id: 'step-1',
      order: 1,
      title: 'Vagas recomendadas com IA',
      description:
        'Agora o TaskOS analisa seu perfil e busca vagas nos principais portais do mercado. Acesse "Vagas Para Mim" no menu lateral para ver as oportunidades.',
      imageAsset: 'career',
      imageVariant: 'center',
      accentColor: '#7C3AED',
      layoutVariant: 'default',
      ctaLabel: 'Entendi',
    },
    {
      id: 'step-2',
      order: 2,
      title: 'Filtro de meses nas finanças',
      description:
        'Filtre despesas por um ou mais meses com checkbox. O mês atual já vem selecionado por padrão para facilitar sua visão diária.',
      imageAsset: 'finance',
      imageVariant: 'center',
      accentColor: '#10B981',
      layoutVariant: 'default',
      ctaLabel: 'Entendi',
    },
    {
      id: 'step-3',
      order: 3,
      title: 'Tour guiado por campanhas',
      description:
        'Este próprio tour é um exemplo! Crie campanhas no Firestore e ative via Remote Config para comunicar novidades aos usuários sem nenhum deploy.',
      imageAsset: 'dashboard',
      imageVariant: 'center',
      accentColor: '#F59E0B',
      layoutVariant: 'default',
      ctaLabel: 'Entendi',
    },
    {
      id: 'step-4',
      order: 4,
      title: 'Tudo pronto!',
      description:
        'Explore as novidades. Quando tiver uma atualização importante, basta criar uma nova campanha e ativar — sem deploy, sem fricção.',
      imageAsset: 'onboarding',
      imageVariant: 'center',
      accentColor: '#0EA5E9',
      layoutVariant: 'default',
      ctaLabel: 'Começar',
    },
  ],
};

const docId = 'abril-2025';
await db.collection('guided_tour_campaigns').doc(docId).set(campaign);
console.log(`✅ Campanha "${docId}" criada com sucesso no Firestore.`);
console.log(`\n👉 Agora ative no Remote Config:`);
console.log(`   guided_tour_enabled = true`);
console.log(`   guided_tour_active_campaign_id = ${docId}`);
process.exit(0);
