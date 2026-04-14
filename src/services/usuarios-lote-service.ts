import * as alunosService from './alunos-service';
import * as analistasService from './analistas-service';

export type TipoUsuarioImportacao = 'aluno' | 'analista';

export interface UsuarioSistemaRow {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuarioImportacao;
  detalhe: string;
  origem: any;
}

export interface LinhaImportacaoNormalizada {
  tipo: TipoUsuarioImportacao | '';
  nome: string;
  email: string;
  valido: boolean;
  erro?: string;
  dados: Record<string, any>;
  raw: Record<string, any>;
}

function parseDateValue(value: any): Date | undefined {
  if (!value && value !== 0) return undefined;

  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const result = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(result.getTime()) ? undefined : result;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const direct = new Date(trimmed);
    if (!Number.isNaN(direct.getTime())) return direct;

    const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) {
      const [, dd, mm, yyyy] = br;
      const dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      return Number.isNaN(dt.getTime()) ? undefined : dt;
    }
  }

  return undefined;
}

function parseNumberValue(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(String(value).replace(',', '.'));
  return Number.isNaN(n) ? undefined : n;
}

function parseSkills(value: any): string[] {
  if (!value) return [];
  return String(value)
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getValue(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return '';
}

function normalizeTipo(value: any): TipoUsuarioImportacao | '' {
  const v = String(value || '').trim().toLowerCase();
  if (['aluno', 'student'].includes(v)) return 'aluno';
  if (['analista', 'analyst'].includes(v)) return 'analista';
  return '';
}

export function normalizarLinhaImportacao(raw: Record<string, any>): LinhaImportacaoNormalizada {
  const tipoInformado = normalizeTipo(
    getValue(raw, ['tipo', 'user_type', 'tipo_usuario', 'categoria'])
  );

  const nome = String(getValue(raw, ['nome', 'name'])).trim();
  const email = String(getValue(raw, ['email', 'e-mail', 'mail'])).trim();

  const curso = String(getValue(raw, ['curso', 'course'])).trim();
  const funcao = String(getValue(raw, ['funcao', 'função', 'cargo', 'role'])).trim();

  let tipo: TipoUsuarioImportacao | '' = tipoInformado;
  if (!tipo) {
    if (curso) tipo = 'aluno';
    else if (funcao) tipo = 'analista';
  }

  if (!tipo) {
    return {
      tipo: '',
      nome,
      email,
      valido: false,
      erro: 'Não foi possível identificar o tipo. Informe "tipo" como aluno ou analista.',
      dados: {},
      raw,
    };
  }

  if (!nome || !email) {
    return {
      tipo,
      nome,
      email,
      valido: false,
      erro: 'Nome e e-mail são obrigatórios.',
      dados: {},
      raw,
    };
  }

  if (tipo === 'aluno') {
    if (!curso) {
      return {
        tipo,
        nome,
        email,
        valido: false,
        erro: 'Para aluno, o campo "curso" é obrigatório.',
        dados: {},
        raw,
      };
    }

    return {
      tipo,
      nome,
      email,
      valido: true,
      dados: {
        nome,
        email,
        telefone: String(getValue(raw, ['telefone', 'phone'])).trim(),
        turma: String(getValue(raw, ['turma', 'class'])).trim(),
        periodo: String(getValue(raw, ['periodo', 'período', 'shift'])).trim(),
        curso,
        ra: String(getValue(raw, ['ra', 'matricula', 'matrícula', 'registro'])).trim(),
        dataNascimento: parseDateValue(getValue(raw, ['dataNascimento', 'data_nascimento', 'nascimento'])),
        endereco: String(getValue(raw, ['endereco', 'endereço', 'address'])).trim(),
        cidade: String(getValue(raw, ['cidade', 'city'])).trim(),
        estado: String(getValue(raw, ['estado', 'state'])).trim(),
        cep: String(getValue(raw, ['cep', 'zip'])).trim(),
        observacoes: String(getValue(raw, ['observacoes', 'observações', 'obs', 'notes'])).trim(),
        foto: String(getValue(raw, ['foto', 'avatar', 'image'])).trim(),
      },
      raw,
    };
  }

  if (!funcao) {
    return {
      tipo,
      nome,
      email,
      valido: false,
      erro: 'Para analista, o campo "funcao" é obrigatório.',
      dados: {},
      raw,
    };
  }

  return {
    tipo,
    nome,
    email,
    valido: true,
    dados: {
      nome,
      email,
      telefone: String(getValue(raw, ['telefone', 'phone'])).trim(),
      funcao,
      squad: String(getValue(raw, ['squad', 'time', 'team'])).trim(),
      senioridade: String(getValue(raw, ['senioridade', 'nivel', 'nível', 'level'])).trim(),
      salario: parseNumberValue(getValue(raw, ['salario', 'salário', 'salary'])),
      foto: String(getValue(raw, ['foto', 'avatar', 'image'])).trim(),
      dataAdmissao: parseDateValue(getValue(raw, ['dataAdmissao', 'data_admissao', 'admissao', 'admissão'])),
      dataNascimento: parseDateValue(getValue(raw, ['dataNascimento', 'data_nascimento', 'nascimento'])),
      endereco: String(getValue(raw, ['endereco', 'endereço', 'address'])).trim(),
      cidade: String(getValue(raw, ['cidade', 'city'])).trim(),
      estado: String(getValue(raw, ['estado', 'state'])).trim(),
      cep: String(getValue(raw, ['cep', 'zip'])).trim(),
      skills: parseSkills(getValue(raw, ['skills', 'habilidades', 'competencias', 'competências'])),
      observacoes: String(getValue(raw, ['observacoes', 'observações', 'obs', 'notes'])).trim(),
    },
    raw,
  };
}

export async function importarUsuariosEmLote(linhas: LinhaImportacaoNormalizada[]) {
  const validas = linhas.filter((linha) => linha.valido);
  const resultados: Array<{ tipo: TipoUsuarioImportacao; id: string; nome: string }> = [];

  for (const linha of validas) {
    if (linha.tipo === 'aluno') {
      const id = await alunosService.criarAluno(linha.dados);
      resultados.push({ tipo: 'aluno', id, nome: linha.nome });
    } else {
      const id = await analistasService.criarAnalista(linha.dados);
      resultados.push({ tipo: 'analista', id, nome: linha.nome });
    }
  }

  return resultados;
}

export async function listarTodosUsuariosSistema(): Promise<UsuarioSistemaRow[]> {
  const [alunos, analistas] = await Promise.all([
    alunosService.listarAlunos(),
    analistasService.listarAnalistas(),
  ]);

  const usuarios: UsuarioSistemaRow[] = [
    ...alunos.map((aluno: any) => ({
      id: aluno.id,
      nome: aluno.nome,
      email: aluno.email,
      tipo: 'aluno' as const,
      detalhe: aluno.curso || aluno.turma || '-',
      origem: aluno,
    })),
    ...analistas.map((analista: any) => ({
      id: analista.id,
      nome: analista.nome,
      email: analista.email,
      tipo: 'analista' as const,
      detalhe: analista.funcao || analista.squad || '-',
      origem: analista,
    })),
  ];

  usuarios.sort((a, b) => a.nome.localeCompare(b.nome));
  return usuarios;
}

export async function excluirUsuarioSistema(id: string, tipo: TipoUsuarioImportacao) {
  if (tipo === 'aluno') {
    await alunosService.deletarAluno(id);
    return;
  }

  await analistasService.deletarAnalista(id);
}