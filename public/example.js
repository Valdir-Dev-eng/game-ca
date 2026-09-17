// ==========================================
// CONFIGURAÇÃO
// ==========================================

const FRAME_RUN_WIDTH = 32;
const FRAME_RUN_HEIGHT = 32;

const FRAME_JUMP_WIDTH = 32;
const FRAME_JUMP_HEIGHT = 32;

const FRAME_STOP_WIDTH = 32;
const FRAME_STOP_HEIGHT = 32;

// ⚠️ AJUSTE: tamanho da sprite de fumaça (10 frames)
const FRAME_SMOKE_WIDTH = 32;
const FRAME_SMOKE_HEIGHT = 32;

const SPEED = 200;
const JUMP_FORCE = -400;
const GRAVITY = 500;
const SCALE = 3;

// Configurações do Hiraishin
const DASH_DISTANCE = 150; // Pixels que ele teletransporta
const DASH_COOLDOWN = 800; // ms entre usos (evita spam)
const DOUBLE_TAP_WINDOW = 300; // ms para considerar double tap

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#ffe0ec',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let platforms;
let smokeEffect; // Grupo de partículas de fumaça
let lastDirection = 'right';
let currentTexture = 'stop';
let isJumping = false;
let gameIsPaused = false;

// Sistema de Double Tap
let lastTapTime = { up: 0, down: 0, left: 0, right: 0 };
let dashCooldownTimer = 0;
let isDashing = false;

// ==========================================
// PRELOAD
// ==========================================
function preload() {
  this.load.spritesheet('run', 'sprite_run.png', {
    frameWidth: FRAME_RUN_WIDTH,
    frameHeight: FRAME_RUN_HEIGHT
  });

  this.load.spritesheet('jump', 'sprite_up.png', {
    frameWidth: FRAME_JUMP_WIDTH,
    frameHeight: FRAME_JUMP_HEIGHT
  });

  this.load.spritesheet('stop', 'sprite_stop.png', {
    frameWidth: FRAME_STOP_WIDTH,
    frameHeight: FRAME_STOP_HEIGHT
  });

  // Carrega cada frame da fumaça individualmente
  for (let i = 1; i <= 10; i++) {
    const frameNumber = i.toString().padStart(2, '0');
    this.load.image(`smoke_${frameNumber}`, `smoke/Smoke_Frame_${frameNumber}.png`);
  }
}

// ==========================================
// CREATE
// ==========================================
function create() {
  // Animações do player
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

  // Animação de fumaça usando frames individuais
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

  // Plataformas
  platforms = this.physics.add.staticGroup();
  let ground = platforms.create(400, 580, 'stop');
  ground.setScale(20, 1);
  ground.refreshBody();

  platforms.create(200, 450, 'stop').setScale(5, 0.5).refreshBody();
  platforms.create(600, 350, 'stop').setScale(5, 0.5).refreshBody();
  platforms.create(400, 250, 'stop').setScale(4, 0.5).refreshBody();

  // Player
  player = this.physics.add.sprite(400, 100, 'stop');
  player.setScale(SCALE);
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);

  this.physics.add.collider(player, platforms);

  // Input
  cursors = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    enter: Phaser.Input.Keyboard.KeyCodes.ENTER
  });

  this.add.text(400, 30, 'A/D andar | W pular | ENTER: item', {
    fontSize: '14px',
    fill: '#ad1457',
    fontFamily: 'Arial'
  }).setOrigin(0.5);

  this.add.text(400, 55, 'Double Tap (2x rápido) = HIRAISHIN', {
    fontSize: '14px',
    fill: '#c2185b',
    fontFamily: 'Arial',
    fontStyle: 'bold'
  }).setOrigin(0.5);

  // Indicador de cooldown
  this.dashIndicator = this.add.text(400, 580, 'HIRAISHIN: PRONTO', {
    fontSize: '12px',
    fill: '#4caf50',
    fontFamily: 'Press Start 2P'
  }).setOrigin(0.5);
}

// ==========================================
// UPDATE
// ==========================================
function update(time, delta) {
  if (gameIsPaused) {
    if (Phaser.Input.Keyboard.JustDown(cursors.enter)) {
      closeItemOverlay();
    }
    return;
  }

  // Atualiza cooldown do dash
  if (dashCooldownTimer > 0) {
    dashCooldownTimer -= delta;
    if (dashCooldownTimer <= 0) {
      dashCooldownTimer = 0;
      this.dashIndicator.setText('HIRAISHIN: PRONTO');
      this.dashIndicator.setColor('#4caf50');
    } else {
      const seconds = (dashCooldownTimer / 1000).toFixed(1);
      this.dashIndicator.setText(`HIRAISHIN: ${seconds}s`);
      this.dashIndicator.setColor('#ff9800');
    }
  }

  // Se está em dash, não processa input normal
  if (isDashing) return;

  let isOnGround = player.body.touching.down;
  player.setVelocityX(0);
  let moving = false;

  // Detecta double tap e ativa dash
  if (checkDoubleTap('left')) {
    activateDash('left');
    return;
  }
  if (checkDoubleTap('right')) {
    activateDash('right');
    return;
  }
  if (checkDoubleTap('up')) {
    activateDash('up');
    return;
  }
  if (checkDoubleTap('down')) {
    activateDash('down');
    return;
  }

  // Movimento normal
  if (cursors.left.isDown) {
    player.setVelocityX(-SPEED);
    player.setFlipX(true);
    lastDirection = 'left';
    moving = true;
  } else if (cursors.right.isDown) {
    player.setVelocityX(SPEED);
    player.setFlipX(false);
    lastDirection = 'right';
    moving = true;
  }

  if (cursors.up.isDown && isOnGround && !isJumping) {
    player.setVelocityY(JUMP_FORCE);
    isJumping = true;
    player.setTexture('jump');
    currentTexture = 'jump';
    player.play('jumping', true);
    player.setFlipX(lastDirection === 'left');
  }

  // Animações
  if (!isOnGround) {
    if (!isJumping) {
      if (currentTexture !== 'run') {
        player.setTexture('run');
        currentTexture = 'run';
      }
      player.play('running', true);
      player.setFlipX(lastDirection === 'left');
    }
  } else {
    isJumping = false;
    if (moving) {
      if (currentTexture !== 'run') {
        player.setTexture('run');
        currentTexture = 'run';
      }
      player.play('running', true);
    } else {
      if (currentTexture !== 'stop') {
        player.setTexture('stop', 0);
        currentTexture = 'stop';
        player.anims.stop();
      }
      player.setFlipX(lastDirection === 'left');
    }
  }

  // ENTER para item
  if (Phaser.Input.Keyboard.JustDown(cursors.enter)) {
    openItemOverlay();
  }
}

// ==========================================
// SISTEMA DE DOUBLE TAP
// ==========================================
function checkDoubleTap(direction) {
  const now = Date.now();
  const lastTap = lastTapTime[direction];
  const timeDiff = now - lastTap;

  // Verifica se a tecla foi APENAS pressionada agora (JustDown)
  const keyMap = {
    up: cursors.up,
    down: cursors.down,
    left: cursors.left,
    right: cursors.right
  };

  if (Phaser.Input.Keyboard.JustDown(keyMap[direction])) {
    if (timeDiff < DOUBLE_TAP_WINDOW && dashCooldownTimer <= 0) {
      // Double tap detectado!
      lastTapTime[direction] = 0; // Reseta
      return true;
    } else {
      // Primeiro tap
      lastTapTime[direction] = now;
    }
  }

  return false;
}

// ==========================================
// SISTEMA DE DASH (HIRAISHIN)
// ==========================================
function activateDash(direction) {
  //  BLOQUEIO: dash para baixo só funciona no ar
  if (direction === 'down' && player.body.touching.down) {
    console.log('❌ Dash para baixo bloqueado: player está no chão');
    return; // Aborta completamente, não gasta cooldown
  }

  isDashing = true;
  dashCooldownTimer = DASH_COOLDOWN;

  // Calcula destino
  let targetX = player.x;
  let targetY = player.y;

  switch(direction) {
    case 'left':
      targetX = player.x - DASH_DISTANCE;
      player.setFlipX(true);
      lastDirection = 'left';
      break;
    case 'right':
      targetX = player.x + DASH_DISTANCE;
      player.setFlipX(false);
      lastDirection = 'right';
      break;
    case 'up':
      targetY = player.y - DASH_DISTANCE;
      break;
    case 'down':
      // Só chega aqui se NÃO estiver no chão (verificação acima)
      targetY = player.y + DASH_DISTANCE;
      break;
  }

  // Limita aos bounds do mundo
  targetX = Phaser.Math.Clamp(targetX, 16, 800 - 16);
  targetY = Phaser.Math.Clamp(targetY, 16, 600 - 16);

  // Efeito 1: Fumaça na posição atual (desaparecer)
  createSmokeEffect(player.x, player.y);

  // Efeito 2: Esconde o player
  player.setVisible(false);
  player.body.enable = false;

  // Teletransporta após pequeno delay
  setTimeout(() => {
    player.setPosition(targetX, targetY);
    
    // Efeito 3: Fumaça na nova posição (reaparecer)
    createSmokeEffect(targetX, targetY);
    
    // Mostra o player novamente
    player.setVisible(true);
    player.body.enable = true;

    // Continua a animação de corrida
    if (currentTexture !== 'run') {
      player.setTexture('run');
      currentTexture = 'run';
    }
    player.play('running', true);

    isDashing = false;
  }, 150);
}

// ==========================================
// EFEITO DE FUMAÇA
// ==========================================
function createSmokeEffect(x, y) {
  const smoke = game.scene.scenes[0].add.sprite(x, y, 'smoke_01');
  
  // ✅ CORREÇÃO: Scale fixo e pequeno, não multiplica pelo SCALE do player
  smoke.setScale(0.2); // Ajuste este valor (0.5 a 2.0) conforme necessário
  
  // Centraliza a origem (importante pra fumaça crescer do centro)
  smoke.setOrigin(0.5, 0.5);
  
  smoke.play('smoke_puff');
  smoke.setDepth(100);

  smoke.on('animationcomplete', () => {
    smoke.destroy();
  });
}

// ==========================================
// OVERLAY DE ITEM (ENTER)
// ==========================================
function openItemOverlay() {
  gameIsPaused = true;
  game.scene.scenes[0].physics.pause();
  document.getElementById('itemOverlay').classList.add('show');
}

function closeItemOverlay() {
  gameIsPaused = false;
  game.scene.scenes[0].physics.resume();
  document.getElementById('itemOverlay').classList.remove('show');
}