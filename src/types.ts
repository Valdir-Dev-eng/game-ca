import { WebSocket } from 'ws';

// Tipos de mensagens que trafegam no WebSocket
export type WsMessageType =
  | 'register_pc'
  | 'register_painel'
  | 'register_celular'
  | 'celular_conectado'
  | 'celular_desconectado'
  | 'botao_pressionado'
  | 'botao_solto'  // ← NOVO
  | 'button_press'
  | 'button_release';  // ← NOVO

export interface WsMessage {
  type: WsMessageType;
  sessionId?: string;
  button?: string;
}

// Tipos de clientes conectados
export type ClientRole = 'pc' | 'painel' | 'celular';

export interface Client {
  id: string;
  role: ClientRole;
  sessionId: string;
  ws: WebSocket;
}

// Estado de uma sessão
export interface Session {
  id: string;
  pc: Client | null;
  painel: Client | null;
  celular: Client | null;
  createdAt: number;
}