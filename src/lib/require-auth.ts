/**
 * Helpers de escopo por usuário autenticado para os serviços de dados.
 *
 * Todos os serviços que gravam/leem coleções com dados pessoais DEVEM usar
 * `requireUid()` para obter o uid do usuário logado e anexar `ownerId` aos
 * documentos, e filtrar `where('ownerId', '==', uid)` em todas as leituras.
 */
import { auth } from './firebase-config';

/**
 * Retorna o uid do usuário logado ou lança se não houver.
 * Use em todo create/update/list que representa dado pessoal.
 */
export function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('NOT_AUTHENTICATED: operação requer usuário autenticado.');
  }
  return uid;
}

/**
 * Versão "soft" — retorna o uid ou null se não houver. Útil para listagens
 * que devem retornar array vazio em vez de explodir quando o usuário ainda
 * não logou (ex.: primeiros renders).
 */
export function currentUidOrNull(): string | null {
  return auth.currentUser?.uid ?? null;
}
