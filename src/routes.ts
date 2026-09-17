import { Router, Request, Response } from 'express';
import { getOrCreateSession } from './sessions';

export function setupRoutes(): Router {
  const router = Router();

    router.get('/getWsEnd', (_req: Request, res: Response) => {
    res.json({ url: process.env.WS_URL });
  });

  router.get('/getHttpEnd', (_req: Request, res: Response) => {
    res.json({ url: process.env.HTTP_URL });
  });

  // Página do celular (quando escaneia o QR Code)
  router.get('/connect/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    getOrCreateSession(sessionId);
    res.sendFile('connect.html', { root: 'public' });
  });

  // Página do painel (PC após redirecionamento)
  router.get('/painel/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    getOrCreateSession(sessionId);
    res.sendFile('painel.html', { root: 'public' });
  });

    // NOVA: Rota do Celular após clicar em Jogar
  router.get('/controle/:sessionId', (req: Request, res: Response) => {
    getOrCreateSession(req.params.sessionId);
    res.sendFile('controle.html', { root: 'public' }); // <-- Arquivo renomeado
  });

  // Health check
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  return router;
}