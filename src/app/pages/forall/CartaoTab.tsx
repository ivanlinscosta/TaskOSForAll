import { useMemo, useState } from 'react';
import {
  CreditCard, Layers, TrendingDown, Calendar,
  Trash2, FileUp, ChevronDown, ChevronRight, BarChart2, LayoutList, Sparkles, Pencil, Check, X,
  ScanSearch, RefreshCw,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { addMonths, format, getMonth, getYear, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import * as custosService from '../../../services/custos-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { InsightsPanel } from '../../components/InsightsPanel';
import { formatCurrency } from '../../../lib/utils';

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const SUBSCRIPTION_KEYWORDS = [
  'netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'prime video',
  'apple', 'microsoft', 'xbox', 'playstation', 'youtube', 'google one',
  'dropbox', 'adobe', 'canva', 'figma', 'notion', 'slack', 'zoom',
  'duolingo', 'deezer', 'globoplay', 'paramount', 'crunchyroll',
  'nintendo', 'twitch', 'linkedin', 'chatgpt', 'openai', 'midjourney',
  'github', 'office 365', 'office365', 'onedrive', 'icloud',
  'kaspersky', 'mcafee', 'norton', 'avg', 'avast', 'bitdefender',
  'expressvpn', 'nordvpn', 'surfshark',
];

function isSubscriptionName(desc: string): boolean {
  const d = desc.toLowerCase();
  return SUBSCRIPTION_KEYWORDS.some(k => d.includes(k));
}
const fmt = formatCurrency;
const MERCHANT_COLORS = ['#0EA5E9', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#6B7280'];

function parseParcela(desc: string): { atual: number; total: number } | null {
  const m = desc.match(/\((\d+)\/(\d+)\)\s*$/);
  if (!m) return null;
  const atual = +m[1], total = +m[2];
  if (isNaN(atual) || isNaN(total) || total < 1) return null;
  return { atual, total };
}

function agruparFaturas(cartao: custosService.Custo[]) {
  if (!cartao.length) return [];
  const byId: Record<string, custosService.Custo[]> = {};
  const semId: custosService.Custo[] = [];
  for (const c of cartao) {
    if (c.faturaId) (byId[c.faturaId] ??= []).push(c);
    else semId.push(c);
  }
  const legGroups: custosService.Custo[][] = [];
  if (semId.length) {
    const sorted = [...semId].sort((a, b) => +new Date(a.criadoEm!) - +new Date(b.criadoEm!));
    let cur = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (+new Date(sorted[i].criadoEm!) - +new Date(sorted[i - 1].criadoEm!) <= 60_000) {
        cur.push(sorted[i]);
      } else {
        legGroups.push(cur);
        cur = [sorted[i]];
      }
    }
    legGroups.push(cur);
  }
  return [
    ...Object.entries(byId).map(([key, itens]) => ({ key, itens })),
    ...legGroups.map(itens => ({ key: `leg_${+new Date(itens[0].criadoEm!)}`, itens })),
  ].sort((a, b) => +new Date(b.itens[0].criadoEm!) - +new Date(a.itens[0].criadoEm!));
}

const TooltipBRL = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-lg text-sm" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
      <p className="font-semibold mb-1 text-[var(--theme-foreground)]">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill || p.color }}>
          {p.name}: {fmt(p.value ?? 0)}
        </p>
      ))}
    </div>
  );
};

export interface CartaoTabProps {
  custos: custosService.Custo[];
  onImportar: () => void;
  onDeleteFatura: (ids: string[], key: string) => Promise<void>;
  monthFilters?: Set<string>;
}

function monthKey(value: any): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function CartaoTab({ custos, onImportar, onDeleteFatura, monthFilters }: CartaoTabProps) {
  const [faturasAbertas, setFaturasAbertas] = useState<Set<string>>(new Set());
  const [parcelasExpandidas, setParcelasExpandidas] = useState<Set<string>>(new Set());
  const [parcelamentosOpen, setParcelamentosOpen] = useState(false);
  const [filtroCartao, setFiltroCartao] = useState<string>('Todos');
  // Category editing for individual invoice items (post-import)
  const [editingCategoryItemId, setEditingCategoryItemId] = useState<string | null>(null);
  const [pendingCategory, setPendingCategory] = useState<custosService.CategoriaCusto>('outros');
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  // Optimistic overrides: custo.id → new category / tipo (so UI updates immediately after save)
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, custosService.CategoriaCusto>>({});
  const [tipoOverrides, setTipoOverrides] = useState<Record<string, custosService.TipoCusto>>({});

  // Reclassification dialog
  const [reclassifyOpen, setReclassifyOpen] = useState(false);
  const [reclassifySelected, setReclassifySelected] = useState<Set<string>>(new Set());
  const [reclassifying, setReclassifying] = useState(false);
  const [reclassifySearch, setReclassifySearch] = useState('');

  const handleStartEditCategory = (c: custosService.Custo) => {
    setEditingCategoryItemId(c.id!);
    setPendingCategory((categoryOverrides[c.id!] ?? c.categoria) as custosService.CategoriaCusto);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryItemId(null);
  };

  const handleSaveCategory = async (c: custosService.Custo) => {
    if (!c.id) return;
    setSavingCategoryId(c.id);
    try {
      await custosService.atualizarCusto(c.id, { categoria: pendingCategory });
      setCategoryOverrides(prev => ({ ...prev, [c.id!]: pendingCategory }));
      setEditingCategoryItemId(null);
      toast.success('Categoria atualizada');
    } catch {
      toast.error('Erro ao salvar categoria');
    } finally {
      setSavingCategoryId(null);
    }
  };

  const cartaoAll = useMemo(() => custos.filter(c => c.origem === 'cartao'), [custos]);

  // Subscription reclassification — grouped by service name so ALL months are updated
  type SubGroup = {
    norm: string;          // normalized key
    label: string;         // display name (first occurrence)
    ids: string[];         // ALL matching item IDs across every fatura
    count: number;
    totalValue: number;
    representative: custosService.Custo;
  };

  const subscriptionGroups = useMemo((): SubGroup[] => {
    const map = new Map<string, SubGroup>();
    for (const c of cartaoAll) {
      const tipoAtual = tipoOverrides[c.id!] ?? c.tipo;
      if (!isSubscriptionName(c.descricao) || tipoAtual === 'assinatura' || !c.id) continue;
      const norm = c.descricao.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
      if (!map.has(norm)) {
        map.set(norm, { norm, label: c.descricao, ids: [], count: 0, totalValue: 0, representative: c });
      }
      const g = map.get(norm)!;
      g.ids.push(c.id);
      g.count++;
      g.totalValue += c.valor;
    }
    return [...map.values()].sort((a, b) => b.totalValue - a.totalValue);
  }, [cartaoAll, tipoOverrides]);

  const openReclassify = () => {
    // Select all groups by their norm key
    setReclassifySelected(new Set(subscriptionGroups.map(g => g.norm)));
    setReclassifySearch('');
    setReclassifyOpen(true);
  };

  const handleReclassify = async () => {
    // Collect ALL ids from selected groups
    const selectedGroups = subscriptionGroups.filter(g => reclassifySelected.has(g.norm));
    const allIds = selectedGroups.flatMap(g => g.ids);
    if (!allIds.length) return;
    setReclassifying(true);
    try {
      await Promise.all(allIds.map(id => custosService.atualizarCusto(id, { tipo: 'assinatura' })));
      const patch: Record<string, custosService.TipoCusto> = {};
      allIds.forEach(id => { patch[id] = 'assinatura'; });
      setTipoOverrides(prev => ({ ...prev, ...patch }));
      toast.success(`${allIds.length} lançamento${allIds.length !== 1 ? 's' : ''} classificado${allIds.length !== 1 ? 's' : ''} como assinatura`);
      setReclassifyOpen(false);
    } catch {
      toast.error('Erro ao reclassificar');
    } finally {
      setReclassifying(false);
    }
  };

  const toggleParcela = (key: string) =>
    setParcelasExpandidas(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const hoje = new Date();
  const mesAtual = getMonth(hoje);
  const anoAtual = getYear(hoje);

  const nomeCartoes = useMemo(() => {
    const names = new Set(cartaoAll.map(c => c.nomeCartao?.trim() || 'Principal'));
    return names.size > 1 ? ['Todos', ...Array.from(names).sort()] : [];
  }, [cartaoAll]);

  const cartao = useMemo(() =>
    filtroCartao === 'Todos'
      ? cartaoAll
      : cartaoAll.filter(c => (c.nomeCartao?.trim() || 'Principal') === filtroCartao),
  [cartaoAll, filtroCartao]);

  const cartaoForFaturas = useMemo(() => {
    if (!monthFilters || monthFilters.size === 0) return cartao;
    return cartao.filter(c => monthFilters.has(monthKey(c.data)));
  }, [cartao, monthFilters]);

  const faturas = useMemo(() => agruparFaturas(cartaoForFaturas), [cartaoForFaturas]);

  const normalizarNome = (desc: string) =>
    desc
      .replace(/\s*\(\d+\/\d+\)\s*$/, '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const parcelamentos = useMemo(() => {
    const raw = cartao.flatMap(c => {
      const p = parseParcela(c.descricao);
      return p && p.atual < p.total
        ? [{ custo: c, parcelaAtual: p.atual, parcelaTotal: p.total,
             valorParcela: c.valor, totalRestante: (p.total - p.atual) * c.valor,
             restantes: p.total - p.atual }]
        : [];
    });

    const dedupMap = new Map<string, typeof raw[number]>();
    for (const item of raw) {
      const key = `${normalizarNome(item.custo.descricao)}|${item.parcelaTotal}|${Math.round(item.valorParcela)}`;
      const ex = dedupMap.get(key);
      if (!ex || item.parcelaAtual > ex.parcelaAtual) dedupMap.set(key, item);
    }

    return [...dedupMap.values()].sort((a, b) => b.totalRestante - a.totalRestante);
  }, [cartao]);

  const parcelamentosAgrupados = useMemo(() => {
    const groupMap = new Map<string, typeof parcelamentos>();
    for (const item of parcelamentos) {
      const key = normalizarNome(item.custo.descricao);
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(item);
    }
    return [...groupMap.entries()]
      .map(([, items]) => ({
        label: items[0].custo.descricao.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim(),
        items,
        totalGrupo: items.reduce((s, i) => s + i.totalRestante, 0),
      }))
      .sort((a, b) => b.totalGrupo - a.totalGrupo);
  }, [parcelamentos]);

  const projecao = useMemo(() => {
    const meses = Array.from({ length: 12 }, (_, i) => addMonths(startOfMonth(hoje), i + 1));
    return meses
      .map(mesDate => {
        const y = getYear(mesDate), m = getMonth(mesDate);
        let total = 0;
        for (const { custo, parcelaAtual, parcelaTotal } of parcelamentos) {
          if (!custo.criadoEm) continue;
          const base = new Date(custo.criadoEm);
          for (let i = 1; i <= parcelaTotal - parcelaAtual; i++) {
            const fut = new Date(base.getFullYear(), base.getMonth() + i, 1);
            if (getYear(fut) === y && getMonth(fut) === m) { total += custo.valor; break; }
          }
        }
        return { mes: `${MESES_LABEL[m]}/${String(y).slice(2)}`, Parcelas: parseFloat(total.toFixed(2)) };
      })
      .filter(m => m.Parcelas > 0);
  }, [parcelamentos]);

  const merchantDistribution = useMemo(() => {
    const meses = Array.from({ length: 12 }, (_, i) => addMonths(startOfMonth(hoje), i - 3));
    const top5Labels = parcelamentosAgrupados.slice(0, 5).map(g => g.label);

    const normToLabel = new Map<string, string>();
    for (const { label, items } of parcelamentosAgrupados) {
      for (const item of items) {
        normToLabel.set(normalizarNome(item.custo.descricao), label);
      }
    }

    const data = meses.map(mesDate => {
      const y = getYear(mesDate), m = getMonth(mesDate);
      const row: Record<string, any> = {
        mes: `${MESES_LABEL[m]}/${String(y).slice(2)}`,
        isCurrent: m === mesAtual && y === anoAtual,
      };
      top5Labels.forEach(l => { row[l] = 0; });
      row['Outros'] = 0;

      for (const { custo, parcelaAtual, parcelaTotal, valorParcela } of parcelamentos) {
        if (!custo.criadoEm) continue;
        const base = new Date(custo.criadoEm);
        const monthDiff = (y - base.getFullYear()) * 12 + (m - base.getMonth());
        const installmentNum = parcelaAtual + monthDiff;

        if (installmentNum >= 1 && installmentNum <= parcelaTotal) {
          const norm = normalizarNome(custo.descricao);
          const label = normToLabel.get(norm)
            ?? custo.descricao.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
          const merchant = top5Labels.includes(label) ? label : 'Outros';
          row[merchant] = parseFloat(((row[merchant] || 0) + valorParcela).toFixed(2));
        }
      }

      return row;
    });

    const merchantColors: Record<string, string> = {};
    top5Labels.forEach((label, i) => { merchantColors[label] = MERCHANT_COLORS[i]; });
    merchantColors['Outros'] = MERCHANT_COLORS[5];

    const hasOutros = data.some(d => (d['Outros'] ?? 0) > 0);
    const merchants = [...top5Labels, ...(hasOutros ? ['Outros'] : [])];

    return { data, merchants, merchantColors };
  }, [parcelamentos, parcelamentosAgrupados, mesAtual, anoAtual]);

  const merchantHighlights = useMemo(() => {
    const highlights: string[] = [];

    const currentRow = merchantDistribution.data.find(d => d.isCurrent);
    if (currentRow) {
      let maxLabel = '';
      let maxVal = 0;
      for (const [key, val] of Object.entries(currentRow)) {
        if (key === 'mes' || key === 'isCurrent') continue;
        if ((val as number) > maxVal) { maxVal = val as number; maxLabel = key; }
      }
      if (maxLabel && maxVal > 0) {
        highlights.push(`Em ${MESES_LABEL[mesAtual]}, o maior valor em parcelas é de ${maxLabel} (${fmt(maxVal)})`);
      }
    }

    for (const { label, items } of parcelamentosAgrupados.slice(0, 4)) {
      const maxRestantes = Math.max(...items.map(i => i.restantes));
      if (maxRestantes <= 0) continue;

      const base = new Date(items[0].custo.criadoEm ?? items[0].custo.data);
      const ultimaMes = new Date(base.getFullYear(), base.getMonth() + maxRestantes, 1);

      if (maxRestantes <= 4) {
        highlights.push(
          `Faltam ${maxRestantes} ${maxRestantes === 1 ? 'parcela' : 'parcelas'} para finalizar o pagamento de ${label}`
        );
      } else {
        highlights.push(
          `Até ${format(ultimaMes, "MMMM 'de' yyyy", { locale: ptBR })} você pagará todas as parcelas de ${label}`
        );
      }
    }

    return highlights.slice(0, 5);
  }, [merchantDistribution, parcelamentosAgrupados, mesAtual]);

  const pieData = useMemo(() => {
    const itens = faturas[0]?.itens ?? [];
    const map: Record<string, number> = {};
    itens.forEach(c => {
      const key = (c.tipo === 'assinatura') ? '__assinatura__' : c.categoria;
      map[key] = (map[key] || 0) + c.valor;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([key, valor]) => ({
        name: key === '__assinatura__' ? 'Assinaturas' : (custosService.CATEGORIAS_LABELS[key as custosService.CategoriaCusto] || key),
        value: parseFloat(valor.toFixed(2)),
        fill: key === '__assinatura__' ? '#7C3AED' : (custosService.CATEGORIAS_CORES[key as custosService.CategoriaCusto] || '#6B7280'),
      }));
  }, [faturas]);

  const totalMesAtual = useMemo(() =>
    cartao
      .filter(c => { const d = new Date(c.criadoEm!); return getMonth(d) === mesAtual && getYear(d) === anoAtual; })
      .reduce((s, c) => s + c.valor, 0),
  [cartao, mesAtual, anoAtual]);

  const totalParcelasAbertas = parcelamentos.reduce((s, p) => s + p.totalRestante, 0);
  const comprometido3Meses = projecao.slice(0, 3).reduce((s, m) => s + m.Parcelas, 0);
  const categoriaTop = pieData[0];

  const resumoCartao = useMemo(() => {
    const linhas = [
      `Cartão de crédito:`,
      `- Gasto no mês atual: ${fmt(totalMesAtual)}`,
      `- Total parcelado em aberto: ${fmt(totalParcelasAbertas)}`,
      `- Comprometimento próximos 3 meses: ${fmt(comprometido3Meses)}`,
      `- Parcelamentos ativos: ${parcelamentos.length} compras`,
      ``,
      `Top parcelamentos:`,
      ...parcelamentosAgrupados.slice(0, 5).map(g =>
        `- ${g.label}: ${fmt(g.totalGrupo)} restante (${g.items[0].restantes} parcelas)`
      ),
      ``,
      `Distribuição por categoria (última fatura):`,
      ...pieData.map(p => `- ${p.name}: ${fmt(p.value)}`),
      ``,
      `Projeção próximos meses:`,
      ...projecao.slice(0, 6).map(p => `- ${p.mes}: ${fmt(p.Parcelas)}`),
    ];
    return linhas.join('\n');
  }, [totalMesAtual, totalParcelasAbertas, comprometido3Meses, parcelamentos, parcelamentosAgrupados, pieData, projecao]);

  // ── Estado vazio ──────────────────────────────────────────────────────────

  if (cartaoAll.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: '#0EA5E915' }}>
          <CreditCard className="h-9 w-9" style={{ color: '#0EA5E9' }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--theme-foreground)]">Nenhuma fatura importada</p>
          <p className="text-sm text-[var(--theme-muted-foreground)] mt-1">
            Importe a fatura do cartão para ver gastos, parcelamentos e projeções
          </p>
        </div>
        <Button onClick={onImportar} className="gap-2" style={{ background: '#0EA5E9', color: '#fff' }}>
          <FileUp className="h-4 w-4" /> Importar Fatura
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Filtro por cartão ── */}
      {nomeCartoes.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <CreditCard className="h-4 w-4 text-[var(--theme-muted-foreground)] flex-shrink-0" />
          {nomeCartoes.map(nome => (
            <button
              key={nome}
              onClick={() => setFiltroCartao(nome)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={filtroCartao === nome
                ? { background: '#0EA5E9', color: '#fff' }
                : { background: 'var(--theme-background-secondary)', color: 'var(--theme-muted-foreground)', border: '1px solid var(--theme-border)' }}
            >
              {nome}
            </button>
          ))}
        </div>
      )}

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Gasto no mês atual', cor: '#0EA5E9', Icon: CreditCard,
            valor: totalMesAtual, desc: 'via cartão de crédito',
          },
          {
            label: 'Parcelas em aberto', cor: '#8B5CF6', Icon: Layers,
            valor: totalParcelasAbertas, desc: `${parcelamentos.length} compras parceladas`,
          },
          {
            label: 'Compromisso 3 meses', cor: '#F59E0B', Icon: Calendar,
            valor: comprometido3Meses, desc: 'em parcelas futuras',
          },
          {
            label: categoriaTop?.name ?? 'Sem dados', cor: categoriaTop?.fill ?? '#6B7280', Icon: TrendingDown,
            valor: categoriaTop?.value ?? 0, desc: 'maior categoria',
          },
        ].map(({ label, cor, Icon, valor, desc }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${cor}15` }}>
                <Icon className="h-5 w-5" style={{ color: cor }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--theme-muted-foreground)] leading-tight">{label}</p>
                <p className="text-base font-bold leading-tight mt-0.5" style={{ color: cor }}>{fmt(valor)}</p>
                <p className="text-xs text-[var(--theme-muted-foreground)] leading-tight">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Distribuição de parcelas por mês ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4" style={{ color: '#0EA5E9' }} />
            Distribuição de Parcelas por Mês
            <span className="text-xs font-normal text-[var(--theme-muted-foreground)]">· pela data de cada parcela</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {merchantDistribution.merchants.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={merchantDistribution.data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--theme-muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--theme-muted-foreground)' }}
                    tickFormatter={v => formatCurrency(v)} />
                  <Tooltip content={<TooltipBRL />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {merchantDistribution.merchants.map((merchant, idx) => (
                    <Bar
                      key={merchant}
                      dataKey={merchant}
                      name={merchant}
                      stackId="a"
                      fill={merchantDistribution.merchantColors[merchant]}
                      radius={idx === merchantDistribution.merchants.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    >
                      {merchantDistribution.data.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={merchantDistribution.merchantColors[merchant]}
                          fillOpacity={entry.isCurrent ? 1 : 0.55}
                        />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>

              {merchantHighlights.length > 0 && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  <p className="text-xs font-semibold text-[var(--theme-muted-foreground)] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: '#8B5CF6' }} />
                    Destaques
                  </p>
                  {merchantHighlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-[var(--theme-muted-foreground)] flex-shrink-0 mt-0.5">•</span>
                      <span className="text-[var(--theme-foreground)]">{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-center py-10 text-sm text-[var(--theme-muted-foreground)]">
              Nenhum parcelamento ativo para exibir
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Distribuição por categoria ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutList className="h-4 w-4" style={{ color: '#0EA5E9' }} />
            Distribuição por Categoria
            <span className="text-xs font-normal text-[var(--theme-muted-foreground)]">· última fatura</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (() => {
            const total = pieData.reduce((s, e) => s + e.value, 0);
            return (
              <div className="space-y-3 mt-1">
                {pieData.map(e => {
                  const pct = total > 0 ? (e.value / total) * 100 : 0;
                  return (
                    <div key={e.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: e.fill }} />
                          <span className="font-medium text-[var(--theme-foreground)]">{e.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--theme-muted-foreground)]">
                          <span>{fmt(e.value)}</span>
                          <span className="w-8 text-right font-semibold" style={{ color: e.fill }}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: e.fill }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-2 border-t text-xs font-semibold" style={{ borderColor: 'var(--theme-border)' }}>
                  <span className="text-[var(--theme-muted-foreground)]">Total</span>
                  <span className="text-[var(--theme-foreground)]">{fmt(total)}</span>
                </div>
              </div>
            );
          })() : (
            <p className="py-16 text-center text-sm text-[var(--theme-muted-foreground)]">Sem dados</p>
          )}
        </CardContent>
      </Card>

      {/* ── Projeção de parcelas futuras ── */}
      {projecao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: '#8B5CF6' }} />
              Projeção de Parcelas Futuras
              <span className="text-xs font-normal text-[var(--theme-muted-foreground)]">· compromisso já assumido</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={projecao} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--theme-muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--theme-muted-foreground)' }}
                  tickFormatter={v => formatCurrency(v)} />
                <Tooltip content={<TooltipBRL />} />
                <Bar dataKey="Parcelas" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Parcelas futuras" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Parcelamentos ativos ── */}
      {parcelamentosAgrupados.length > 0 && (
        <Card>
          <CardHeader className="cursor-pointer select-none" onClick={() => setParcelamentosOpen(o => !o)}>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" style={{ color: '#8B5CF6' }} />
              Parcelamentos Ativos
              <Badge className="ml-1 text-xs" style={{ background: '#8B5CF615', color: '#8B5CF6', border: 'none' }}>
                {parcelamentos.length}
              </Badge>
              <span className="ml-auto">
                {parcelamentosOpen
                  ? <ChevronDown className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                  : <ChevronRight className="h-4 w-4 text-[var(--theme-muted-foreground)]" />}
              </span>
            </CardTitle>
          </CardHeader>
          {parcelamentosOpen && <CardContent className="space-y-2">
            {parcelamentosAgrupados.map(({ label, items, totalGrupo }) => {
              const expandido = parcelasExpandidas.has(label);
              const corPrimaria = custosService.CATEGORIAS_CORES[items[0].custo.categoria] || '#8B5CF6';

              return (
                <div key={label} className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--theme-border)' }}>
                  <button
                    onClick={() => toggleParcela(label)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--theme-hover)]"
                    style={{ background: 'var(--theme-background-secondary)' }}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${corPrimaria}20` }}>
                      <CreditCard className="h-4 w-4" style={{ color: corPrimaria }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--theme-foreground)] truncate">{label}</p>
                        {items.length > 1 && (
                          <Badge className="text-xs flex-shrink-0" style={{ background: `${corPrimaria}20`, color: corPrimaria, border: 'none' }}>
                            {items.length} compras
                          </Badge>
                        )}
                      </div>
                      {items.length === 1 && (() => {
                        const { parcelaAtual, parcelaTotal } = items[0];
                        return (
                          <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5">
                            {parcelaAtual}/{parcelaTotal} parcelas · {parcelaTotal - parcelaAtual} restantes
                          </p>
                        );
                      })()}
                      {items.length > 1 && (
                        <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5">
                          {items.reduce((s, i) => s + i.restantes, 0)} parcelas restantes no total
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0 mr-2">
                      <p className="text-sm font-bold text-[var(--theme-foreground)]">{fmt(totalGrupo)}</p>
                      <p className="text-xs text-[var(--theme-muted-foreground)]">restante</p>
                    </div>

                    {expandido
                      ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-[var(--theme-muted-foreground)]" />
                      : <ChevronRight className="h-4 w-4 flex-shrink-0 text-[var(--theme-muted-foreground)]" />
                    }
                  </button>

                  {expandido && (
                    <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                      {items.map(({ custo, parcelaAtual, parcelaTotal, restantes, valorParcela, totalRestante }) => {
                        const cor = custosService.CATEGORIAS_CORES[custo.categoria] || '#6B7280';
                        const progress = (parcelaAtual / parcelaTotal) * 100;
                        const nome = custo.descricao.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
                        const totalCompra = parcelaTotal * valorParcela;
                        const totalPago = parcelaAtual * valorParcela;
                        const dataBase = new Date(custo.criadoEm ?? custo.data);
                        const proxMes = new Date(dataBase.getFullYear(), dataBase.getMonth() + 1, 1);
                        const ultimaMes = new Date(dataBase.getFullYear(), dataBase.getMonth() + restantes, 1);

                        return (
                          <div key={custo.id} className="px-4 py-4 space-y-3" style={{ background: 'var(--theme-card)' }}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: `${cor}20`, color: cor }}>
                                {custosService.CATEGORIAS_LABELS[custo.categoria]}
                              </span>
                              <p className="text-sm font-semibold text-[var(--theme-foreground)]">{nome}</p>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-[var(--theme-muted-foreground)]">
                                <span>Parcela {parcelaAtual} de {parcelaTotal}</span>
                                <span>{Math.round(progress)}% pago</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: cor }} />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: 'Total da compra', valor: totalCompra, cor: 'var(--theme-foreground)' },
                                { label: 'Já pago', valor: totalPago, cor: '#10B981' },
                                { label: 'Restante', valor: totalRestante, cor: '#EF4444' },
                              ].map(({ label: lbl, valor, cor: c }) => (
                                <div key={lbl} className="rounded-lg p-2 text-center" style={{ background: 'var(--theme-background-secondary)' }}>
                                  <p className="text-xs text-[var(--theme-muted-foreground)]">{lbl}</p>
                                  <p className="text-sm font-bold mt-0.5" style={{ color: c }}>{fmt(valor)}</p>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-xs text-[var(--theme-muted-foreground)] pt-1 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                              <span>
                                {fmt(valorParcela)}/mês
                                {restantes > 0 && <> · próxima em <strong className="text-[var(--theme-foreground)]">{format(proxMes, "MMM/yy", { locale: ptBR })}</strong></>}
                              </span>
                              {restantes > 0 && (
                                <span>
                                  última em <strong className="text-[var(--theme-foreground)]">{format(ultimaMes, "MMM/yy", { locale: ptBR })}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>}
        </Card>
      )}

      {/* ── Histórico de faturas ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-[var(--theme-foreground)]">
            <CreditCard className="h-4 w-4" style={{ color: '#0EA5E9' }} />
            Histórico de Faturas
          </h3>
          <div className="flex gap-2">
            {subscriptionGroups.length > 0 && (
              <Button
                onClick={openReclassify}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <ScanSearch className="h-3.5 w-3.5" />
                Detectar assinaturas
                <span className="ml-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {subscriptionGroups.length}
                </span>
              </Button>
            )}
            <Button onClick={onImportar} variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <FileUp className="h-3.5 w-3.5" /> Nova fatura
            </Button>
          </div>
        </div>

        {faturas.map(({ key, itens }) => {
          const aberta = !faturasAbertas.has(key);
          const total = itens.reduce((s, c) => s + c.valor, 0);
          const importadaEm = new Date(itens[0].criadoEm!);
          const nomeCartaoFatura = itens[0].nomeCartao;
          const porCategoria = Object.entries(
            itens.reduce<Record<string, custosService.Custo[]>>((acc, c) => {
              (acc[c.categoria] ??= []).push(c); return acc;
            }, {})
          ).sort((a, b) =>
            b[1].reduce((s, c) => s + c.valor, 0) - a[1].reduce((s, c) => s + c.valor, 0)
          );

          return (
            <Card key={key} style={{ borderColor: '#0EA5E920' }}>
              <CardContent className="p-0">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer rounded-xl hover:bg-[#0EA5E908]"
                  onClick={() => setFaturasAbertas(s => {
                    const n = new Set(s);
                    aberta ? n.add(key) : n.delete(key);
                    return n;
                  })}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: '#0EA5E915' }}>
                      <CreditCard className="h-4 w-4" style={{ color: '#0EA5E9' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--theme-foreground)]">
                        Importada em {format(importadaEm, "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {nomeCartaoFatura && (
                          <Badge className="text-xs py-0" style={{ background: '#0EA5E915', color: '#0EA5E9', border: '1px solid #0EA5E930' }}>
                            {nomeCartaoFatura}
                          </Badge>
                        )}
                        <span className="text-xs text-[var(--theme-muted-foreground)]">{itens.length} lançamentos</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-red-500">{fmt(total)}</span>
                    <button
                      onClick={e => { e.stopPropagation(); void onDeleteFatura(itens.map(c => c.id!), key); }}
                      className="text-[var(--theme-muted-foreground)] hover:text-red-500 transition-colors"
                      title="Excluir fatura"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {aberta
                      ? <ChevronDown className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                      : <ChevronRight className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                    }
                  </div>
                </div>

                {aberta && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: '#0EA5E915' }}>
                    {porCategoria.map(([cat, catItens]) => {
                      const cor = custosService.CATEGORIAS_CORES[cat as custosService.CategoriaCusto] || '#6B7280';
                      const totalCat = catItens.reduce((s, c) => s + c.valor, 0);
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${cor}20`, color: cor }}>
                              {custosService.CATEGORIAS_LABELS[cat as custosService.CategoriaCusto] || cat}
                            </span>
                            <span className="text-xs text-[var(--theme-muted-foreground)]">{fmt(totalCat)}</span>
                          </div>
                          <div className="space-y-1">
                            {catItens.map(c => {
                              const effectiveCat = (categoryOverrides[c.id!] ?? c.categoria) as custosService.CategoriaCusto;
                              const effectiveTipo = tipoOverrides[c.id!] ?? c.tipo;
                              const effectiveCor = custosService.CATEGORIAS_CORES[effectiveCat] || '#6B7280';
                              const isEditingThis = editingCategoryItemId === c.id;
                              const isSavingThis = savingCategoryId === c.id;

                              return (
                                <div key={c.id} className="rounded-lg px-3 py-2 space-y-2"
                                  style={{ background: `${effectiveCor}08` }}>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm text-[var(--theme-foreground)] truncate">{c.descricao}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {!isEditingThis && (
                                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                            style={{ background: `${effectiveCor}20`, color: effectiveCor }}>
                                            {custosService.CATEGORIAS_LABELS[effectiveCat] || effectiveCat}
                                          </span>
                                        )}
                                        {effectiveTipo === 'assinatura' && (
                                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                            style={{ background: '#F59E0B20', color: '#F59E0B' }}>
                                            assinatura
                                          </span>
                                        )}
                                        <span className="text-xs text-[var(--theme-muted-foreground)]">
                                          {format(new Date(c.data), "d MMM", { locale: ptBR })}
                                        </span>
                                        {c.notas === 'Compra internacional' && (
                                          <Badge variant="outline" className="text-xs py-0">Internacional</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <span className="text-sm font-semibold" style={{ color: effectiveCor }}>
                                        {fmt(c.valor)}
                                      </span>
                                      {!isEditingThis ? (
                                        <button
                                          onClick={e => { e.stopPropagation(); handleStartEditCategory(c); }}
                                          className="rounded-md p-1 text-[var(--theme-muted-foreground)] hover:bg-[var(--theme-background)] hover:text-[var(--theme-accent)] transition-colors"
                                          title="Editar categoria"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            onClick={e => { e.stopPropagation(); void handleSaveCategory(c); }}
                                            disabled={isSavingThis}
                                            className="rounded-md p-1 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                                            title="Salvar"
                                          >
                                            <Check className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={e => { e.stopPropagation(); handleCancelEditCategory(); }}
                                            className="rounded-md p-1 text-[var(--theme-muted-foreground)] hover:bg-[var(--theme-background)] transition-colors"
                                            title="Cancelar"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {isEditingThis && (
                                    <Select
                                      value={pendingCategory}
                                      onValueChange={v => setPendingCategory(v as custosService.CategoriaCusto)}
                                    >
                                      <SelectTrigger className="h-8 text-xs" onClick={e => e.stopPropagation()}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(Object.keys(custosService.CATEGORIAS_LABELS) as custosService.CategoriaCusto[]).map(k => (
                                          <SelectItem key={k} value={k} className="text-xs">
                                            {custosService.CATEGORIAS_LABELS[k]}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Recomendações com IA ── */}
      <InsightsPanel contexto="cartao" resumo={resumoCartao} />

      {/* ── Dialog: detectar e reclassificar assinaturas ── */}
      <Dialog open={reclassifyOpen} onOpenChange={setReclassifyOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanSearch className="h-5 w-5 text-amber-500" />
              Detectar Assinaturas
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-[var(--theme-muted-foreground)]">
            Os lançamentos abaixo foram identificados como possíveis serviços de assinatura.
            Selecione os que deseja reclassificar como <strong>Assinatura</strong>.
          </p>

          <Input
            placeholder="Buscar por nome…"
            value={reclassifySearch}
            onChange={e => setReclassifySearch(e.target.value)}
            className="h-8 text-sm"
          />

          <div className="flex items-center justify-between text-xs text-[var(--theme-muted-foreground)]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded"
                checked={reclassifySelected.size === subscriptionGroups.length && subscriptionGroups.length > 0}
                onChange={e => setReclassifySelected(e.target.checked
                  ? new Set(subscriptionGroups.map(g => g.norm))
                  : new Set()
                )}
              />
              Selecionar todos ({subscriptionGroups.length} serviços)
            </label>
            <span>
              {subscriptionGroups.filter(g => reclassifySelected.has(g.norm)).reduce((s, g) => s + g.count, 0)} lançamentos
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 min-h-0" style={{ maxHeight: '320px' }}>
            {subscriptionGroups
              .filter(g => !reclassifySearch || g.label.toLowerCase().includes(reclassifySearch.toLowerCase()))
              .map(g => {
                const checked = reclassifySelected.has(g.norm);
                const toggle = () => setReclassifySelected(prev => {
                  const next = new Set(prev);
                  checked ? next.delete(g.norm) : next.add(g.norm);
                  return next;
                });
                return (
                  <label
                    key={g.norm}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                    style={{
                      background: checked ? '#F59E0B12' : 'var(--theme-background-secondary)',
                      border: `1px solid ${checked ? '#F59E0B40' : 'transparent'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded flex-shrink-0"
                      checked={checked}
                      onChange={toggle}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--theme-foreground)] truncate">{g.label}</p>
                      <p className="text-xs text-[var(--theme-muted-foreground)]">
                        {g.count} lançamento{g.count !== 1 ? 's' : ''} em faturas · {custosService.CATEGORIAS_LABELS[g.representative.categoria]}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-amber-600">{fmt(g.totalValue)}</p>
                      <p className="text-xs text-[var(--theme-muted-foreground)]">total</p>
                    </div>
                  </label>
                );
              })}
          </div>

          {(() => {
            const totalLancamentos = subscriptionGroups.filter(g => reclassifySelected.has(g.norm)).reduce((s, g) => s + g.count, 0);
            return (
              <DialogFooter className="border-t pt-3" style={{ borderColor: 'var(--theme-border)' }}>
                <Button variant="outline" onClick={() => setReclassifyOpen(false)}>Cancelar</Button>
                <Button
                  onClick={handleReclassify}
                  disabled={reclassifying || reclassifySelected.size === 0}
                  style={{ background: '#F59E0B', color: '#fff' }}
                  className="gap-2"
                >
                  {reclassifying
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Classificando…</>
                    : <><Check className="h-4 w-4" /> Classificar {totalLancamentos} lançamentos</>
                  }
                </Button>
              </DialogFooter>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
}
