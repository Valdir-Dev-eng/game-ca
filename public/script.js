// ============================
// CONFIGURAÇÃO WEBSOCKET
// ============================
// Troca pela URL do seu backend quando subir
let ws = null;
let sessionId = null;

let WS_URL = '';
let HTTP_URL = '';

async function carregarConfiguracoes() {
  try {
    const [wsRes, httpRes] = await Promise.all([
      fetch('/getWsEnd').then(r => r.json()),
      fetch('/getHttpEnd').then(r => r.json())
    ]);
    WS_URL = wsRes.url;
    HTTP_URL = httpRes.url;
    console.log('Configurações carregadas:', { WS_URL, HTTP_URL });
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    alert('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
  }
}

// Chama assim que o script carrega
carregarConfiguracoes();



// ============================
// CURSOR CUSTOMIZADO
// ============================
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
});

function animarRing() {
  ringX += (mouseX - ringX) * 0.15;
  ringY += (mouseY - ringY) * 0.15;
  cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
  requestAnimationFrame(animarRing);
}
animarRing();

document.querySelectorAll('button, .coracao-gigante, .promessa-card, .timeline-item, a').forEach(el => {
  el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
});

// ============================
// SISTEMA DE PARTÍCULAS
// ============================
const canvas = document.getElementById('particulas');
const ctx = canvas.getContext('2d');
let particulas = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const tiposParticulas = [
  { simbolo: '💗', tamanho: 20 },
  { simbolo: '🌸', tamanho: 18 },
  { simbolo: '✨', tamanho: 15 },
  { simbolo: '', tamanho: 16 },
  { simbolo: '❤️', tamanho: 14 },
  { simbolo: '💖', tamanho: 22 }
];

class Particula {
  constructor() {
    this.reset();
    this.y = Math.random() * canvas.height;
  }
  
  reset() {
    const tipo = tiposParticulas[Math.floor(Math.random() * tiposParticulas.length)];
    this.simbolo = tipo.simbolo;
    this.tamanho = tipo.tamanho + Math.random() * 10;
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + 50;
    this.velocidade = Math.random() * 0.8 + 0.3;
    this.opacidade = Math.random() * 0.6 + 0.2;
    this.angulo = Math.random() * Math.PI * 2;
    this.rotacao = Math.random() * 360;
    this.velocidadeRotacao = (Math.random() - 0.5) * 2;
  }
  
  atualizar() {
    this.y -= this.velocidade;
    this.angulo += 0.02;
    this.x += Math.sin(this.angulo) * 0.8;
    this.rotacao += this.velocidadeRotacao;
    if (this.y < -50) this.reset();
  }
  
  desenhar() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotacao * Math.PI) / 180);
    ctx.globalAlpha = this.opacidade;
    ctx.font = `${this.tamanho}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.simbolo, 0, 0);
    ctx.restore();
  }
}

for (let i = 0; i < 80; i++) {
  particulas.push(new Particula());
}

function loopParticulas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particulas.forEach(p => {
    p.atualizar();
    p.desenhar();
  });
  requestAnimationFrame(loopParticulas);
}
loopParticulas();

// ============================
// INTRO OVERLAY
// ============================
const intro = document.getElementById('intro');
const btnEntrar = document.getElementById('btnEntrar');
const conteudo = document.getElementById('conteudo');

conteudo.style.opacity = '0';

btnEntrar.addEventListener('click', () => {
  intro.classList.add('hidden');
  setTimeout(() => {
    conteudo.style.transition = 'opacity 1.5s ease';
    conteudo.style.opacity = '1';
    intro.style.display = 'none';
    const rect = btnEntrar.getBoundingClientRect();
    for (let i = 0; i < 30; i++) {
      setTimeout(() => explodirCoracaoUnico({ x: rect.left + rect.width/2, y: rect.top + rect.height/2 }), i * 30);
    }
  }, 800);
});

// ============================
// SCROLL REVEAL
// ============================
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

reveals.forEach(el => observer.observe(el));

// ============================
// CORAÇÃO GIGANTE
// ============================
const coracao = document.getElementById('coracao');
coracao.addEventListener('click', () => {
  coracao.style.transform = 'scale(1.4) rotate(-10deg)';
  setTimeout(() => {
    coracao.style.transform = '';
  }, 400);
  explodirCoracoes(coracao.getBoundingClientRect());
});

function explodirCoracoes(rect) {
  const centro = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  for (let i = 0; i < 20; i++) {
    setTimeout(() => explodirCoracaoUnico(centro), i * 40);
  }
}

function explodirCoracaoUnico(centro) {
  const coracaoEl = document.createElement('div');
  const simbolos = ['💗', '💕', '🌸', '💖', '🎯', '❤️', '✨'];
  coracaoEl.textContent = simbolos[Math.floor(Math.random() * simbolos.length)];
  coracaoEl.style.cssText = `
    position: fixed;
    left: ${centro.x}px;
    top: ${centro.y}px;
    font-size: ${Math.random() * 25 + 20}px;
    pointer-events: none;
    z-index: 9998;
    transition: all 1.5s cubic-bezier(0.22, 1, 0.36, 1);
    opacity: 1;
  `;
  document.body.appendChild(coracaoEl);

  const angulo = Math.random() * Math.PI * 2;
  const distancia = Math.random() * 400 + 200;
  const dx = Math.cos(angulo) * distancia;
  const dy = Math.sin(angulo) * distancia - 150;

  requestAnimationFrame(() => {
    coracaoEl.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random() * 720 - 360}deg)`;
    coracaoEl.style.opacity = '0';
  });

  setTimeout(() => coracaoEl.remove(), 1600);
}

// ============================
// PARALLAX NOS NÚMEROS
// ============================
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  document.querySelectorAll('.secao-numero').forEach((num) => {
    const offset = (scrollY - num.offsetTop) * 0.1;
    num.style.transform = `translateY(calc(-50% + ${offset}px))`;
  });
});

// ============================
// LÓGICA DO BOTÃO "VAMOS FAZER AS PAZES" + QR CODE + WS
// ============================
const btnPaz = document.getElementById('btnPaz');
const msgFinal = document.getElementById('msgFinal');
const estadoInicial = document.getElementById('estadoInicial');
const estadoQr = document.getElementById('estadoQr');
const estadoConectado = document.getElementById('estadoConectado');
const qrStatus = document.getElementById('qrStatus');
const controlesGrid = document.getElementById('controlesGrid');
const logEventos = document.getElementById('logEventos');

btnPaz.addEventListener('click', async () => {
  msgFinal.classList.add('show');
  sessionId = generateSessionId();
  
  setTimeout(async () => {
    estadoInicial.style.display = 'none';
    estadoQr.style.display = 'flex';
    
    // GARANTE QUE TEMOS A URL ANTES DE GERAR O QR CODE
    if (!HTTP_URL) await carregarConfiguracoes();
    
    // Gera o QR Code com a URL HTTP correta + o caminho /connect/
    const qrFinalUrl = `${HTTP_URL}/connect/${sessionId}`;
    console.log('QR Code gerado para:', qrFinalUrl);
    
    new QRCode(document.getElementById('qrcode'), {
      text: qrFinalUrl,
      width: 256,
      height: 256,
      colorDark: '#ad1457',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    
    qrStatus.innerHTML = '<span class="status-dot"></span> Aguardando Carol escanear...';
    
    // Conecta no WebSocket
    if (!WS_URL) await carregarConfiguracoes();
    conectarWebSocket();
  }, 1500);
});

function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function conectarWebSocket() {
  try {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('PC conectado ao WebSocket em:', WS_URL);
      // Envia o ID da sessão pro servidor
      ws.send(JSON.stringify({
        type: 'register_pc',
        sessionId: sessionId
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket desconectado, tentando reconectar...');
      setTimeout(conectarWebSocket, 3000);
    };
  } catch (e) {
    console.error('Erro ao criar WebSocket:', e);
  }
}

function handleServerMessage(data) {
  switch(data.type) {
    case 'celular_conectado':
  // Redireciona o PC para a página do painel
  window.location.href = `/painel/${sessionId}`;
  break;
  }
}

// ============================
// CORAÇÕES FLUTUANTES (após botão paz)
// ============================
function criarCoracaoFlutuante() {
  const container = document.getElementById('floatingHearts');
  if (!container) return;
  
  const coracao = document.createElement('div');
  coracao.textContent = ['', '💕', '🌸'][Math.floor(Math.random() * 3)];
  coracao.style.cssText = `
    position: absolute;
    left: ${Math.random() * 100}%;
    bottom: -50px;
    font-size: ${Math.random() * 30 + 20}px;
    animation: flutuarCima ${Math.random() * 3 + 3}s ease-out forwards;
    opacity: 0.6;
    pointer-events: none;
  `;
  container.appendChild(coracao);
  
  setTimeout(() => coracao.remove(), 6000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes flutuarCima {
    0% {
      transform: translateY(0) rotate(0deg) scale(0.5);
      opacity: 0.6;
    }
    100% {
      transform: translateY(-100vh) rotate(360deg) scale(1);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);