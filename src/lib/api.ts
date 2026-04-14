// API calls com integração OpenAI e fallback para mock

import { PlanoAula, AvaliacaoTimeIA, ResumoReuniaoIA } from '../types';
import * as openaiService from './openai-service';

const API_DELAY = 2000; // Simula latência de rede

// Simula delay de requisição
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gera um plano de aula usando IA
 * Tenta usar OpenAI, fallback para mock se não configurado
 */
export async function generatePlanoAula(
  tema: string,
  serie: string,
  objetivo: string
): Promise<PlanoAula> {
  try {
    if (openaiService.isOpenAIConfigured()) {
      const content = await openaiService.generateLessonPlanWithAI(tema, serie, objetivo);
      return {
        tema,
        serie,
        objetivo,
        conteudo: {
          introducao: content.split('\n')[0] || `Contextualização sobre ${tema}`,
          desenvolvimento: content.split('\n').slice(1, 6),
          conclusao: content.split('\n').slice(-2)[0] || 'Conclusão',
          recursos: ['Computador', 'IDE', 'Dataset'],
          avaliacao: 'Participação (30%), Exercício (40%), Projeto (30%)',
        },
        duracao: 180,
      };
    }
  } catch (error) {
    console.warn('Erro ao usar OpenAI, usando mock:', error);
  }

  // Fallback para mock
  await delay(API_DELAY);
  return {
    tema,
    serie,
    objetivo,
    conteudo: {
      introducao: `Contextualização sobre ${tema}, apresentando conceitos fundamentais e aplicações práticas no contexto de ${serie}.`,
      desenvolvimento: [
        'Explicação teórica dos principais conceitos',
        'Demonstração prática com ferramentas',
        'Exercícios guiados em grupo',
        'Atividade hands-on de implementação',
        'Discussão de cases reais de mercado',
      ],
      conclusao: 'Recapitulação dos pontos principais, discussão sobre aprendizados e apresentação dos próximos passos.',
      recursos: [
        'Computador com acesso à internet',
        'IDE de desenvolvimento',
        'Material de apoio (slides/documentação)',
        'Dataset para exercícios práticos',
      ],
      avaliacao: 'Participação (30%), Exercício prático (40%), Projeto final (30%)',
    },
    duracao: 180,
  };
}

/**
 * Avalia um aluno e gera recomendações pedagógicas
 * Tenta usar OpenAI, fallback para mock se não configurado
 */
export async function avaliarAluno(
  alunoId: string,
  notas: number[],
  comportamento: string
): Promise<{
  diagnostico: string;
  recomendacoes: string[];
  pontosFortes: string[];
  areasAtencao: string[];
}> {
  try {
    if (openaiService.isOpenAIConfigured()) {
      const content = await openaiService.evaluateStudentWithAI(
        `Aluno ${alunoId}`,
        notas,
        comportamento,
        'Avaliação automática'
      );
      
      return {
        diagnostico: content.split('\n')[0] || 'Aluno com desempenho satisfatório',
        recomendacoes: content.split('\n').slice(1, 4),
        pontosFortes: ['Boa participação', 'Interesse em aprender'],
        areasAtencao: ['Melhorar consistência', 'Aprofundar conhecimentos'],
      };
    }
  } catch (error) {
    console.warn('Erro ao usar OpenAI, usando mock:', error);
  }

  // Fallback para mock
  await delay(API_DELAY);
  const media = notas.reduce((a, b) => a + b, 0) / notas.length;

  return {
    diagnostico: media >= 7 
      ? 'Aluno com desempenho satisfatório, demonstrando bom aproveitamento dos conteúdos.' 
      : 'Aluno necessita de atenção especial e reforço em conceitos fundamentais.',
    recomendacoes: [
      'Incentivar participação ativa em aula',
      'Propor exercícios de fixação adicionais',
      'Agendar mentoria individual se necessário',
    ],
    pontosFortes: [
      'Boa participação em discussões',
      'Interesse em aprender',
    ],
    areasAtencao: [
      'Melhorar consistência nas entregas',
      'Aprofundar conhecimentos teóricos',
    ],
  };
}

/**
 * Avalia performance de um time/squad
 * Tenta usar OpenAI, fallback para mock se não configurado
 */
export async function avaliarTime(
  timeNome: string,
  periodo: string
): Promise<AvaliacaoTimeIA> {
  try {
    if (openaiService.isOpenAIConfigured()) {
      const content = await openaiService.generateTeamFeedbackWithAI(
        timeNome,
        'Squad',
        periodo,
        'Entregas consistentes',
        'Comunicação'
      );
      
      return {
        analistaId: 'team-assessment',
        pontuacao: 92,
        fortalezas: content.split('\n').slice(0, 3),
        areas_melhoria: content.split('\n').slice(3, 6),
        recomendacoes: content.split('\n').slice(6, 9),
        tendencia: 'crescimento',
      };
    }
  } catch (error) {
    console.warn('Erro ao usar OpenAI, usando mock:', error);
  }

  // Fallback para mock
  await delay(API_DELAY);
  return {
    analistaId: 'team-assessment',
    pontuacao: 92,
    fortalezas: [
      'Excelência técnica em IA e ML',
      'Forte cultura de colaboração',
      'Consistência em entregas de qualidade',
    ],
    areas_melhoria: [
      'Comunicação com stakeholders não-técnicos',
      'Gestão de tempo e priorização',
      'Documentação de decisões arquiteturais',
    ],
    recomendacoes: [
      'Workshop de comunicação executiva',
      'Template padronizado para docs técnicos',
      'Reuniões de alinhamento mais frequentes',
    ],
    tendencia: 'crescimento',
  };
}

/**
 * Gera resumo automático de reunião
 * Tenta usar OpenAI, fallback para mock se não configurado
 */
export async function resumirReuniao(
  reuniaoId: string,
  notas: string
): Promise<ResumoReuniaoIA> {
  try {
    if (openaiService.isOpenAIConfigured()) {
      const content = await openaiService.summarizeMeetingWithAI(
        `Reunião ${reuniaoId}`,
        notas,
        ['Participantes']
      );
      
      return {
        reuniaoId,
        resumo: content.split('\n')[0] || 'Reunião produtiva',
        principais_pontos: content.split('\n').slice(1, 4),
        decisoes: content.split('\n').slice(4, 7),
        acoes_sugeridas: [
          {
            id: 'action-1',
            descricao: 'Ação 1',
            responsavel: 'Responsável',
            prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pendente',
          },
        ],
        participantes_destaque: ['Participante 1'],
      };
    }
  } catch (error) {
    console.warn('Erro ao usar OpenAI, usando mock:', error);
  }

  // Fallback para mock
  await delay(API_DELAY);
  return {
    reuniaoId,
    resumo: 'Reunião produtiva com discussão sobre roadmap Q2 e priorização de features. Time alinhado sobre próximos passos e responsabilidades definidas.',
    principais_pontos: [
      'Definição de prioridades para Q2',
      'Alocação de recursos no projeto de churn',
      'Aprovação de budget adicional para infraestrutura',
    ],
    decisoes: [
      'Implementar modelo de churn em produção até fim do mês',
      'Contratar analista júnior adicional',
      'Migrar infraestrutura para novo cluster',
    ],
    acoes_sugeridas: [
      {
        id: 'action-1',
        descricao: 'Finalizar documentação técnica do modelo',
        responsavel: 'Tech Lead',
        prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pendente',
      },
      {
        id: 'action-2',
        descricao: 'Configurar pipeline de deploy',
        responsavel: 'Engenheiro ML',
        prazo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'pendente',
      },
    ],
    participantes_destaque: [
      'João Silva - Liderança técnica',
      'Maria Santos - Ideias inovadoras',
    ],
  };
}

/**
 * Gera insights de produtividade
 * Tenta usar OpenAI, fallback para mock se não configurado
 */
export async function gerarInsightsProdutividade(
  tarefasConcluidas: number,
  reunioesRealizadas: number,
  contexto: 'fiap' | 'itau'
): Promise<{
  insights: string[];
  sugestoes: string[];
  score: number;
}> {
  try {
    if (openaiService.isOpenAIConfigured()) {
      const content = await openaiService.generateProductivityInsightsWithAI(
        tarefasConcluidas,
        10,
        reunioesRealizadas,
        8,
        contexto
      );
      
      const score = Math.min(100, (tarefasConcluidas * 10) + (reunioesRealizadas * 5));
      return {
        insights: content.split('\n').slice(0, 2),
        sugestoes: content.split('\n').slice(2, 5),
        score,
      };
    }
  } catch (error) {
    console.warn('Erro ao usar OpenAI, usando mock:', error);
  }

  // Fallback para mock
  await delay(1000);
  const score = Math.min(100, (tarefasConcluidas * 10) + (reunioesRealizadas * 5));

  return {
    insights: [
      score >= 80 
        ? 'Excelente produtividade! Você está superando suas metas.' 
        : 'Performance abaixo do esperado. Considere revisar prioridades.',
      `Contexto ${contexto.toUpperCase()}: ${tarefasConcluidas} tarefas concluídas esta semana.`,
    ],
    sugestoes: [
      'Agendar blocos de foco para deep work',
      'Revisar tarefas de baixa prioridade',
      'Delegar quando possível',
    ],
    score,
  };
}

// Estrutura para configuração da API OpenAI
export const openAIConfig = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 2000,
};

/**
 * Função genérica para chamar OpenAI
 */
export async function callOpenAI(prompt: string, systemMessage: string) {
  if (!openaiService.isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY environment variable.');
  }

  return openaiService.askAIAssistant(prompt, 'fiap', [
    { role: 'system', content: systemMessage },
  ]);
}
