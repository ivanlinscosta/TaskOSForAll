import { useState, useEffect } from 'react';
import { Plus, ThumbsUp, ThumbsDown, Target, Calendar, Loader, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { mockFeedbacks, mockAnalistas } from '../../../lib/mock-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase-config';
import * as analistasService from '../../../services/analistas-service';

interface FeedbackItem {
  id: string;
  analistaId: string;
  analistaNome?: string;
  data: Date;
  pontosFortes: string[];
  pontosMelhoria: string[];
  combinados: string[];
  proximaRevisao: Date;
  createdAt?: Date;
}

interface AnalistaOption {
  id: string;
  nome: string;
  funcao: string;
  foto?: string;
}

export function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [analistas, setAnalistas] = useState<AnalistaOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    analistaId: '',
    pontosFortes: [''],
    pontosMelhoria: [''],
    combinados: [''],
    proximaRevisao: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      await Promise.all([carregarFeedbacks(), carregarAnalistas()]);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarAnalistas = async () => {
    try {
      const analistasFirebase = await analistasService.listarAnalistas();
      if (analistasFirebase && analistasFirebase.length > 0) {
        setAnalistas(analistasFirebase.map(a => ({
          id: a.id || '',
          nome: a.nome,
          funcao: a.funcao,
          foto: a.foto,
        })));
      } else {
        setAnalistas(mockAnalistas.map(a => ({
          id: a.id,
          nome: a.nome,
          funcao: a.funcao,
          foto: a.foto,
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar analistas:', error);
      setAnalistas(mockAnalistas.map(a => ({
        id: a.id,
        nome: a.nome,
        funcao: a.funcao,
        foto: a.foto,
      })));
    }
  };

  const carregarFeedbacks = async () => {
    try {
      // Query simples SEM orderBy para evitar necessidade de índice
      const snapshot = await getDocs(collection(db, 'feedbacks_gestao'));
      const fbFirebase = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          analistaId: data.analistaId || '',
          analistaNome: data.analistaNome || '',
          data: data.data?.toDate?.() || new Date(),
          pontosFortes: data.pontosFortes || [],
          pontosMelhoria: data.pontosMelhoria || [],
          combinados: data.combinados || [],
          proximaRevisao: data.proximaRevisao?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as FeedbackItem;
      });

      // Ordenar no client-side (mais recentes primeiro)
      fbFirebase.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      if (fbFirebase.length > 0) {
        setFeedbacks(fbFirebase);
      } else {
        // Se não há feedbacks no Firebase, mostrar lista vazia (não mock)
        setFeedbacks([]);
      }
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
      // Só usa mock se houver erro de conexão
      setFeedbacks(mockFeedbacks as FeedbackItem[]);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.analistaId) {
      toast.error('Selecione um analista');
      return;
    }

    try {
      setIsSaving(true);
      const pontosFortes = formData.pontosFortes.filter(p => p.trim() !== '');
      const pontosMelhoria = formData.pontosMelhoria.filter(p => p.trim() !== '');
      const combinados = formData.combinados.filter(p => p.trim() !== '');

      if (pontosFortes.length === 0 && pontosMelhoria.length === 0) {
        toast.error('Preencha pelo menos um ponto forte ou de melhoria');
        return;
      }

      // Buscar nome do analista selecionado
      const analistaSelecionado = analistas.find(a => a.id === formData.analistaId);

      await addDoc(collection(db, 'feedbacks_gestao'), {
        analistaId: formData.analistaId,
        analistaNome: analistaSelecionado?.nome || 'Analista',
        pontosFortes,
        pontosMelhoria,
        combinados,
        data: Timestamp.now(),
        proximaRevisao: formData.proximaRevisao
          ? Timestamp.fromDate(new Date(formData.proximaRevisao))
          : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        createdAt: Timestamp.now(),
      });

      toast.success('Feedback criado com sucesso!');
      setShowModal(false);
      setFormData({ analistaId: '', pontosFortes: [''], pontosMelhoria: [''], combinados: [''], proximaRevisao: '' });
      await carregarFeedbacks();
    } catch (error) {
      console.error('Erro ao criar feedback:', error);
      toast.error('Erro ao criar feedback');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (field: 'pontosFortes' | 'pontosMelhoria' | 'combinados') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeItem = (field: 'pontosFortes' | 'pontosMelhoria' | 'combinados', index: number) => {
    setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });
  };

  const updateItem = (field: 'pontosFortes' | 'pontosMelhoria' | 'combinados', index: number, value: string) => {
    const items = [...formData[field]];
    items[index] = value;
    setFormData({ ...formData, [field]: items });
  };

  const getAnalistaInfo = (analistaId: string, analistaNome?: string) => {
    // Primeiro tenta encontrar nos analistas carregados do Firebase
    const analistaFirebase = analistas.find(a => a.id === analistaId);
    if (analistaFirebase) return analistaFirebase;

    // Fallback para mock
    const analistaMock = mockAnalistas.find(a => a.id === analistaId);
    if (analistaMock) return analistaMock;

    // Se não encontrou, retorna um objeto com o nome salvo
    return { id: analistaId, nome: analistaNome || 'Analista', funcao: '', foto: '' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Gestão de Feedbacks</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">{feedbacks.length} feedbacks registrados</p>
        </div>
        <Button variant="theme" className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Novo Feedback
        </Button>
      </div>

      {/* Modal de Novo Feedback */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--theme-background)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-[var(--theme-border)]">
              <h2 className="text-xl font-bold text-[var(--theme-foreground)]">Novo Feedback</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--theme-muted-foreground)] hover:text-[var(--theme-foreground)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Analista *</Label>
                <select
                  className="w-full px-3 py-2 rounded-md border border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)]"
                  value={formData.analistaId}
                  onChange={(e) => setFormData({ ...formData, analistaId: e.target.value })}
                  required
                >
                  <option value="">Selecione um analista...</option>
                  {analistas.map(a => (
                    <option key={a.id} value={a.id}>{a.nome} - {a.funcao}</option>
                  ))}
                </select>
              </div>

              {/* Pontos Fortes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-green-600 flex items-center gap-2"><ThumbsUp className="w-4 h-4" /> Pontos Fortes</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addItem('pontosFortes')}><Plus className="w-3 h-3" /></Button>
                </div>
                {formData.pontosFortes.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Descreva um ponto forte..." value={item} onChange={(e) => updateItem('pontosFortes', i, e.target.value)} />
                    {formData.pontosFortes.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem('pontosFortes', i)}><X className="w-4 h-4" /></Button>}
                  </div>
                ))}
              </div>

              {/* Pontos de Melhoria */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-orange-600 flex items-center gap-2"><ThumbsDown className="w-4 h-4" /> Pontos de Melhoria</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addItem('pontosMelhoria')}><Plus className="w-3 h-3" /></Button>
                </div>
                {formData.pontosMelhoria.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Descreva um ponto de melhoria..." value={item} onChange={(e) => updateItem('pontosMelhoria', i, e.target.value)} />
                    {formData.pontosMelhoria.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem('pontosMelhoria', i)}><X className="w-4 h-4" /></Button>}
                  </div>
                ))}
              </div>

              {/* Combinados */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-blue-600 flex items-center gap-2"><Target className="w-4 h-4" /> Combinados</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addItem('combinados')}><Plus className="w-3 h-3" /></Button>
                </div>
                {formData.combinados.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Descreva um combinado..." value={item} onChange={(e) => updateItem('combinados', i, e.target.value)} />
                    {formData.combinados.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem('combinados', i)}><X className="w-4 h-4" /></Button>}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Próxima Revisão</Label>
                <Input type="date" value={formData.proximaRevisao} onChange={(e) => setFormData({ ...formData, proximaRevisao: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--theme-border)]">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" variant="theme" disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Salvando...' : 'Salvar Feedback'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedbacks List */}
      <div className="space-y-4">
        {feedbacks.map(feedback => {
          const analista = getAnalistaInfo(feedback.analistaId, feedback.analistaNome);

          return (
            <Card key={feedback.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-[var(--theme-accent)]">
                      <AvatarImage src={analista?.foto} />
                      <AvatarFallback>
                        {analista ? analista.nome.split(' ').map(n => n[0]).join('').substring(0, 2) : 'AN'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{analista?.nome || 'Analista'}</CardTitle>
                      <p className="text-sm text-[var(--theme-muted-foreground)]">{analista?.funcao || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="theme" className="gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(feedback.data), "d 'de' MMM", { locale: ptBR })}
                    </Badge>
                    {feedback.proximaRevisao && (
                      <p className="text-xs text-[var(--theme-muted-foreground)] mt-1">
                        Próxima: {format(new Date(feedback.proximaRevisao), "d 'de' MMM", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedback.pontosFortes && feedback.pontosFortes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600"><ThumbsUp className="w-4 h-4" /> Pontos Fortes</h4>
                    <ul className="space-y-1.5">
                      {feedback.pontosFortes.map((ponto, index) => (
                        <li key={index} className="text-sm text-[var(--theme-foreground)] p-2 rounded-lg bg-green-500/10 border border-green-500/20">{ponto}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.pontosMelhoria && feedback.pontosMelhoria.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-600"><ThumbsDown className="w-4 h-4" /> Pontos de Melhoria</h4>
                    <ul className="space-y-1.5">
                      {feedback.pontosMelhoria.map((ponto, index) => (
                        <li key={index} className="text-sm text-[var(--theme-foreground)] p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">{ponto}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.combinados && feedback.combinados.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-600"><Target className="w-4 h-4" /> Combinados</h4>
                    <ul className="space-y-1.5">
                      {feedback.combinados.map((combinado, index) => (
                        <li key={index} className="text-sm text-[var(--theme-foreground)] p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">{combinado}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {feedbacks.length === 0 && (
          <div className="text-center py-12 text-[var(--theme-muted-foreground)]">
            <p>Nenhum feedback encontrado.</p>
            <Button variant="theme" className="mt-4 gap-2" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" /> Criar Primeiro Feedback
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
