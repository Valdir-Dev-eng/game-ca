import express, { Express } from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { setupRoutes } from './routes';
import { setupWebSocket } from './ws';

// Carrega as variáveis do .env
dotenv.config();

const app: Express = express();

// ✅ CORREÇÃO: Converte a porta para número explicitamente
const PORT = Number(process.env.PORT) || 2373;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.static('public'));
app.use('/', setupRoutes());

const server = createServer(app);
setupWebSocket(server);

server.listen(PORT, HOST, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   Servidor rodando em:                   ║
  ║  🌐 HTTP: ${process.env.HTTP_URL}           ║
  ║  🔌 WS:   ${process.env.WS_URL}             ║
  ╚══════════════════════════════════════════╝
  `);
});