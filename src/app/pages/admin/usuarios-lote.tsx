import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Users,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  excluirUsuarioSistema,
  importarUsuariosEmLote,
  LinhaImportacaoNormalizada,
  listarTodosUsuariosSistema,
  normalizarLinhaImportacao,
  UsuarioSistemaRow,
} from '../../../services/usuarios-lote-service';

type TipoImportacao = 'aluno' | 'analista';

function getLinhaId(linha: LinhaImportacaoNormalizada, index: number) {
  return `${linha.tipo || 'desconhecido'}-${linha.email || linha.nome || index}-${index}`;
}

function ImportPreviewTable({
  title,
  tipo,
  rows,
  selectedIds,
  onToggleOne,
  onToggleAll,
}: {
  title: string;
  tipo: TipoImportacao;
  rows: Array<{ linha: LinhaImportacaoNormalizada; index: number; id: string }>;
  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: (tipo: TipoImportacao, checked: boolean) => void;
}) {
  const validRows = rows.filter((r) => r.linha.valido);
  const allSelected =
    validRows.length > 0 && validRows.every((r) => selectedIds.has(r.id));
  const someSelected =
    validRows.some((r) => selectedIds.has(r.id)) && !allSelected;

  return (
    <Card className="rounded-[28px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{title}</span>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={(e) => onToggleAll(tipo, e.target.checked)}
            />
            Selecionar todos
          </label>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--theme-muted-foreground)]">
            Nenhum registro encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--theme-border)]">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-[var(--theme-background-secondary)]">
                <tr>
                  <th className="px-3 py-2 text-left">Selecionar</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Nome</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Erro</th>
                  <th className="px-3 py-2 text-left">
                    {tipo === 'aluno' ? 'Curso' : 'Função'}
                  </th>
                  <th className="px-3 py-2 text-left">
                    {tipo === 'aluno' ? 'Turma' : 'Squad'}
                  </th>
                  <th className="px-3 py-2 text-left">
                    {tipo === 'aluno' ? 'Período' : 'Senioridade'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ linha, id }) => {
                  const disabled = !linha.valido;

                  return (
                    <tr key={id} className="border-t border-[var(--theme-border)]">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(id)}
                          disabled={disabled}
                          onChange={() => onToggleOne(id)}
                        />
                      </td>

                      <td className="px-3 py-2">
                        {linha.valido ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Válida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            Inválida
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 font-medium">{linha.nome || '-'}</td>
                      <td className="px-3 py-2">{linha.email || '-'}</td>
                      <td className="px-3 py-2 text-red-600">{linha.erro || '-'}</td>
                      <td className="px-3 py-2">
                        {tipo === 'aluno'
                          ? linha.dados?.curso || '-'
                          : linha.dados?.funcao || '-'}
                      </td>
                      <td className="px-3 py-2">
                        {tipo === 'aluno'
                          ? linha.dados?.turma || '-'
                          : linha.dados?.squad || '-'}
                      </td>
                      <td className="px-3 py-2">
                        {tipo === 'aluno'
                          ? linha.dados?.periodo || '-'
                          : linha.dados?.senioridade || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UsuariosCadastradosTable({
  title,
  rows,
  onDelete,
}: {
  title: string;
  rows: UsuarioSistemaRow[];
  onDelete: (usuario: UsuarioSistemaRow) => void;
}) {
  return (
    <Card className="rounded-[28px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--theme-muted-foreground)]">
            Nenhum usuário encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--theme-border)]">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[var(--theme-background-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Informação</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((usuario) => (
                  <tr key={`${usuario.tipo}-${usuario.id}`} className="border-t border-[var(--theme-border)]">
                    <td className="px-4 py-3 font-medium">{usuario.nome}</td>
                    <td className="px-4 py-3 text-[var(--theme-muted-foreground)]">
                      {usuario.email}
                    </td>
                    <td className="px-4 py-3 text-[var(--theme-muted-foreground)]">
                      {usuario.detalhe}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(usuario)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UsuariosLote() {
  const [arquivoNome, setArquivoNome] = useState('');
  const [linhasNormalizadas, setLinhasNormalizadas] = useState<LinhaImportacaoNormalizada[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistemaRow[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setIsLoadingUsers(true);
      const data = await listarTodosUsuariosSistema();
      setUsuarios(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar usuários do sistema');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const processarArquivo = async (file: File) => {
    try {
      setArquivoNome(file.name);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, {
        defval: '',
        raw: true,
      });

      const normalizadas = json.map((row) => normalizarLinhaImportacao(row));
      setLinhasNormalizadas(normalizadas);

      const validIds = new Set<string>();
      normalizadas.forEach((linha, index) => {
        const id = getLinhaId(linha, index);
        if (linha.valido) validIds.add(id);
      });
      setSelectedImportIds(validIds);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao ler o arquivo Excel');
    }
  };

  const handleArquivoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      toast.error('Envie um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    await processarArquivo(file);
  };

  const importRows = useMemo(() => {
    return linhasNormalizadas.map((linha, index) => ({
      linha,
      index,
      id: getLinhaId(linha, index),
    }));
  }, [linhasNormalizadas]);

  const importAlunos = useMemo(
    () => importRows.filter((item) => item.linha.tipo === 'aluno'),
    [importRows]
  );

  const importAnalistas = useMemo(
    () => importRows.filter((item) => item.linha.tipo === 'analista'),
    [importRows]
  );

  const validasSelecionadas = useMemo(() => {
    return importRows.filter(
      (item) => item.linha.valido && selectedImportIds.has(item.id)
    );
  }, [importRows, selectedImportIds]);

  const toggleOneImport = (id: string) => {
    setSelectedImportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllByTipo = (tipo: TipoImportacao, checked: boolean) => {
    const idsDoTipo = importRows
      .filter((item) => item.linha.tipo === tipo && item.linha.valido)
      .map((item) => item.id);

    setSelectedImportIds((prev) => {
      const next = new Set(prev);

      idsDoTipo.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });

      return next;
    });
  };

  const handleImportar = async () => {
    if (!validasSelecionadas.length) {
      toast.error('Selecione pelo menos uma linha válida para importar');
      return;
    }

    try {
      setIsImporting(true);

      await importarUsuariosEmLote(validasSelecionadas.map((item) => item.linha));

      toast.success(`${validasSelecionadas.length} usuários importados com sucesso`);
      await carregarUsuarios();

      setArquivoNome('');
      setLinhasNormalizadas([]);
      setSelectedImportIds(new Set());
    } catch (error) {
      console.error(error);
      toast.error('Erro ao importar usuários');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExcluir = async (usuario: UsuarioSistemaRow) => {
    const confirmar = window.confirm(
      `Deseja realmente excluir ${usuario.nome} (${usuario.tipo})?`
    );
    if (!confirmar) return;

    try {
      await excluirUsuarioSistema(usuario.id, usuario.tipo);
      toast.success('Usuário excluído com sucesso');
      await carregarUsuarios();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const usuariosFiltrados = useMemo(() => {
    const term = filtro.toLowerCase().trim();
    if (!term) return usuarios;

    return usuarios.filter((item) =>
      [item.nome, item.email, item.tipo, item.detalhe]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(term))
    );
  }, [usuarios, filtro]);

  const alunosCadastrados = useMemo(
    () => usuariosFiltrados.filter((u) => u.tipo === 'aluno'),
    [usuariosFiltrados]
  );

  const analistasCadastrados = useMemo(
    () => usuariosFiltrados.filter((u) => u.tipo === 'analista'),
    [usuariosFiltrados]
  );

  const validasTotal = linhasNormalizadas.filter((item) => item.valido).length;
  const invalidasTotal = linhasNormalizadas.length - validasTotal;

  return (
    <div className="space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">
          Importação e Gestão de Usuários
        </h1>
        <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
          Importe alunos e analistas via Excel e gerencie os usuários cadastrados.
        </p>
      </div>

      <Card className="rounded-[28px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar via Excel
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-dashed border-[var(--theme-border)] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-[var(--theme-foreground)]">
                  Arquivo esperado
                </p>
                <p className="text-sm text-[var(--theme-muted-foreground)]">
                  Coluna <strong>tipo</strong> com valor <strong>aluno</strong> ou <strong>analista</strong>.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium">
                <Upload className="h-4 w-4" />
                Selecionar Excel
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleArquivoChange}
                  className="hidden"
                />
              </label>
            </div>

            {arquivoNome && (
              <p className="mt-3 text-sm text-[var(--theme-muted-foreground)]">
                Arquivo selecionado: <strong>{arquivoNome}</strong>
              </p>
            )}
          </div>

          {linhasNormalizadas.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">Linhas válidas</p>
                  <p className="text-2xl font-bold text-emerald-700">{validasTotal}</p>
                </div>
                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-sm text-red-700">Linhas inválidas</p>
                  <p className="text-2xl font-bold text-red-700">{invalidasTotal}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">Selecionadas</p>
                  <p className="text-2xl font-bold text-blue-700">{validasSelecionadas.length}</p>
                </div>
                <div className="rounded-2xl bg-violet-50 p-4">
                  <p className="text-sm text-violet-700">Linhas totais</p>
                  <p className="text-2xl font-bold text-violet-700">{linhasNormalizadas.length}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleImportar} disabled={isImporting || validasSelecionadas.length === 0}>
                  {isImporting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Importar selecionados
                </Button>
              </div>

              <ImportPreviewTable
                title="Preview de Alunos"
                tipo="aluno"
                rows={importAlunos}
                selectedIds={selectedImportIds}
                onToggleOne={toggleOneImport}
                onToggleAll={toggleAllByTipo}
              />

              <ImportPreviewTable
                title="Preview de Analistas"
                tipo="analista"
                rows={importAnalistas}
                selectedIds={selectedImportIds}
                onToggleOne={toggleOneImport}
                onToggleAll={toggleAllByTipo}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[28px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários cadastrados
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Input
              placeholder="Filtrar por nome, email ou detalhe..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
            </div>
          ) : (
            <div className="space-y-5">
              <UsuariosCadastradosTable
                title="Alunos cadastrados"
                rows={alunosCadastrados}
                onDelete={handleExcluir}
              />

              <UsuariosCadastradosTable
                title="Analistas cadastrados"
                rows={analistasCadastrados}
                onDelete={handleExcluir}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}