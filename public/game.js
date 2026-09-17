// ==========================================
// CONFIGURAÇÃO DO JOGO
// ==========================================

const TILE_SIZE = 32;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// ✅ CORREÇÃO: Extrair o sessionId da URL (ex: /painel/sess_xxxxx)
const urlPath = window.location.pathname;
const sessionId = urlPath.split('/').pop() || 'sess_default';
console.log('🎮 Session ID extraído da URL:', sessionId);

let ws = null;
let WS_URL = '';

// ✅ CORREÇÃO: Garantir que o objeto global exista e não seja sobrescrito
window.celularButtons = window.celularButtons || {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false
};

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  audio: {
    disableWebAudio: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false // Mude para true se precisar ver as caixas de colisão
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  }
};

const game = new Phaser.Game(config);

let platforms;
let decorations;
let player;

// ==========================================
// PRELOAD
// ==========================================
function preload() {
  // ✅ TILES (com barra / no início)
  this.load.image('floor_1', '/assets/industrial/1 Tiles/IndustrialTile_01.png');
  this.load.image('floor_2', '/assets/industrial/1 Tiles/IndustrialTile_02.png');
  this.load.image('floor_3', '/assets/industrial/1 Tiles/IndustrialTile_03.png');
  
  this.load.image('wall_1', '/assets/industrial/1 Tiles/IndustrialTile_04.png');
  this.load.image('wall_2', '/assets/industrial/1 Tiles/IndustrialTile_05.png');
  
  this.load.image('platform', '/assets/industrial/1 Tiles/IndustrialTile_06.png');
  this.load.image('door_decor', '/assets/industrial/1 Tiles/IndustrialTile_07.png');
  
  // ✅ OBJETOS
  this.load.image('crate', '/assets/industrial/3 Objects/Box1.png');
  this.load.image('barrel', '/assets/industrial/3 Objects/Barrel1.png');
  this.load.image('container', '/assets/industrial/3 Objects/Box2.png');
  this.load.image('fence', '/assets/industrial/3 Objects/Fence1.png');
  this.load.image('bench', '/assets/industrial/3 Objects/Bench.png');
  
  // ✅ SPRITES DO BICHINHO (na raiz da pasta public)
  this.load.spritesheet('run', '/sprite_run.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('jump', '/sprite_up.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('stop', '/sprite_stop.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('combo', '/sprite_combo.png', { frameWidth: 32, frameHeight: 32 });
  
  // ✅ FUMAÇA
  for (let i = 1; i <= 10; i++) {
    const frameNumber = i.toString().padStart(2, '0');
    this.load.image(`smoke_${frameNumber}`, `/smoke/Smoke_Frame_${frameNumber}.png`);
  }
}

// ==========================================
// CREATE
// ==========================================
function create() {
  const W = this.scale.width;
  const H = this.scale.height;
  
  platforms = this.physics.add.staticGroup();
  decorations = this.physics.add.staticGroup();

  // ==========================================
  // ANIMAÇÕES
  // ==========================================
  this.anims.create({
    key: 'running',
    frames: this.anims.generateFrameNumbers('run', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'jumping',
    frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: 0
  });

  const smokeFrames = [];
  for (let i = 1; i <= 10; i++) {
    const frameNumber = i.toString().padStart(2, '0');
    smokeFrames.push({ key: `smoke_${frameNumber}` });
  }
  this.anims.create({
    key: 'smoke_puff',
    frames: smokeFrames,
    frameRate: 20,
    repeat: 0
  });

  // ✅ CORREÇÃO: Se são 6 frames, vai de 0 a 5
  const comboFrames = this.anims.generateFrameNumbers('combo', { start: 0, end: 5 });
  console.log('🎨 Frames de combo encontrados:', comboFrames.length);
  
  if (comboFrames.length > 0) {
    this.anims.create({
      key: 'combo_anim',
      frames: comboFrames,
      frameRate: 15,
      repeat: 0
    });
  }

  // ==========================================
  // CENÁRIO
  // ==========================================
  const floorY = H - TILE_SIZE / 2;
  for (let x = TILE_SIZE / 2; x < W; x += TILE_SIZE) {
    const tileIndex = (Math.floor(x / TILE_SIZE) % 3) + 1;
    let floor = platforms.create(x, floorY, `floor_${tileIndex}`);
    floor.setDisplaySize(TILE_SIZE, TILE_SIZE);
    floor.refreshBody();
  }

  const wallTopY = TILE_SIZE / 2;
  const wallBottomY = H - TILE_SIZE - TILE_SIZE / 2;
  
  for (let y = wallTopY; y <= wallBottomY; y += TILE_SIZE) {
    const wallType = (Math.floor(y / TILE_SIZE) % 2) + 1;
    let wall = platforms.create(TILE_SIZE / 2, y, `wall_${wallType}`);
    wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
    wall.refreshBody();
  }
  for (let y = wallTopY; y <= wallBottomY; y += TILE_SIZE) {
    const wallType = (Math.floor(y / TILE_SIZE) % 2) + 1;
    let wall = platforms.create(W - TILE_SIZE / 2, y, `wall_${wallType}`);
    wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
    wall.refreshBody();
  }
  for (let x = TILE_SIZE / 2; x < W; x += TILE_SIZE) {
    let wall = platforms.create(x, TILE_SIZE / 2, 'wall_1');
    wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
    wall.refreshBody();
  }

  decorations.create(TILE_SIZE / 2, H - TILE_SIZE * 2, 'door_decor')
    .setDisplaySize(TILE_SIZE, TILE_SIZE * 2).setDepth(15);
  decorations.create(W - TILE_SIZE / 2, H - TILE_SIZE * 1.5, 'door_decor')
    .setDisplaySize(TILE_SIZE, TILE_SIZE * 2).setDepth(15);

  const createPlatform = (startX, y, length) => {
    for (let x = startX; x < startX + length * TILE_SIZE; x += TILE_SIZE) {
      let plat = platforms.create(x, y, 'platform');
      plat.setDisplaySize(TILE_SIZE, TILE_SIZE);
      plat.refreshBody();
    }
  };

  createPlatform(W * 0.10, H * 0.78, 6);
  createPlatform(W * 0.65, H * 0.78, 6);
  createPlatform(W * 0.25, H * 0.65, 4);
  createPlatform(W * 0.55, H * 0.65, 4);
  createPlatform(W * 0.10, H * 0.52, 5);
  createPlatform(W * 0.70, H * 0.52, 5);
  createPlatform(W * 0.30, H * 0.40, 6);
  createPlatform(W * 0.60, H * 0.40, 6);
  createPlatform(W * 0.15, H * 0.28, 4);
  createPlatform(W * 0.70, H * 0.28, 4);
  createPlatform(W * 0.40, H * 0.18, 6);

  createPlatform(W * 0.45, H * 0.72, 2);
  createPlatform(W * 0.20, H * 0.58, 2);
  createPlatform(W * 0.75, H * 0.58, 2);
  createPlatform(W * 0.45, H * 0.46, 2);
  createPlatform(W * 0.25, H * 0.34, 2);
  createPlatform(W * 0.70, H * 0.34, 2);
  createPlatform(W * 0.45, H * 0.22, 2);

  decorations.create(W * 0.08, H - TILE_SIZE * 1.5, 'crate').setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(10);
  decorations.create(W * 0.92, H - TILE_SIZE * 1.5, 'barrel').setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(10);
  decorations.create(W * 0.15, H * 0.78 - TILE_SIZE, 'crate').setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(10);
  decorations.create(W * 0.70, H * 0.52 - TILE_SIZE, 'container').setDisplaySize(TILE_SIZE * 2, TILE_SIZE).setDepth(10);

  // ==========================================
  // CRIAR O BICHINHO
  // ==========================================
  player = new Bichinho(this, W / 2, H - TILE_SIZE * 3);
  this.physics.add.collider(player.sprite, platforms);

  // HUD
  this.add.text(W / 2, 30, 'WASD + SHIFT = Hiraishin | ESPAÇO = Combo', {
    fontSize: '14px',
    fill: '#ff9ebb',
    fontFamily: 'Press Start 2P'
  }).setOrigin(0.5);

  // ==========================================
  // WEBSOCKET
  // ==========================================
  fetch('/getWsEnd')
    .then(res => res.json())
    .then(data => {
      WS_URL = data.url;
      console.log('✅ WS_URL carregado:', WS_URL);
      conectarWebSocket();
    })
    .catch(err => console.error('Erro ao carregar WS:', err));

  function conectarWebSocket() {
    if (!WS_URL) {
      setTimeout(conectarWebSocket, 1000);
      return;
    }

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('🔌 Painel de jogo conectado com Session ID:', sessionId);
      // ✅ CORREÇÃO: Envia o sessionId extraído da URL
      ws.send(JSON.stringify({ type: 'register_painel', sessionId: sessionId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'botao_pressionado':
          handleBotaoPressionado(data.button);
          break;
        case 'botao_solto':
          handleBotaoSolto(data.button);
          break;
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket desconectado, reconectando em 3s...');
      setTimeout(conectarWebSocket, 3000);
    };
  }

  function handleBotaoPressionado(button) {
    console.log(`📱 Botão pressionado: ${button}`);
    window.celularButtons[button] = true;

    if (button === 'a') {
      player.combo();
    } else if (button === 'b') {
      player.poder(player.lastDirection);
    }
  }

  function handleBotaoSolto(button) {
    console.log(`📱 Botão solto: ${button}`);
    window.celularButtons[button] = false;
  }
}

// ==========================================
// UPDATE
// ==========================================
function update(time, delta) {
  if (player) {
    player.update(time, delta, platforms);
  }
}