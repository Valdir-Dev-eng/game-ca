import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WsMessage, Client, ClientRole } from './types';
import {
  getOrCreateSession,
  assignClient,
  removeClient,
  getSession,
} from './sessions';

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    let currentClient: Client | null = null;

    console.log('[WS] Nova conexão WebSocket');

    ws.on('message', (raw: Buffer) => {
      try {
        const msg: WsMessage = JSON.parse(raw.toString());
        handleMessage(msg, ws, (client) => {
          currentClient = client;
        });
      } catch (err) {
        console.error('[WS] Erro ao processar mensagem:', err);
      }
    });

    ws.on('close', () => {
      console.log('[WS] Conexão fechada');
      if (currentClient) {
        removeClient(currentClient.sessionId, currentClient.role);
        notifySessionChanges(currentClient.sessionId);
      }
    });

    ws.on('error', (err) => {
      console.error('[WS] Erro:', err);
    });
  });

  console.log('[WS] WebSocket Server inicializado');
  return wss;
}

function handleMessage(
  msg: WsMessage,
  ws: WebSocket,
  setClient: (c: Client) => void
): void {
  switch (msg.type) {
    case 'register_pc': {
      if (!msg.sessionId) return;
      const session = getOrCreateSession(msg.sessionId);
      const client: Client = {
        id: generateId(),
        role: 'pc',
        sessionId: msg.sessionId,
        ws,
      };
      assignClient(msg.sessionId, client);
      setClient(client);

      ws.send(JSON.stringify({ type: 'pc_registrado', sessionId: msg.sessionId }));
      break;
    }

    case 'register_painel': {
      if (!msg.sessionId) return;
      const session = getOrCreateSession(msg.sessionId);
      const client: Client = {
        id: generateId(),
        role: 'painel',
        sessionId: msg.sessionId,
        ws,
      };
      assignClient(msg.sessionId, client);
      setClient(client);

      // ✅ NOVO: Verifica se o celular já está conectado
      if (session.celular) {
        console.log('[Sync] Painel e celular prontos!');
        
        // Avisa o painel que pode começar
        ws.send(JSON.stringify({ 
          type: 'painel_pronto', 
          sessionId: msg.sessionId,
          message: 'Celular conectado! Aguardando botões...'
        }));
      } else {
        console.log('[Sync] Painel registrado, aguardando celular...');
      }
      break;
    }

    case 'register_celular': {
      if (!msg.sessionId) return;
      const session = getOrCreateSession(msg.sessionId);
      const client: Client = {
        id: generateId(),
        role: 'celular',
        sessionId: msg.sessionId,
        ws,
      };
      assignClient(msg.sessionId, client);
      setClient(client);

      // Avisa o PC que o celular conectou (para redirecionar)
      if (session.pc) {
        session.pc.ws.send(
          JSON.stringify({ type: 'celular_conectado', sessionId: msg.sessionId })
        );
      }

      // ✅ NOVO: Verifica se o painel já está conectado
      if (session.painel) {
        console.log('[Sync] Celular e painel prontos!');
        
        // Avisa o painel que o celular está pronto
        session.painel.ws.send(JSON.stringify({ 
          type: 'celular_pronto', 
          sessionId: msg.sessionId,
          message: 'Celular conectado e pronto!'
        }));
      } else {
        console.log('[Sync] Celular registrado, aguardando painel...');
      }
      break;
    }
    case 'button_release': {
  if (!msg.sessionId || !msg.button) return;
  const session = getSession(msg.sessionId);
  
  if (!session) {
    console.warn('[Release] Sessão não encontrada:', msg.sessionId);
    return;
  }

  if (!session.painel) {
    console.warn('[Release] Painel não conectado, release ignorado:', msg.button);
    return;
  }

  // Reenvia para o painel
  session.painel.ws.send(
    JSON.stringify({
      type: 'botao_solto',
      sessionId: msg.sessionId,
      button: msg.button,
    })
  );
  
  console.log(`[Release] ${msg.button} solto, enviado para o painel`);
  break;
}

    case 'button_press': {
      if (!msg.sessionId || !msg.button) return;
      const session = getSession(msg.sessionId);
      
      // ✅ IMPORTANTE: Só encaminha se existir sessão
      if (!session) {
        console.warn('[Button] Sessão não encontrada:', msg.sessionId);
        return;
      }

      // ✅ IMPORTANTE: Verifica se o painel existe antes de enviar
      if (!session.painel) {
        console.warn('[Button] Painel não conectado, botão ignorado:', msg.button);
        return;
      }

      // Reenvia para o painel
      session.painel.ws.send(
        JSON.stringify({
          type: 'botao_pressionado',
          sessionId: msg.sessionId,
          button: msg.button,
        })
      );
      
      console.log(`[Button] ${msg.button} enviado para o painel`);
      break;
    }

    default:
      console.log('[WS] Tipo de mensagem desconhecido:', msg.type);
  }
}

function notifySessionChanges(sessionId: string): void {
  const session = getSession(sessionId);
  if (!session) return;

  if (session.pc) {
    if (!session.celular) {
      session.pc.ws.send(
        JSON.stringify({ type: 'celular_desconectado', sessionId })
      );
    }
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}