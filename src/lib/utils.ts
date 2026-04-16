/**
 * TaskAll - Utility Functions
 * Funções auxiliares para o sistema
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS com tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retorna a cor baseada no score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-blue-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Retorna a cor de background baseada no score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500/10';
  if (score >= 60) return 'bg-blue-500/10';
  if (score >= 40) return 'bg-yellow-500/10';
  return 'bg-red-500/10';
}

/**
 * Formata uma data para exibição
 */
export function formatDate(
  date: Date | string,
  formatStr: string = "d 'de' MMMM 'de' yyyy"
): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return format(parsedDate, formatStr, { locale: ptBR });
}

/**
 * Formata hora
 */
export function formatTime(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return format(parsedDate, 'HH:mm');
}

/**
 * Formata data e hora
 */
export function formatDateTime(
  date: Date | string,
  formatStr: string = "d 'de' MMM 'às' HH:mm"
): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return format(parsedDate, formatStr, { locale: ptBR });
}

/**
 * Calcula média de um array de números
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * Calcula porcentagem
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Gera iniciais de um nome
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Trunca texto com ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Formata moeda brasileira
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gera cor baseada em string (para avatares)
 */
export function getColorFromString(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    '#EC7000', // Itaú Orange
    '#003A8F', // Itaú Blue
    '#6A0DAD', // FIAP Purple
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
  ];

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Calcula tempo decorrido desde uma data
 */
export function getTimeAgo(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const diffMs = now.getTime() - parsedDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDate(parsedDate, "d 'de' MMM");
}

/**
 * Ordena array de objetos por propriedade
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Agrupa array por propriedade
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Gera ID único
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone de objeto
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Calcula score de eficiência
 */
export function calculateEfficiencyScore(
  tarefasConcluidas: number,
  reunioesRealizadas: number,
  feedbacksFeitos: number,
  aulasMinistradas: number
): number {
  const weighted =
    tarefasConcluidas * 3 +
    reunioesRealizadas * 2 +
    feedbacksFeitos * 4 +
    aulasMinistradas * 3;

  const maxExpected = 50;
  const score = Math.min(100, (weighted / maxExpected) * 100);

  return Math.round(score);
}

/**
 * Detecta tipo de arquivo por extensão
 */
export function getFileType(
  filename: string
): 'pdf' | 'ppt' | 'doc' | 'video' | 'link' {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (['pdf'].includes(ext || '')) return 'pdf';
  if (['ppt', 'pptx'].includes(ext || '')) return 'ppt';
  if (['doc', 'docx'].includes(ext || '')) return 'doc';
  if (['mp4', 'avi', 'mov'].includes(ext || '')) return 'video';
  return 'link';
}

/**
 * Converte bytes para formato legível
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Valida força de senha
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: 'fraca' | 'média' | 'forte' | 'muito forte';
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'fraca' };
  if (score <= 4) return { score, label: 'média' };
  if (score <= 5) return { score, label: 'forte' };
  return { score, label: 'muito forte' };
}

/**
 * Limpa HTML tags de uma string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Capitaliza primeira letra
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converte para slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}