import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles, Loader, Bot, Image as ImageIcon, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { useAppStore } from '../../stores/useAppStore';
import { useAuth } from '../../lib/auth-context';
import {
  askAssistant,
  generateAssistantImage,
  type AssistantMessage,
} from '../../services/ai-assistant-service';
import {
  appendChatMessage,
  loadMonthlyChatHistory,
  type ChatMessage,
} from '../../services/ai-history-service';
import { loadUserChatPhoto } from '../../services/chat-profile-service';

import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { getInitials } from '../../lib/utils';
import { toast } from 'sonner';

const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];

function AssistantChart({ chart }: { chart: NonNullable<ChatMessage['chart']> }) {
  if (!chart) return null;

  return (
    <div
      className="mt-3 overflow-hidden rounded-xl border"
      style={{
        borderColor: 'var(--theme-border)',
        background: 'var(--theme-background)',
      }}
    >
      <div
        className="border-b px-3 py-2"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
          <h4 className="text-xs font-semibold">{chart.title}</h4>
        </div>
        {chart.description ? (
          <p className="mt-1 text-[11px] text-[var(--theme-muted-foreground)]">
            {chart.description}
          </p>
        ) : null}
      </div>

      <div className="h-64 w-full p-3">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'bar' ? (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey || 'label'} fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              {chart.series.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : chart.type === 'line' ? (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey || 'label'} fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              {chart.series.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} strokeWidth={2} />
              ))}
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={chart.data}
                dataKey={chart.series[0]?.key || 'value'}
                nameKey={chart.xKey || 'label'}
                outerRadius={90}
                label
              >
                {chart.data.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CONTEXT_CONFIG = {
  fiap: {
    title: 'AI Assistant FIAP',
    agente: 'Agente FIAP',
    badge: 'Contexto FIAP',
    placeholder: 'Pergunte sobre plano de aula, cronograma, materiais ou avaliações...',
    description: 'Peça ajuda com plano de aula, cronograma, avaliações, materiais, atividades e gestão acadêmica.',
  },
  itau: {
    title: 'AI Assistant Itaú',
    agente: 'Agente Itaú',
    badge: 'Contexto Itaú',
    placeholder: 'Pergunte sobre analistas, feedbacks, reuniões ou planos de ação...',
    description: 'Peça ajuda com analistas, feedbacks, avaliações de desempenho, reuniões, tarefas e planos de ação.',
  },
  pessoal: {
    title: 'AI Assistant Pessoal',
    agente: 'Assistente Pessoal',
    badge: 'Contexto Pessoal',
    placeholder: 'Pergunte sobre suas viagens, gastos, tarefas do dia a dia ou finanças pessoais...',
    description: 'Peça ajuda com viagens, controle de gastos por categoria, organização de tarefas e dicas financeiras.',
  },
  admin: {
    title: 'AI Assistant',
    agente: 'Agente Admin',
    badge: 'Contexto Admin',
    placeholder: 'Digite sua pergunta...',
    description: 'Assistente de administração do sistema.',
  },
};

function getCtx(contextMode: string) {
  return CONTEXT_CONFIG[contextMode as keyof typeof CONTEXT_CONFIG] ?? CONTEXT_CONFIG.itau;
}

function EmptyState({ contextMode }: { contextMode: string }) {
  const ctx = getCtx(contextMode);
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          background: 'var(--theme-background-secondary)',
          color: 'var(--theme-accent)',
        }}
      >
        <Sparkles className="h-6 w-6" />
      </div>

      <h2 className="text-lg font-semibold text-[var(--theme-foreground)]">
        {ctx.title}
      </h2>

      <p className="mt-2 max-w-2xl text-sm text-[var(--theme-muted-foreground)]">
        {ctx.description}
      </p>
    </div>
  );
}

export function AIAssistant() {
  const { contextMode } = useAppStore();
  const { user } = useAuth();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [userChatPhoto, setUserChatPhoto] = useState('');

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(() => getCtx(contextMode).title, [contextMode]);

  useEffect(() => {
    if (!user?.uid) return;
    void loadHistory();
    void loadPhoto();
  }, [user?.uid, contextMode]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isSending]);

  const loadPhoto = async () => {
    if (!user?.uid) return;
    const photo = await loadUserChatPhoto(user.uid, user);
    setUserChatPhoto(photo);
  };

  const loadHistory = async () => {
    if (!user?.uid) return;

    try {
      setIsLoadingHistory(true);
      const history = await loadMonthlyChatHistory(user.uid, contextMode);
      setMessages(history);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar histórico do assistente');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || isSending || !user?.uid) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      await appendChatMessage(user.uid, contextMode, userMessage);

      const historyPayload: AssistantMessage[] = [...messages, userMessage].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await askAssistant({
        prompt,
        contextMode,
        history: historyPayload,
      });

      let imageUrl = '';

      if (response.imageRequest?.shouldGenerate && response.imageRequest.prompt) {
        try {
          const generated = await generateAssistantImage({
            prompt: response.imageRequest.prompt,
            contextMode,
          });
          imageUrl = generated.imageDataUrl;
        } catch (error) {
          console.error(error);
        }
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        text: response.markdown,
        chart: response.chart,
        imageUrl,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await appendChatMessage(user.uid, contextMode, assistantMessage);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao consultar o AI Assistant');

      const fallback: ChatMessage = {
        role: 'assistant',
        text: 'Não consegui responder agora. Tente novamente em instantes.',
      };

      setMessages((prev) => [...prev, fallback]);
      await appendChatMessage(user.uid, contextMode, fallback);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-96px)] p-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm"
            style={{
              background: 'var(--theme-accent)',
              color: 'var(--theme-accent-foreground)',
            }}
          >
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">{title}</h1>
            <p className="text-xs text-[var(--theme-muted-foreground)]">
              Assistente contextual com histórico, imagens e gráficos
            </p>
          </div>

          <Badge variant="outline" className="ml-auto text-[11px]">
            {getCtx(contextMode).badge}
          </Badge>
        </div>

        <Card
          className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border shadow-sm"
          style={{
            borderColor: 'var(--theme-border)',
            background: 'var(--theme-card)',
          }}
        >
          <div
            className="flex shrink-0 items-center justify-between border-b px-4 py-3"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  background: 'var(--theme-background-secondary)',
                  color: 'var(--theme-accent)',
                }}
              >
                <Bot className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--theme-foreground)]">
                  {getCtx(contextMode).agente}
                </p>
                <p className="text-[11px] text-[var(--theme-muted-foreground)]">
                  Respostas com contexto do sistema
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Badge variant="outline" className="text-[11px]">Texto</Badge>
              <Badge variant="outline" className="text-[11px]">Gráficos</Badge>
              <Badge variant="outline" className="text-[11px]">Imagens</Badge>
            </div>
          </div>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
            >
              {isLoadingHistory ? (
                <div className="flex h-full items-center justify-center">
                  <Loader className="h-6 w-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <EmptyState contextMode={contextMode} />
              ) : (
                <div className="mx-auto flex w-full max-w-none flex-col gap-4">
                  {messages.map((message, index) => {
                    const isUser = message.role === 'user';

                    return (
                      <div
                        key={`${message.role}-${index}`}
                        className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <Avatar className="mt-1 h-8 w-8 shrink-0 border border-[var(--theme-border)]">
                            <AvatarFallback
                              style={{
                                background: 'var(--theme-accent)',
                                color: 'var(--theme-accent-foreground)',
                              }}
                            >
                              AI
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[82%] rounded-[18px] px-4 py-3 shadow-sm ${
                            isUser ? 'rounded-tr-md' : 'rounded-tl-md'
                          }`}
                          style={
                            isUser
                              ? {
                                  background: 'var(--theme-accent)',
                                  color: 'var(--theme-accent-foreground)',
                                }
                              : {
                                  background: 'var(--theme-background)',
                                  color: 'var(--theme-foreground)',
                                  border: '1px solid var(--theme-border)',
                                }
                          }
                        >
                          <div className="prose prose-sm max-w-none text-[12px] leading-5">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.text}
                            </ReactMarkdown>
                          </div>

                          {message.imageUrl ? (
                            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)]">
                              <div className="flex items-center gap-2 border-b border-[var(--theme-border)] px-3 py-2">
                                <ImageIcon className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                                <span className="text-xs font-medium">Imagem gerada</span>
                              </div>
                              <img
                                src={message.imageUrl}
                                alt="Imagem gerada pelo assistente"
                                className="max-h-[320px] w-full object-contain"
                              />
                            </div>
                          ) : null}

                          {message.chart ? <AssistantChart chart={message.chart} /> : null}
                        </div>

                        {isUser && (
                          <Avatar className="mt-1 h-8 w-8 shrink-0 border border-[var(--theme-border)]">
                            {userChatPhoto ? (
                              <AvatarImage src={userChatPhoto} />
                            ) : (
                              <AvatarFallback
                                style={{
                                  background: 'var(--theme-background-secondary)',
                                  color: 'var(--theme-foreground)',
                                }}
                              >
                                {getInitials(user?.displayName || 'Você')}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        )}
                      </div>
                    );
                  })}

                  {isSending && (
                    <div className="flex items-start gap-2">
                      <Avatar className="mt-1 h-8 w-8 shrink-0 border border-[var(--theme-border)]">
                        <AvatarFallback
                          style={{
                            background: 'var(--theme-accent)',
                            color: 'var(--theme-accent-foreground)',
                          }}
                        >
                          AI
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className="rounded-[18px] rounded-tl-md border px-4 py-3"
                        style={{
                          background: 'var(--theme-background)',
                          borderColor: 'var(--theme-border)',
                        }}
                      >
                        <span className="inline-flex items-center gap-2 text-[12px] text-[var(--theme-muted-foreground)]">
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-[var(--theme-accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="inline-block h-2 w-2 rounded-full bg-[var(--theme-accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="inline-block h-2 w-2 rounded-full bg-[var(--theme-accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                          Pensando…
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="shrink-0 border-t px-4 py-3"
              style={{
                borderColor: 'var(--theme-border)',
                background: 'var(--theme-card)',
              }}
            >
              <div className="mx-auto w-full max-w-none">
                <div className="flex items-end gap-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={getCtx(contextMode).placeholder}
                    rows={1}
                    className="min-h-[38px] flex-1 resize-none overflow-hidden border-0 border-b bg-transparent px-0 py-2 text-[12px] outline-none placeholder:text-[12px]"
                    style={{
                      color: 'var(--theme-foreground)',
                      borderColor: 'var(--theme-border)',
                    }}
                  />

                  <Button
                    onClick={() => void handleSend()}
                    disabled={isSending || !input.trim()}
                    className="h-9 shrink-0 gap-2 rounded-lg px-4 text-xs"
                  >
                    {isSending ? (
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}