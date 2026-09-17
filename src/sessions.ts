import { Session, Client, ClientRole } from './types';

// Mapa de sessões ativas
const sessions = new Map<string, Session>();

export function createSession(sessionId: string): Session {
  const session: Session = {
    id: sessionId,
    pc: null,
    painel: null,
    celular: null,
    createdAt: Date.now(),
  };
  sessions.set(sessionId, session);
  console.log(`[Sessions] Sessão criada: ${sessionId}`);
  return session;
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function getOrCreateSession(sessionId: string): Session {
  let session = sessions.get(sessionId);
  if (!session) {
    session = createSession(sessionId);
  }
  return session;
}

export function assignClient(sessionId: string, client: Client): void {
  const session = getOrCreateSession(sessionId);

  switch (client.role) {
    case 'pc':
      session.pc = client;
      break;
    case 'painel':
      session.painel = client;
      break;
    case 'celular':
      session.celular = client;
      break;
  }

  console.log(
    `[Sessions] ${client.role} conectado na sessão ${sessionId}`
  );
}

export function removeClient(sessionId: string, role: ClientRole): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  switch (role) {
    case 'pc':
      session.pc = null;
      break;
    case 'painel':
      session.painel = null;
      break;
    case 'celular':
      session.celular = null;
      break;
  }

  console.log(
    `[Sessions] ${role} desconectado da sessão ${sessionId}`
  );
}

// Limpa sessões antigas (opcional, a cada 5 min)
export function cleanupOldSessions(maxAgeMs = 5 * 60 * 1000): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (
      now - session.createdAt > maxAgeMs &&
      !session.pc &&
      !session.painel &&
      !session.celular
    ) {
      sessions.delete(id);
      console.log(`[Sessions] Sessão expirada removida: ${id}`);
    }
  }
}

setInterval(() => cleanupOldSessions(), 60 * 1000);