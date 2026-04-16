/**
 * Serviço de integração com Google Calendar.
 *
 * Usa OAuth2 com token do Firebase Auth (Google provider)
 * para ler/escrever eventos no Google Calendar do usuário.
 */
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

/**
 * Obtém um access token com scope de Calendar.
 * Se o token atual não tiver o scope, faz um novo signInWithPopup pedindo o scope.
 */
export async function getCalendarAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope(CALENDAR_SCOPES);

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Não foi possível obter acesso ao Google Calendar');
  }

  cachedAccessToken = credential.accessToken;
  tokenExpiry = Date.now() + 50 * 60 * 1000; // ~50 min
  return cachedAccessToken;
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
  colorId?: string;
}

/**
 * Lista eventos do calendário principal dentro de um intervalo.
 */
export async function listarEventosCalendar(
  timeMin: Date,
  timeMax: Date,
): Promise<GoogleCalendarEvent[]> {
  const token = await getCalendarAccessToken();
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[Google Calendar] Erro ao listar:', errBody);
    throw new Error('Falha ao carregar eventos do Google Calendar');
  }

  const data = await res.json();
  return (data.items || []) as GoogleCalendarEvent[];
}

/**
 * Cria um evento no calendário principal.
 */
export async function criarEventoCalendar(
  evento: GoogleCalendarEvent,
): Promise<GoogleCalendarEvent> {
  const token = await getCalendarAccessToken();

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(evento),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[Google Calendar] Erro ao criar evento:', errBody);
    throw new Error('Falha ao criar evento no Google Calendar');
  }

  return res.json();
}

/**
 * Cria um evento all-day no Google Calendar a partir de dados de viagem.
 */
export async function adicionarViagemAoCalendar(viagem: {
  destino: string;
  descricao?: string;
  dataIda: Date | string;
  dataVolta?: Date | string;
  notas?: string;
}): Promise<GoogleCalendarEvent> {
  const ida = typeof viagem.dataIda === 'string' ? viagem.dataIda : viagem.dataIda.toISOString().split('T')[0];
  const volta = viagem.dataVolta
    ? typeof viagem.dataVolta === 'string'
      ? viagem.dataVolta
      : viagem.dataVolta.toISOString().split('T')[0]
    : ida;

  // Adicionar 1 dia ao fim (Google Calendar all-day events são exclusivos no final)
  const endDate = new Date(volta);
  endDate.setDate(endDate.getDate() + 1);
  const endStr = endDate.toISOString().split('T')[0];

  return criarEventoCalendar({
    summary: `✈️ Viagem: ${viagem.destino}`,
    description: [viagem.descricao, viagem.notas].filter(Boolean).join('\n\n'),
    start: { date: ida },
    end: { date: endStr },
    colorId: '9', // azul
  });
}

/**
 * Verifica se o usuário já autorizou o Google Calendar (tenta silenciosamente).
 */
export function isCalendarConnected(): boolean {
  return cachedAccessToken !== null && Date.now() < tokenExpiry;
}
