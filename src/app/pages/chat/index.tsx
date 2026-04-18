import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Bot,
  Briefcase,
  CheckCircle2,
  CheckSquare,
  Heart,
  HelpCircle,
  Loader2,
  MessageSquare,
  Plane,
  RotateCcw,
  Send,
  SkipForward,
  Wallet,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../../../lib/auth-context';
import { getGoalLabel } from '../../../lib/taskos-forall';
import { saveChatData, type ChatAction, type ChatWorkspace } from '../../../services/chat-save-service';
import { askPlatformHelp } from '../../../lib/openai-service';

type ChatStep = 'choose_action' | 'choose_workspace' | 'collect' | 'confirm' | 'saving' | 'success' | 'ajuda';

interface FieldDef {
  key: string;
  question: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  required: boolean;
  hint?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface Message {
  id: string;
  role: 'bot' | 'user';
  content: string;
}

const ACTIONS: Array<{
  value: ChatAction;
  label: string;
  description: string;
  icon: any;
  recommendedGoalIds: string[];
  alwaysShow?: boolean;
}> = [
  {
    value: 'tarefa',
    label: 'Cadastrar tarefa',
    description: 'Crie uma nova tarefa de forma guiada.',
    icon: CheckSquare,
    recommendedGoalIds: ['acompanhar_tarefas', 'acompanhar_tarefas_pessoais', 'usar_chat_rapido'],
  },
  {
    value: 'gasto',
    label: 'Cadastrar gasto',
    description: 'Registre um gasto de trabalho ou pessoal.',
    icon: Wallet,
    recommendedGoalIds: ['organizar_financas', 'registrar_gastos_pessoais', 'controlar_gastos_trabalho', 'usar_chat_rapido'],
  },
  {
    value: 'feedback',
    label: 'Registrar feedback',
    description: 'Guarde um feedback importante.',
    icon: MessageSquare,
    recommendedGoalIds: ['registrar_feedbacks', 'usar_chat_rapido'],
  },
  {
    value: 'viagem',
    label: 'Cadastrar viagem',
    description: 'Salve destino, datas e objetivo.',
    icon: Plane,
    recommendedGoalIds: ['planejar_viagens', 'usar_chat_rapido'],
  },
  {
    value: 'ajuda',
    label: 'Pedir ajuda',
    description: 'Tire dúvidas sobre a plataforma.',
    icon: HelpCircle,
    recommendedGoalIds: [],
    alwaysShow: true,
  },
];

const FIELDS: Record<ChatAction, FieldDef[]> = {
  tarefa: [
    { key: 'titulo', question: 'Qual é o título da tarefa?', type: 'text', required: true, placeholder: 'Ex.: Preparar proposta' },
    { key: 'descricao', question: 'Descreva a tarefa', type: 'textarea', required: false, placeholder: 'Contexto ou detalhes' },
    { key: 'prazo', question: 'Qual é o prazo?', type: 'date', required: false },
    {
      key: 'prioridade',
      question: 'Qual é a prioridade?',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'Baixa' },
        { value: 'medium', label: 'Média' },
        { value: 'high', label: 'Alta' },
      ],
    },
  ],
  gasto: [
    { key: 'descricao', question: 'O que foi esse gasto?', type: 'text', required: true, placeholder: 'Ex.: Uber para reunião' },
    { key: 'valor', question: 'Qual foi o valor?', type: 'number', required: true, placeholder: 'Ex.: 49,90' },
    { key: 'categoria', question: 'Qual a categoria?', type: 'text', required: true, placeholder: 'Ex.: transporte, alimentação...' },
    { key: 'data', question: 'Qual foi a data?', type: 'date', required: false },
  ],
  feedback: [
    { key: 'pessoa', question: 'Para quem é esse feedback?', type: 'text', required: true, placeholder: 'Ex.: Ana' },
    { key: 'tipo', question: 'Qual o tipo do feedback?', type: 'text', required: true, placeholder: 'Ex.: positivo, construtivo...' },
    { key: 'contexto', question: 'Qual o contexto?', type: 'text', required: false, placeholder: 'Ex.: sprint review' },
    { key: 'descricao', question: 'Descreva o feedback', type: 'textarea', required: true, placeholder: 'Escreva o feedback completo' },
  ],
  viagem: [
    { key: 'destino', question: 'Qual é o destino?', type: 'text', required: true, placeholder: 'Ex.: Salvador' },
    { key: 'dataIda', question: 'Qual a data de ida?', type: 'date', required: true },
    { key: 'dataVolta', question: 'Qual a data de volta?', type: 'date', required: false },
    { key: 'objetivo', question: 'Qual o objetivo da viagem?', type: 'textarea', required: false, placeholder: 'Ex.: férias ou congresso' },
  ],
  ajuda: [],
};

function makeMessage(role: 'bot' | 'user', content: string): Message {
  return { id: crypto.randomUUID(), role, content };
}

function MessageBubble({ message }: { message: Message }) {
  const isBot = message.role === 'bot';
  return (
    <div className={cn('flex gap-2', isBot ? 'justify-start' : 'justify-end')}>
      {isBot && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)]">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isBot
            ? 'rounded-tl-md border border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-foreground)]'
            : 'rounded-tr-md bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)]',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function validate(field: FieldDef, value: string) {
  if (field.required && !value.trim()) return 'Este campo é obrigatório.';
  if (field.type === 'number' && value.trim()) {
    const normalized = value.replace(',', '.');
    if (Number.isNaN(Number(normalized))) return 'Informe um valor numérico válido.';
  }
  return null;
}

export function ChatGuiado() {
  const { user, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    makeMessage('bot', 'Olá! Vou te ajudar a cadastrar informações no TaskAll. Escolha uma ação para começar.'),
  ]);
  const [step, setStep] = useState<ChatStep>('choose_action');
  const [selectedAction, setSelectedAction] = useState<ChatAction | null>(null);
  const [workspace, setWorkspace] = useState<ChatWorkspace | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [helpInput, setHelpInput] = useState('');
  const [isHelpLoading, setIsHelpLoading] = useState(false);
  const [helpConversation, setHelpConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const actionParam = searchParams.get('action') as ChatAction | null;
    const workspaceParam = searchParams.get('workspace') as ChatWorkspace | null;

    if (actionParam && ACTIONS.some((item) => item.value === actionParam) && !selectedAction) {
      if (actionParam === 'ajuda') {
        setSelectedAction('ajuda');
        setStep('ajuda');
        setMessages([
          makeMessage('bot', 'Olá! Estou aqui para tirar suas dúvidas sobre o TaskAll. O que você gostaria de saber?'),
        ]);
        return;
      }

      setSelectedAction(actionParam);
      setStep(workspaceParam && (workspaceParam === 'work' || workspaceParam === 'life') ? 'collect' : 'choose_workspace');

      if (workspaceParam === 'work' || workspaceParam === 'life') {
        setWorkspace(workspaceParam);
        setCurrentFieldIndex(0);
        const firstField = FIELDS[actionParam][0];
        const workspaceLabel = workspaceParam === 'work' ? 'Trabalho' : 'Vida pessoal';
        setMessages([
          makeMessage('bot', `Vamos abrir uma jornada rápida para ${ACTIONS.find((item) => item.value === actionParam)?.label.toLowerCase()}.`),
          makeMessage('user', workspaceLabel),
          makeMessage('bot', `Perfeito. ${firstField.question}`),
        ]);
      } else {
        setMessages([
          makeMessage('bot', `Vamos abrir uma jornada rápida para ${ACTIONS.find((item) => item.value === actionParam)?.label.toLowerCase()}.`),
          makeMessage('bot', 'Em qual workspace você quer realizar essa ação?'),
        ]);
      }
    }
  }, [searchParams, selectedAction]);

  const availableActions = useMemo(() => {
    const workGoals = userProfile?.preferencias?.workGoals ?? [];
    const lifeGoals = userProfile?.preferencias?.lifeGoals ?? [];
    const activeGoals = new Set([...workGoals, ...lifeGoals]);
    const filtered = ACTIONS.filter((action) =>
      !action.alwaysShow && action.recommendedGoalIds.some((goalId) => activeGoals.has(goalId)),
    );
    const ajudaAction = ACTIONS.find((a) => a.value === 'ajuda')!;
    return [...filtered, ajudaAction];
  }, [userProfile?.preferencias]);

  const currentField = selectedAction && selectedAction !== 'ajuda' ? FIELDS[selectedAction][currentFieldIndex] : null;

  const restart = () => {
    setMessages([makeMessage('bot', 'Sessão encerrada. Escolha uma nova ação para continuar.')]);
    setStep('choose_action');
    setSelectedAction(null);
    setWorkspace(null);
    setAnswers({});
    setCurrentFieldIndex(0);
    setInputValue('');
    setHelpInput('');
    setHelpConversation([]);
  };

  const handleChooseAction = (action: ChatAction) => {
    const actionLabel = ACTIONS.find((item) => item.value === action)?.label || action;

    if (action === 'ajuda') {
      setSelectedAction('ajuda');
      setStep('ajuda');
      setHelpConversation([]);
      setMessages((prev) => [
        ...prev,
        makeMessage('user', actionLabel),
        makeMessage('bot', 'Olá! Estou aqui para tirar suas dúvidas sobre o TaskAll. 😊\n\nPode me perguntar sobre qualquer funcionalidade — tarefas, planejamento, finanças, carreira, chat guiado, perfil ou qualquer outra coisa. Como posso te ajudar?'),
      ]);
      return;
    }

    setSelectedAction(action);
    setStep('choose_workspace');
    setMessages((prev) => [
      ...prev,
      makeMessage('user', actionLabel),
      makeMessage('bot', 'Perfeito. Em qual workspace você quer realizar essa ação?'),
    ]);
  };

  const handleChooseWorkspace = (nextWorkspace: ChatWorkspace) => {
    if (!selectedAction) return;

    setWorkspace(nextWorkspace);
    setStep('collect');
    setCurrentFieldIndex(0);

    const firstField = FIELDS[selectedAction][0];
    const workspaceLabel = nextWorkspace === 'work' ? 'Trabalho' : 'Vida pessoal';

    setMessages((prev) => [
      ...prev,
      makeMessage('user', workspaceLabel),
      makeMessage(
        'bot',
        `Ótimo. Vou personalizar essa jornada com base nas suas preferências de ${workspaceLabel.toLowerCase()}. ${firstField.question}`,
      ),
    ]);
  };

  const handleAnswer = async (answer: string) => {
    if (!currentField || !selectedAction) return;

    const error = validate(currentField, answer);
    if (error) {
      setMessages((prev) => [...prev, makeMessage('bot', error)]);
      return;
    }

    const nextAnswers = {
      ...answers,
      [currentField.key]: answer,
    };
    setAnswers(nextAnswers);

    const nextIndex = currentFieldIndex + 1;
    const fields = FIELDS[selectedAction];

    setMessages((prev) => [...prev, makeMessage('user', answer)]);

    if (nextIndex < fields.length) {
      setCurrentFieldIndex(nextIndex);
      setMessages((prev) => [...prev, makeMessage('bot', fields[nextIndex].question)]);
      setInputValue('');
      return;
    }

    setStep('confirm');
    const summary = Object.entries(nextAnswers)
      .map(([key, value]) => `• ${key}: ${value || '—'}`)
      .join('\n');

    setMessages((prev) => [
      ...prev,
      makeMessage(
        'bot',
        `Revise os dados antes de salvar:\n${summary}\n\nSe estiver tudo certo, toque em Confirmar cadastro.`,
      ),
    ]);
    setInputValue('');
  };

  const confirmSave = async () => {
    if (!selectedAction || !workspace || !user?.uid) return;
    try {
      setIsSaving(true);
      setStep('saving');
      setMessages((prev) => [...prev, makeMessage('bot', 'Salvando no Firebase...')]);

      const savedId = await saveChatData(selectedAction, workspace, answers, {
        ownerId: user.uid,
        ownerName: userProfile?.nome || user.displayName || '',
        ownerGoals:
          workspace === 'work'
            ? userProfile?.preferencias?.workGoals ?? []
            : userProfile?.preferencias?.lifeGoals ?? [],
      });

      setStep('success');
      setMessages((prev) => [
        ...prev,
        makeMessage(
          'bot',
          `Cadastro realizado com sucesso! ID: ${savedId}. Esta jornada foi personalizada com base nas suas preferências: ${(workspace === 'work'
            ? userProfile?.preferencias?.workGoals ?? []
            : userProfile?.preferencias?.lifeGoals ?? []
          ).map(getGoalLabel).join(', ') || 'sem preferências'}.`,
        ),
      ]);
      toast.success('Cadastro salvo com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar o cadastro.');
      setStep('confirm');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHelpQuestion = async () => {
    const question = helpInput.trim();
    if (!question) return;

    setHelpInput('');
    setMessages((prev) => [...prev, makeMessage('user', question)]);
    setIsHelpLoading(true);

    try {
      const answer = await askPlatformHelp(question, helpConversation);
      setHelpConversation((prev) => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: answer },
      ]);
      setMessages((prev) => [...prev, makeMessage('bot', answer)]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        makeMessage('bot', 'Desculpe, não consegui processar sua pergunta agora. Tente novamente.'),
      ]);
    } finally {
      setIsHelpLoading(false);
    }
  };

  const skipCurrentField = () => {
    if (!currentField || !selectedAction || currentField.required) return;
    void handleAnswer('');
  };

  return (
    <div className="h-full bg-[var(--theme-background)] p-4 sm:p-6">
      <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col overflow-hidden rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-sm">
        <div className="border-b border-[var(--theme-border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--theme-background-secondary)] p-3 text-[var(--theme-accent)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--theme-foreground)]">Chat guiado personalizado</h1>
              <p className="text-xs text-[var(--theme-muted-foreground)]">
                A experiência usa seus objetivos para adaptar as jornadas de cadastro.
              </p>
            </div>
          </div>
        </div>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-[var(--theme-background)] px-4 py-5">
          {step !== 'ajuda' && (
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 text-sm text-[var(--theme-muted-foreground)]">
              <p className="font-medium text-[var(--theme-foreground)]">Preferências ativas</p>
              <p className="mt-2">
                Trabalho: {(userProfile?.preferencias?.workGoals ?? []).map(getGoalLabel).join(', ') || 'nenhuma'}
              </p>
              <p className="mt-1">
                Vida pessoal: {(userProfile?.preferencias?.lifeGoals ?? []).map(getGoalLabel).join(', ') || 'nenhuma'}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {(isSaving || isHelpLoading) && (
            <div className="flex justify-start gap-2">
              <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)]">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3 text-sm">
                {isSaving ? 'Salvando...' : 'Pensando...'}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-4">
          {step === 'choose_action' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableActions.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  onClick={() => handleChooseAction(action.value)}
                  className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] px-4 py-4 text-left transition hover:border-[var(--theme-accent)] hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[var(--theme-background-secondary)] p-2 text-[var(--theme-accent)]">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--theme-foreground)]">{action.label}</p>
                      <p className="mt-1 text-xs text-[var(--theme-muted-foreground)]">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 'choose_workspace' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleChooseWorkspace('work')}
                className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] px-4 py-4 text-left transition hover:border-[var(--theme-accent)] hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[var(--theme-background-secondary)] p-2 text-[var(--theme-accent)]">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Trabalho</p>
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Use metas e menus profissionais</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleChooseWorkspace('life')}
                className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] px-4 py-4 text-left transition hover:border-[var(--theme-accent)] hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[var(--theme-background-secondary)] p-2 text-[var(--theme-accent)]">
                    <Heart className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Vida pessoal</p>
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Use metas e menus pessoais</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 'collect' && currentField && (
            <div className="space-y-3">
              {currentField.type === 'select' && currentField.options ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {currentField.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => void handleAnswer(option.value)}
                      className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] px-3 py-3 text-sm transition hover:border-[var(--theme-accent)]"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={currentField.placeholder || currentField.question}
                    rows={currentField.type === 'textarea' ? 4 : 2}
                    className="w-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] px-4 py-3 text-sm outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleAnswer(inputValue);
                        setInputValue('');
                      }
                    }}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-[var(--theme-muted-foreground)]">
                      {currentField.hint || 'Preencha o campo e pressione Enter ou Enviar.'}
                    </div>
                    <div className="flex items-center gap-2">
                      {!currentField.required && (
                        <button
                          type="button"
                          onClick={skipCurrentField}
                          className="inline-flex items-center gap-2 rounded-xl border border-[var(--theme-border)] px-3 py-2 text-xs"
                        >
                          <SkipForward className="h-3.5 w-3.5" />
                          Pular
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          void handleAnswer(inputValue);
                          setInputValue('');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[var(--theme-accent)] px-4 py-2 text-xs font-medium text-[var(--theme-accent-foreground)]"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Enviar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={confirmSave}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--theme-accent)] px-4 py-2 text-sm font-medium text-[var(--theme-accent-foreground)]"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar cadastro
              </button>
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--theme-border)] px-4 py-2 text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Recomeçar
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--theme-accent)] px-4 py-2 text-sm font-medium text-[var(--theme-accent-foreground)]"
              >
                <RotateCcw className="h-4 w-4" />
                Iniciar nova jornada
              </button>
            </div>
          )}

          {step === 'ajuda' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <textarea
                  value={helpInput}
                  onChange={(e) => setHelpInput(e.target.value)}
                  placeholder="Escreva sua dúvida sobre o TaskAll..."
                  rows={2}
                  disabled={isHelpLoading}
                  className="flex-1 resize-none rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] px-4 py-3 text-sm outline-none disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleHelpQuestion();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleHelpQuestion()}
                  disabled={isHelpLoading || !helpInput.trim()}
                  className="self-end rounded-2xl bg-[var(--theme-accent)] p-3 text-[var(--theme-accent-foreground)] transition disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--theme-muted-foreground)]">
                  Pressione Enter para enviar · Shift+Enter para nova linha
                </p>
                <button
                  type="button"
                  onClick={restart}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--theme-border)] px-3 py-1.5 text-xs text-[var(--theme-muted-foreground)] transition hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)]"
                >
                  <RotateCcw className="h-3 w-3" />
                  Voltar ao menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
