import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Wallet, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import * as custosService from '../../../services/custos-service';
import * as viagensService from '../../../services/viagens-service';

export function NovoCusto() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [viagens, setViagens] = useState<viagensService.Viagem[]>([]);

  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    categoria: 'outros' as custosService.CategoriaCusto,
    tipo: 'variavel' as custosService.TipoCusto,
    data: new Date().toISOString().split('T')[0],
    viagemId: '',
    notas: '',
  });

  useEffect(() => {
    viagensService.listarViagens().then(setViagens).catch(() => {});
  }, []);

  const setField = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descricao || !form.valor) {
      toast.error('Preencha a descrição e o valor');
      return;
    }

    setIsLoading(true);
    try {
      await custosService.criarCusto({
        descricao: form.descricao,
        valor: parseFloat(form.valor),
        categoria: form.categoria,
        tipo: form.tipo,
        data: new Date(form.data),
        viagemId: form.viagemId || undefined,
        notas: form.notas,
      });
      toast.success('Gasto registrado!');
      navigate('/pessoal/custos');
    } catch {
      toast.error('Erro ao registrar gasto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pessoal/custos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Registrar Gasto</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">Adicione um novo lançamento financeiro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                  Detalhes do Gasto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    placeholder="Ex: Jantar no restaurante"
                    value={form.descricao}
                    onChange={(e) => setField('descricao', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor">Valor (R$) *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={form.valor}
                      onChange={(e) => setField('valor', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={form.data}
                      onChange={(e) => setField('data', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select value={form.categoria} onValueChange={(v) => setField('categoria', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(custosService.CATEGORIAS_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setField('tipo', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixa">Fixo</SelectItem>
                        <SelectItem value="assinatura">Assinatura</SelectItem>
                        <SelectItem value="variavel">Variável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {viagens.length > 0 && (
                  <div>
                    <Label htmlFor="viagem">Associar à Viagem (opcional)</Label>
                    <Select value={form.viagemId} onValueChange={(v) => setField('viagemId', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione uma viagem..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {viagens.map((v) => (
                          <SelectItem key={v.id} value={v.id!}>{v.destino}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    placeholder="Observações adicionais..."
                    value={form.notas}
                    onChange={(e) => setField('notas', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  style={{ background: 'var(--theme-accent)', color: '#fff' }}
                >
                  {isLoading ? 'Salvando...' : 'Registrar Gasto'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/pessoal/custos')}
                >
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
